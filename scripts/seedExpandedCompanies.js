/**
 * CompanyIQ — Expanded Company Dataset Seeder
 * Idempotent, duplicate-safe script that seeds 20 additional enterprise and tech companies
 * without mutating or wiping existing companies, users, or saved data.
 */

const mongoose = require('mongoose');
const env = require('../src/config/env');
const logger = require('../src/utils/logger');
const Company = require('../src/models/Company');
const CompanyIntelligence = require('../src/models/CompanyIntelligence');
const Source = require('../src/models/Source');
const Evidence = require('../src/models/Evidence');
const ReviewAggregate = require('../src/models/ReviewAggregate');

const expandedCompanies = [
  // 1. HCLTech
  {
    slug: 'hcltech',
    name: 'HCL Technologies',
    shortName: 'HCLTech',
    logoText: 'hcl',
    logoBg: '#0155A5',
    logoColor: '#FFFFFF',
    industry: 'IT Services · India',
    location: 'Noida / Bangalore / Chennai, India',
    website: 'hcltech.com',
    description: 'A global technology enterprise specializing in digital, engineering, cloud, and AI-driven infrastructure services.',
    overallScore: 81,
    overallScoreMax: 100,
    confidence: { level: 'high', percentage: 80, label: 'High confidence · 80%', detail: 'Based on 118 verified employee feedback records.' },
    reviewCount: 118,
    sampleSourcesCount: 3,
    sampleSourcesSummary: 'Oct 2026 · Sample A / B / C',
    categories: {
      culture: { key: 'culture', name: 'Work Culture', score: 81, trend: 'positive', summary: 'People-centric culture with stable work rhythms.', evidenceCount: 52, confidence: { level: 'high', percentage: 79, label: 'High' } },
      salary: { key: 'salary', name: 'Salary & Benefits', score: 72, trend: 'mixed', summary: 'Standard IT services compensation bands with annual appraisals.', evidenceCount: 44, confidence: { level: 'conflict', label: 'Mixed' } },
      wlb: { key: 'wlb', name: 'Work-Life Balance', score: 83, trend: 'positive', summary: 'Generally predictable working hours with flexibility across delivery centers.', evidenceCount: 50, confidence: { level: 'high', percentage: 82, label: 'High' } },
      growth: { key: 'growth', name: 'Career Growth', score: 80, trend: 'positive', summary: 'Substantial opportunities in engineering R&D and digital practices.', evidenceCount: 48, confidence: { level: 'high', percentage: 78, label: 'High' } },
      management: { key: 'management', name: 'Management', score: 76, trend: 'mixed', summary: 'Management quality depends significantly on client account leadership.', evidenceCount: 36, confidence: { level: 'mixed', label: 'Mixed' } },
      learning: { key: 'learning', name: 'Learning Opportunities', score: 86, trend: 'positive', summary: 'Solid training platforms in cloud infrastructure and cybersecurity.', evidenceCount: 65, confidence: { level: 'high', percentage: 84, label: 'High' } },
      stability: { key: 'stability', name: 'Job Stability', score: 88, trend: 'positive', summary: 'Very high tenure security with large multi-year enterprise contracts.', evidenceCount: 58, confidence: { level: 'high', percentage: 87, label: 'High' } },
      satisfaction: { key: 'satisfaction', name: 'Overall Satisfaction', score: 81, trend: 'positive', summary: 'Strong satisfaction reported by early and mid-career engineers.', evidenceCount: 49, confidence: { level: 'high', percentage: 80, label: 'High' } },
    },
    positiveSignals: ['Predictable work-life balance', 'Strong engineering R&D foundation'],
    concernSignals: ['Appraisal increments vary by account profitability'],
    aiSummary: {
      highlight: 'Dependable engineering infrastructure career foundation.',
      quote: 'HCLTech offers a balanced workplace culture with strong engineering R&D capabilities, ideal for engineers seeking steady tenure and hands-on client projects.',
      freshness: 'Updated 8 days ago',
      sourcesCount: 3,
      reviewCount: 118,
      confidence: { level: 'high', percentage: 80, label: 'High confidence · 80%' },
    },
    praises: [
      { title: 'Work-life balance', percentage: 78, count: 54 },
      { title: 'Job stability', percentage: 86, count: 62 },
      { title: 'Engineering exposure', percentage: 72, count: 49 },
    ],
    mixed: [
      { title: 'Salary increments', percentage: 41, count: 28 },
    ],
    risks: [
      { level: 'Low', category: 'Stability', score: 14, description: 'Resilient order book and strong enterprise client relationships.' },
    ],
    concernsToInvestigate: [
      { id: '01', title: 'Account allocation', description: 'Inquire whether assigned to product engineering or support maintenance.' },
    ],
  },

  // 2. Wipro
  {
    slug: 'wipro',
    name: 'Wipro Limited',
    shortName: 'Wipro',
    logoText: 'wip',
    logoBg: '#183883',
    logoColor: '#FFFFFF',
    industry: 'IT Services · India',
    location: 'Bangalore / Pune / Hyderabad, India',
    website: 'wipro.com',
    description: 'A multinational IT services and digital consulting organization with strong domain depth in cloud transformation and banking.',
    overallScore: 78,
    overallScoreMax: 100,
    confidence: { level: 'high', percentage: 79, label: 'High confidence · 79%', detail: '135 validated engineering reviews across enterprise verticals.' },
    reviewCount: 135,
    sampleSourcesCount: 3,
    sampleSourcesSummary: 'Oct 2026 · Sample A / B / C',
    categories: {
      culture: { key: 'culture', name: 'Work Culture', score: 79, trend: 'positive', summary: 'Diverse, collaborative workforce with welcoming entry-level community.', evidenceCount: 60, confidence: { level: 'high', percentage: 78, label: 'High' } },
      salary: { key: 'salary', name: 'Salary & Benefits', score: 68, trend: 'mixed', summary: 'Standard entry-level fresher packages; increments linked to billable billing bands.', evidenceCount: 52, confidence: { level: 'conflict', label: 'Mixed' } },
      wlb: { key: 'wlb', name: 'Work-Life Balance', score: 80, trend: 'positive', summary: 'Reasonable balance with hybrid working options.', evidenceCount: 58, confidence: { level: 'high', percentage: 80, label: 'High' } },
      growth: { key: 'growth', name: 'Career Growth', score: 77, trend: 'mixed', summary: 'Internal job postings exist, though promotions require project manager endorsement.', evidenceCount: 51, confidence: { level: 'mixed', label: 'Mixed' } },
      management: { key: 'management', name: 'Management', score: 73, trend: 'mixed', summary: 'Middle management varies widely depending on client project governance.', evidenceCount: 42, confidence: { level: 'mixed', label: 'Mixed' } },
      learning: { key: 'learning', name: 'Learning Opportunities', score: 85, trend: 'positive', summary: 'Extensive internal academies and certification reimbursement programs.', evidenceCount: 71, confidence: { level: 'high', percentage: 83, label: 'High' } },
      stability: { key: 'stability', name: 'Job Stability', score: 86, trend: 'positive', summary: 'High organizational security with low attrition in core delivery practices.', evidenceCount: 64, confidence: { level: 'high', percentage: 85, label: 'High' } },
      satisfaction: { key: 'satisfaction', name: 'Overall Satisfaction', score: 78, trend: 'positive', summary: 'Good initial platform to start a software engineering career.', evidenceCount: 55, confidence: { level: 'high', percentage: 78, label: 'High' } },
    },
    positiveSignals: ['Comprehensive training academies', 'Solid stability & brand prestige'],
    concernSignals: ['Fresher compensation progression is gradual'],
    aiSummary: {
      highlight: 'Established digital transformation employer with broad domain reach.',
      quote: 'Wipro provides a supportive learning atmosphere with abundant technology training. Best for early professionals seeking diverse client project exposure.',
      freshness: 'Updated 6 days ago',
      sourcesCount: 3,
      reviewCount: 135,
      confidence: { level: 'high', percentage: 79, label: 'High confidence · 79%' },
    },
    praises: [
      { title: 'Training & certifications', percentage: 79, count: 68 },
      { title: 'Job security', percentage: 84, count: 72 },
    ],
    mixed: [
      { title: 'Promotion cadence', percentage: 44, count: 38 },
    ],
    risks: [
      { level: 'Medium', category: 'Salary progression', score: 49, description: 'Appraisal increments may be modest in slower market cycles.' },
    ],
    concernsToInvestigate: [
      { id: '01', title: 'Tech stack allocation', description: 'Confirm specific framework and tooling before project onboarding.' },
    ],
  },

  // 3. Tech Mahindra
  {
    slug: 'tech-mahindra',
    name: 'Tech Mahindra Limited',
    shortName: 'Tech Mahindra',
    logoText: 'tm',
    logoBg: '#ED1C24',
    logoColor: '#FFFFFF',
    industry: 'IT Services · India',
    location: 'Pune / Mumbai / Hyderabad, India',
    website: 'techmahindra.com',
    description: 'Leading provider of digital transformation, telecom network software, and business engineering solutions.',
    overallScore: 77,
    overallScoreMax: 100,
    confidence: { level: 'high', percentage: 77, label: 'High confidence · 77%', detail: '94 employee reviews analyzed across telecom and enterprise domains.' },
    reviewCount: 94,
    sampleSourcesCount: 3,
    sampleSourcesSummary: 'Oct 2026 · Sample A / B / C',
    categories: {
      culture: { key: 'culture', name: 'Work Culture', score: 78, trend: 'positive', summary: 'Friendly team dynamics with collaborative delivery teams.', evidenceCount: 42, confidence: { level: 'high', percentage: 76, label: 'High' } },
      salary: { key: 'salary', name: 'Salary & Benefits', score: 69, trend: 'mixed', summary: 'Competitive telecom specialist rates, standard general services packages.', evidenceCount: 38, confidence: { level: 'mixed', label: 'Mixed' } },
      wlb: { key: 'wlb', name: 'Work-Life Balance', score: 79, trend: 'positive', summary: 'Adequate balance with predictable operational sprints.', evidenceCount: 40, confidence: { level: 'high', percentage: 78, label: 'High' } },
      growth: { key: 'growth', name: 'Career Growth', score: 76, trend: 'mixed', summary: 'Strong internal pathways for telecom network and cloud software engineers.', evidenceCount: 35, confidence: { level: 'mixed', label: 'Mixed' } },
      management: { key: 'management', name: 'Management', score: 72, trend: 'mixed', summary: 'Leadership effectiveness varies by vertical and client account.', evidenceCount: 29, confidence: { level: 'mixed', label: 'Mixed' } },
      learning: { key: 'learning', name: 'Learning Opportunities', score: 82, trend: 'positive', summary: 'Specialized 5G, network automation, and AI training programs.', evidenceCount: 49, confidence: { level: 'high', percentage: 81, label: 'High' } },
      stability: { key: 'stability', name: 'Job Stability', score: 84, trend: 'positive', summary: 'Strong enterprise backing by the Mahindra Group.', evidenceCount: 46, confidence: { level: 'high', percentage: 83, label: 'High' } },
      satisfaction: { key: 'satisfaction', name: 'Overall Satisfaction', score: 77, trend: 'positive', summary: 'Reliable workplace for telecommunications and systems engineering.', evidenceCount: 39, confidence: { level: 'high', percentage: 77, label: 'High' } },
    },
    positiveSignals: ['Domain strength in 5G and telecom', 'Mahindra Group brand backing'],
    concernSignals: ['Client delivery pressure during network rollouts'],
    aiSummary: {
      highlight: 'Market leader in telecom software and network transformation.',
      quote: 'Tech Mahindra provides unmatched exposure to telecom technologies and connected enterprise platforms, backed by a stable group environment.',
      freshness: 'Updated 10 days ago',
      sourcesCount: 3,
      reviewCount: 94,
      confidence: { level: 'high', percentage: 77, label: 'High confidence · 77%' },
    },
    praises: [
      { title: 'Telecom domain mastery', percentage: 82, count: 48 },
      { title: 'Group stability', percentage: 85, count: 52 },
    ],
    mixed: [
      { title: 'Variable bonus payouts', percentage: 39, count: 24 },
    ],
    risks: [
      { level: 'Low', category: 'Corporate stability', score: 16, description: 'Diversified global client base across telco, manufacturing, and BFSI.' },
    ],
    concernsToInvestigate: [
      { id: '01', title: 'On-call requirements', description: 'Check if role involves mission-critical network monitoring shift rotations.' },
    ],
  },

  // 4. LTIMindtree
  {
    slug: 'ltimindtree',
    name: 'LTIMindtree Limited',
    shortName: 'LTIMindtree',
    logoText: 'lti',
    logoBg: '#0A73B0',
    logoColor: '#FFFFFF',
    industry: 'IT Services · India',
    location: 'Mumbai / Bangalore / Pune, India',
    website: 'ltimindtree.com',
    description: 'Tier-1 digital solutions and technology consulting powerhouse created by the merger of L&T Infotech and Mindtree.',
    overallScore: 82,
    overallScoreMax: 100,
    confidence: { level: 'high', percentage: 82, label: 'High confidence · 82%', detail: '108 reviews verified across banking, retail, and manufacturing sectors.' },
    reviewCount: 108,
    sampleSourcesCount: 3,
    sampleSourcesSummary: 'Oct 2026 · Sample A / B / C',
    categories: {
      culture: { key: 'culture', name: 'Work Culture', score: 83, trend: 'positive', summary: 'Modern, high-energy consulting atmosphere with progressive engineering practices.', evidenceCount: 54, confidence: { level: 'high', percentage: 81, label: 'High' } },
      salary: { key: 'salary', name: 'Salary & Benefits', score: 76, trend: 'positive', summary: 'Above-average compensation compared to legacy Tier-1 Indian IT services peers.', evidenceCount: 48, confidence: { level: 'high', percentage: 79, label: 'High' } },
      wlb: { key: 'wlb', name: 'Work-Life Balance', score: 81, trend: 'positive', summary: 'Healthy work boundaries with structured hybrid policies.', evidenceCount: 51, confidence: { level: 'high', percentage: 80, label: 'High' } },
      growth: { key: 'growth', name: 'Career Growth', score: 84, trend: 'positive', summary: 'Fast growth velocity resulting from merged client accounts and digital scale.', evidenceCount: 50, confidence: { level: 'high', percentage: 82, label: 'High' } },
      management: { key: 'management', name: 'Management', score: 78, trend: 'positive', summary: 'Pragmatic, execution-focused delivery leadership.', evidenceCount: 38, confidence: { level: 'high', percentage: 77, label: 'High' } },
      learning: { key: 'learning', name: 'Learning Opportunities', score: 88, trend: 'positive', summary: 'Excellent modern full-stack, cloud, and generative AI enablement.', evidenceCount: 62, confidence: { level: 'high', percentage: 85, label: 'High' } },
      stability: { key: 'stability', name: 'Job Stability', score: 86, trend: 'positive', summary: 'Backed by Larsen & Toubro Group with formidable financial strength.', evidenceCount: 55, confidence: { level: 'high', percentage: 86, label: 'High' } },
      satisfaction: { key: 'satisfaction', name: 'Overall Satisfaction', score: 82, trend: 'positive', summary: 'High satisfaction in digital engineering and cloud migration units.', evidenceCount: 47, confidence: { level: 'high', percentage: 81, label: 'High' } },
    },
    positiveSignals: ['High compensation compared to peers', 'Strong digital & cloud practices'],
    concernSignals: ['Integration process adjustments across certain accounts'],
    aiSummary: {
      highlight: 'High-growth mid-to-large tier digital transformation leader.',
      quote: 'LTIMindtree blends Mindtree’s agile engineering pedigree with L&T’s industrial scale, offering superior career velocity and compensation.',
      freshness: 'Updated 5 days ago',
      sourcesCount: 3,
      reviewCount: 108,
      confidence: { level: 'high', percentage: 82, label: 'High confidence · 82%' },
    },
    praises: [
      { title: 'Digital engineering culture', percentage: 83, count: 56 },
      { title: 'Competitive compensation', percentage: 78, count: 51 },
      { title: 'Modern tech stacks', percentage: 81, count: 53 },
    ],
    mixed: [
      { title: 'Cross-functional alignment', percentage: 33, count: 21 },
    ],
    risks: [
      { level: 'Low', category: 'Scale resilience', score: 15, description: 'Larsen & Toubro conglomerate parentage ensures long-term viability.' },
    ],
    concernsToInvestigate: [
      { id: '01', title: 'Practice group focus', description: 'Ask if assigned to high-velocity digital cloud practice or legacy enterprise support.' },
    ],
  },

  // 5. Persistent Systems
  {
    slug: 'persistent',
    name: 'Persistent Systems',
    shortName: 'Persistent',
    logoText: 'ps',
    logoBg: '#FF6600',
    logoColor: '#FFFFFF',
    industry: 'Digital Engineering · India',
    location: 'Pune / Hyderabad / Bangalore, India',
    website: 'persistent.com',
    description: 'Renowned digital engineering and enterprise software product development partner with elite technical pedigree.',
    overallScore: 84,
    overallScoreMax: 100,
    confidence: { level: 'high', percentage: 83, label: 'High confidence · 83%', detail: '89 reviews from software architects and product engineers.' },
    reviewCount: 89,
    sampleSourcesCount: 3,
    sampleSourcesSummary: 'Oct 2026 · Sample A / B / C',
    categories: {
      culture: { key: 'culture', name: 'Work Culture', score: 85, trend: 'positive', summary: 'Engineering-first ethos with high developer autonomy and open communication.', evidenceCount: 46, confidence: { level: 'high', percentage: 84, label: 'High' } },
      salary: { key: 'salary', name: 'Salary & Benefits', score: 79, trend: 'positive', summary: 'Strong base pay with attractive performance incentives for product engineering.', evidenceCount: 40, confidence: { level: 'high', percentage: 80, label: 'High' } },
      wlb: { key: 'wlb', name: 'Work-Life Balance', score: 82, trend: 'positive', summary: 'Respected work-life balance with trust-based remote/hybrid culture.', evidenceCount: 44, confidence: { level: 'high', percentage: 82, label: 'High' } },
      growth: { key: 'growth', name: 'Career Growth', score: 86, trend: 'positive', summary: 'Rapid promotions based on technical merit and product delivery outcomes.', evidenceCount: 45, confidence: { level: 'high', percentage: 83, label: 'High' } },
      management: { key: 'management', name: 'Management', score: 81, trend: 'positive', summary: 'Technically competent engineering managers who code and review PRs.', evidenceCount: 34, confidence: { level: 'high', percentage: 80, label: 'High' } },
      learning: { key: 'learning', name: 'Learning Opportunities', score: 90, trend: 'positive', summary: 'Direct exposure to silicon valley ISV product architectures and modern cloud stacks.', evidenceCount: 56, confidence: { level: 'high', percentage: 88, label: 'High' } },
      stability: { key: 'stability', name: 'Job Stability', score: 85, trend: 'positive', summary: 'Consistent quarter-on-quarter growth and zero debt profile.', evidenceCount: 48, confidence: { level: 'high', percentage: 85, label: 'High' } },
      satisfaction: { key: 'satisfaction', name: 'Overall Satisfaction', score: 84, trend: 'positive', summary: 'Very high pride among developers working on mission-critical products.', evidenceCount: 43, confidence: { level: 'high', percentage: 82, label: 'High' } },
    },
    positiveSignals: ['True product engineering culture', 'Direct exposure to US ISV codebases'],
    concernSignals: ['Demanding engineering code quality standards'],
    aiSummary: {
      highlight: 'Premier Indian destination for core product engineering.',
      quote: 'Persistent stands out for its high engineering bar and genuine software product development partnerships, making it an exceptional fit for coders.',
      freshness: 'Updated 4 days ago',
      sourcesCount: 3,
      reviewCount: 89,
      confidence: { level: 'high', percentage: 83, label: 'High confidence · 83%' },
    },
    praises: [
      { title: 'Technical craftsmanship', percentage: 88, count: 52 },
      { title: 'Manager competence', percentage: 82, count: 47 },
      { title: 'Product exposure', percentage: 86, count: 50 },
    ],
    mixed: [
      { title: 'Rigorous sprint deadlines', percentage: 28, count: 16 },
    ],
    risks: [
      { level: 'Low', category: 'Tech relevance', score: 11, description: 'Continuously engaged on modern SaaS, cloud-native, and AI architectures.' },
    ],
    concernsToInvestigate: [
      { id: '01', title: 'Client timezones', description: 'Check if sprint rituals align with US Pacific or East Coast hours.' },
    ],
  },

  // 6. Coforge
  {
    slug: 'coforge',
    name: 'Coforge Limited',
    shortName: 'Coforge',
    logoText: 'cof',
    logoBg: '#1B365D',
    logoColor: '#FFFFFF',
    industry: 'IT Services · India',
    location: 'Noida / Hyderabad / Bangalore, India',
    website: 'coforge.com',
    description: 'Fastest growing digital solutions partner with deep domain expertise in insurance, banking, and travel services.',
    overallScore: 81,
    overallScoreMax: 100,
    confidence: { level: 'high', percentage: 80, label: 'High confidence · 80%', detail: '76 verified employee submissions across insurance & BFSI.' },
    reviewCount: 76,
    sampleSourcesCount: 3,
    sampleSourcesSummary: 'Oct 2026 · Sample A / B / C',
    categories: {
      culture: { key: 'culture', name: 'Work Culture', score: 82, trend: 'positive', summary: 'Supportive and transparent leadership with strong employee recognition.', evidenceCount: 38, confidence: { level: 'high', percentage: 80, label: 'High' } },
      salary: { key: 'salary', name: 'Salary & Benefits', score: 77, trend: 'positive', summary: 'Competitive compensation with transparent appraisal frameworks.', evidenceCount: 34, confidence: { level: 'high', percentage: 78, label: 'High' } },
      wlb: { key: 'wlb', name: 'Work-Life Balance', score: 80, trend: 'positive', summary: 'Reasonable work-life balance with weekend work strictly discouraged.', evidenceCount: 36, confidence: { level: 'high', percentage: 79, label: 'High' } },
      growth: { key: 'growth', name: 'Career Growth', score: 83, trend: 'positive', summary: 'Accelerated promotion tracks driven by rapid firm revenue expansion.', evidenceCount: 37, confidence: { level: 'high', percentage: 81, label: 'High' } },
      management: { key: 'management', name: 'Management', score: 80, trend: 'positive', summary: 'Accessible executive leadership and open feedback mechanisms.', evidenceCount: 28, confidence: { level: 'high', percentage: 79, label: 'High' } },
      learning: { key: 'learning', name: 'Learning Opportunities', score: 85, trend: 'positive', summary: 'Strong domain certifications in Guidewire, MuleSoft, and Pega.', evidenceCount: 44, confidence: { level: 'high', percentage: 83, label: 'High' } },
      stability: { key: 'stability', name: 'Job Stability', score: 84, trend: 'positive', summary: 'Consistent order book wins and high client retention rates.', evidenceCount: 40, confidence: { level: 'high', percentage: 84, label: 'High' } },
      satisfaction: { key: 'satisfaction', name: 'Overall Satisfaction', score: 81, trend: 'positive', summary: 'Consistently ranked among the best medium-sized IT employers.', evidenceCount: 35, confidence: { level: 'high', percentage: 80, label: 'High' } },
    },
    positiveSignals: ['High growth velocity', 'Domain mastery in insurance & fintech'],
    concernSignals: ['High reliance on BFSI & Travel sector cycles'],
    aiSummary: {
      highlight: 'Rapidly compounding digital solutions firm with strong culture.',
      quote: 'Coforge provides strong career momentum and specialized fintech/insurtech domain training, accompanied by transparent management.',
      freshness: 'Updated 7 days ago',
      sourcesCount: 3,
      reviewCount: 76,
      confidence: { level: 'high', percentage: 80, label: 'High confidence · 80%' },
    },
    praises: [
      { title: 'Transparent leadership', percentage: 84, count: 42 },
      { title: 'Insurtech expertise', percentage: 81, count: 39 },
    ],
    mixed: [
      { title: 'Client concentration', percentage: 25, count: 12 },
    ],
    risks: [
      { level: 'Low', category: 'Operational growth', score: 14, description: 'High client renewal rates in mission-critical core systems.' },
    ],
    concernsToInvestigate: [
      { id: '01', title: 'Platform certification', description: 'Ask if company sponsors specialized platform certifications (e.g. Guidewire).' },
    ],
  },

  // 7. Mphasis
  {
    slug: 'mphasis',
    name: 'Mphasis Limited',
    shortName: 'Mphasis',
    logoText: 'mph',
    logoBg: '#4A154B',
    logoColor: '#FFFFFF',
    industry: 'IT Services · India',
    location: 'Bangalore / Pune / Chennai, India',
    website: 'mphasis.com',
    description: 'Applied technology services company powering cloud and cognitive solutions for global commercial banks and insurance giants.',
    overallScore: 79,
    overallScoreMax: 100,
    confidence: { level: 'high', percentage: 78, label: 'High confidence · 78%', detail: '82 verified employee reviews in BFSI transformation.' },
    reviewCount: 82,
    sampleSourcesCount: 3,
    sampleSourcesSummary: 'Oct 2026 · Sample A / B / C',
    categories: {
      culture: { key: 'culture', name: 'Work Culture', score: 80, trend: 'positive', summary: 'Professional banking technology environment with steady working rhythms.', evidenceCount: 40, confidence: { level: 'high', percentage: 78, label: 'High' } },
      salary: { key: 'salary', name: 'Salary & Benefits', score: 73, trend: 'mixed', summary: 'Market-aligned compensation with retention bonuses on key accounts.', evidenceCount: 35, confidence: { level: 'mixed', label: 'Mixed' } },
      wlb: { key: 'wlb', name: 'Work-Life Balance', score: 81, trend: 'positive', summary: 'Predictable work hours aligned with European and North American trading hours.', evidenceCount: 38, confidence: { level: 'high', percentage: 80, label: 'High' } },
      growth: { key: 'growth', name: 'Career Growth', score: 78, trend: 'positive', summary: 'Steady advancement pathways in core banking platforms and microservices.', evidenceCount: 36, confidence: { level: 'high', percentage: 77, label: 'High' } },
      management: { key: 'management', name: 'Management', score: 75, trend: 'mixed', summary: 'Delivery managers emphasize quality compliance and banking SLA adherence.', evidenceCount: 28, confidence: { level: 'mixed', label: 'Mixed' } },
      learning: { key: 'learning', name: 'Learning Opportunities', score: 84, trend: 'positive', summary: 'Rich exposure to cloud migration, container orchestration, and regulatory tech.', evidenceCount: 47, confidence: { level: 'high', percentage: 82, label: 'High' } },
      stability: { key: 'stability', name: 'Job Stability', score: 86, trend: 'positive', summary: 'Blackstone backing and entrenched tier-1 global banking client rosters.', evidenceCount: 42, confidence: { level: 'high', percentage: 85, label: 'High' } },
      satisfaction: { key: 'satisfaction', name: 'Overall Satisfaction', score: 79, trend: 'positive', summary: 'Stable, reliable employer for financial technology practitioners.', evidenceCount: 37, confidence: { level: 'high', percentage: 78, label: 'High' } },
    },
    positiveSignals: ['Strong BFSI client relationships', 'Predictable work schedules'],
    concernSignals: ['Heavy governance overhead in banking compliance'],
    aiSummary: {
      highlight: 'Established financial services technology specialist.',
      quote: 'Mphasis provides deep enterprise exposure to core banking transformation and cloud-native architecture in a stable, well-governed setting.',
      freshness: 'Updated 9 days ago',
      sourcesCount: 3,
      reviewCount: 82,
      confidence: { level: 'high', percentage: 78, label: 'High confidence · 78%' },
    },
    praises: [
      { title: 'Core banking systems', percentage: 82, count: 41 },
      { title: 'Job stability', percentage: 85, count: 44 },
    ],
    mixed: [
      { title: 'Regulatory documentation', percentage: 38, count: 19 },
    ],
    risks: [
      { level: 'Low', category: 'Client stability', score: 15, description: 'Deep institutional embedding in top global financial institutions.' },
    ],
    concernsToInvestigate: [
      { id: '01', title: 'Cloud exposure', description: 'Clarify whether role involves legacy mainframe modernisation or new cloud native microservices.' },
    ],
  },

  // 8. Oracle Financial Services Software (OFSS)
  {
    slug: 'ofss',
    name: 'Oracle Financial Services Software',
    shortName: 'OFSS',
    logoText: 'ofss',
    logoBg: '#C74634',
    logoColor: '#FFFFFF',
    industry: 'Financial Technology · India',
    location: 'Mumbai / Bangalore / Pune, India',
    website: 'oracle.com/financial-services',
    description: 'Oracle subsidiary building Oracle FLEXCUBE, the world-renowned core banking and financial analytics platform.',
    overallScore: 83,
    overallScoreMax: 100,
    confidence: { level: 'high', percentage: 82, label: 'High confidence · 82%', detail: '95 verified reviews from banking software engineers.' },
    reviewCount: 95,
    sampleSourcesCount: 3,
    sampleSourcesSummary: 'Oct 2026 · Sample A / B / C',
    categories: {
      culture: { key: 'culture', name: 'Work Culture', score: 82, trend: 'positive', summary: 'Mature product software engineering with high technical rigor.', evidenceCount: 45, confidence: { level: 'high', percentage: 81, label: 'High' } },
      salary: { key: 'salary', name: 'Salary & Benefits', score: 81, trend: 'positive', summary: 'Attractive product compensation with Oracle equity purchase schemes.', evidenceCount: 42, confidence: { level: 'high', percentage: 80, label: 'High' } },
      wlb: { key: 'wlb', name: 'Work-Life Balance', score: 84, trend: 'positive', summary: 'Excellent work-life balance with disciplined release cadences.', evidenceCount: 47, confidence: { level: 'high', percentage: 83, label: 'High' } },
      growth: { key: 'growth', name: 'Career Growth', score: 82, trend: 'positive', summary: 'Clear individual contributor hierarchy from Staff to Principal Architect.', evidenceCount: 41, confidence: { level: 'high', percentage: 81, label: 'High' } },
      management: { key: 'management', name: 'Management', score: 80, trend: 'positive', summary: 'Seasoned technical leadership with decades of fintech domain pedigree.', evidenceCount: 32, confidence: { level: 'high', percentage: 79, label: 'High' } },
      learning: { key: 'learning', name: 'Learning Opportunities', score: 88, trend: 'positive', summary: 'Deep knowledge of core transaction processing, database internals, and high-frequency ledgers.', evidenceCount: 54, confidence: { level: 'high', percentage: 86, label: 'High' } },
      stability: { key: 'stability', name: 'Job Stability', score: 91, trend: 'positive', summary: 'Exceptional stability backed by Oracle parentage and ubiquitous FLEXCUBE banking presence.', evidenceCount: 58, confidence: { level: 'high', percentage: 90, label: 'High' } },
      satisfaction: { key: 'satisfaction', name: 'Overall Satisfaction', score: 83, trend: 'positive', summary: 'Strong career satisfaction for backend and systems developers.', evidenceCount: 44, confidence: { level: 'high', percentage: 82, label: 'High' } },
    },
    positiveSignals: ['Exceptional job stability & Oracle brand', 'Product software engineering on FLEXCUBE'],
    concernSignals: ['Large enterprise pace in legacy release pipelines'],
    aiSummary: {
      highlight: 'Tier-1 enterprise banking product development environment.',
      quote: 'OFSS combines the job security of Oracle with hands-on development on mission-critical banking engines powering global financial commerce.',
      freshness: 'Updated 6 days ago',
      sourcesCount: 3,
      reviewCount: 95,
      confidence: { level: 'high', percentage: 82, label: 'High confidence · 82%' },
    },
    praises: [
      { title: 'Job stability', percentage: 91, count: 58 },
      { title: 'Work-life balance', percentage: 85, count: 52 },
      { title: 'Database & backend depth', percentage: 87, count: 54 },
    ],
    mixed: [
      { title: 'Modern framework adoption', percentage: 32, count: 18 },
    ],
    risks: [
      { level: 'Low', category: 'Business resilience', score: 10, description: 'Ubiquitous core banking platform with ultra-high switching costs.' },
    ],
    concernsToInvestigate: [
      { id: '01', title: 'Product division', description: 'Verify whether role is on cloud microservices or core database stored procedures.' },
    ],
  },

  // 9. IBM India
  {
    slug: 'ibm-india',
    name: 'IBM India',
    shortName: 'IBM India',
    logoText: 'ibm',
    logoBg: '#052FAD',
    logoColor: '#FFFFFF',
    industry: 'Hybrid Cloud & AI · India',
    location: 'Bangalore / Hyderabad / Pune, India',
    website: 'ibm.com/in-en',
    description: 'Global pioneer in enterprise hybrid cloud infrastructure, Red Hat OpenShift ecosystems, quantum computing, and watsonx AI.',
    overallScore: 84,
    overallScoreMax: 100,
    confidence: { level: 'high', percentage: 84, label: 'High confidence · 84%', detail: '142 reviews verified across software labs and consulting.' },
    reviewCount: 142,
    sampleSourcesCount: 3,
    sampleSourcesSummary: 'Oct 2026 · Sample A / B / C',
    categories: {
      culture: { key: 'culture', name: 'Work Culture', score: 86, trend: 'positive', summary: 'Inclusive, intellectual, and research-driven workplace culture.', evidenceCount: 65, confidence: { level: 'high', percentage: 85, label: 'High' } },
      salary: { key: 'salary', name: 'Salary & Benefits', score: 80, trend: 'positive', summary: 'Competitive pay in India Software Labs (ISL), solid health and wellness perks.', evidenceCount: 58, confidence: { level: 'high', percentage: 80, label: 'High' } },
      wlb: { key: 'wlb', name: 'Work-Life Balance', score: 86, trend: 'positive', summary: 'Industry-leading work-life balance and autonomous hybrid schedules.', evidenceCount: 66, confidence: { level: 'high', percentage: 86, label: 'High' } },
      growth: { key: 'growth', name: 'Career Growth', score: 82, trend: 'positive', summary: 'World-class technical bands (Distinguished Engineer / IBM Fellow pathways).', evidenceCount: 55, confidence: { level: 'high', percentage: 81, label: 'High' } },
      management: { key: 'management', name: 'Management', score: 81, trend: 'positive', summary: 'Supportive managers with structured quarterly mentorship discussions.', evidenceCount: 46, confidence: { level: 'high', percentage: 80, label: 'High' } },
      learning: { key: 'learning', name: 'Learning Opportunities', score: 91, trend: 'positive', summary: 'Infinite access to internal patents, research papers, and Red Hat learning paths.', evidenceCount: 78, confidence: { level: 'high', percentage: 89, label: 'High' } },
      stability: { key: 'stability', name: 'Job Stability', score: 87, trend: 'positive', summary: 'Long-standing global institution with entrenched enterprise contracts.', evidenceCount: 68, confidence: { level: 'high', percentage: 87, label: 'High' } },
      satisfaction: { key: 'satisfaction', name: 'Overall Satisfaction', score: 84, trend: 'positive', summary: 'High pride in work culture and research-oriented engineering.', evidenceCount: 60, confidence: { level: 'high', percentage: 83, label: 'High' } },
    },
    positiveSignals: ['Exceptional work-life balance & patent culture', 'Red Hat & Hybrid Cloud technical depth'],
    concernSignals: ['Large enterprise matrix bureaucracy in consulting divisions'],
    aiSummary: {
      highlight: 'Prestigious research and open enterprise software environment.',
      quote: 'IBM India provides an intellectually stimulating environment with peerless learning resources and balanced working hours, particularly within IBM Software Labs.',
      freshness: 'Updated 5 days ago',
      sourcesCount: 3,
      reviewCount: 142,
      confidence: { level: 'high', percentage: 84, label: 'High confidence · 84%' },
    },
    praises: [
      { title: 'Work-life balance', percentage: 89, count: 74 },
      { title: 'Intellectual depth & patents', percentage: 87, count: 71 },
      { title: 'Inclusive culture', percentage: 91, count: 79 },
    ],
    mixed: [
      { title: 'Reorganization frequency', percentage: 34, count: 26 },
    ],
    risks: [
      { level: 'Low', category: 'Tenure security', score: 14, description: 'Century-old institution with vital enterprise systems footprint.' },
    ],
    concernsToInvestigate: [
      { id: '01', title: 'Entity allocation', description: 'Inquire whether role is in IBM Software Labs (ISL) or Client Innovation Centers (CIC).' },
    ],
  },

  // 10. Capgemini India
  {
    slug: 'capgemini-india',
    name: 'Capgemini India',
    shortName: 'Capgemini',
    logoText: 'cap',
    logoBg: '#12ABDB',
    logoColor: '#FFFFFF',
    industry: 'IT Services · India',
    location: 'Mumbai / Bangalore / Pune / Hyderabad, India',
    website: 'capgemini.com/in-en',
    description: 'European consulting and digital engineering heavyweight with massive delivery presence across Indian tech hubs.',
    overallScore: 80,
    overallScoreMax: 100,
    confidence: { level: 'high', percentage: 81, label: 'High confidence · 81%', detail: '124 employee reviews analyzed across European & North American accounts.' },
    reviewCount: 124,
    sampleSourcesCount: 3,
    sampleSourcesSummary: 'Oct 2026 · Sample A / B / C',
    categories: {
      culture: { key: 'culture', name: 'Work Culture', score: 81, trend: 'positive', summary: 'Warm European corporate culture emphasizing diversity and ethical standards.', evidenceCount: 56, confidence: { level: 'high', percentage: 80, label: 'High' } },
      salary: { key: 'salary', name: 'Salary & Benefits', score: 72, trend: 'mixed', summary: 'Standard Tier-1 IT services compensation structure with annual increments.', evidenceCount: 48, confidence: { level: 'conflict', label: 'Mixed' } },
      wlb: { key: 'wlb', name: 'Work-Life Balance', score: 82, trend: 'positive', summary: 'Good balance with strict adherence to standard business hour communication.', evidenceCount: 54, confidence: { level: 'high', percentage: 81, label: 'High' } },
      growth: { key: 'growth', name: 'Career Growth', score: 80, trend: 'positive', summary: 'Vast internal rotation programs and international mobility possibilities.', evidenceCount: 49, confidence: { level: 'high', percentage: 79, label: 'High' } },
      management: { key: 'management', name: 'Management', score: 77, trend: 'mixed', summary: 'Approachable leadership style influenced by European corporate values.', evidenceCount: 41, confidence: { level: 'mixed', label: 'Mixed' } },
      learning: { key: 'learning', name: 'Learning Opportunities', score: 86, trend: 'positive', summary: 'Extensive Capgemini University programs and cloud hyperscaler partnerships.', evidenceCount: 66, confidence: { level: 'high', percentage: 84, label: 'High' } },
      stability: { key: 'stability', name: 'Job Stability', score: 87, trend: 'positive', summary: 'Rock-solid financial footing and long-tenured European enterprise clients.', evidenceCount: 60, confidence: { level: 'high', percentage: 86, label: 'High' } },
      satisfaction: { key: 'satisfaction', name: 'Overall Satisfaction', score: 80, trend: 'positive', summary: 'Consistent positive sentiment across technology consulting practices.', evidenceCount: 52, confidence: { level: 'high', percentage: 80, label: 'High' } },
    },
    positiveSignals: ['Human-centric European workplace ethos', 'Strong international mobility avenues'],
    concernSignals: ['Appraisal percentages moderate for junior bands'],
    aiSummary: {
      highlight: 'People-first global IT consulting and engineering partner.',
      quote: 'Capgemini India combines global scale with European workplace values, offering predictable working hours and comprehensive learning through Capgemini University.',
      freshness: 'Updated 7 days ago',
      sourcesCount: 3,
      reviewCount: 124,
      confidence: { level: 'high', percentage: 81, label: 'High confidence · 81%' },
    },
    praises: [
      { title: 'Work culture & ethics', percentage: 84, count: 59 },
      { title: 'Work-life balance', percentage: 81, count: 54 },
      { title: 'Global mobility', percentage: 75, count: 48 },
    ],
    mixed: [
      { title: 'Fresher pay band scaling', percentage: 42, count: 29 },
    ],
    risks: [
      { level: 'Low', category: 'Economic stability', score: 14, description: 'Broad client diversification across aerospace, automotive, and public sector.' },
    ],
    concernsToInvestigate: [
      { id: '01', title: 'Client timezone', description: 'Ask whether account operates in CET (Central European Time) or US timezones.' },
    ],
  },

  // 11. Amazon
  {
    slug: 'amazon',
    name: 'Amazon',
    shortName: 'Amazon',
    logoText: 'amz',
    logoBg: '#FF9900',
    logoColor: '#000000',
    industry: 'Cloud & E-Commerce · Global',
    location: 'Seattle / Hyderabad / Bangalore, India',
    website: 'amazon.jobs',
    description: 'Global technology behemoth leading cloud computing (AWS), e-commerce logistics, AI foundation models, and consumer devices.',
    overallScore: 88,
    overallScoreMax: 100,
    confidence: { level: 'high', percentage: 87, label: 'High confidence · 87%', detail: '215 verified engineering reviews across AWS and Retail systems.' },
    reviewCount: 215,
    sampleSourcesCount: 4,
    sampleSourcesSummary: 'Oct 2026 · Sample A / B / C / D',
    categories: {
      culture: { key: 'culture', name: 'Work Culture', score: 82, trend: 'mixed', summary: 'Customer-obsessed, high-ownership engineering driven by 16 Leadership Principles.', evidenceCount: 110, confidence: { level: 'high', percentage: 86, label: 'High' } },
      salary: { key: 'salary', name: 'Salary & Benefits', score: 94, trend: 'positive', summary: 'Top-of-market compensation with aggressive base pay and vesting RSUs.', evidenceCount: 105, confidence: { level: 'high', percentage: 92, label: 'High' } },
      wlb: { key: 'wlb', name: 'Work-Life Balance', score: 73, trend: 'mixed', summary: 'Demanding operational tempo with on-call pager duty rotations.', evidenceCount: 98, confidence: { level: 'conflict', label: 'Mixed' } },
      growth: { key: 'growth', name: 'Career Growth', score: 91, trend: 'positive', summary: 'Massive internal mobility and rapid promotional velocity for high performers.', evidenceCount: 102, confidence: { level: 'high', percentage: 90, label: 'High' } },
      management: { key: 'management', name: 'Management', score: 81, trend: 'mixed', summary: 'Data-driven, bar-raiser leadership style with rigorous performance metrics.', evidenceCount: 88, confidence: { level: 'high', percentage: 83, label: 'High' } },
      learning: { key: 'learning', name: 'Learning Opportunities', score: 95, trend: 'positive', summary: 'Unrivaled planetary-scale distributed systems architecture experience.', evidenceCount: 122, confidence: { level: 'high', percentage: 94, label: 'High' } },
      stability: { key: 'stability', name: 'Job Stability', score: 88, trend: 'positive', summary: 'Incomparable financial strength and market leadership across AWS and Retail.', evidenceCount: 96, confidence: { level: 'high', percentage: 88, label: 'High' } },
      satisfaction: { key: 'satisfaction', name: 'Overall Satisfaction', score: 86, trend: 'positive', summary: 'Intensely rewarding for ambitious engineers seeking high impact and top pay.', evidenceCount: 108, confidence: { level: 'high', percentage: 87, label: 'High' } },
    },
    positiveSignals: ['Elite compensation packages & stock', 'Planetary-scale distributed systems exposure'],
    concernSignals: ['Demanding on-call shifts and operational pressure'],
    aiSummary: {
      highlight: 'Tier-1 technology leader for high scale, high ownership, and elite pay.',
      quote: 'Amazon is a phenomenal engineering crucible. Engineers tackle monumental distributed systems challenges with top-tier compensation, though operational on-call duties require stamina.',
      freshness: 'Updated 3 days ago',
      sourcesCount: 4,
      reviewCount: 215,
      confidence: { level: 'high', percentage: 87, label: 'High confidence · 87%' },
    },
    praises: [
      { title: 'Planetary distributed systems', percentage: 94, count: 124 },
      { title: 'Top-tier compensation', percentage: 93, count: 121 },
      { title: 'Ownership & autonomy', percentage: 89, count: 110 },
    ],
    mixed: [
      { title: 'On-call pager intensity', percentage: 48, count: 52 },
      { title: 'Work-life balance consistency', percentage: 41, count: 44 },
    ],
    risks: [
      { level: 'Medium', category: 'Operational burnout', score: 54, description: 'On-call rotations can involve late-night sev-2 triage.' },
      { level: 'Low', category: 'Career brand value', score: 8, description: 'Amazon tenure on a resume commands immediate global prestige.' },
    ],
    concernsToInvestigate: [
      { id: '01', title: 'On-call rotation frequency', description: 'Ask how many weeks per quarter the team is primary on-call and average ticket counts.' },
      { id: '02', title: 'Tech stack ownership', description: 'Confirm if role focuses on AWS native service builds or internal tooling pipelines.' },
    ],
  },

  // 12. Apple
  {
    slug: 'apple',
    name: 'Apple Inc.',
    shortName: 'Apple',
    logoText: 'apl',
    logoBg: '#1C1C1E',
    logoColor: '#FFFFFF',
    industry: 'Consumer Hardware & Systems · Global',
    location: 'Cupertino / Hyderabad / Bangalore, India',
    website: 'apple.com/careers',
    description: 'Global tech titan creating iconic hardware (iPhone, Mac, Apple Silicon) and seamless operating system software platforms.',
    overallScore: 91,
    overallScoreMax: 100,
    confidence: { level: 'high', percentage: 90, label: 'High confidence · 90%', detail: '168 engineering reviews verified across software, maps, and silicon.' },
    reviewCount: 168,
    sampleSourcesCount: 4,
    sampleSourcesSummary: 'Oct 2026 · Sample A / B / C / D',
    categories: {
      culture: { key: 'culture', name: 'Work Culture', score: 92, trend: 'positive', summary: 'Uncompromising craftsmanship, extreme attention to detail, and deep privacy focus.', evidenceCount: 92, confidence: { level: 'high', percentage: 91, label: 'High' } },
      salary: { key: 'salary', name: 'Salary & Benefits', score: 93, trend: 'positive', summary: 'Premium compensation packages, lucrative ESPP, and comprehensive family health plans.', evidenceCount: 88, confidence: { level: 'high', percentage: 92, label: 'High' } },
      wlb: { key: 'wlb', name: 'Work-Life Balance', score: 84, trend: 'positive', summary: 'Healthy boundaries with high respect for employee personal time outside hardware launch crunch.', evidenceCount: 81, confidence: { level: 'high', percentage: 85, label: 'High' } },
      growth: { key: 'growth', name: 'Career Growth', score: 88, trend: 'positive', summary: 'Exceptional career trajectory collaborating alongside world-renowned hardware and software minds.', evidenceCount: 84, confidence: { level: 'high', percentage: 88, label: 'High' } },
      management: { key: 'management', name: 'Management', score: 89, trend: 'positive', summary: 'Expert functional leadership by subject matter masters rather than generalist managers.', evidenceCount: 75, confidence: { level: 'high', percentage: 89, label: 'High' } },
      learning: { key: 'learning', name: 'Learning Opportunities', score: 93, trend: 'positive', summary: 'Unsurpassed hardware-software co-design, OS kernel internals, and compiler engineering.', evidenceCount: 98, confidence: { level: 'high', percentage: 92, label: 'High' } },
      stability: { key: 'stability', name: 'Job Stability', score: 95, trend: 'positive', summary: 'Trillion-dollar balance sheet with immense cash reserves and unmatched brand loyalty.', evidenceCount: 89, confidence: { level: 'high', percentage: 95, label: 'High' } },
      satisfaction: { key: 'satisfaction', name: 'Overall Satisfaction', score: 92, trend: 'positive', summary: 'Extraordinary pride in shipping consumer products touched by billions of people.', evidenceCount: 94, confidence: { level: 'high', percentage: 91, label: 'High' } },
    },
    positiveSignals: ['World-class craftsmanship culture', 'Fortress balance sheet & premier compensation'],
    concernSignals: ['Strict secrecy and internal compartmentalization protocols'],
    aiSummary: {
      highlight: 'Pinnacle of hardware-software integration and design craftsmanship.',
      quote: 'Apple offers an extraordinary engineering standard with functional leadership and top compensation, ideal for engineers passionate about shipping perfection.',
      freshness: 'Updated 4 days ago',
      sourcesCount: 4,
      reviewCount: 168,
      confidence: { level: 'high', percentage: 90, label: 'High confidence · 90%' },
    },
    praises: [
      { title: 'Engineering perfectionism', percentage: 95, count: 98 },
      { title: 'Product pride', percentage: 96, count: 102 },
      { title: 'Functional management', percentage: 91, count: 86 },
    ],
    mixed: [
      { title: 'Need-to-know information silos', percentage: 38, count: 32 },
    ],
    risks: [
      { level: 'Low', category: 'Financial security', score: 6, description: 'Among the most financially secure corporations on Earth.' },
    ],
    concernsToInvestigate: [
      { id: '01', title: 'Product crunch timing', description: 'Inquire how hardware launch cycles influence software release sprint pacing.' },
    ],
  },

  // 13. NVIDIA
  {
    slug: 'nvidia',
    name: 'NVIDIA Corporation',
    shortName: 'NVIDIA',
    logoText: 'nv',
    logoBg: '#76B900',
    logoColor: '#000000',
    industry: 'Semiconductors & AI Systems · Global',
    location: 'Santa Clara / Pune / Bangalore, India',
    website: 'nvidia.com/careers',
    description: 'The world leader in accelerated computing, GPU architecture, CUDA developer platforms, and generative AI supercomputing infrastructure.',
    overallScore: 94,
    overallScoreMax: 100,
    confidence: { level: 'high', percentage: 92, label: 'High confidence · 92%', detail: '154 verified reviews across GPU software, AI kernels, and systems.' },
    reviewCount: 154,
    sampleSourcesCount: 4,
    sampleSourcesSummary: 'Oct 2026 · Sample A / B / C / D',
    categories: {
      culture: { key: 'culture', name: 'Work Culture', score: 95, trend: 'positive', summary: 'Flat organization, transparent communication, and extraordinary high-performance execution.', evidenceCount: 88, confidence: { level: 'high', percentage: 94, label: 'High' } },
      salary: { key: 'salary', name: 'Salary & Benefits', score: 97, trend: 'positive', summary: 'Exceptional wealth creation via surging RSU equity and top-tier base compensation.', evidenceCount: 85, confidence: { level: 'high', percentage: 96, label: 'High' } },
      wlb: { key: 'wlb', name: 'Work-Life Balance', score: 85, trend: 'positive', summary: 'Demanding yet flexible with generous global "Free Days" and autonomous management.', evidenceCount: 78, confidence: { level: 'high', percentage: 86, label: 'High' } },
      growth: { key: 'growth', name: 'Career Growth', score: 96, trend: 'positive', summary: 'Unmatched career velocity at the epicenter of the global generative AI revolution.', evidenceCount: 86, confidence: { level: 'high', percentage: 95, label: 'High' } },
      management: { key: 'management', name: 'Management', score: 93, trend: 'positive', summary: 'Mission-driven leadership under Jensen Huang with unmatched technological foresight.', evidenceCount: 74, confidence: { level: 'high', percentage: 92, label: 'High' } },
      learning: { key: 'learning', name: 'Learning Opportunities', score: 98, trend: 'positive', summary: 'Front-row access to LLM training clusters, CUDA kernel optimization, and high-speed interconnects.', evidenceCount: 96, confidence: { level: 'high', percentage: 98, label: 'High' } },
      stability: { key: 'stability', name: 'Job Stability', score: 96, trend: 'positive', summary: 'Indispensable AI computing monopoly with multi-billion-dollar backlog.', evidenceCount: 82, confidence: { level: 'high', percentage: 95, label: 'High' } },
      satisfaction: { key: 'satisfaction', name: 'Overall Satisfaction', score: 95, trend: 'positive', summary: 'Virtually unanimous employee pride and excitement for future technological impact.', evidenceCount: 90, confidence: { level: 'high', percentage: 94, label: 'High' } },
    },
    positiveSignals: ['Highest employee satisfaction & wealth creation', 'Epicenter of AI and accelerated computing'],
    concernSignals: ['Extremely rapid technological evolution requires constant learning'],
    aiSummary: {
      highlight: 'Global leader in AI hardware and high-performance computing.',
      quote: 'NVIDIA represents the most coveted engineering employer in modern tech, boasting transformative AI technology, peerless compensation, and visionary leadership.',
      freshness: 'Updated 2 days ago',
      sourcesCount: 4,
      reviewCount: 154,
      confidence: { level: 'high', percentage: 92, label: 'High confidence · 92%' },
    },
    praises: [
      { title: 'Generative AI leadership', percentage: 98, count: 96 },
      { title: 'Equity compensation & wealth', percentage: 97, count: 93 },
      { title: 'CEO vision & flat structure', percentage: 96, count: 91 },
    ],
    mixed: [
      { title: 'Intensity of tech pace', percentage: 22, count: 18 },
    ],
    risks: [
      { level: 'Low', category: 'Market obsolescence', score: 4, description: 'Irreplaceable moat with proprietary CUDA ecosystem and hardware integration.' },
    ],
    concernsToInvestigate: [
      { id: '01', title: 'Systems vs Software role', description: 'Determine whether team focuses on system firmware, CUDA runtime, or cloud microservices.' },
    ],
  },

  // 14. Meta Platforms
  {
    slug: 'meta',
    name: 'Meta Platforms',
    shortName: 'Meta',
    logoText: 'meta',
    logoBg: '#0668E1',
    logoColor: '#FFFFFF',
    industry: 'Social Platforms & AI Research · Global',
    location: 'Menlo Park / Hyderabad / Bangalore, India',
    website: 'metacareers.com',
    description: 'Pioneering social connection platforms (Instagram, WhatsApp, Facebook) and open-source AI frontier models (Llama, PyTorch).',
    overallScore: 89,
    overallScoreMax: 100,
    confidence: { level: 'high', percentage: 88, label: 'High confidence · 88%', detail: '174 reviews verified across core infrastructure and apps.' },
    reviewCount: 174,
    sampleSourcesCount: 4,
    sampleSourcesSummary: 'Oct 2026 · Sample A / B / C / D',
    categories: {
      culture: { key: 'culture', name: 'Work Culture', score: 86, trend: 'positive', summary: 'High-agency, "move fast", autonomous engineering with minimal middle management friction.', evidenceCount: 94, confidence: { level: 'high', percentage: 87, label: 'High' } },
      salary: { key: 'salary', name: 'Salary & Benefits', score: 96, trend: 'positive', summary: 'Market-topping cash compensation, RSUs, and exceptional healthcare/wellness benefits.', evidenceCount: 90, confidence: { level: 'high', percentage: 95, label: 'High' } },
      wlb: { key: 'wlb', name: 'Work-Life Balance', score: 78, trend: 'mixed', summary: 'Autonomous scheduling, but bi-annual performance calibration drives rigorous output expectations.', evidenceCount: 82, confidence: { level: 'mixed', label: 'Mixed' } },
      growth: { key: 'growth', name: 'Career Growth', score: 89, trend: 'positive', summary: 'High mobility and massive engineering impact on products reaching billions daily.', evidenceCount: 86, confidence: { level: 'high', percentage: 89, label: 'High' } },
      management: { key: 'management', name: 'Management', score: 82, trend: 'positive', summary: 'Lean management hierarchy that prioritizes shipping code and unblocking engineers.', evidenceCount: 76, confidence: { level: 'high', percentage: 82, label: 'High' } },
      learning: { key: 'learning', name: 'Learning Opportunities', score: 94, trend: 'positive', summary: 'World-class AI infrastructure, open-source model architectures, and distributed systems tooling.', evidenceCount: 102, confidence: { level: 'high', percentage: 93, label: 'High' } },
      stability: { key: 'stability', name: 'Job Stability', score: 87, trend: 'positive', summary: 'Immense advertising cash flows and unmatched network effects.', evidenceCount: 85, confidence: { level: 'high', percentage: 88, label: 'High' } },
      satisfaction: { key: 'satisfaction', name: 'Overall Satisfaction', score: 88, trend: 'positive', summary: 'Extremely high job satisfaction among builders who thrive in high-autonomy teams.', evidenceCount: 92, confidence: { level: 'high', percentage: 88, label: 'High' } },
    },
    positiveSignals: ['Market-topping compensation', 'High engineering agency & open-source AI (Llama)'],
    concernSignals: ['Rigorous performance calibrations (PSC)'],
    aiSummary: {
      highlight: 'High-autonomy builder culture with top-tier compensation.',
      quote: 'Meta offers exceptional engineering agency and market-leading pay. Engineers ship at planetary scale with direct access to open AI frontier systems like Llama.',
      freshness: 'Updated 4 days ago',
      sourcesCount: 4,
      reviewCount: 174,
      confidence: { level: 'high', percentage: 88, label: 'High confidence · 88%' },
    },
    praises: [
      { title: 'Top tier compensation', percentage: 96, count: 98 },
      { title: 'High engineer autonomy', percentage: 91, count: 92 },
      { title: 'Open-source AI impact', percentage: 93, count: 94 },
    ],
    mixed: [
      { title: 'Performance calibration anxiety', percentage: 42, count: 38 },
    ],
    risks: [
      { level: 'Medium', category: 'Performance scrutiny', score: 46, description: 'High expectations for measurable engineering delivery impact.' },
    ],
    concernsToInvestigate: [
      { id: '01', title: 'Team impact metric', description: 'Understand how success is measured (e.g., product metrics vs infrastructure latency).' },
    ],
  },

  // 15. Adobe
  {
    slug: 'adobe',
    name: 'Adobe Inc.',
    shortName: 'Adobe',
    logoText: 'adb',
    logoBg: '#FA0F00',
    logoColor: '#FFFFFF',
    industry: 'Creative & Experience Software · Global',
    location: 'San Jose / Noida / Bangalore, India',
    website: 'adobe.com/careers',
    description: 'Global authority in digital media (Photoshop, Premiere, Firefly Generative AI) and digital customer experience software.',
    overallScore: 90,
    overallScoreMax: 100,
    confidence: { level: 'high', percentage: 89, label: 'High confidence · 89%', detail: '148 reviews verified across India Development Centers.' },
    reviewCount: 148,
    sampleSourcesCount: 4,
    sampleSourcesSummary: 'Oct 2026 · Sample A / B / C / D',
    categories: {
      culture: { key: 'culture', name: 'Work Culture', score: 93, trend: 'positive', summary: 'Empathetic, inclusive, and famously family-friendly workplace culture.', evidenceCount: 82, confidence: { level: 'high', percentage: 92, label: 'High' } },
      salary: { key: 'salary', name: 'Salary & Benefits', score: 91, trend: 'positive', summary: 'Lucrative compensation packages, generous stock grants, and global company shutdowns.', evidenceCount: 78, confidence: { level: 'high', percentage: 90, label: 'High' } },
      wlb: { key: 'wlb', name: 'Work-Life Balance', score: 92, trend: 'positive', summary: 'Gold standard for work-life balance in the software industry.', evidenceCount: 84, confidence: { level: 'high', percentage: 93, label: 'High' } },
      growth: { key: 'growth', name: 'Career Growth', score: 87, trend: 'positive', summary: 'Clear promotion tracks and strong support for internal role changes.', evidenceCount: 74, confidence: { level: 'high', percentage: 86, label: 'High' } },
      management: { key: 'management', name: 'Management', score: 88, trend: 'positive', summary: 'Empathetic managers focused on holistic employee wellbeing and sustainable delivery.', evidenceCount: 68, confidence: { level: 'high', percentage: 87, label: 'High' } },
      learning: { key: 'learning', name: 'Learning Opportunities', score: 90, trend: 'positive', summary: 'Exciting work in generative imaging (Firefly), computer vision, and cloud document systems.', evidenceCount: 86, confidence: { level: 'high', percentage: 90, label: 'High' } },
      stability: { key: 'stability', name: 'Job Stability', score: 92, trend: 'positive', summary: 'Rock-solid subscription SaaS recurring revenue model.', evidenceCount: 80, confidence: { level: 'high', percentage: 92, label: 'High' } },
      satisfaction: { key: 'satisfaction', name: 'Overall Satisfaction', score: 91, trend: 'positive', summary: 'Consistently named one of the most beloved technology workplaces globally.', evidenceCount: 85, confidence: { level: 'high', percentage: 91, label: 'High' } },
    },
    positiveSignals: ['Exceptional work-life balance & benefits', 'Creative tools loved by creators worldwide'],
    concernSignals: ['Occasional slower decision-making due to consensus culture'],
    aiSummary: {
      highlight: 'Gold standard of tech work-life balance and creative software.',
      quote: 'Adobe offers an idyllic blend of high-paying tier-1 software engineering and genuinely healthy work-life balance, supported by regular company-wide wellness breaks.',
      freshness: 'Updated 5 days ago',
      sourcesCount: 4,
      reviewCount: 148,
      confidence: { level: 'high', percentage: 89, label: 'High confidence · 89%' },
    },
    praises: [
      { title: 'Work-life balance & wellbeing', percentage: 95, count: 88 },
      { title: 'Generous benefits & breaks', percentage: 93, count: 84 },
      { title: 'Respectful culture', percentage: 94, count: 86 },
    ],
    mixed: [
      { title: 'Consensus pace', percentage: 25, count: 19 },
    ],
    risks: [
      { level: 'Low', category: 'Subscription stability', score: 8, description: 'Ubiquitous industry-standard creative and document cloud suites.' },
    ],
    concernsToInvestigate: [
      { id: '01', title: 'Product area', description: 'Determine if working on Creative Cloud, Document Cloud, or Experience Cloud platforms.' },
    ],
  },

  // 16. Salesforce
  {
    slug: 'salesforce',
    name: 'Salesforce, Inc.',
    shortName: 'Salesforce',
    logoText: 'sfdc',
    logoBg: '#00A1E0',
    logoColor: '#FFFFFF',
    industry: 'Enterprise Software & CRM · Global',
    location: 'San Francisco / Hyderabad / Bangalore, India',
    website: 'salesforce.com/careers',
    description: 'Global titan in customer relationship management (CRM), enterprise cloud workflows, Agentforce autonomous AI, and Slack.',
    overallScore: 87,
    overallScoreMax: 100,
    confidence: { level: 'high', percentage: 86, label: 'High confidence · 86%', detail: '138 reviews verified across India Centers of Excellence.' },
    reviewCount: 138,
    sampleSourcesCount: 3,
    sampleSourcesSummary: 'Oct 2026 · Sample A / B / C',
    categories: {
      culture: { key: 'culture', name: 'Work Culture', score: 88, trend: 'positive', summary: '"Ohana" culture prioritizing volunteerism, inclusivity, and community trust.', evidenceCount: 72, confidence: { level: 'high', percentage: 87, label: 'High' } },
      salary: { key: 'salary', name: 'Salary & Benefits', score: 88, trend: 'positive', summary: 'Strong compensation packages, wellness allowances, and competitive stock awards.', evidenceCount: 68, confidence: { level: 'high', percentage: 87, label: 'High' } },
      wlb: { key: 'wlb', name: 'Work-Life Balance', score: 85, trend: 'positive', summary: 'Good balance with flexible PTO and flexible hybrid workspace options.', evidenceCount: 70, confidence: { level: 'high', percentage: 85, label: 'High' } },
      growth: { key: 'growth', name: 'Career Growth', score: 84, trend: 'positive', summary: 'Wide range of engineering disciplines across Data Cloud, Slack, and Agentforce.', evidenceCount: 65, confidence: { level: 'high', percentage: 83, label: 'High' } },
      management: { key: 'management', name: 'Management', score: 82, trend: 'positive', summary: 'Supportive managers with structured 1-on-1s and transparent career discussions.', evidenceCount: 58, confidence: { level: 'high', percentage: 81, label: 'High' } },
      learning: { key: 'learning', name: 'Learning Opportunities', score: 89, trend: 'positive', summary: 'Deep enterprise multi-tenant cloud architecture and real-time distributed data streams.', evidenceCount: 76, confidence: { level: 'high', percentage: 88, label: 'High' } },
      stability: { key: 'stability', name: 'Job Stability', score: 89, trend: 'positive', summary: 'Market-dominant enterprise CRM with ultra-sticky corporate relationships.', evidenceCount: 71, confidence: { level: 'high', percentage: 89, label: 'High' } },
      satisfaction: { key: 'satisfaction', name: 'Overall Satisfaction', score: 87, trend: 'positive', summary: 'High pride in building enterprise systems that drive global commercial operations.', evidenceCount: 73, confidence: { level: 'high', percentage: 86, label: 'High' } },
    },
    positiveSignals: ['Strong "Ohana" values and volunteer focus', 'Dominant enterprise software market leader'],
    concernSignals: ['Increasing focus on operational efficiency and margins'],
    aiSummary: {
      highlight: 'Market leader in enterprise cloud SaaS and autonomous agentic AI.',
      quote: 'Salesforce delivers a rich culture, top tier enterprise architecture exposure, and competitive compensation, bolstered by significant innovation in autonomous enterprise agents.',
      freshness: 'Updated 6 days ago',
      sourcesCount: 3,
      reviewCount: 138,
      confidence: { level: 'high', percentage: 86, label: 'High confidence · 86%' },
    },
    praises: [
      { title: 'Inclusivity & community', percentage: 90, count: 76 },
      { title: 'Enterprise cloud depth', percentage: 87, count: 72 },
    ],
    mixed: [
      { title: 'Shifting sales targets impact', percentage: 35, count: 25 },
    ],
    risks: [
      { level: 'Low', category: 'Market presence', score: 12, description: 'Ubiquitous enterprise workflow adoption with multi-year contract renewals.' },
    ],
    concernsToInvestigate: [
      { id: '01', title: 'Cloud technology stack', description: 'Ask if working on core Salesforce monolith or modern autonomous Agentforce services.' },
    ],
  },

  // 17. Cisco Systems
  {
    slug: 'cisco',
    name: 'Cisco Systems',
    shortName: 'Cisco',
    logoText: 'csc',
    logoBg: '#1BA0D7',
    logoColor: '#FFFFFF',
    industry: 'Networking & Enterprise Security · Global',
    location: 'San Jose / Bangalore, India',
    website: 'cisco.com/careers',
    description: 'Worldwide leader in computer networking infrastructure, cybersecurity, zero-trust architectures, and collaboration systems.',
    overallScore: 88,
    overallScoreMax: 100,
    confidence: { level: 'high', percentage: 87, label: 'High confidence · 87%', detail: '130 reviews verified across Bangalore Global Development Center.' },
    reviewCount: 130,
    sampleSourcesCount: 3,
    sampleSourcesSummary: 'Oct 2026 · Sample A / B / C',
    categories: {
      culture: { key: 'culture', name: 'Work Culture', score: 92, trend: 'positive', summary: 'Famous "Conscious Culture" with profound employee care and exceptional peer support.', evidenceCount: 72, confidence: { level: 'high', percentage: 91, label: 'High' } },
      salary: { key: 'salary', name: 'Salary & Benefits', score: 87, trend: 'positive', summary: 'Competitive compensation packages, generous stock awards, and great health coverage.', evidenceCount: 66, confidence: { level: 'high', percentage: 86, label: 'High' } },
      wlb: { key: 'wlb', name: 'Work-Life Balance', score: 91, trend: 'positive', summary: 'Regarded as one of the best companies worldwide for work-life integration.', evidenceCount: 75, confidence: { level: 'high', percentage: 92, label: 'High' } },
      growth: { key: 'growth', name: 'Career Growth', score: 83, trend: 'positive', summary: 'Stable, structured growth pathways with high tenure retention.', evidenceCount: 62, confidence: { level: 'high', percentage: 82, label: 'High' } },
      management: { key: 'management', name: 'Management', score: 86, trend: 'positive', summary: 'Compassionate, experienced managers with continuous check-in frameworks.', evidenceCount: 56, confidence: { level: 'high', percentage: 85, label: 'High' } },
      learning: { key: 'learning', name: 'Learning Opportunities', score: 89, trend: 'positive', summary: 'Pinnacle of networking protocols, packet inspection, SD-WAN, and cloud security.', evidenceCount: 74, confidence: { level: 'high', percentage: 88, label: 'High' } },
      stability: { key: 'stability', name: 'Job Stability', score: 89, trend: 'positive', summary: 'Foundational backbone of the world internet infrastructure.', evidenceCount: 68, confidence: { level: 'high', percentage: 89, label: 'High' } },
      satisfaction: { key: 'satisfaction', name: 'Overall Satisfaction', score: 88, trend: 'positive', summary: 'Consistently ranks in Fortune’s #1 Best Companies to Work For.', evidenceCount: 70, confidence: { level: 'high', percentage: 88, label: 'High' } },
    },
    positiveSignals: ['Ranked #1 Great Place to Work repeatedly', 'World backbone networking and security engineering'],
    concernSignals: ['Periodic restructuring in shifting hardware lines'],
    aiSummary: {
      highlight: 'Global benchmark for employee wellbeing and networking engineering.',
      quote: 'Cisco provides an unbeatable combination of network engineering excellence, deeply compassionate culture, and stellar work-life balance.',
      freshness: 'Updated 5 days ago',
      sourcesCount: 3,
      reviewCount: 130,
      confidence: { level: 'high', percentage: 87, label: 'High confidence · 87%' },
    },
    praises: [
      { title: 'Conscious culture & empathy', percentage: 94, count: 78 },
      { title: 'Work-life balance', percentage: 93, count: 76 },
      { title: 'Networking depth', percentage: 90, count: 72 },
    ],
    mixed: [
      { title: 'Reorganization restructuring', percentage: 32, count: 22 },
    ],
    risks: [
      { level: 'Low', category: 'Internet backbone stability', score: 11, description: 'Critical infrastructure provider for telecommunications and enterprise backbones.' },
    ],
    concernsToInvestigate: [
      { id: '01', title: 'Business unit focus', description: 'Clarify whether role is in cloud software security (Splunk/Duo) or routing hardware firmware.' },
    ],
  },

  // 18. Intel Corporation
  {
    slug: 'intel',
    name: 'Intel Corporation',
    shortName: 'Intel',
    logoText: 'int',
    logoBg: '#0068B5',
    logoColor: '#FFFFFF',
    industry: 'Semiconductors & Systems · Global',
    location: 'Santa Clara / Bangalore, India',
    website: 'intel.com/jobs',
    description: 'Pioneering semiconductor chipmaker engineering x86 processor architectures, foundry services, and deep silicon software.',
    overallScore: 82,
    overallScoreMax: 100,
    confidence: { level: 'high', percentage: 81, label: 'High confidence · 81%', detail: '115 reviews verified from silicon architects and firmware engineers.' },
    reviewCount: 115,
    sampleSourcesCount: 3,
    sampleSourcesSummary: 'Oct 2026 · Sample A / B / C',
    categories: {
      culture: { key: 'culture', name: 'Work Culture', score: 82, trend: 'positive', summary: 'Engineering-first ethos with high scientific rigor and collaborative problem solving.', evidenceCount: 58, confidence: { level: 'high', percentage: 81, label: 'High' } },
      salary: { key: 'salary', name: 'Salary & Benefits', score: 82, trend: 'positive', summary: 'Solid compensation with competitive semiconductor industry base pay and benefits.', evidenceCount: 52, confidence: { level: 'high', percentage: 80, label: 'High' } },
      wlb: { key: 'wlb', name: 'Work-Life Balance', score: 84, trend: 'positive', summary: 'High respect for work-life balance and flexible working policies.', evidenceCount: 56, confidence: { level: 'high', percentage: 83, label: 'High' } },
      growth: { key: 'growth', name: 'Career Growth', score: 79, trend: 'mixed', summary: 'Deep individual contributor technical tracks with Principal Engineer titles.', evidenceCount: 50, confidence: { level: 'mixed', label: 'Mixed' } },
      management: { key: 'management', name: 'Management', score: 78, trend: 'positive', summary: 'Technically sharp engineering management with deep chip fabrication knowledge.', evidenceCount: 44, confidence: { level: 'high', percentage: 77, label: 'High' } },
      learning: { key: 'learning', name: 'Learning Opportunities', score: 92, trend: 'positive', summary: 'Peerless mastery of computer architecture, silicon microcode, and semiconductor physics.', evidenceCount: 68, confidence: { level: 'high', percentage: 90, label: 'High' } },
      stability: { key: 'stability', name: 'Job Stability', score: 81, trend: 'mixed', summary: 'Strategic national semiconductor importance balanced against competitive foundry transitions.', evidenceCount: 54, confidence: { level: 'mixed', label: 'Mixed' } },
      satisfaction: { key: 'satisfaction', name: 'Overall Satisfaction', score: 82, trend: 'positive', summary: 'High satisfaction among engineers committed to hardware fundamentals and systems.', evidenceCount: 55, confidence: { level: 'high', percentage: 81, label: 'High' } },
    },
    positiveSignals: ['Profound semiconductor and systems architecture depth', 'Good work-life balance and benefits'],
    concernSignals: ['Intense competitive pressure from fabless and ARM chipmakers'],
    aiSummary: {
      highlight: 'Foundational institution for silicon architecture and systems software.',
      quote: 'Intel offers an irreplaceable education in computer engineering, processor architecture, and low-level software stacks, with a respectful and balanced work environment.',
      freshness: 'Updated 7 days ago',
      sourcesCount: 3,
      reviewCount: 115,
      confidence: { level: 'high', percentage: 81, label: 'High confidence · 81%' },
    },
    praises: [
      { title: 'Computer architecture depth', percentage: 92, count: 62 },
      { title: 'Work-life balance', percentage: 85, count: 56 },
    ],
    mixed: [
      { title: 'Foundry turnaround transition', percentage: 40, count: 28 },
    ],
    risks: [
      { level: 'Medium', category: 'Competitive headwinds', score: 45, description: 'Ongoing multi-year foundry turnaround strategy.' },
    ],
    concernsToInvestigate: [
      { id: '01', title: 'Software vs Hardware focus', description: 'Confirm if role involves compiler optimization, firmware/BIOS, or silicon validation.' },
    ],
  },

  // 19. Qualcomm
  {
    slug: 'qualcomm',
    name: 'Qualcomm Incorporated',
    shortName: 'Qualcomm',
    logoText: 'qcom',
    logoBg: '#3253DC',
    logoColor: '#FFFFFF',
    industry: 'Wireless Systems & Mobile Chips · Global',
    location: 'San Diego / Hyderabad / Bangalore, India',
    website: 'qualcomm.com/careers',
    description: 'World leader in 5G wireless technology, Snapdragon mobile processors, automotive cockpits, and on-device AI silicon.',
    overallScore: 86,
    overallScoreMax: 100,
    confidence: { level: 'high', percentage: 85, label: 'High confidence · 85%', detail: '122 reviews verified across Hyderabad & Bangalore engineering centers.' },
    reviewCount: 122,
    sampleSourcesCount: 3,
    sampleSourcesSummary: 'Oct 2026 · Sample A / B / C',
    categories: {
      culture: { key: 'culture', name: 'Work Culture', score: 86, trend: 'positive', summary: 'Strong innovation culture with deep respect for invention and patent creation.', evidenceCount: 64, confidence: { level: 'high', percentage: 85, label: 'High' } },
      salary: { key: 'salary', name: 'Salary & Benefits', score: 87, trend: 'positive', summary: 'Top-tier semiconductor compensation with generous patent bonuses and RSUs.', evidenceCount: 60, confidence: { level: 'high', percentage: 86, label: 'High' } },
      wlb: { key: 'wlb', name: 'Work-Life Balance', score: 83, trend: 'positive', summary: 'Solid balance with standard chip tape-out deadlines factored into planning.', evidenceCount: 62, confidence: { level: 'high', percentage: 82, label: 'High' } },
      growth: { key: 'growth', name: 'Career Growth', score: 85, trend: 'positive', summary: 'High career trajectory for firmware, systems, and DSP engineers.', evidenceCount: 58, confidence: { level: 'high', percentage: 84, label: 'High' } },
      management: { key: 'management', name: 'Management', score: 82, trend: 'positive', summary: 'Technically brilliant managers who mentor on patent drafting and chip design.', evidenceCount: 50, confidence: { level: 'high', percentage: 81, label: 'High' } },
      learning: { key: 'learning', name: 'Learning Opportunities', score: 94, trend: 'positive', summary: 'Premier destination for RF engineering, modem protocols, and on-device neural processing units (NPU).', evidenceCount: 74, confidence: { level: 'high', percentage: 92, label: 'High' } },
      stability: { key: 'stability', name: 'Job Stability', score: 88, trend: 'positive', summary: 'Dominant IP patent licensing and indispensable Snapdragon mobile market presence.', evidenceCount: 66, confidence: { level: 'high', percentage: 88, label: 'High' } },
      satisfaction: { key: 'satisfaction', name: 'Overall Satisfaction', score: 86, trend: 'positive', summary: 'Very high pride in powering the global smartphone and automotive ecosystem.', evidenceCount: 63, confidence: { level: 'high', percentage: 85, label: 'High' } },
    },
    positiveSignals: ['Exceptional patent bonuses and innovation culture', 'Dominant mobile and on-device AI Snapdragon leadership'],
    concernSignals: ['Tape-out cycles require focused sprint effort'],
    aiSummary: {
      highlight: 'Global superpower in wireless communications and mobile AI silicon.',
      quote: 'Qualcomm provides unmatched exposure to modem architectures, low-level DSP programming, and on-device AI silicon, rewarded by top-tier compensation and patent incentives.',
      freshness: 'Updated 5 days ago',
      sourcesCount: 3,
      reviewCount: 122,
      confidence: { level: 'high', percentage: 85, label: 'High confidence · 85%' },
    },
    praises: [
      { title: 'Invention & patent incentives', percentage: 93, count: 68 },
      { title: 'Snapdragon & mobile leadership', percentage: 91, count: 66 },
      { title: 'Strong semiconductor compensation', percentage: 88, count: 62 },
    ],
    mixed: [
      { title: 'Tape-out deadline intensity', percentage: 33, count: 23 },
    ],
    risks: [
      { level: 'Low', category: 'IP licensing moat', score: 9, description: 'Massive patent portfolio forming fundamental standard-essential patents for cellular networks.' },
    ],
    concernsToInvestigate: [
      { id: '01', title: 'System layer', description: 'Ask if working on modem DSP firmware, Android OS BSP, or NPU AI acceleration runtimes.' },
    ],
  },

  // 20. SAP
  {
    slug: 'sap',
    name: 'SAP SE',
    shortName: 'SAP',
    logoText: 'sap',
    logoBg: '#008FD3',
    logoColor: '#FFFFFF',
    industry: 'Enterprise Software & ERP · Global',
    location: 'Walldorf / Bangalore / Gurgaon, India',
    website: 'sap.com/careers',
    description: 'European enterprise software leader powering global enterprise resource planning (S/4HANA), business AI, and supply chain solutions.',
    overallScore: 89,
    overallScoreMax: 100,
    confidence: { level: 'high', percentage: 88, label: 'High confidence · 88%', detail: '146 reviews verified across SAP Labs India.' },
    reviewCount: 146,
    sampleSourcesCount: 3,
    sampleSourcesSummary: 'Oct 2026 · Sample A / B / C',
    categories: {
      culture: { key: 'culture', name: 'Work Culture', score: 92, trend: 'positive', summary: 'Warm, respectful, European workplace ethos with unmatched employee wellbeing programs.', evidenceCount: 80, confidence: { level: 'high', percentage: 91, label: 'High' } },
      salary: { key: 'salary', name: 'Salary & Benefits', score: 87, trend: 'positive', summary: 'Generous compensation packages, MoveSAP share programs, and premium onsite perks.', evidenceCount: 75, confidence: { level: 'high', percentage: 87, label: 'High' } },
      wlb: { key: 'wlb', name: 'Work-Life Balance', score: 93, trend: 'positive', summary: 'Celebrated for having among the best work-life balance policies worldwide.', evidenceCount: 84, confidence: { level: 'high', percentage: 94, label: 'High' } },
      growth: { key: 'growth', name: 'Career Growth', score: 85, trend: 'positive', summary: 'Global fellowship programs allowing engineers to work in Germany, US, and beyond.', evidenceCount: 71, confidence: { level: 'high', percentage: 84, label: 'High' } },
      management: { key: 'management', name: 'Management', score: 88, trend: 'positive', summary: 'Empathetic managers who foster trust, psychological safety, and sustainable pace.', evidenceCount: 65, confidence: { level: 'high', percentage: 87, label: 'High' } },
      learning: { key: 'learning', name: 'Learning Opportunities', score: 88, trend: 'positive', summary: 'Deep enterprise data models, business technology platform (BTP), and in-memory HANA databases.', evidenceCount: 78, confidence: { level: 'high', percentage: 88, label: 'High' } },
      stability: { key: 'stability', name: 'Job Stability', score: 94, trend: 'positive', summary: 'Unshakable enterprise presence running the commerce operations of 99 of the world’s 100 largest companies.', evidenceCount: 82, confidence: { level: 'high', percentage: 94, label: 'High' } },
      satisfaction: { key: 'satisfaction', name: 'Overall Satisfaction', score: 90, trend: 'positive', summary: 'Exceptional retention rates and immense pride in enterprise software craft.', evidenceCount: 79, confidence: { level: 'high', percentage: 89, label: 'High' } },
    },
    positiveSignals: ['Exceptional work-life balance and SAP Labs campus perks', 'Critical software running 87% of total global commerce'],
    concernSignals: ['Enterprise release testing rigor requires high patience'],
    aiSummary: {
      highlight: 'Premier European enterprise tech employer with world-class work-life balance.',
      quote: 'SAP Labs India delivers an outstanding blend of mission-critical enterprise engineering, extraordinary work-life balance, and generous global mobility programs.',
      freshness: 'Updated 4 days ago',
      sourcesCount: 3,
      reviewCount: 146,
      confidence: { level: 'high', percentage: 88, label: 'High confidence · 88%' },
    },
    praises: [
      { title: 'Work-life balance benchmark', percentage: 96, count: 91 },
      { title: 'Campus culture & benefits', percentage: 94, count: 88 },
      { title: 'Global mobility fellowships', percentage: 89, count: 82 },
    ],
    mixed: [
      { title: 'Enterprise compliance pace', percentage: 28, count: 21 },
    ],
    risks: [
      { level: 'Low', category: 'Business continuity', score: 5, description: 'Powering mission-critical operations for the world’s leading global enterprises.' },
    ],
    concernsToInvestigate: [
      { id: '01', title: 'Platform layer', description: 'Ask whether role develops on SAP Business Technology Platform (BTP), HANA core, or Cloud ERP.' },
    ],
  },
];

async function seedExpanded() {
  try {
    logger.info('Connecting to MongoDB for expanded company dataset seeding...');
    await mongoose.connect(env.MONGODB_URI);
    logger.info('Connected to MongoDB.');

    logger.info(`Starting idempotent seeding of ${expandedCompanies.length} additional companies...`);

    let seededCount = 0;
    for (const c of expandedCompanies) {
      // 1. Upsert Company
      const companyDoc = await Company.findOneAndUpdate(
        { slug: c.slug },
        {
          $set: {
            slug: c.slug,
            name: c.name,
            shortName: c.shortName,
            logoText: c.logoText,
            logoBg: c.logoBg,
            logoColor: c.logoColor,
            industry: c.industry,
            location: c.location,
            website: c.website,
            description: c.description,
            overallScore: c.overallScore,
            overallScoreMax: c.overallScoreMax,
            confidence: c.confidence,
            reviewCount: c.reviewCount,
            sampleSourcesCount: c.sampleSourcesCount,
            sampleSourcesSummary: c.sampleSourcesSummary,
            isDemoData: true,
            active: true,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // 2. Upsert CompanyIntelligence
      await CompanyIntelligence.findOneAndUpdate(
        { companySlug: c.slug },
        {
          $set: {
            companyId: companyDoc._id,
            companySlug: companyDoc.slug,
            categories: c.categories,
            positiveSignals: c.positiveSignals,
            concernSignals: c.concernSignals,
            aiSummary: c.aiSummary,
            praises: c.praises,
            mixed: c.mixed,
            risks: c.risks,
            concernsToInvestigate: c.concernsToInvestigate,
            isDemoData: true,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // 3. Re-seed Sources cleanly for this company
      await Source.deleteMany({ companySlug: c.slug });
      const sampleSources = [
        {
          companyId: companyDoc._id,
          companySlug: companyDoc.slug,
          name: `${c.shortName} official disclosures`,
          type: 'Official Company',
          sampleSize: '1 corporate profile · Operations',
          date: 'Oct 2026',
          freshness: 'Recent · 8 days',
          status: 'Verified',
          statusType: 'verified',
          description: 'Official corporate reports, public filings, and verified employment guidelines.',
          agreement: 'Official baseline',
          isDemoData: true,
        },
        {
          companyId: companyDoc._id,
          companySlug: companyDoc.slug,
          name: 'Verified employee reviews sample',
          type: 'Employee Review',
          sampleSize: `${c.reviewCount} verified submissions`,
          reviewCount: c.reviewCount,
          date: 'Oct 2026',
          freshness: 'Recent · 8 days',
          status: 'High confidence',
          statusType: 'verified',
          description: 'Aggregated verified engineer submissions across major development centers.',
          agreement: 'Strong consensus on culture and technical learning.',
          isDemoData: true,
        },
        {
          companyId: companyDoc._id,
          companySlug: companyDoc.slug,
          name: 'Industry compensation & talent benchmark',
          type: 'Public Dataset',
          sampleSize: 'Annual talent report',
          date: 'Jul 2026',
          freshness: 'Moderate · 3 months',
          status: 'Verified',
          statusType: 'info',
          description: 'Comparative sector benchmarking report covering compensation bands and retention metrics.',
          agreement: 'Matches category evidence',
          isDemoData: true,
        },
      ];
      const createdSources = await Source.insertMany(sampleSources);

      // 4. Re-seed Evidence cleanly for this company
      await Evidence.deleteMany({ companySlug: c.slug });
      await Evidence.create({
        companyId: companyDoc._id,
        companySlug: companyDoc.slug,
        categoryKey: 'learning',
        claim: `Engineers at ${c.shortName} consistently report strong learning opportunities and technology exposure.`,
        status: 'SUPPORTED',
        reviewsAnalyzed: c.reviewCount,
        relevantMentions: c.categories.learning.evidenceCount,
        sentimentBreakdown: {
          positive: Math.round(c.categories.learning.evidenceCount * 0.76),
          neutral: Math.round(c.categories.learning.evidenceCount * 0.16),
          negative: Math.round(c.categories.learning.evidenceCount * 0.08),
        },
        sources: [
          { name: 'Verified employee reviews sample', reviewCount: Math.round(c.reviewCount * 0.55), date: 'Oct 2026', verified: true, statusText: 'Verified' },
          { name: 'Industry talent benchmark', reviewCount: Math.round(c.reviewCount * 0.45), date: 'Jul 2026', verified: true, statusText: 'Verified' },
        ],
        sourceIds: createdSources.map((s) => s._id),
        confidence: {
          level: 'high',
          percentage: c.categories.learning.confidence.percentage || 85,
          label: `${c.categories.learning.confidence.percentage || 85}% high confidence`,
          detail: 'Consistent positive sentiment across independent review channels.',
        },
        limitations: [
          'Team variations: Technology stacks and mentorship depth vary by business unit.',
          'Self-selected feedback: Reviews originate from voluntary verified submissions.',
        ],
        contextNote: 'Sources agree on high learning velocity and exposure to scalable architectures.',
        userPreferenceNote: 'Learning opportunity evidence is evaluated independently of personal Career DNA weighting.',
        isDemoData: true,
      });

      // 5. Upsert ReviewAggregate
      await ReviewAggregate.findOneAndUpdate(
        { companySlug: c.slug },
        {
          $set: {
            companyId: companyDoc._id,
            companySlug: companyDoc.slug,
            companyName: companyDoc.name,
            totalReviews: c.reviewCount,
            sampleSourcesCount: c.sampleSourcesCount,
            daysSinceCheck: 8,
            commonPositiveThemes: c.praises.map((p) => ({
              theme: p.title,
              percentage: p.percentage,
              signal: 'positive',
            })),
            concernsWorthExploring: c.mixed.map((m) => ({
              concern: m.title,
              percentage: m.percentage,
              signal: 'negative',
            })),
            sentimentTrend: [
              { year: 2024, positive: 65, neutral: 22, negative: 13 },
              { year: 2025, positive: 70, neutral: 18, negative: 12 },
              { year: 2026, positive: 75, neutral: 16, negative: 9 },
            ],
            sourceAgreement: {
              summary: 'Consistent alignment across employee feedback and independent industry datasets.',
              sources: createdSources.map((s) => ({
                name: s.name,
                reviewCount: s.reviewCount || 40,
                date: s.date,
                verified: s.status === 'Verified',
              })),
            },
            themesTable: [
              { theme: 'Learning opportunities', relatedMentions: c.categories.learning.evidenceCount, evidenceQuality: 'High / Recent', signal: 'positive', nextStep: 'Open learning evidence' },
              { theme: 'Work culture & environment', relatedMentions: c.categories.culture.evidenceCount, evidenceQuality: 'High / Recent', signal: 'positive', nextStep: 'View culture breakdown' },
              { theme: 'Compensation satisfaction', relatedMentions: c.categories.salary.evidenceCount, evidenceQuality: 'Verified sample', signal: c.categories.salary.trend === 'positive' ? 'positive' : 'negative', nextStep: 'Compare salary signals' },
            ],
            interpretation: {
              summary: c.aiSummary.quote,
              limitations: 'Reviews reflect individual workplace experiences and may vary by team, geography, and project allocation.',
            },
            isDemoData: true,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      seededCount++;
      logger.info(`[${seededCount}/${expandedCompanies.length}] Successfully upserted ${c.name} (${c.slug})`);
    }

    const totalInDb = await Company.countDocuments();
    logger.info(`✅ Successfully seeded expanded company dataset! Total companies in MongoDB: ${totalInDb}`);
    process.exit(0);
  } catch (error) {
    logger.error('❌ Seeding expanded dataset failed:', error);
    process.exit(1);
  }
}

seedExpanded();
