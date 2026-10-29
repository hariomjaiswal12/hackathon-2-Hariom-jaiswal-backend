const BaseCompanyProvider = require('./BaseCompanyProvider');
const logger = require('../../utils/logger');

function isCompanyLike(description = '') {
  const d = description.toLowerCase();
  return (
    d.includes('company') ||
    d.includes('corporation') ||
    d.includes('enterprise') ||
    d.includes('multinational') ||
    d.includes('business') ||
    d.includes('startup') ||
    d.includes('firm') ||
    d.includes('conglomerate') ||
    d.includes('developer') ||
    d.includes('services') ||
    d.includes('software') ||
    d.includes('technology') ||
    d.includes('tech') ||
    d.includes('bank') ||
    d.includes('consulting') ||
    d.includes('agency')
  );
}

class WikidataRegistryProvider extends BaseCompanyProvider {
  constructor() {
    super('wikidata', 'Wikidata Global Knowledge Base');
    this.baseUrl = 'https://www.wikidata.org/w/api.php';
  }

  isEnabled() {
    return true;
  }

  getAttribution() {
    return {
      provider: this.name,
      displayName: this.displayName,
      license: 'Creative Commons CC0 1.0 Universal Public Domain Dedication',
      attributionText: 'Structured entity data sourced from Wikidata (wikidata.org) under CC0.',
      sourceUrl: 'https://www.wikidata.org',
    };
  }

  async searchCompanies(query, options = {}) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const { limit = 8, timeoutMs = 4000 } = options;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `${this.baseUrl}?action=wbsearchentities&search=${encodeURIComponent(query.trim())}&language=en&format=json&limit=${Math.min(limit * 2, 20)}&type=item`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'CompanyIQ/1.0 (Enterprise Entity Discovery; info@companyiq.dev)',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        logger.warn(`[Wikidata] Search returned HTTP ${res.status}`);
        return [];
      }

      const data = await res.json();
      const rawList = data?.search || [];

      // Filter to items that are businesses/companies/startups
      const companyItems = rawList.filter((item) => isCompanyLike(item.description || ''));

      return companyItems.slice(0, limit).map((item) => {
        const desc = item.description || 'Corporate entity';
        let country = 'Global';
        if (desc.toLowerCase().includes('indian') || desc.toLowerCase().includes('in india')) country = 'India';
        else if (desc.toLowerCase().includes('american') || desc.toLowerCase().includes('in the united states')) country = 'United States';
        else if (desc.toLowerCase().includes('british') || desc.toLowerCase().includes('in the united kingdom')) country = 'United Kingdom';

        return {
          name: item.label,
          legalName: item.label,
          shortName: item.label,
          registrationNumber: item.id, // Wikidata QID
          jurisdiction: country,
          country,
          location: country,
          industry: desc,
          description: desc,
          overallScore: null, // Genuine factual data, no invented ratings
          isDemoData: false,
          confidence: {
            level: 'medium',
            label: 'Public Knowledge Base',
            detail: `Verified from Wikidata structured knowledge graph (${item.id}).`,
          },
          verificationStatus: 'THIRD_PARTY_VERIFIED',
          dataSources: [
            {
              provider: 'Wikidata',
              sourceUrl: item.concepturi || `https://www.wikidata.org/wiki/${item.id}`,
              retrievedAt: new Date(),
              confidence: 'THIRD_PARTY_VERIFIED',
              fieldsProvided: ['name', 'description', 'industry', 'country'],
              attribution: 'Data sourced from Wikidata under Creative Commons CC0.',
            },
          ],
        };
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        logger.warn(`[Wikidata] Search timed out after ${timeoutMs}ms.`);
      } else {
        logger.warn(`[Wikidata] Search failed: ${err.message}`);
      }
      return [];
    } finally {
      clearTimeout(timeout);
    }
  }
}

module.exports = WikidataRegistryProvider;

