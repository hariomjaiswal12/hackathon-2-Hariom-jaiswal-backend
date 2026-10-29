# CompanyIQ Backend API

> Production-ready, evidence-backed REST API for **CompanyIQ** — AI-Powered Company Intelligence & Career Fit Platform.

---

## 1. Overview & Core Philosophy

CompanyIQ solves scattered workplace research by centralizing company data, platform ratings, verified review signals, and source links into transparent, evidence-backed intelligence.

### Non-Negotiable Architectural Principles
1. **Company Intelligence ≠ Career Fit**:
   - **Company Intelligence**: Evaluates what the aggregated evidence says about a workplace (e.g., TCS = 82/100, Infosys = 80/100, Accenture = 85/100, Microsoft = 89/100).
   - **Career Fit**: Evaluates how well that company matches an individual's personal Career DNA priorities (e.g., Hariom = 87% match).
   - Changing user priorities **NEVER modifies the underlying company intelligence score or evidence**.
2. **Missing Information ≠ Zero**:
   - Missing data (e.g., lack of reliable promotion timelines) returns `score: null` with status `MISSING` / `INSUFFICIENT DATA`. It is **never treated as zero**.
3. **Evidence Integrity & Source Provenance**:
   - Every AI insight and metric links to traceable `sourceIds` with freshness indicators and explicit conflict flags (`CONFLICTING`, `STALE`).
4. **AI Hallucination Defense**:
   - LLM prompts are grounded strictly in loaded company evidence and review mentions. If data is lacking, the AI explicitly states insufficient data.
5. **What-If Simulation Isolation**:
   - Transient simulations in the What-If Simulator compute re-ranked alignment without mutating saved Career DNA.
6. **Demo Data Transparency**:
   - Sample hackathon records are marked `isDemoData: true` ("Illustrative, not verified company research").

---

## 2. Technology Stack

- **Runtime:** Node.js (v20+)
- **Framework:** Express.js (REST API, prefix `/api/v1`)
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (Access & Refresh tokens) + bcrypt password hashing
- **Security:** Helmet, CORS, Rate Limiting (`express-rate-limit`), MongoDB sanitization
- **AI/LLM:** Google Gemini API (`@google/generative-ai`) with deterministic grounded fallback
- **Testing:** Jest + Supertest (23 integration tests)
- **Documentation:** Swagger UI / OpenAPI 3.0 at `/api-docs`

---

## 3. Project Directory Structure

```
h2backend/
│
├── docs/
│   ├── backend-requirements.md   # Architectural specification & schema mapping
│   └── api-contract.md           # REST API Contract with request/response schemas
│
├── src/
│   ├── config/
│   │   ├── env.js                # Environment variable loader
│   │   ├── db.js                 # MongoDB connection & reconnect logic
│   │   └── ai.js                 # Gemini AI client configuration
│   │
│   ├── constants/
│   │   └── index.js              # Confidence levels, weights, categories
│   │
│   ├── models/
│   │   ├── User.js               # User accounts & preferences
│   │   ├── CareerDNA.js          # Personal profile & 8 priority weights
│   │   ├── Company.js            # Company profile & metadata
│   │   ├── CompanyIntelligence.js# Category breakdown, trends, praises, risks
│   │   ├── Source.js             # Sources registry & provenance
│   │   ├── Evidence.js           # Category claims & review mentions
│   │   ├── ReviewAggregate.js    # Review stats, sentiment trends, themes
│   │   ├── SavedCompany.js       # Shortlisted companies
│   │   ├── ComparisonScenario.js # Saved 2-3 company comparisons & What-Ifs
│   │   ├── ResearchHistory.js    # Activity logs grouped by date
│   │   ├── Alert.js              # Watchlist updates & freshness alerts
│   │   └── AIConversation.js     # Ask CompanyIQ grounded threads
│   │
│   ├── services/
│   │   ├── scoringService.js     # Deterministic scoring & Career Fit engine
│   │   ├── companyService.js     # Search, filter, details & evidence loader
│   │   ├── careerService.js      # Career DNA & personalized fit calculation
│   │   ├── comparisonService.js  # Side-by-side & battle mode comparison
│   │   ├── scenarioService.js    # What-If Simulator engine
│   │   ├── aiService.js          # Grounded AI Q&A with Gemini & fallback
│   │   ├── dashboardService.js   # Main overview aggregator
│   │   ├── historyService.js     # Activity history management
│   │   ├── savedCompanyService.js# Shortlist management
│   │   ├── alertService.js       # Watchlist alerts
│   │   ├── settingsService.js    # Profile & research settings
│   │   └── authService.js        # Authentication & token rotation
│   │
│   ├── controllers/              # HTTP request/response handlers
│   ├── routes/                   # Express route definitions
│   ├── middleware/               # Auth, validation, error handler, notFound
│   ├── validators/               # express-validator schemas
│   ├── prompts/                  # Grounded prompt builder for LLM
│   ├── utils/                    # Logger, AppError, apiResponse, token
│   ├── docs/
│   │   └── swagger.json          # OpenAPI 3.0 specification
│   ├── app.js                    # Express app configuration
│   └── server.js                 # Server entrypoint with graceful shutdown
│
├── scripts/
│   └── seed.js                   # Illustrative demo dataset seeder
├── tests/
│   └── api.test.js               # Integration test suite
├── .env.example
├── package.json
└── README.md
```

---

## 4. Setup & Installation

### Prerequisites
- Node.js v20+
- MongoDB running locally on `mongodb://127.0.0.1:27017` (or MongoDB Atlas URI)

### 1. Clone & Install Dependencies
```bash
cd h2backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Key environment variables:
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/companyiq
JWT_ACCESS_SECRET=companyiq_jwt_access_secret_super_secure_key_2026_dev
JWT_REFRESH_SECRET=companyiq_jwt_refresh_secret_super_secure_key_2026_dev
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=http://localhost:5173
```

*(Note: If `GEMINI_API_KEY` is omitted, CompanyIQ automatically uses its built-in grounded rule synthesizer, ensuring zero runtime disruptions!)*

### 3. Seed Database
Seed the database with illustrative demo companies (TCS, Infosys, Accenture, Microsoft, Google) and demo user Hariom:
```bash
npm run seed
```

Default credentials:
- **Email:** `hariom@example.com`
- **Password:** `Password123!`

### 4. Run Development Server
```bash
npm run dev
```
Or start in production:
```bash
npm start
```
The server will start at `http://localhost:5000`.

### 5. Run Test Suite
```bash
npm test
```
Executes all 23 integration tests with Supertest against live MongoDB.

---

## 5. API Reference Summary (`/api/v1`)

Interactive Swagger UI documentation is available at:
👉 **`http://localhost:5000/api-docs`**

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Health check & DB status | Public |
| `POST` | `/api/v1/auth/register` | Register user | Public |
| `POST` | `/api/v1/auth/login` | Login user & receive JWT | Public |
| `GET` | `/api/v1/auth/me` | Current user profile | Bearer |
| `POST` | `/api/v1/auth/refresh` | Rotate access token | Public |
| `POST` | `/api/v1/auth/logout` | Revoke session | Bearer |
| `GET` | `/api/v1/companies` | Search & filter companies | Optional |
| `GET` | `/api/v1/companies/:id` | Company intelligence & categories | Optional |
| `GET` | `/api/v1/companies/:id/evidence` | Category claims & mentions | Optional |
| `GET` | `/api/v1/companies/:id/sources` | Verified sources registry | Optional |
| `GET` | `/api/v1/companies/:id/review-insights` | Review stats & sentiment trends | Optional |
| `GET` | `/api/v1/career-dna` | User Career DNA profile | Bearer |
| `PUT` | `/api/v1/career-dna` | Update Career DNA priorities | Bearer |
| `GET` | `/api/v1/career-fit` | Career Fit across all companies | Bearer |
| `GET` | `/api/v1/career-fit/:companyId` | Career Fit for a single company | Bearer |
| `POST` | `/api/v1/comparisons/calculate` | Compare 2 or 3 companies | Optional |
| `GET` | `/api/v1/comparisons` | Saved comparisons | Bearer |
| `POST` | `/api/v1/comparisons` | Save a comparison | Bearer |
| `DELETE` | `/api/v1/comparisons/:id` | Delete saved comparison | Bearer |
| `POST` | `/api/v1/scenarios/calculate` | What-If Simulator (isolated) | Optional |
| `POST` | `/api/v1/scenarios/save` | Save What-If scenario | Bearer |
| `POST` | `/api/v1/ai/ask` | Ask CompanyIQ Grounded AI | Optional |
| `GET` | `/api/v1/ai/threads` | AI conversation threads | Optional |
| `GET` | `/api/v1/dashboard` | Main Overview Dashboard data | Optional |
| `GET` | `/api/v1/saved-companies` | Shortlisted companies | Bearer |
| `POST` | `/api/v1/saved-companies/:companyId` | Save company | Bearer |
| `DELETE` | `/api/v1/saved-companies/:companyId` | Remove saved company | Bearer |
| `GET` | `/api/v1/history` | Research activity history | Bearer |
| `DELETE` | `/api/v1/history` | Clear research history | Bearer |
| `GET` | `/api/v1/alerts` | Watchlist alerts | Optional |
| `PATCH` | `/api/v1/alerts/:id/read` | Mark alert as read | Bearer |
| `GET` | `/api/v1/settings` | User settings | Bearer |
| `PUT` | `/api/v1/settings` | Update user settings | Bearer |

---

## 6. Frontend Integration

An API client is included at `h2frontend/src/services/apiClient.ts` that provides typed communication with the backend. It automatically stores and transmits the JWT token, seamlessly connects all pages, and retains fallback resiliency.

Run the frontend:
```bash
cd h2frontend
npm run dev
```
Explore the UI at `http://localhost:5173` connected to backend at `http://localhost:5000/api/v1`.

