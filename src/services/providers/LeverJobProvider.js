/**
 * LeverJobProvider.js
 * Integration with Lever Postings Public API.
 * Docs: https://github.com/lever/postings-api
 */

class LeverJobProvider {
  constructor() {
    this.name = 'LEVER';
    this.baseUrl = 'https://api.lever.co/v0/postings';
    this.timeout = 10000;
  }

  detectWorkArrangement(workplaceType = '', title = '', location = '') {
    const wt = (workplaceType || '').toLowerCase();
    if (wt === 'remote') return 'Remote';
    if (wt === 'hybrid') return 'Hybrid';
    if (wt === 'on-site' || wt === 'onsite') return 'On-site';

    const text = `${title} ${location}`.toLowerCase();
    if (text.includes('remote')) return 'Remote';
    if (text.includes('hybrid')) return 'Hybrid';
    if (text.includes('on-site') || text.includes('onsite')) return 'On-site';
    return 'Unspecified';
  }

  extractSkills(title = '', description = '') {
    const knownSkills = [
      'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Go', 'Rust', 'Java',
      'C++', 'AWS', 'GCP', 'Azure', 'Kubernetes', 'Docker', 'GraphQL', 'REST',
      'PostgreSQL', 'MongoDB', 'Redis', 'SQL', 'Kafka', 'AI', 'Machine Learning',
      'LLM', 'GenAI', 'Next.js', 'Tailwind', 'Swift', 'Kotlin', 'Flutter', 'DevOps',
      'CI/CD', 'Security', 'Figma', 'System Design', 'Microservices'
    ];

    const haystack = `${title} ${description}`.toLowerCase();
    const matches = [];

    for (const skill of knownSkills) {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(haystack)) {
        matches.push(skill);
      }
    }

    return matches.slice(0, 8);
  }

  extractSalary(additionalText = '', description = '') {
    const combined = `${additionalText} ${description}`;
    const match = combined.match(/\$([0-9]{2,3}(?:,[0-9]{3})+)\s*(?:-|–|to)\s*\$([0-9]{2,3}(?:,[0-9]{3})+)/i);
    if (match) {
      const min = parseInt(match[1].replace(/,/g, ''), 10);
      const max = parseInt(match[2].replace(/,/g, ''), 10);
      return {
        min,
        max,
        currency: 'USD',
        period: 'YEAR',
        text: `$${match[1]} - $${match[2]} / yr`,
      };
    }
    return { min: null, max: null, currency: 'USD', period: 'YEAR', text: null };
  }

  /**
   * Fetch active job postings from Lever for a given site token
   * @param {string} siteToken - Lever site identifier (e.g. 'spotify', 'netflix')
   * @param {Object} companyContext - { name, slug, id }
   */
  async fetchJobs(siteToken, companyContext = {}) {
    if (!siteToken) {
      throw new Error('Lever site token is required');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const url = `${this.baseUrl}/${encodeURIComponent(siteToken)}?mode=json`;
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CompanyIQ-HiringDiscovery/1.0',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { jobs: [], boardFound: false, totalCount: 0 };
        }
        throw new Error(`Lever API responded with status ${response.status}`);
      }

      const rawPostings = await response.json();
      if (!Array.isArray(rawPostings)) {
        return { jobs: [], boardFound: false, totalCount: 0 };
      }

      const parsedJobs = rawPostings.map((raw) => {
        const title = raw.text || 'Untitled Position';
        const locationName = raw.categories?.location || 'Remote';
        const department = raw.categories?.department || raw.categories?.team || 'Engineering';
        const commitment = raw.categories?.commitment || 'Full-time';
        const descPlain = raw.descriptionPlain || '';
        const additionalPlain = raw.additionalPlain || '';
        const workArrangement = this.detectWorkArrangement(raw.workplaceType, title, locationName);
        const skills = this.extractSkills(title, `${descPlain} ${additionalPlain}`);
        const salary = this.extractSalary(additionalPlain, descPlain);

        let employmentType = 'Full-time';
        const lowerCommitment = commitment.toLowerCase();
        if (lowerCommitment.includes('part') || lowerCommitment.includes('part-time')) {
          employmentType = 'Part-time';
        } else if (lowerCommitment.includes('intern') || lowerCommitment.includes('internship')) {
          employmentType = 'Internship';
        } else if (lowerCommitment.includes('contract')) {
          employmentType = 'Contract';
        }

        let experienceRange = 'Mid-Senior Level';
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('senior') || lowerTitle.includes('lead') || lowerTitle.includes('staff')) {
          experienceRange = 'Senior / Lead';
        } else if (lowerTitle.includes('intern')) {
          experienceRange = 'Internship';
        } else if (lowerTitle.includes('junior') || lowerTitle.includes('associate') || lowerTitle.includes('entry')) {
          experienceRange = 'Entry-Level / Junior';
        }

        const applyUrl = raw.applyUrl || raw.hostedUrl || `https://jobs.lever.co/${siteToken}/${raw.id}/apply`;

        return {
          title,
          companyId: companyContext.id || null,
          companySlug: companyContext.slug || siteToken,
          companyName: companyContext.name || siteToken,
          externalJobId: `lever-${raw.id}`,
          description: descPlain.slice(0, 1500),
          responsibilities: [],
          skills,
          experienceRange,
          employmentType,
          workArrangement,
          location: locationName,
          city: locationName.split(',')[0]?.trim() || locationName,
          country: locationName.split(',').pop()?.trim() || 'United States',
          department,
          salary,
          postedAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
          applyUrl,
          originalUrl: raw.hostedUrl || applyUrl,
          sourceProvider: 'LEVER',
          status: 'ACTIVE',
          lastVerifiedAt: new Date(),
          isVerified: true,
        };
      });

      return {
        jobs: parsedJobs,
        boardFound: true,
        totalCount: parsedJobs.length,
        careersUrl: `https://jobs.lever.co/${siteToken}`,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

module.exports = LeverJobProvider;

