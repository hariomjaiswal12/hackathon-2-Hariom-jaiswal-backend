# CompanyIQ — API Contract Specification (`/api/v1`)

All endpoints use JSON for requests and responses. The base URL prefix is `/api/v1`.

### Standard Response Envelope

#### Success:
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

#### Error:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable explanation",
    "details": []
  }
}
```

---

## 1. System & Health

### 1.1 Health Check
- **Method:** `GET`
- **URL:** `/api/v1/health`
- **Auth:** Public
- **Response (200):**
```json
{
  "success": true,
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-10-28T18:00:00.000Z"
}
```

---

## 2. Authentication

### 2.1 Register
- **Method:** `POST`
- **URL:** `/api/v1/auth/register`
- **Auth:** Public
- **Request Body:**
```json
{
  "name": "Hariom",
  "email": "hariom@example.com",
  "password": "Password123!",
  "careerStage": "Fresher",
  "targetRole": "Backend Developer",
  "defaultLocation": "Bangalore, India",
  "preferredWorkStyle": "Hybrid"
}
```
- **Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "660c1...",
      "name": "Hariom",
      "email": "hariom@example.com",
      "careerStage": "Fresher",
      "targetRole": "Backend Developer",
      "defaultLocation": "Bangalore, India",
      "preferredWorkStyle": "Hybrid"
    },
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi..."
    }
  },
  "message": "User registered successfully"
}
```

### 2.2 Login
- **Method:** `POST`
- **URL:** `/api/v1/auth/login`
- **Auth:** Public
- **Request Body:**
```json
{
  "email": "hariom@example.com",
  "password": "Password123!"
}
```
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "660c1...",
      "name": "Hariom",
      "email": "hariom@example.com",
      "careerStage": "Fresher",
      "targetRole": "Backend Developer"
    },
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi..."
    }
  },
  "message": "Login successful"
}
```

### 2.3 Get Current User Profile
- **Method:** `GET`
- **URL:** `/api/v1/auth/me`
- **Auth:** Bearer Token
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "660c1...",
    "name": "Hariom",
    "email": "hariom@example.com",
    "careerStage": "Fresher",
    "targetRole": "Backend Developer",
    "defaultLocation": "Bangalore, India",
    "preferredWorkStyle": "Hybrid",
    "researchPreferences": {
      "showSourceMetadata": true,
      "showConfidence": true,
      "useCareerDNAForRecommendations": true
    },
    "notificationPreferences": {
      "evidenceUpdates": true,
      "sourceConflictAlerts": true,
      "emailDigest": false,
      "digestFrequency": "Weekly"
    }
  }
}
```

### 2.4 Refresh Token
- **Method:** `POST`
- **URL:** `/api/v1/auth/refresh`
- **Auth:** Public (requires refreshToken in body)
- **Request Body:**
```json
{
  "refreshToken": "eyJhbGciOi..."
}
```
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

### 2.5 Logout
- **Method:** `POST`
- **URL:** `/api/v1/auth/logout`
- **Auth:** Bearer Token
- **Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 3. Companies & Intelligence

### 3.1 List / Search Companies
- **Method:** `GET`
- **URL:** `/api/v1/companies`
- **Auth:** Optional (if token present, attaches user-specific `careerFit` and `isSaved`)
- **Query Parameters:**
  - `query` / `search`: string
  - `industry`: string
  - `location`: string
  - `minScore`: number (0–100)
  - `minGrowth`: number (0–100)
  - `minWlb`: number (0–100)
  - `confidenceLevel`: string (`high`, `medium`, `low`, etc.)
  - `sortBy`: string (`relevance`, `highestScore`, `highestFit`, `mostReviewed`, `recentlyUpdated`)
  - `page`: number (default: 1)
  - `limit`: number (default: 10)
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "companies": [
      {
        "id": "tcs",
        "name": "Tata Consultancy Services",
        "shortName": "TCS",
        "logoText": "tcs",
        "logoBg": "#1E293B",
        "logoColor": "#FFFFFF",
        "industry": "IT Services · India",
        "location": "Mumbai, India",
        "website": "tcs.com",
        "overallScore": 82,
        "overallScoreMax": 100,
        "confidence": {
          "level": "high",
          "percentage": 82,
          "label": "High confidence · 82%"
        },
        "reviewCount": 127,
        "sampleSourcesCount": 3,
        "lastUpdated": "Updated Oct 2026 · Sample A / B / C",
        "positiveSignals": ["Strong learning & stability"],
        "concernSignals": ["Salary progression is mixed"],
        "careerFit": {
          "fitScore": 87,
          "tier": "Excellent Match"
        },
        "isSaved": true,
        "isDemoData": true
      }
    ],
    "pagination": {
      "total": 4,
      "page": 1,
      "pages": 1,
      "limit": 10
    }
  }
}
```

### 3.2 Get Company Intelligence Detail
- **Method:** `GET`
- **URL:** `/api/v1/companies/:id` (supports mongoId or slug like 'tcs')
- **Auth:** Optional (adds careerFit if authenticated)
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "tcs",
    "name": "Tata Consultancy Services",
    "shortName": "TCS",
    "logoText": "tcs",
    "industry": "IT Services · India",
    "overallScore": 82,
    "confidence": { "level": "high", "percentage": 82, "label": "High confidence · 82%" },
    "categories": {
      "learning": { "key": "learning", "name": "Learning Opportunities", "score": 91, "evidenceCount": 86, "trend": "positive" },
      "growth": { "key": "growth", "name": "Career Growth", "score": 88, "evidenceCount": 72, "trend": "positive" },
      "stability": { "key": "stability", "name": "Job Stability", "score": 89, "evidenceCount": 74, "trend": "positive" },
      "culture": { "key": "culture", "name": "Work Culture", "score": 84, "evidenceCount": 64, "trend": "positive" },
      "wlb": { "key": "wlb", "name": "Work-Life Balance", "score": 81, "evidenceCount": 58, "trend": "neutral" },
      "salary": { "key": "salary", "name": "Salary & Benefits", "score": 70, "evidenceCount": 49, "trend": "mixed" },
      "management": { "key": "management", "name": "Management", "score": 76, "evidenceCount": 42, "trend": "mixed" },
      "satisfaction": { "key": "satisfaction", "name": "Overall Satisfaction", "score": 82, "evidenceCount": 68, "trend": "positive" }
    },
    "aiSummary": {
      "highlight": "Strong learning and project exposure signals.",
      "quote": "Available employee feedback frequently highlights strong learning opportunities...",
      "freshness": "Updated 12 days ago",
      "sourcesCount": 3,
      "reviewCount": 127
    },
    "praises": [{ "title": "Learning opportunities", "percentage": 76, "count": 63 }],
    "mixed": [{ "title": "Salary progression", "percentage": 43, "count": 35 }],
    "risks": [{ "level": "Medium", "category": "Salary progression", "score": 52 }],
    "concernsToInvestigate": [{ "id": "01", "title": "Salary progression", "description": "..." }],
    "careerFit": { "fitScore": 87, "tier": "Excellent Match" },
    "sources": [...]
  }
}
```

### 3.3 Get Category Evidence Detail
- **Method:** `GET`
- **URL:** `/api/v1/companies/:id/evidence`
- **Auth:** Optional
- **Query Parameters:** `categoryKey` (e.g. `learning`)
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "ev-tcs-learning",
    "companyId": "tcs",
    "categoryKey": "learning",
    "claim": "Employees frequently highlight strong learning opportunities.",
    "reviewsAnalyzed": 127,
    "relevantMentions": 86,
    "sentimentBreakdown": { "positive": 63, "neutral": 15, "negative": 8 },
    "sources": [
      { "name": "Sample Source A", "reviewCount": 52, "date": "Oct 16, 2026", "verified": true, "statusText": "Verified" }
    ],
    "confidence": { "level": "high", "percentage": 82, "label": "High confidence · 82%" },
    "limitations": [
      "Conflict - Salary: Sources agree more closely on learning than salary...",
      "User preference context: Your learning priority is 95/100..."
    ],
    "contextNote": "Sources agree more closely on learning than salary.",
    "userPreferenceNote": "Your learning priority is 95/100."
  }
}
```

### 3.4 Get Company Sources
- **Method:** `GET`
- **URL:** `/api/v1/companies/:id/sources`
- **Auth:** Public / Optional
- **Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "src-1",
      "name": "Sample company profile",
      "type": "Official Company",
      "sampleSize": "1 profile · Business context",
      "date": "Oct 16, 2026",
      "freshness": "Recent · 12 days",
      "status": "Verified",
      "statusType": "verified",
      "description": "Corporate filings, publicly disclosed operational and workforce scale indicators.",
      "agreement": "Official baseline"
    }
  ]
}
```

### 3.5 Get Review Insights
- **Method:** `GET`
- **URL:** `/api/v1/companies/:id/review-insights`
- **Auth:** Optional
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "companyId": "tcs",
    "companyName": "Tata Consultancy Services",
    "totalReviews": 127,
    "sampleSourcesCount": 3,
    "daysSinceCheck": 12,
    "commonPositiveThemes": [
      { "theme": "Learning", "percentage": 76, "signal": "positive" },
      { "theme": "Growth", "percentage": 71, "signal": "positive" },
      { "theme": "Stability", "percentage": 87, "signal": "positive" }
    ],
    "concernsWorthExploring": [
      { "concern": "Salary progression", "percentage": 43, "signal": "negative" },
      { "concern": "Management consistency", "percentage": 31, "signal": "negative" },
      { "concern": "Peak workload / WLB", "percentage": 28, "signal": "negative" }
    ],
    "sentimentTrend": [
      { "year": 2024, "positive": 60, "neutral": 25, "negative": 15 },
      { "year": 2025, "positive": 68, "neutral": 20, "negative": 12 },
      { "year": 2026, "positive": 72, "neutral": 18, "negative": 10 }
    ],
    "sourceAgreement": {
      "summary": "Learning shows agreement across the sample. Salary signals are conflicting.",
      "sources": [...]
    },
    "themesTable": [
      { "theme": "Learning opportunities", "relatedMentions": 86, "evidenceQuality": "High / Recent", "nextStep": "Open learning evidence" }
    ],
    "interpretation": {
      "summary": "Available feedback frequently highlights learning and stability...",
      "limitations": "Reviews are self-selected and may not reflect every employee or team."
    }
  }
}
```

---

## 4. Career DNA & Career Fit

### 4.1 Get Career DNA
- **Method:** `GET`
- **URL:** `/api/v1/career-dna`
- **Auth:** Bearer Token
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "name": "Hariom",
    "targetRole": "Backend Developer",
    "experience": "Fresher",
    "workStyle": "Hybrid",
    "preferredLocation": "Bangalore, India",
    "priorities": {
      "learning": 95,
      "growth": 90,
      "stability": 85,
      "culture": 80,
      "wlb": 75,
      "salary": 70,
      "technology": 90,
      "location": 60
    },
    "skills": ["JavaScript", "Node.js", "Python", "SQL"],
    "isComplete": true,
    "updatedAt": "2026-10-28T10:00:00.000Z"
  }
}
```

### 4.2 Save / Update Career DNA
- **Method:** `PUT` or `POST`
- **URL:** `/api/v1/career-dna`
- **Auth:** Bearer Token
- **Request Body:**
```json
{
  "name": "Hariom",
  "targetRole": "Backend Developer",
  "experience": "Fresher",
  "workStyle": "Hybrid",
  "preferredLocation": "Bangalore, India",
  "priorities": {
    "learning": 95,
    "growth": 90,
    "stability": 85,
    "culture": 80,
    "wlb": 75,
    "salary": 70,
    "technology": 90,
    "location": 60
  },
  "skills": ["JavaScript", "Node.js", "Python", "SQL"],
  "isComplete": true
}
```
- **Response (200):** Success envelope with updated DNA.

### 4.3 Delete Career DNA
- **Method:** `DELETE`
- **URL:** `/api/v1/career-dna`
- **Auth:** Bearer Token
- **Response (200):**
```json
{
  "success": true,
  "message": "Career DNA reset successfully"
}
```

### 4.4 Get Career Fit for All Companies
- **Method:** `GET`
- **URL:** `/api/v1/career-fit`
- **Auth:** Bearer Token
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "userProfile": { "role": "Backend Developer", "experience": "Fresher" },
    "matches": [
      {
        "companyId": "tcs",
        "companyName": "Tata Consultancy Services",
        "fitScore": 87,
        "tier": "Excellent Match",
        "whyItFits": ["Learning and stability align closely with your strongest priorities."],
        "tradeOffs": ["Salary progression shows mixed feedback."],
        "breakdown": [...]
      }
    ]
  }
}
```

### 4.5 Get Career Fit for a Single Company
- **Method:** `GET`
- **URL:** `/api/v1/career-fit/:companyId`
- **Auth:** Bearer Token
- **Response (200):** Returns single company fit object matching design.

---

## 5. Company Comparisons & Saved Research

### 5.1 Compare Companies (2 or 3)
- **Method:** `POST`
- **URL:** `/api/v1/comparisons/calculate`
- **Auth:** Optional / Bearer Token
- **Request Body:**
```json
{
  "companyIds": ["accenture", "tcs", "infosys"],
  "scenario": "baseline",
  "customPriorities": null
}
```
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "companies": [...],
    "categoriesComparison": [...],
    "careerFitComparison": [...],
    "leadCompany": {
      "id": "accenture",
      "name": "Accenture",
      "headline": "Why is Accenture #1?",
      "explanation": "In this scenario, learning and growth carry the strongest weights..."
    },
    "tradeOffs": [...]
  }
}
```

### 5.2 Get Saved Comparisons
- **Method:** `GET`
- **URL:** `/api/v1/comparisons`
- **Auth:** Bearer Token
- **Response (200):** Array of saved scenarios.

### 5.3 Save Comparison
- **Method:** `POST`
- **URL:** `/api/v1/comparisons`
- **Auth:** Bearer Token
- **Request Body:**
```json
{
  "title": "Backend fresher · Baseline",
  "description": "Accenture 91% · TCS 86% · Infosys 81%",
  "companyIds": ["accenture", "tcs", "infosys"],
  "priorities": { ... },
  "isBaseline": true
}
```

### 5.4 Delete Saved Comparison
- **Method:** `DELETE`
- **URL:** `/api/v1/comparisons/:id`
- **Auth:** Bearer Token

### 5.5 Saved Companies List
- **Method:** `GET`
- **URL:** `/api/v1/saved-companies`
- **Auth:** Bearer Token
- **Response (200):** Array of saved companies with intelligence and fit scores.

### 5.6 Save a Company
- **Method:** `POST`
- **URL:** `/api/v1/saved-companies/:companyId`
- **Auth:** Bearer Token

### 5.7 Remove a Saved Company
- **Method:** `DELETE`
- **URL:** `/api/v1/saved-companies/:companyId`
- **Auth:** Bearer Token

---

## 6. What-If Simulator

### 6.1 Calculate What-If Scenario
- **Method:** `POST`
- **URL:** `/api/v1/scenarios/calculate`
- **Auth:** Optional / Bearer Token
- **Request Body:**
```json
{
  "priorities": {
    "learning": 95,
    "growth": 90,
    "stability": 85,
    "culture": 80,
    "wlb": 100,
    "salary": 70,
    "technology": 90,
    "location": 60
  },
  "companyIds": ["accenture", "tcs", "infosys"]
}
```
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "baselineRankings": [
      { "companyId": "accenture", "companyName": "Accenture", "score": 91, "rank": 1 },
      { "companyId": "tcs", "companyName": "TCS", "score": 86, "rank": 2 },
      { "companyId": "infosys", "companyName": "Infosys", "score": 81, "rank": 3 }
    ],
    "scenarioRankings": [
      { "companyId": "infosys", "companyName": "Infosys", "score": 91, "rank": 1 },
      { "companyId": "tcs", "companyName": "TCS", "score": 86, "rank": 2 },
      { "companyId": "accenture", "companyName": "Accenture", "score": 77, "rank": 3 }
    ],
    "delta": [
      { "companyId": "infosys", "diff": 10, "rankDiff": 2 },
      { "companyId": "tcs", "diff": 0, "rankDiff": 0 },
      { "companyId": "accenture", "diff": -14, "rankDiff": -2 }
    ],
    "explanation": "Infosys moved to #1 because your increased preference for work-life balance gives greater weight to that category.",
    "savedDNARemainsUnchanged": true
  }
}
```

---

## 7. AI Q&A Engine (Ask CompanyIQ)

### 7.1 Ask AI (Grounded Prompting)
- **Method:** `POST`
- **URL:** `/api/v1/ai/ask`
- **Auth:** Optional / Bearer Token
- **Request Body:**
```json
{
  "companyId": "tcs",
  "question": "Is TCS good for freshers?",
  "threadId": "optional-existing-thread-id"
}
```
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "threadId": "thread-1",
    "message": {
      "id": "msg-1",
      "sender": "assistant",
      "claim": "TCS may align with a learning-first fresher profile—with trade-offs worth checking.",
      "text": "Available employee feedback frequently highlights strong learning opportunities...",
      "confidence": {
        "level": "high",
        "percentage": 82,
        "label": "High confidence · 82%",
        "detail": "127 reviews · 3 sample sources · Checked 12 days ago"
      },
      "evidenceRef": {
        "mentions": 86,
        "positive": 63,
        "neutral": 15,
        "negative": 8,
        "sourcesCount": 3,
        "reviewsCount": 127,
        "checkedDaysAgo": 12
      },
      "sources": ["Sample Source A · 52 reviews", "Sample Source B · 44 reviews", "Sample Source C · 31 reviews"],
      "followUps": [
        "What do employees commonly praise?",
        "What are the biggest concerns?",
        "How is work-life balance?"
      ],
      "caveats": "Self-selected feedback and company-level aggregation."
    }
  }
}
```

### 7.2 Get AI Threads
- **Method:** `GET`
- **URL:** `/api/v1/ai/threads`
- **Auth:** Bearer Token

---

## 8. Dashboard, History, Alerts & Settings

### 8.1 Dashboard Overview
- **Method:** `GET`
- **URL:** `/api/v1/dashboard`
- **Auth:** Bearer Token (or guest demo mode fallback)
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "companiesResearched": 12,
      "savedCompanies": 5,
      "comparisons": 4,
      "careerFitStatus": "Complete"
    },
    "careerDNA": { ... },
    "recommendedCompanies": [ ... ],
    "recentResearch": [ ... ]
  }
}
```

### 8.2 Research History
- **Method:** `GET`
- **URL:** `/api/v1/history`
- **Auth:** Bearer Token
- **Query Parameters:** `type` (`all`, `companies`, `comparisons`, `ai_questions`)
- **Response (200):** Array of history items grouped by date.

### 8.3 Clear Research History
- **Method:** `DELETE`
- **URL:** `/api/v1/history`
- **Auth:** Bearer Token

### 8.4 Get Watchlist Alerts
- **Method:** `GET`
- **URL:** `/api/v1/alerts`
- **Auth:** Bearer Token
- **Response (200):** Array of alerts.

### 8.5 Mark Alert as Read
- **Method:** `PATCH`
- **URL:** `/api/v1/alerts/:id/read`
- **Auth:** Bearer Token

### 8.6 Update User Settings
- **Method:** `PUT`
- **URL:** `/api/v1/settings`
- **Auth:** Bearer Token
- **Request Body:** Partial profile, researchPreferences, or notificationPreferences.

