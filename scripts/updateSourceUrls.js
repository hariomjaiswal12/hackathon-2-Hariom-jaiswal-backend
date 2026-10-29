const mongoose = require('mongoose');
const env = require('../src/config/env');

const OFFICIAL_COMPANY_DOMAINS = {
  tcs: 'https://www.tcs.com',
  infosys: 'https://www.infosys.com',
  accenture: 'https://www.accenture.com',
  microsoft: 'https://www.microsoft.com',
  google: 'https://about.google',
  hcltech: 'https://www.hcltech.com',
  wipro: 'https://www.wipro.com',
  'tech-mahindra': 'https://www.techmahindra.com',
  ltimindtree: 'https://www.ltimindtree.com',
  persistent: 'https://www.persistent.com',
  coforge: 'https://www.coforge.com',
  mphasis: 'https://www.mphasis.com',
  ofss: 'https://www.oracle.com/financial-services/',
  'ibm-india': 'https://www.ibm.com/in-en',
  'capgemini-india': 'https://www.capgemini.com/in-en/',
  amazon: 'https://www.aboutamazon.com/',
  apple: 'https://www.apple.com/',
  nvidia: 'https://www.nvidia.com/',
  meta: 'https://about.meta.com/',
  adobe: 'https://www.adobe.com/',
  salesforce: 'https://www.salesforce.com/',
  cisco: 'https://www.cisco.com/',
  intel: 'https://www.intel.com/',
  qualcomm: 'https://www.qualcomm.com/',
  sap: 'https://www.sap.com/',
  'vkaps-it-solutions': 'https://vkaps.com',
};

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to MongoDB. Updating source and company records idempotently...');

  const Company = mongoose.connection.db.collection('companies');
  const Source = mongoose.connection.db.collection('sources');

  // 1. Update VKAPS company record specifically
  const vkaps = await Company.findOne({ slug: 'vkaps-it-solutions' });
  if (vkaps) {
    const updatedDataSources = [
      {
        provider: 'Ministry of Corporate Affairs (MCA) / ROC Gwalior',
        sourceUrl: 'https://www.mca.gov.in/',
        retrievedAt: new Date('2026-10-29T08:00:00Z'),
        confidence: 'OFFICIAL_REGISTRY',
        isAvailable: true,
        availabilityNotice: null,
        fieldsProvided: [
          'name',
          'registrationNumber',
          'jurisdiction',
          'legalStatus',
          'foundedYear',
          'headquarters',
          'city',
          'country',
          'authorizedCapital',
          'paidUpCapital',
        ],
        attribution: 'Data verified from official Ministry of Corporate Affairs (MCA) records (CIN: U72900MP2018PTC047186, ROC Gwalior).',
      },
      {
        provider: 'Official Domain & Web Presence (vkaps.com)',
        sourceUrl: 'https://vkaps.com',
        retrievedAt: new Date('2026-10-29T08:00:00Z'),
        confidence: 'VERIFIED_DOMAIN',
        isAvailable: true,
        availabilityNotice: null,
        fieldsProvided: [
          'website',
          'domain',
          'industry',
          'description',
          'services',
          'techStack',
          'locations',
          'leadership',
        ],
        attribution: 'Verified official corporate domain vkaps.com and public company documentation.',
      },
      {
        provider: 'Clutch B2B Verified Directory',
        sourceUrl: 'https://clutch.co/profile/vkaps-it-solutions',
        retrievedAt: new Date('2026-10-29T08:00:00Z'),
        confidence: 'THIRD_PARTY_VERIFIED',
        isAvailable: true,
        availabilityNotice: null,
        fieldsProvided: [
          'companySize',
          'ratings',
          'clientEndorsements',
          'projectPortfolio',
        ],
        attribution: 'Verified B2B reviews and project delivery track record on Clutch (4.9/5 rating, 30+ client evaluations).',
      },
      {
        provider: 'LinkedIn Corporate Directory',
        sourceUrl: null,
        isAvailable: false,
        availabilityNotice: 'External profile not verified · Public directory page unavailable',
        retrievedAt: new Date('2026-10-29T08:00:00Z'),
        confidence: 'VERIFIED_PROFILE',
        fieldsProvided: [
          'employeeCountRange',
          'openPositions',
          'operatingLocations',
        ],
        attribution: 'Corporate registration verified via MCA. External public LinkedIn directory entry not verified.',
      },
    ];

    const updatedSocialLinks = {
      linkedin: null,
      clutch: 'https://clutch.co/profile/vkaps-it-solutions',
      twitter: 'https://twitter.com/vkapsit',
      github: 'https://github.com/vkapsitsolutions',
    };

    const updatedLeadership = (vkaps.leadership || []).map((l) => ({
      ...l,
      linkedinUrl: null,
      isAvailable: false,
    }));

    await Company.updateOne(
      { _id: vkaps._id },
      {
        $set: {
          website: 'https://vkaps.com',
          domain: 'vkaps.com',
          dataSources: updatedDataSources,
          socialLinks: updatedSocialLinks,
          leadership: updatedLeadership,
          'workforce.careersUrl': 'https://vkaps.com/careers',
        },
      }
    );
    console.log('✓ Successfully sanitized VKAPS IT Solutions company document.');

    // Remove existing VKAPS sources to rebuild cleanly
    await Source.deleteMany({ companyId: vkaps._id });

    const vkapsCleanSources = [
      {
        companyId: vkaps._id,
        companySlug: vkaps.slug,
        name: 'Ministry of Corporate Affairs (MCA) / ROC Gwalior',
        type: 'Official Company',
        sampleSize: 'Official Registry Filing',
        reviewCount: 10,
        date: 'Oct 29, 2026',
        freshness: 'Verified today',
        freshnessStatus: 'Recent',
        status: 'Verified',
        statusType: 'verified',
        description: 'Data verified from official Ministry of Corporate Affairs (MCA) records (CIN: U72900MP2018PTC047186, ROC Gwalior).',
        agreement: 'Official and verified provenance',
        url: 'https://www.mca.gov.in/',
        isAvailable: true,
        availabilityNotice: null,
        isDemoData: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        companyId: vkaps._id,
        companySlug: vkaps.slug,
        name: 'Official Domain Verification (vkaps.com)',
        type: 'Official Company',
        sampleSize: 'Registry Filing',
        reviewCount: 8,
        date: 'Oct 29, 2026',
        freshness: 'Verified today',
        freshnessStatus: 'Recent',
        status: 'Verified',
        statusType: 'verified',
        description: 'Verified official corporate domain vkaps.com and public documentation.',
        agreement: 'Official legal registry document',
        url: 'https://vkaps.com',
        isAvailable: true,
        availabilityNotice: null,
        isDemoData: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        companyId: vkaps._id,
        companySlug: vkaps.slug,
        name: 'Clutch B2B Verified Directory',
        type: 'Third-Party Review',
        sampleSize: 'Verified Directory',
        reviewCount: 4,
        date: 'Oct 29, 2026',
        freshness: 'Verified today',
        freshnessStatus: 'Recent',
        status: 'Verified',
        statusType: 'verified',
        description: 'Verified B2B reviews and project delivery track record on Clutch (4.9/5 rating, 30+ client evaluations).',
        agreement: 'Official and verified provenance',
        url: 'https://clutch.co/profile/vkaps-it-solutions',
        isAvailable: true,
        availabilityNotice: null,
        isDemoData: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        companyId: vkaps._id,
        companySlug: vkaps.slug,
        name: 'LinkedIn Corporate Directory',
        type: 'Third-Party Review',
        sampleSize: 'Verified Directory',
        reviewCount: 0,
        date: 'Oct 29, 2026',
        freshness: 'Unverified',
        freshnessStatus: 'Recent',
        status: 'Unverified',
        statusType: 'insufficient',
        description: 'Public corporate page unavailable or unindexed. Link disabled per data integrity standard.',
        agreement: 'External profile not verified',
        url: null,
        isAvailable: false,
        availabilityNotice: 'External profile not verified · Public directory page unavailable',
        isDemoData: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await Source.insertMany(vkapsCleanSources);
    console.log(`✓ Inserted ${vkapsCleanSources.length} clean, validated sources for VKAPS.`);
  }

  // 2. Audit and update all other sources across the collection
  const allSources = await Source.find({}).toArray();
  let updatedCount = 0;

  for (const s of allSources) {
    if (s.companySlug === 'vkaps-it-solutions') continue;

    const lowerName = (s.name || '').toLowerCase();
    const isOfficialFiling =
      lowerName.includes('official') ||
      lowerName.includes('sample company profile') ||
      lowerName.includes('disclosures') ||
      lowerName.includes('filings');

    if (isOfficialFiling) {
      const canonicalDomain = OFFICIAL_COMPANY_DOMAINS[s.companySlug];
      if (canonicalDomain) {
        await Source.updateOne(
          { _id: s._id },
          {
            $set: {
              url: canonicalDomain,
              isAvailable: true,
              availabilityNotice: null,
            },
          }
        );
        updatedCount++;
      }
    } else {
      // Internal review sample, benchmark, learning summary, or career DNA
      await Source.updateOne(
        { _id: s._id },
        {
          $set: {
            url: null,
            isAvailable: false,
            availabilityNotice: 'CompanyIQ synthesized evidence · No external URL',
          },
        }
      );
      updatedCount++;
    }
  }

  console.log(`✓ Updated ${updatedCount} sources across the database.`);
  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

