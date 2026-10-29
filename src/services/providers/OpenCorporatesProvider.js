const BaseCompanyProvider = require('./BaseCompanyProvider');
const env = require('../../config/env');
const logger = require('../../utils/logger');

class OpenCorporatesProvider extends BaseCompanyProvider {
  constructor() {
    super('opencorporates', 'OpenCorporates');
    this.apiToken = env.OPENCORPORATES_API_TOKEN;
    this.baseUrl = 'https://api.opencorporates.com/v0.4';
  }

  isEnabled() {
    return Boolean(this.apiToken && this.apiToken.trim());
  }

  getAttribution() {
    return {
      provider: this.name,
      displayName: this.displayName,
      license: 'Open Database License (ODbL) / OpenCorporates Public Terms',
      attributionText: 'Company legal registration data provided by OpenCorporates (opencorporates.com)',
      sourceUrl: 'https://opencorporates.com',
    };
  }

  async searchCompanies(query, options = {}) {
    if (!this.isEnabled()) {
      logger.info('[OpenCorporates] Skipped: OPENCORPORATES_API_TOKEN not configured in environment.');
      return [];
    }

    if (!query || query.trim().length < 2) {
      return [];
    }

    const { jurisdiction, limit = 10, timeoutMs = 4000 } = options;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        api_token: this.apiToken,
      });

      if (jurisdiction) {
        params.append('jurisdiction_code', jurisdiction.toLowerCase());
      }

      const url = `${this.baseUrl}/companies/search?${params.toString()}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'CompanyIQ/1.0 (Enterprise Discovery; info@companyiq.dev)',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          logger.warn(`[OpenCorporates] Authentication error (${res.status}): Please check OPENCORPORATES_API_TOKEN.`);
          return [];
        }
        if (res.status === 429) {
          logger.warn('[OpenCorporates] Rate limit exceeded. Backing off.');
          return [];
        }
        logger.warn(`[OpenCorporates] API returned status ${res.status}`);
        return [];
      }

      const data = await res.json();
      const rawList = data?.results?.companies || [];

      return rawList.slice(0, limit).map(({ company: c }) => {
        const address = c.registered_address_in_full || 
          (c.registered_address ? Object.values(c.registered_address).filter(Boolean).join(', ') : '');

        const countryCode = (c.jurisdiction_code || '').toUpperCase();
        let country = 'Global';
        if (countryCode === 'IN') country = 'India';
        else if (countryCode === 'GB' || countryCode === 'UK') country = 'United Kingdom';
        else if (countryCode.startsWith('US')) country = 'United States';

        const foundedYear = c.incorporation_date ? new Date(c.incorporation_date).getFullYear() : undefined;

        return {
          name: c.name,
          legalName: c.name,
          shortName: c.name,
          registrationNumber: c.company_number,
          jurisdiction: c.jurisdiction_code ? c.jurisdiction_code.toUpperCase() : 'Unknown',
          country,
          location: address || country,
          headquarters: address || undefined,
          legalStatus: c.current_status || (c.inactive ? 'Inactive' : 'Active'),
          foundedYear: isNaN(foundedYear) ? undefined : foundedYear,
          industry: c.company_type || 'Corporate Entity',
          website: c.registry_url || undefined,
          logoUrl: undefined,
          overallScore: null, // Genuine factual data, no invented ratings
          isDemoData: false,
          confidence: {
            level: 'high',
            label: 'Official Legal Entity',
            detail: `Verified from OpenCorporates legal registry under jurisdiction ${c.jurisdiction_code || 'global'}.`,
          },
          verificationStatus: 'OFFICIAL_REGISTRY',
          dataSources: [
            {
              provider: 'OpenCorporates',
              sourceUrl: c.opencorporates_url || `https://opencorporates.com/companies/${c.jurisdiction_code}/${c.company_number}`,
              retrievedAt: new Date(),
              confidence: 'OFFICIAL_REGISTRY',
              fieldsProvided: ['name', 'registrationNumber', 'jurisdiction', 'legalStatus', 'foundedYear', 'headquarters'],
              attribution: 'Legal entity record sourced from OpenCorporates under ODbL.',
            },
          ],
        };
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        logger.warn(`[OpenCorporates] Request timed out after ${timeoutMs}ms.`);
      } else {
        logger.warn(`[OpenCorporates] Request failed: ${err.message}`);
      }
      return [];
    } finally {
      clearTimeout(timeout);
    }
  }
}

module.exports = OpenCorporatesProvider;

