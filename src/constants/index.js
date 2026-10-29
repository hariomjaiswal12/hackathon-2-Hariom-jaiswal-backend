/**
 * Domain constants for CompanyIQ
 */

const CONFIDENCE_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INSUFFICIENT: 'insufficient',
  CONFLICT: 'conflict',
  STALE: 'stale',
  MIXED: 'mixed',
};

const EVIDENCE_STATUS = {
  SUPPORTED: 'SUPPORTED',
  CONFLICTING: 'CONFLICTING',
  MISSING: 'MISSING',
  STALE: 'STALE',
};

const SOURCE_TYPES = {
  OFFICIAL_COMPANY: 'Official Company',
  EMPLOYEE_REVIEW: 'Employee Review',
  PUBLIC_DATASET: 'Public Dataset',
  AI_INTERPRETATION: 'AI interpretation',
  USER_PREFERENCE: 'User Preference',
};

const SOURCE_VERIFICATION_STATUS = {
  VERIFIED: 'Verified',
  MIXED: 'Mixed',
  NEEDS_REFRESH: 'Needs refresh',
  USER_SUPPLIED: 'User supplied',
  HIGH_CONFIDENCE: 'High confidence',
  STALE: 'Stale',
};

const CAREER_CATEGORIES = {
  LEARNING: 'learning',
  GROWTH: 'growth',
  STABILITY: 'stability',
  CULTURE: 'culture',
  WLB: 'wlb',
  SALARY: 'salary',
  MANAGEMENT: 'management',
  SATISFACTION: 'satisfaction',
};

const CAREER_PRIORITY_KEYS = [
  'learning',
  'growth',
  'stability',
  'culture',
  'wlb',
  'salary',
  'technology',
  'location',
];

const SCORING_WEIGHTS = {
  learning: 0.20,
  growth: 0.20,
  culture: 0.15,
  wlb: 0.15,
  salary: 0.15,
  management: 0.15,
};

const ACTIVITY_TYPES = {
  COMPANY_VIEW: 'Company',
  COMPARISON: 'Comparison',
  AI_QUESTION: 'AI question',
  EVIDENCE_VIEW: 'Evidence',
  CAREER_FIT: 'Career Fit',
  WHAT_IF: 'What-If',
};

const ALERT_TYPES = {
  SCORE_UPDATE: 'score_update',
  SOURCE_FRESHNESS: 'source_freshness',
  FIT_CHANGE: 'fit_change',
  EVIDENCE_ALERT: 'evidence_alert',
};

module.exports = {
  CONFIDENCE_LEVELS,
  EVIDENCE_STATUS,
  SOURCE_TYPES,
  SOURCE_VERIFICATION_STATUS,
  CAREER_CATEGORIES,
  CAREER_PRIORITY_KEYS,
  SCORING_WEIGHTS,
  ACTIVITY_TYPES,
  ALERT_TYPES,
};

