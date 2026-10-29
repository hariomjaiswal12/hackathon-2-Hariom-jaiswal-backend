/**
 * BaseCompanyProvider - Abstract interface for external company registries & discovery providers.
 */
class BaseCompanyProvider {
  constructor(name, displayName) {
    if (new.target === BaseCompanyProvider) {
      throw new TypeError('Cannot construct BaseCompanyProvider instances directly');
    }
    this.name = name;
    this.displayName = displayName;
  }

  isEnabled() {
    return true;
  }

  /**
   * Search companies matching a query string and optional filters
   * @param {string} query
   * @param {Object} options { country, jurisdiction, limit, timeoutMs }
   * @returns {Promise<Array<Object>>}
   */
  async searchCompanies(query, options = {}) {
    throw new Error('searchCompanies() must be implemented by subclass');
  }

  /**
   * Get attribution and licensing requirements for this provider
   * @returns {Object} { provider, license, attributionText, website }
   */
  getAttribution() {
    return {
      provider: this.name,
      displayName: this.displayName,
      license: 'Proprietary / Public API',
      attributionText: `Data retrieved from ${this.displayName}`,
    };
  }
}

module.exports = BaseCompanyProvider;

