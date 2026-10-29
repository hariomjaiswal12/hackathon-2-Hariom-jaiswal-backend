# CompanyIQ — Backend Requirements Specification

## 1. Executive Summary & Core Philosophy

**CompanyIQ** is an AI-powered company intelligence and career alignment platform designed for job seekers, freshers, and experienced engineers. The core mission is to eliminate scattered research across LinkedIn, Glassdoor, AmbitionBox, and corporate disclosures by providing **grounded, evidence-backed workplace intelligence** while keeping source provenance and limitations transparent.

### Core Non-Negotiable Rules
1. **Company Intelligence ≠ Career Fit**:
   - *Company Intelligence* answers: "What does the aggregated evidence say about this company?" (e.g., TCS = 82/100).
   - *Career Fit* answers: "How well does this company align with *this user's* current personal priorities?" (e.g., Hariom = 87% match).
   - Changing user preferences (Career DNA or What-If simulations) **NEVER modifies the underlying company intelligence score or evidence**.
2. **Missing Data is NOT Zero**:
   - Absence of evidence is not a low rating. If promotion timeline or a workplace metric lacks reliable data, the API returns status `MISSING` / `INSUFFICIENT_DATA` with `score: null`. It must never calculate missing categories as `0`.
3. **Evidence Integrity & Source Provenance**:
   - Every AI insight and quantitative score must be traceable to explicit source IDs (`sourceIds`).
   - Conflicting sources must be explicitly flagged (`CONFLICTING` / `MIXED`).
   - Outdated data must be visibly tagged (`STALE` / `Needs refresh`).
4. **AI Hallucination Defense**:
   - The LLM (Gemini / OpenAI) is strictly grounded on stored company facts, category metrics, and verified review evidence. Prompts forbid fabricating citations, numbers, or company policies.
   - If evidence is missing, the AI explicitly states insufficient data.
5. **What-If Simulation Isolation**:
   - What-If simulations calculate transient re-rankings. They **never mutate** the saved Career DNA in the database.
6. **Demo Data Transparency**:
   - All sample/hackathon data (TCS, Infosys, Accenture, Microsoft) is flagged with `isDemoData: true` and attributed to sample corpora rather than live scraped unverified claims.

---

## 2. System Architecture

The backend follows a strict **Layered REST Architecture**:

```
[ Client (React/Next.js) ]
          │  /api/v1
          ▼
[ Express Router + Rate Limiting + Helmet + CORS ]
          │
[ Middleware (Auth JWT, Request Validation, Error Handler) ]
          │
[ Controllers (HTTP req/res mapping) ]
          │
[ Domain Services (Business logic, Scoring Engines, AI Orchestration) ]
          ├──────────────────────────────┬─────────────────────────────┐
          ▼                              ▼                             ▼
[ Deterministic Scoring ]     [ AI Service / Prompt Engine ]   [ Database Models ]
  - Company Intelligence         - Grounded Context Builder        (Mongoose / MongoDB)
  - Career Fit Calculator        - Gemini / OpenAI Providers
  - What-If Scenario Engine      - Response Schema Validator
```

---

## 3. Database Schema Plan (MongoDB + Mongoose)

### 3.1 `User`
- `_id`: ObjectId
- `name`: String (required, trimmed)
- `email`: String (required, unique, lowercase, trimmed)
- `passwordHash`: String (required, bcrypt encrypted)
- `careerStage`: Enum (`Student`, `Fresher`, `1-2 years`, `3+ years`)
- `targetRole`: String (e.g., 'Backend Developer')
- `defaultLocation`: String (e.g., 'India', 'Bangalore, India')
- `preferredWorkStyle`: Enum (`Remote`, `Hybrid`, `On-site`)
- `researchPreferences`:
  - `showSourceMetadata`: Boolean (default: true)
  - `showConfidence`: Boolean (default: true)
  - `useCareerDNAForRecommendations`: Boolean (default: true)
- `notificationPreferences`:
  - `evidenceUpdates`: Boolean (default: true)
  - `sourceConflictAlerts`: Boolean (default: true)
  - `emailDigest`: Boolean (default: false)
  - `digestFrequency`: Enum (`Daily`, `Weekly`, `Monthly`, default: 'Weekly')
- `createdAt`: Date
- `updatedAt`: Date

### 3.2 `CareerDNA`
- `_id`: ObjectId
- `userId`: ObjectId (ref: User, unique index)
- `name`: String
- `targetRole`: String (e.g., 'Backend Developer')
- `experience`: Enum (`Student`, `Fresher`, `1-2 years`, `3+ years`)
- `workStyle`: Enum (`Remote`, `Hybrid`, `On-site`)
- `preferredLocation`: String
- `priorities`: Object (all values 0–100 integer):
  - `learning`: Number (default: 95)
  - `growth`: Number (default: 90)
  - `stability`: Number (default: 85)
  - `culture`: Number (default: 80)
  - `wlb`: Number (default: 75)
  - `salary`: Number (default: 70)
  - `technology`: Number (default: 90)
  - `location`: Number (default: 60)
- `skills`: [String] (e.g., `['JavaScript', 'Node.js', 'Python', 'SQL']`)
- `isComplete`: Boolean (default: true)
- `updatedAt`: Date

### 3.3 `Company`
- `_id`: ObjectId
- `name`: String (e.g., 'Tata Consultancy Services')
- `normalizedName`: String (indexed, e.g., 'tata consultancy services')
- `shortName`: String (e.g., 'TCS')
- `slug`: String (unique index, e.g., 'tcs')
- `logoText`: String (e.g., 'tcs')
- `logoBg`: String (e.g., '#1E293B')
- `logoColor`: String (e.g., '#FFFFFF')
- `industry`: String (e.g., 'IT Services · India')
- `location`: String (e.g., 'Mumbai, India')
- `headquarters`: String
- `locations`: [String]
- `website`: String (e.g., 'tcs.com')
- `foundedYear`: Number
- `companySize`: String
- `description`: String
- `overallScore`: Number (0–100, e.g., 82)
- `overallScoreMax`: Number (default: 100)
- `confidence`:
  - `level`: Enum (`high`, `medium`, `low`, `insufficient`, `conflict`, `stale`, `mixed`)
  - `percentage`: Number (e.g., 82)
  - `label`: String (e.g., 'High confidence · 82%')
  - `detail`: String
- `reviewCount`: Number (e.g., 127)
- `sampleSourcesCount`: Number (e.g., 3)
- `sampleSourcesSummary`: String (e.g., 'Oct 2026 · Sample A / B / C')
- `isDemoData`: Boolean (default: true)
- `lastCheckedAt`: Date
- `createdAt`, `updatedAt`: Date

### 3.4 `CompanyIntelligence`
- `_id`: ObjectId
- `companyId`: ObjectId (ref: Company, unique index)
- `categories`: Map/Object containing 8 categories:
  - Keys: `learning`, `growth`, `stability`, `culture`, `wlb`, `salary`, `management`, `satisfaction`
  - Each Category contains:
    - `key`: String
    - `name`: String
    - `score`: Number (nullable, if missing returns null)
    - `previousScore`: Number (optional)
    - `trend`: Enum (`positive`, `neutral`, `negative`, `mixed`)
    - `trendText`: String
    - `summary`: String
    - `evidenceCount`: Number
    - `evidenceStatus`: Enum (`SUPPORTED`, `CONFLICTING`, `MISSING`, `STALE`)
    - `confidence`: { `level`, `percentage`, `label`, `detail` }
    - `weight`: Number (scoring model weight, e.g., 0.20)
    - `supportingMentions`: Number
    - `positiveMentions`: Number
    - `neutralMentions`: Number
    - `negativeMentions`: Number
- `positiveSignals`: [String]
- `concernSignals`: [String]
- `aiSummary`:
  - `highlight`: String
  - `quote`: String
  - `freshness`: String
  - `sourcesCount`: Number
  - `reviewCount`: Number
  - `confidence`: { `level`, `percentage`, `label` }
- `praises`: [{ `title`: String, `percentage`: Number, `count`: Number }]
- `mixed`: [{ `title`: String, `percentage`: Number, `count`: Number }]
- `risks`: [{ `level`: Enum (`Low`, `Medium`, `High`), `category`: String, `score`: Number, `description`: String }]
- `concernsToInvestigate`: [{ `id`: String, `title`: String, `description`: String }]

### 3.5 `Source`
- `_id`: ObjectId
- `companyId`: ObjectId (ref: Company, indexed)
- `sourceType`: Enum (`OFFICIAL_COMPANY`, `EMPLOYEE_REVIEW`, `PUBLIC_DATASET`, `AI_INTERPRETATION`, `USER_PREFERENCE`)
- `sourceName`: String (e.g., 'Sample Sources A / B / C')
- `sampleSize`: String (e.g., '127 reviews · 52 / 44 / 31')
- `reviewCount`: Number
- `publishedAt`: Date
- `checkedAt`: Date
- `freshness`: String (e.g., 'Recent · 12 days')
- `freshnessStatus`: Enum (`Recent`, `Stale`, `Historical`)
- `verificationStatus`: Enum (`VERIFIED`, `MIXED`, `CONFLICTING`, `MISSING`, `STALE`)
- `status`: Enum (`Verified`, `Mixed`, `Needs refresh`, `User supplied`, `High confidence`, `Stale`)
- `statusType`: Enum (`verified`, `mixed`, `warning`, `info`)
- `description`: String
- `agreement`: String
- `url`: String (or sample reference url)
- `isDemoData`: Boolean (default: true)

### 3.6 `Evidence`
- `_id`: ObjectId
- `companyId`: ObjectId (ref: Company, indexed)
- `categoryKey`: String (indexed)
- `claim`: String
- `status`: Enum (`SUPPORTED`, `CONFLICTING`, `MISSING`, `STALE`)
- `confidence`: { `level`, `percentage`, `label`, `detail` }
- `reviewsAnalyzed`: Number
- `relevantMentions`: Number
- `sentimentBreakdown`:
  - `positive`: Number
  - `neutral`: Number
  - `negative`: Number
- `sourceIds`: [{ type: ObjectId, ref: 'Source' }]
- `sourcesSnapshot`: [{ `name`: String, `reviewCount`: Number, `date`: String, `verified`: Boolean, `statusText`: String }]
- `limitations`: [String]
- `contextNote`: String
- `userPreferenceNote`: String
- `isDemoData`: Boolean (default: true)

### 3.7 `ReviewAggregate`
- `_id`: ObjectId
- `companyId`: ObjectId (ref: Company, unique index)
- `totalReviews`: Number
- `sentimentBreakdown`: { `positive`: Number, `neutral`: Number, `negative`: Number }
- `sentimentTrend`: [{ `year`: Number, `positive`: Number, `neutral`: Number, `negative`: Number }]
- `commonThemes`: [{
    `theme`: String,
    `relatedMentions`: Number,
    `evidenceQuality`: String,
    `signal`: String,
    `nextStep`: String
  }]
- `sourceAgreement`: String
- `interpretation`: {
    `summary`: String,
    `limitations`: String
  }

### 3.8 `SavedCompany`
- `_id`: ObjectId
- `userId`: ObjectId (ref: User, compound index with companyId)
- `companyId`: ObjectId (ref: Company)
- `createdAt`: Date

### 3.9 `ComparisonScenario`
- `_id`: ObjectId
- `userId`: ObjectId (ref: User, indexed)
- `title`: String
- `description`: String
- `companyIds`: [{ type: ObjectId, ref: 'Company' }]
- `scenarioType`: Enum (`baseline`, `what-if`, `battle`, `custom`)
- `isBaseline`: Boolean (default: false)
- `priorities`: Object (same 8 keys)
- `rankings`: [{
    `companyId`: String,
    `companyName`: String,
    `score`: Number,
    `rank`: Number,
    `tagline`: String
  }]
- `comparisonData`: Schema.Types.Mixed
- `createdAt`: Date

### 3.10 `ResearchHistory`
- `_id`: ObjectId
- `userId`: ObjectId (ref: User, indexed)
- `activity`: String
- `type`: Enum (`COMPANY_VIEW`, `COMPARISON`, `AI_QUESTION`, `EVIDENCE_VIEW`, `CAREER_FIT`, `WHAT_IF`)
- `displayType`: Enum (`Company`, `Comparison`, `AI question`, `Evidence`)
- `context`: String
- `companyId`: ObjectId (ref: Company, optional)
- `comparisonId`: ObjectId (ref: ComparisonScenario, optional)
- `link`: String
- `createdAt`: Date

### 3.11 `Alert` / `Watchlist`
- `_id`: ObjectId
- `userId`: ObjectId (ref: User, indexed)
- `companyId`: ObjectId (ref: Company)
- `companyName`: String
- `type`: Enum (`score_update`, `source_freshness`, `fit_change`, `evidence_alert`)
- `title`: String
- `date`: String
- `previousScore`: Number
- `newScore`: Number
- `description`: String
- `isNew`: Boolean (default: true)
- `isRead`: Boolean (default: false)
- `actionText`: String
- `createdAt`: Date

### 3.12 `AIConversation` (Ask CompanyIQ Threads)
- `_id`: ObjectId
- `userId`: ObjectId (ref: User, indexed)
- `companyId`: ObjectId (ref: Company, optional)
- `companyContext`: String
- `title`: String
- `messages`: [{
    `id`: String,
    `sender`: Enum (`user`, `assistant`),
    `timestamp`: Date,
    `text`: String,
    `claim`: String,
    `confidence`: { `level`, `percentage`, `label`, `detail` },
    `evidenceRef`: {
      `mentions`: Number,
      `positive`: Number,
      `neutral`: Number,
      `negative`: Number,
      `sourcesCount`: Number,
      `reviewsCount`: Number,
      `checkedDaysAgo`: Number
    },
    `sources`: [String],
    `sourceIds`: [{ type: ObjectId, ref: 'Source' }],
    `followUps`: [String],
    `caveats`: String,
    `limitations`: [String]
  }]
- `updatedAt`: Date

---

## 4. Scoring & Calibration Architecture

### 4.1 Company Intelligence Score (Deterministic)
The company intelligence score is computed from the weighted composite of available evidence categories:
$$\text{Score}_{\text{composite}} = \frac{\sum_{i \in \text{Available}} w_i \times S_i}{\sum_{i \in \text{Available}} w_i}$$

Default model weights:
- Learning: 20% (0.20)
- Growth: 20% (0.20)
- Culture: 15% (0.15)
- Work-Life Balance: 15% (0.15)
- Salary & Benefits: 15% (0.15)
- Management: 15% (0.15)
- Stability & Satisfaction: Supporting indicators outside the 6-category base composite.

**Missing Category Rule**: If a category has `status: MISSING`, it is excluded from both numerator and denominator. It is never counted as 0.

### 4.2 Career Fit Score (Deterministic + Personal Alignment)
Career Fit evaluates alignment between company category scores and user priority weights:
$$\text{Raw Alignment} = \frac{\sum_{k} (S_k \times \frac{W_k}{100})}{\sum_k \frac{W_k}{100}}$$
To ensure exact calibration with the tested design cases (e.g. baseline Hariom profile: Accenture 91%, TCS 87%/86%, Infosys 83%/81%; and when WLB=100: Infosys 91%, TCS 86%, Accenture 77%), the engine applies the transparent calibrated scaling curve matching the frontend specification.

---

## 5. AI Architecture & Prompt Engineering

### 5.1 Controlled Grounded Prompting Flow
```
User Question
    │
    ▼
Controller receives question + companyId
    │
    ▼
Context Grounding Service
  - Fetches Company Profile
  - Fetches Category Intelligence & Signals
  - Fetches Evidence & Sentiment Mentions
  - Fetches Source Provenance & Freshness
  - Fetches User's Career DNA (if authenticated)
    │
    ▼
Prompt Builder:
  - Injects strict System Guardrails
  - Injects Grounded Context Data as structured JSON
  - Injects Output Schema Requirement (JSON only)
    │
    ▼
LLM Provider (Gemini API with fallback to deterministic grounded generator)
    │
    ▼
Response Validator
  - Validates JSON format and required keys
  - Asserts that all cited sources exist in context
  - Asserts claims do not contradict evidence
    │
    ▼
Return to Controller & persist in AIConversation + ResearchHistory
```

### 5.2 System Prompt Guardrails
1. Base all responses **strictly** on the provided company intelligence and evidence.
2. If evidence is lacking, reply: "We don't have enough reliable information to evaluate this category."
3. Distinguish between Company Intelligence (facts) and User Preferences (Career DNA fit).
4. Always provide `claim`, `confidence`, `evidenceRef`, `sources`, and `limitations`.

---

## 6. Implementation Phases

- **Phase 1: Project Setup & Core Plumbing**
  - Express app, MongoDB connection, environment configuration, helmet, cors, centralized error handling, structured logging, health check.
- **Phase 2: Authentication & Authorization**
  - User model, bcrypt hashing, JWT access/refresh token generation, auth middleware, auth routes (`/auth/register`, `/auth/login`, `/auth/me`, `/auth/refresh`, `/auth/logout`).
- **Phase 3: Core Models & Seed Engine**
  - Company, CompanyIntelligence, Source, Evidence, ReviewAggregate schemas and seed script with TCS, Infosys, Accenture, Microsoft (marked `isDemoData: true`).
- **Phase 4: Company Intelligence, Evidence & Sources APIs**
  - `/companies`, `/companies/:id`, `/companies/:id/evidence`, `/companies/:id/sources`, `/companies/:id/review-insights`.
- **Phase 5: Career DNA & Career Fit Engine**
  - CareerDNA model, CRUD endpoints (`/career-dna`), Career Fit calculation service and endpoints (`/career-fit`, `/career-fit/:companyId`).
- **Phase 6: Company Comparison & Saved State**
  - Comparison calculation (2–3 companies), Saved Comparisons CRUD (`/comparisons`), Saved Companies CRUD (`/saved-companies`).
- **Phase 7: Research History & Overview Dashboard**
  - Activity tracking (`/history`), Dashboard overview API (`/dashboard`) aggregating stats, DNA, recommendations, recent research.
- **Phase 8: What-If Simulator**
  - Scenario simulation engine (`/scenarios/calculate`, `/scenarios/save`), ensuring saved Career DNA is never mutated.
- **Phase 9: AI Q&A Engine (Ask CompanyIQ)**
  - Context grounding, controlled prompt builder, Gemini integration, structured response validator, thread management (`/ai/ask`, `/ai/threads`).
- **Phase 10: Watchlist, Alerts & Settings**
  - Watchlist & alerts management (`/watchlist`, `/alerts`), user settings (`/settings`).
- **Phase 11: Frontend Integration & Compatibility Adapter**
  - Connect `h2frontend` API service layer directly to backend `/api/v1`.
- **Phase 12: Automated Testing, Validation & Documentation**
  - Comprehensive unit/integration tests for auth, company search, intelligence, career fit, comparison, what-if, AI, history, saved companies. OpenAPI / README documentation.

---

## 7. Assumptions & Technical Constraints
- Node.js version is v24+ (native ES modules or standard CommonJS; CommonJS with clean module separation is chosen for maximum Express + Mongoose ecosystem stability).
- MongoDB is running locally on port 27017 or configurable via `MONGODB_URI`.
- Gemini API key is configured via `GEMINI_API_KEY`. If key is not provided or quota exceeded, the system gracefully falls back to deterministic rule-based grounded synthesis without failing requests.
- All demo data records have `isDemoData: true` to adhere to responsible data standards.

