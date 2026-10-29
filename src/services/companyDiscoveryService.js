const crypto = require('crypto');
const logger = require('../utils/logger');
const env = require('../config/env');
const ProviderCache = require('../models/ProviderCache');

const OpenCorporatesProvider = require('./providers/OpenCorporatesProvider');
const CompaniesHouseProvider = require('./providers/CompaniesHouseProvider');
const McaIndiaRegistryProvider = require('./providers/McaIndiaRegistryProvider');
const WikidataRegistryProvider = require('./providers/WikidataRegistryProvider');
const ClearbitDiscoveryProvider = require('./providers/ClearbitDiscoveryProvider');

/**
 * Normalizes company strings by stripping legal suffixes, punctuation, and multiple spaces
 */
function normalizeCompanyName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
    .replace(/\b(private limited|pvt ltd|pvt\. ltd\.|pvt limited|limited|ltd|inc|incorporated|corporation|corp|llc|llp|gmbh|s\.a\.|sa)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

class CompanyDiscoveryService {
  constructor() {
    this.providers = [
      new McaIndiaRegistryProvider(),
      new OpenCorporatesProvider(),
      new CompaniesHouseProvider(),
      new WikidataRegistryProvider(),
      new ClearbitDiscoveryProvider(),
    ];

    // Fast in-memory cache for debounced user typing (15 min TTL)
    this.memoryCache = new Map();
    this.memoryCacheTtlMs = 15 * 60 * 1000;
  }

  getCacheKey(query, options = {}) {
    const raw = `${query.trim().toLowerCase()}:${options.country || ''}:${options.jurisdiction || ''}:${options.limit || 10}`;
    return crypto.createHash('md5').update(raw).digest('hex');
  }

  /**
   * Search all active external providers with deduplication and caching
   */
  async searchExternalProviders(query, options = {}) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const trimmed = query.trim();
    const cacheKey = this.getCacheKey(trimmed, options);

    // 1. Check in-memory cache
    const memEntry = this.memoryCache.get(cacheKey);
    if (memEntry && memEntry.expiresAt > Date.now()) {
      return memEntry.data;
    }

    // 2. Check MongoDB persistent TTL cache
    try {
      const dbEntry = await ProviderCache.findOne({ cacheKey }).lean();
      if (dbEntry && dbEntry.data) {
        this.memoryCache.set(cacheKey, {
          data: dbEntry.data,
          expiresAt: Date.now() + this.memoryCacheTtlMs,
        });
        return dbEntry.data;
      }
    } catch (err) {
      logger.warn(`[DiscoveryCache] Failed reading cache: ${err.message}`);
    }

    // 3. Query all enabled providers in parallel with timeout isolation
    const timeoutMs = options.timeoutMs || (process.env.NODE_ENV === 'test' ? 1500 : env.PROVIDER_TIMEOUT_MS || 4000);
    const providerPromises = this.providers.map(async (provider) => {
      try {
        if (!provider.isEnabled()) return [];
        return await provider.searchCompanies(trimmed, { ...options, timeoutMs });
      } catch (err) {
        logger.warn(`[DiscoveryService] Provider ${provider.name} failed: ${err.message}`);
        return [];
      }
    });

    const settled = await Promise.allSettled(providerPromises);
    const allResults = [];

    settled.forEach((res) => {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        allResults.push(...res.value);
      }
    });

    // 4. Deduplicate and merge records across providers
    const merged = this.deduplicateAndMerge(allResults);

    // 5. Store in caches (Memory & MongoDB)
    const ttlHours = env.CACHE_TTL_HOURS || 24;
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    this.memoryCache.set(cacheKey, {
      data: merged,
      expiresAt: Date.now() + this.memoryCacheTtlMs,
    });

    ProviderCache.findOneAndUpdate(
      { cacheKey },
      {
        cacheKey,
        provider: 'composite_discovery',
        query: trimmed,
        data: merged,
        expiresAt,
      },
      { upsert: true, new: true }
    ).catch((err) => logger.warn(`[DiscoveryCache] Save failed: ${err.message}`));

    return merged;
  }

  /**
   * Deduplicates company records using normalized names, domains, and registration numbers
   */
  deduplicateAndMerge(records) {
    const list = [];

    for (const record of records) {
      const normName = normalizeCompanyName(record.name);
      const regNum = record.registrationNumber ? record.registrationNumber.trim().toLowerCase() : null;
      const domain = record.domain ? record.domain.trim().toLowerCase() : null;

      const existingIndex = list.findIndex((item) => {
        const itemNorm = normalizeCompanyName(item.name);
        const itemReg = item.registrationNumber ? item.registrationNumber.trim().toLowerCase() : null;
        const itemDomain = item.domain ? item.domain.trim().toLowerCase() : null;

        // Exact registration number match (CIN / CRN)
        if (regNum && itemReg && regNum === itemReg) return true;

        // Exact domain match
        if (domain && itemDomain && domain === itemDomain) return true;

        // Exact normalized name match
        if (normName && itemNorm && normName === itemNorm) return true;

        // One contains the other and shares jurisdiction/country
        if (
          normName &&
          itemNorm &&
          (normName.includes(itemNorm) || itemNorm.includes(normName)) &&
          item.country === record.country
        ) {
          return true;
        }

        return false;
      });

      if (existingIndex >= 0) {
        // Merge records: official registry records take precedence for legal fields
        const existing = list[existingIndex];
        const isOfficial = record.verificationStatus === 'OFFICIAL_REGISTRY';

        list[existingIndex] = {
          ...existing,
          ...(isOfficial ? record : {}),
          domain: existing.domain || record.domain,
          website: existing.website || record.website,
          logoUrl: existing.logoUrl || record.logoUrl,
          description: existing.description || record.description,
          industry: existing.industry || record.industry,
          registrationNumber: existing.registrationNumber || record.registrationNumber,
          jurisdiction: existing.jurisdiction || record.jurisdiction,
          legalStatus: existing.legalStatus || record.legalStatus,
          foundedYear: existing.foundedYear || record.foundedYear,
          headquarters: existing.headquarters || record.headquarters,
          location: existing.location || record.location,
          country: existing.country || record.country,
          city: existing.city || record.city,
          aliases: Array.from(new Set([...(existing.aliases || []), ...(record.aliases || []), record.name, record.shortName].filter(Boolean))),
          dataSources: [...(existing.dataSources || []), ...(record.dataSources || [])],
        };
      } else {
        list.push({
          ...record,
          normalizedName: normName,
          slug: record.slug || normName.replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
          aliases: Array.from(new Set([...(record.aliases || []), record.name, record.shortName].filter(Boolean))),
        });
      }
    }

    return list;
  }
}

module.exports = new CompanyDiscoveryService();
