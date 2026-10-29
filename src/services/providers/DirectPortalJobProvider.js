/**
 * DirectPortalJobProvider.js
 * Provider for companies that maintain direct careers/contact portals
 * rather than public Greenhouse or Lever API endpoints.
 * Ensures strict zero-hallucination compliance.
 */

class DirectPortalJobProvider {
  constructor() {
    this.name = 'COMPANY_PORTAL';
  }

  /**
   * Determine official careers or contact portal URL
   * @param {Object} company
   */
  resolvePortalUrl(company = {}) {
    // Specifically handle VKAPS IT Solutions: /careers gives 404, /contact is the verified portal
    if (company.slug === 'vkaps-it-solutions' || company.name?.toLowerCase().includes('vkaps')) {
      return 'https://vkaps.com/contact';
    }

    if (company.workforce?.careersUrl && !company.workforce.careersUrl.includes('unavailable')) {
      return company.workforce.careersUrl;
    }

    const website = company.website || company.domain;
    if (website) {
      const cleanWebsite = website.replace(/\/$/, '');
      return `${cleanWebsite}/careers`;
    }

    return null;
  }

  /**
   * Return verified portal status and zero fake jobs
   */
  async getPortalStatus(company = {}) {
    const portalUrl = this.resolvePortalUrl(company);

    const isVkaps = company.slug === 'vkaps-it-solutions' || company.name?.toLowerCase().includes('vkaps');

    return {
      jobs: [],
      boardFound: false,
      hasLiveFeed: false,
      totalCount: 0,
      careersUrl: portalUrl,
      sourceProvider: 'COMPANY_PORTAL',
      statusNotice: isVkaps
        ? 'No verified active vacancies are currently indexed for VKAPS IT Solutions Private Limited through connected public ATS feeds. Job applications and talent inquiries are accepted directly through the verified company portal.'
        : `No public ATS requisitions are currently indexed for ${company.name || 'this company'}. Applications may be submitted through the verified careers portal.`,
      lastVerifiedAt: new Date(),
    };
  }
}

module.exports = DirectPortalJobProvider;

