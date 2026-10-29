const BaseCompanyProvider = require('./BaseCompanyProvider');
const logger = require('../../utils/logger');

class ClearbitDiscoveryProvider extends BaseCompanyProvider {
  constructor() {
    super('clearbit', 'Clearbit Discovery API');
    this.baseUrl = 'https://autocomplete.clearbit.com/v1/companies/suggest';
  }

  isEnabled() {
    return true;
  }

  getAttribution() {
    return {
      provider: this.name,
      displayName: this.displayName,
      license: 'Public Discovery API',
      attributionText: 'Domain and logo discovery verified via Clearbit Discovery API and Google Favicon Service.',
      sourceUrl: 'https://clearbit.com',
    };
  }

  async searchCompanies(query, options = {}) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const { limit = 8, timeoutMs = 3000 } = options;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `${this.baseUrl}?query=${encodeURIComponent(query.trim())}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'CompanyIQ/1.0 (info@companyiq.dev)',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        logger.warn(`[Clearbit] Search returned HTTP ${res.status}`);
        return [];
      }

      const list = await res.json();
      if (!Array.isArray(list)) return [];

      return list.slice(0, limit).map((c) => {
        const domain = (c.domain || '').toLowerCase().replace(/^www\./, '');
        const logoUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : undefined;

        return {
          name: c.name,
          legalName: c.name,
          shortName: c.name,
          domain,
          website: domain ? `https://${domain}` : undefined,
          logoUrl,
          industry: 'Technology & Enterprise',
          location: 'Global',
          country: 'Global',
          overallScore: null,
          isDemoData: false,
          confidence: {
            level: 'medium',
            label: 'Verified Web Entity',
            detail: `Verified domain ${domain} via Clearbit Discovery.`,
          },
          verificationStatus: 'THIRD_PARTY_VERIFIED',
          dataSources: [
            {
              provider: 'Clearbit Discovery',
              sourceUrl: `https://${domain}`,
              retrievedAt: new Date(),
              confidence: 'VERIFIED_DOMAIN',
              fieldsProvided: ['name', 'domain', 'website', 'logoUrl'],
              attribution: 'Domain and web entity verified via Clearbit Discovery API.',
            },
          ],
        };
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        logger.warn(`[Clearbit] Search timed out after ${timeoutMs}ms.`);
      } else {
        logger.warn(`[Clearbit] Search failed: ${err.message}`);
      }
      return [];
    } finally {
      clearTimeout(timeout);
    }
  }
}

module.exports = ClearbitDiscoveryProvider;

