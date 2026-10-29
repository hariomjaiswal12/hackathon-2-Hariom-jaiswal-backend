/**
 * syncRealJobsAndSanitize.js
 * Sanitizes VKAPS IT Solutions (zero fake jobs, official contact portal)
 * and seeds/syncs real active jobs for flagship ATS-enabled companies.
 */

const mongoose = require('mongoose');
const env = require('../src/config/env');
const Company = require('../src/models/Company');
const Job = require('../src/models/Job');
const jobDiscoveryService = require('../src/services/jobDiscoveryService');

async function main() {
  console.log('[Sync] Connecting to database...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('[Sync] Connected to MongoDB.');

  // 1. Sanitize VKAPS IT Solutions
  console.log('[Sync] Sanitizing VKAPS IT Solutions...');
  await Company.updateOne(
    { slug: 'vkaps-it-solutions' },
    {
      $set: {
        'workforce.careersUrl': 'https://vkaps.com/contact',
        'workforce.openPositions': [],
        'workforce.atsProvider': null,
        'workforce.atsToken': null,
      },
    }
  );
  await Job.deleteMany({ companySlug: 'vkaps-it-solutions' });
  console.log('✓ VKAPS IT Solutions sanitized: 0 open positions, careersUrl set to https://vkaps.com/contact');

  // 2. Define flagship ATS companies
  const flagshipCompanies = [
    {
      name: 'Figma',
      slug: 'figma',
      domain: 'figma.com',
      website: 'https://www.figma.com',
      description: 'Figma is a web-based collaborative design platform for UI and UX design, vector graphics, and prototyping.',
      industry: 'Design Software & Collaboration',
      country: 'United States',
      city: 'San Francisco',
      legalStatus: 'ACTIVE',
      entityType: 'Privately Held',
      workforce: {
        employeeCount: 1500,
        employeeCountRange: '1,000-5,000',
        careersUrl: 'https://boards.greenhouse.io/figma',
        atsProvider: 'GREENHOUSE',
        atsToken: 'figma',
        openPositions: [],
        workplacePolicies: {
          workModel: 'Hybrid / Remote Friendly',
          perks: ['Wellness Stipend', 'Health & Dental', 'Home Office Budget', 'Equity'],
        },
      },
      overallScore: 92,
    },
    {
      name: 'Stripe',
      slug: 'stripe',
      domain: 'stripe.com',
      website: 'https://www.stripe.com',
      description: 'Stripe is a financial infrastructure platform for businesses, powering online payments, billing, and global commerce.',
      industry: 'Financial Technology / Payments',
      country: 'United States',
      city: 'San Francisco',
      legalStatus: 'ACTIVE',
      entityType: 'Privately Held',
      workforce: {
        employeeCount: 7000,
        employeeCountRange: '5,000-10,000',
        careersUrl: 'https://boards.greenhouse.io/stripe',
        atsProvider: 'GREENHOUSE',
        atsToken: 'stripe',
        openPositions: [],
        workplacePolicies: {
          workModel: 'Remote-First / In-Office Hubs',
          perks: ['Comprehensive Health', '401(k) Match', 'Parental Leave', 'Learning Stipend'],
        },
      },
      overallScore: 91,
    },
    {
      name: 'Spotify',
      slug: 'spotify',
      domain: 'spotify.com',
      website: 'https://www.spotify.com',
      description: 'Spotify is a digital music, podcast, and video service that gives users access to millions of songs and content creators.',
      industry: 'Audio Streaming & Entertainment',
      country: 'Sweden',
      city: 'Stockholm',
      legalStatus: 'ACTIVE',
      entityType: 'Public Company',
      workforce: {
        employeeCount: 8000,
        employeeCountRange: '5,000-10,000',
        careersUrl: 'https://jobs.lever.co/spotify',
        atsProvider: 'LEVER',
        atsToken: 'spotify',
        openPositions: [],
        workplacePolicies: {
          workModel: 'Work From Anywhere (WFA)',
          perks: ['Global Health Insurance', 'Generous Parental Leave', 'Mental Health Support', 'Equity'],
        },
      },
      overallScore: 89,
    },
    {
      name: 'Cloudflare',
      slug: 'cloudflare',
      domain: 'cloudflare.com',
      website: 'https://www.cloudflare.com',
      description: 'Cloudflare is a web infrastructure and website security company providing content delivery network services, DDoS mitigation, and edge compute.',
      industry: 'Cloud Infrastructure & Security',
      country: 'United States',
      city: 'San Francisco',
      legalStatus: 'ACTIVE',
      entityType: 'Public Company',
      workforce: {
        employeeCount: 3500,
        employeeCountRange: '1,000-5,000',
        careersUrl: 'https://boards.greenhouse.io/cloudflare',
        atsProvider: 'GREENHOUSE',
        atsToken: 'cloudflare',
        openPositions: [],
        workplacePolicies: {
          workModel: 'Hybrid / Flexible',
          perks: ['Health, Vision, Dental', 'Stock Purchase Plan', 'Continuing Education'],
        },
      },
      overallScore: 90,
    },
    {
      name: 'Reddit',
      slug: 'reddit',
      domain: 'reddit.com',
      website: 'https://www.reddit.com',
      description: 'Reddit is a network of communities where people can dive into their interests, hobbies, and passions.',
      industry: 'Social Media & Online Communities',
      country: 'United States',
      city: 'San Francisco',
      legalStatus: 'ACTIVE',
      entityType: 'Public Company',
      workforce: {
        employeeCount: 2000,
        employeeCountRange: '1,000-5,000',
        careersUrl: 'https://boards.greenhouse.io/reddit',
        atsProvider: 'GREENHOUSE',
        atsToken: 'reddit',
        openPositions: [],
        workplacePolicies: {
          workModel: 'Remote Friendly',
          perks: ['Health & Wellness', 'Parental Leave', '401(k) Matching', 'Learning Fund'],
        },
      },
      overallScore: 88,
    },
  ];

  // Upsert flagship companies and sync real jobs
  for (const compData of flagshipCompanies) {
    console.log(`\n[Sync] Processing ${compData.name} (${compData.slug})...`);
    let comp = await Company.findOne({ slug: compData.slug });
    if (!comp) {
      comp = await Company.create({
        ...compData,
        normalizedName: compData.name.toLowerCase(),
      });
      console.log(`  Created company record for ${compData.name}`);
    } else {
      await Company.updateOne(
        { slug: compData.slug },
        {
          $set: {
            'workforce.careersUrl': compData.workforce.careersUrl,
            'workforce.atsProvider': compData.workforce.atsProvider,
            'workforce.atsToken': compData.workforce.atsToken,
            'workforce.workplacePolicies': compData.workforce.workplacePolicies,
          },
        }
      );
      comp = await Company.findOne({ slug: compData.slug });
      console.log(`  Updated workforce/ATS config for ${compData.name}`);
    }

    try {
      console.log(`  Syncing genuine live jobs from ${comp.workforce.atsProvider}...`);
      const syncResult = await jobDiscoveryService.syncCompanyJobs(comp);
      console.log(`  ✓ Synced ${syncResult.totalSynced} live jobs for ${compData.name}`);
    } catch (err) {
      console.error(`  ✗ Error syncing jobs for ${compData.name}:`, err.message);
    }
  }

  // Summary counts
  const totalJobsInDb = await Job.countDocuments();
  const jobsByCompany = await Job.aggregate([
    { $group: { _id: '$companySlug', count: { $sum: 1 }, provider: { $first: '$sourceProvider' } } },
    { $sort: { count: -1 } },
  ]);

  console.log('\n=== REAL-TIME JOB SYNC SUMMARY ===');
  console.log(`Total genuine active jobs in DB: ${totalJobsInDb}`);
  console.log('Breakdown by company:');
  jobsByCompany.forEach((g) => {
    console.log(` - ${g._id}: ${g.count} jobs (Provider: ${g.provider})`);
  });

  const vkapsCount = await Job.countDocuments({ companySlug: 'vkaps-it-solutions' });
  console.log(`VKAPS IT Solutions jobs count: ${vkapsCount} (Strict Zero Hallucination)`);

  await mongoose.disconnect();
  console.log('[Sync] Done and disconnected.');
}

main().catch((err) => {
  console.error('[Sync] Fatal error:', err);
  process.exit(1);
});
