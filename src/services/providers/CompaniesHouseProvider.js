const BaseCompanyProvider = require('./BaseCompanyProvider');
const env = require('../../config/env');
const logger = require('../../utils/logger');

class CompaniesHouseProvider extends BaseCompanyProvider {
  constructor() {
    super('companies_house', 'UK Companies House');
    this.apiKey = env.COMPANIES_HOUSE_API_KEY;
    this.baseUrl = 'https://api.company-information.service.gov.uk';
  }

  isEnabled() {
    return Boolean(this.apiKey && this.apiKey.trim());
  }

  getAttribution() {
    return {
      provider: this.name,
      displayName: this.displayName,
      license: 'Open Government Licence v3.0 (OGL)',
      attributionText: 'Contains public sector information licensed under the Open Government Licence v3.0 (Companies House UK).',
      sourceUrl: 'https://www.gov.uk/government/organisations/companies-house',
    };
  }

  async searchCompanies(query, options = {}) {
    if (!this.isEnabled()) {
      return [];
    }

    if (!query || query.trim().length < 2) {
      return [];
    }

    const { limit = 10, timeoutMs = 4000 } = options;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const authHeader = 'Basic ' + Buffer.from(`${this.apiKey}:`).toString('base64');
      const url = `${this.baseUrl}/search/companies?q=${encodeURIComponent(query.trim())}&items_per_page=${limit}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
          'User-Agent': 'CompanyIQ/1.0',
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          logger.warn('[CompaniesHouse] API key unauthorized. Check COMPANIES_HOUSE_API_KEY in .env.');
          return [];
        }
        logger.warn(`[CompaniesHouse] API returned status ${res.status}`);
        return [];
      }

      const data = await res.json();
      const items = data.items || [];

      return items.slice(0, limit).map((c) => {
        const address = c.address_snippet || (c.address ? Object.values(c.address).filter(Boolean).join(', ') : 'United Kingdom');
        const foundedYear = c.date_of_creation ? new Date(c.date_of_creation).getFullYear() : undefined;

        return {
          name: c.title,
          legalName: c.title,
          shortName: c.title,
          registrationNumber: c.company_number,
          jurisdiction: 'United Kingdom (Companies House)',
          country: 'United Kingdom',
          city: c.address?.locality || undefined,
          location: address,
          headquarters: address,
          legalStatus: c.company_status ? (c.company_status === 'active' ? 'Active' : c.company_status) : 'Active',
          foundedYear: isNaN(foundedYear) ? undefined : foundedYear,
          industry: c.company_type || 'Registered Entity',
          overallScore: null,
          isDemoData: false,
          confidence: {
            level: 'high',
            label: 'Official UK Registry',
            detail: `Verified from Companies House UK (Company Number: ${c.company_number}).`,
          },
          verificationStatus: 'OFFICIAL_REGISTRY',
          dataSources: [
            {
              provider: 'Companies House UK',
              sourceUrl: `https://find-and-update.company-information.service.gov.uk/company/${c.company_number}`,
              retrievedAt: new Date(),
              confidence: 'OFFICIAL_REGISTRY',
              fieldsProvided: ['name', 'registrationNumber', 'jurisdiction', 'legalStatus', 'foundedYear', 'headquarters'],
              attribution: 'Crown copyright, Companies House (licensed under Open Government Licence v3.0).',
            },
          ],
        };
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        logger.warn(`[CompaniesHouse] Request timed out after ${timeoutMs}ms.`);
      } else {
        logger.warn(`[CompaniesHouse] Request failed: ${err.message}`);
      }
      return [];
    } finally {
      clearTimeout(timeout);
    }
  }
}

module.exports = CompaniesHouseProvider;

