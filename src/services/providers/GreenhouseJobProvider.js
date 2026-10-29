/**
 * GreenhouseJobProvider.js
 * Integration with Greenhouse Job Board Public API.
 * Docs: https://developers.greenhouse.io/job-board.html
 */

class GreenhouseJobProvider {
  constructor() {
    this.name = 'GREENHOUSE';
    this.baseUrl = 'https://boards-api.greenhouse.io/v1/boards';
    this.timeout = 10000;
  }

  /**
   * Helper to strip HTML tags and decode basic entities
   */
  stripHtml(html = '') {
    if (!html) return '';
    let text = html
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ');

    return text
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<\/p>|<\/li>|<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  /**
   * Detect work arrangement from title, location, or content
   */
  detectWorkArrangement(title = '', locationName = '', content = '') {
    const text = `${title} ${locationName} ${content.slice(0, 2000)}`.toLowerCase();
    if ((text.includes('remote') && (text.includes('hybrid') || text.includes('hub') || text.includes('office'))) || text.includes('hybrid')) {
      return 'Hybrid';
    }
    if (text.includes('remote') || text.includes('work from anywhere') || text.includes('distributed')) {
      return 'Remote';
    }
    if (text.includes('on-site') || text.includes('onsite') || text.includes('in-office') || text.includes('office only')) {
      return 'On-site';
    }
    return 'On-site';
  }

  /**
   * Extract basic skills from title and content
   */
  extractSkills(title = '', content = '') {
    const knownSkills = [
      'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Go', 'Rust', 'Java',
      'C++', 'AWS', 'GCP', 'Azure', 'Kubernetes', 'Docker', 'GraphQL', 'REST',
      'PostgreSQL', 'MongoDB', 'Redis', 'SQL', 'Kafka', 'AI', 'Machine Learning',
      'LLM', 'GenAI', 'Next.js', 'Tailwind', 'Swift', 'Kotlin', 'Flutter', 'DevOps',
      'CI/CD', 'Security', 'Figma', 'System Design', 'Microservices'
    ];

    const haystack = `${title} ${content}`.toLowerCase();
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

  /**
   * Extract salary range if disclosed in content
   */
  extractSalary(content = '') {
    if (!content) return { min: null, max: null, currency: 'USD', period: 'YEAR', text: null };

    // Match patterns like: $120,000 - $180,000 or $120,000 to $180,000
    const match = content.match(/\$([0-9]{2,3}(?:,[0-9]{3})+)\s*(?:-|–|to)\s*\$([0-9]{2,3}(?:,[0-9]{3})+)/i);
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

    // Match hourly patterns like $45 - $65 / hr
    const hourlyMatch = content.match(/\$([0-9]{2,3}(?:\.[0-9]{2})?)\s*(?:-|–|to)\s*\$([0-9]{2,3}(?:\.[0-9]{2})?)\s*(?:\/|\s*per\s*)hr/i);
    if (hourlyMatch) {
      return {
        min: parseFloat(hourlyMatch[1]),
        max: parseFloat(hourlyMatch[2]),
        currency: 'USD',
        period: 'HOUR',
        text: `$${hourlyMatch[1]} - $${hourlyMatch[2]} / hr`,
      };
    }

    return { min: null, max: null, currency: 'USD', period: 'YEAR', text: null };
  }

  /**
   * Fetch active job listings for a given board token
   * @param {string} boardToken - Greenhouse board token (e.g. 'figma', 'stripe', 'cloudflare')
   * @param {Object} companyContext - { name, slug, id }
   */
  async fetchJobs(boardToken, companyContext = {}) {
    if (!boardToken) {
      throw new Error('Greenhouse board token is required');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const url = `${this.baseUrl}/${encodeURIComponent(boardToken)}/jobs?content=true`;
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
        throw new Error(`Greenhouse API responded with status ${response.status}`);
      }

      const data = await response.json();
      const rawJobs = Array.isArray(data.jobs) ? data.jobs : [];

      const parsedJobs = rawJobs.map((raw) => {
        const title = raw.title || 'Untitled Opening';
        const rawContent = raw.content || '';
        const plainDesc = this.stripHtml(rawContent);
        const locationName = raw.location?.name || 'Remote';
        const department = raw.departments?.[0]?.name || 'Engineering';
        const workArrangement = this.detectWorkArrangement(title, locationName, plainDesc);
        const skills = this.extractSkills(title, plainDesc);
        const salary = this.extractSalary(plainDesc);

        // Determine experience indicator from title
        let experienceRange = 'Mid-Senior Level';
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('senior') || lowerTitle.includes('lead') || lowerTitle.includes('staff') || lowerTitle.includes('principal')) {
          experienceRange = 'Senior / Lead';
        } else if (lowerTitle.includes('intern') || lowerTitle.includes('internship')) {
          experienceRange = 'Internship';
        } else if (lowerTitle.includes('junior') || lowerTitle.includes('associate') || lowerTitle.includes('entry')) {
          experienceRange = 'Entry-Level / Junior';
        } else if (lowerTitle.includes('director') || lowerTitle.includes('vp') || lowerTitle.includes('head')) {
          experienceRange = 'Executive / Leadership';
        }

        // Determine employment type
        let employmentType = 'Full-time';
        if (lowerTitle.includes('intern') || lowerTitle.includes('internship')) {
          employmentType = 'Internship';
        } else if (lowerTitle.includes('contract') || lowerTitle.includes('contractor')) {
          employmentType = 'Contract';
        } else if (lowerTitle.includes('part-time') || lowerTitle.includes('part time')) {
          employmentType = 'Part-time';
        }

        // Direct apply URL from Greenhouse
        const applyUrl = raw.absolute_url || `https://boards.greenhouse.io/${boardToken}/jobs/${raw.id}`;

        return {
          title,
          companyId: companyContext.id || null,
          companySlug: companyContext.slug || boardToken,
          companyName: companyContext.name || boardToken,
          externalJobId: `greenhouse-${raw.id}`,
          description: plainDesc.slice(0, 1500),
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
          postedAt: raw.updated_at ? new Date(raw.updated_at) : new Date(),
          applyUrl,
          originalUrl: applyUrl,
          sourceProvider: 'GREENHOUSE',
          status: 'ACTIVE',
          lastVerifiedAt: new Date(),
          isVerified: true,
        };
      });

      return {
        jobs: parsedJobs,
        boardFound: true,
        totalCount: parsedJobs.length,
        careersUrl: `https://boards.greenhouse.io/${boardToken}`,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

module.exports = GreenhouseJobProvider;
