/**
 * CompanyIQ - Dedicated Demo Account Manager & Password Management Utility
 *
 * Security Guidelines:
 *   - Never prints or logs plaintext passwords, password hashes, or secrets.
 *   - Persists test credentials locally in h2backend/.env (gitignored).
 *   - Strictly targets demo@companyiq.internal only.
 *   - Idempotent and safe: preserves all unrelated records and data.
 *
 * Usage:
 *   node scripts/manageDemoAccount.js                   # Inspects & syncs demo account status
 *   node scripts/manageDemoAccount.js --reset [pwd]     # Resets demo password securely
 *   node scripts/manageDemoAccount.js --verify          # Verifies password hash integrity
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const crypto = require('crypto');
const dotenv = require('dotenv');

// Load environment
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const env = require('../src/config/env');
const User = require('../src/models/User');
const logger = require('../src/utils/logger');

const DEMO_EMAIL = 'demo@companyiq.internal';
const DEMO_NAME = 'Demo Guest';

function saveLocalDemoPassword(newPassword) {
  try {
    if (!fs.existsSync(envPath)) return false;
    let content = fs.readFileSync(envPath, 'utf8');
    if (content.includes('DEMO_PASSWORD=')) {
      content = content.replace(/^DEMO_PASSWORD=.*$/m, `DEMO_PASSWORD=${newPassword}`);
    } else {
      content += `\n# Dedicated Demo Account Password (development only)\nDEMO_PASSWORD=${newPassword}\n`;
    }
    fs.writeFileSync(envPath, content, 'utf8');
    return true;
  } catch (err) {
    logger.warn('Could not persist DEMO_PASSWORD to .env:', err.message);
    return false;
  }
}

async function main() {
  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    const dbName = mongoose.connection.name;
    const isAtlas = env.MONGODB_URI.startsWith('mongodb+srv://');
    logger.info(`Connected to ${isAtlas ? 'MongoDB Atlas' : 'Local MongoDB'} database: "${dbName}"`);

    const isResetRequested = process.argv.includes('--reset') || process.argv.includes('--set-password');
    const isVerifyOnly = process.argv.includes('--verify');

    let customPassword = null;
    ['--reset', '--set-password'].forEach((flag) => {
      const idx = process.argv.indexOf(flag);
      if (idx !== -1 && process.argv[idx + 1] && !process.argv[idx + 1].startsWith('--')) {
        customPassword = process.argv[idx + 1];
      }
    });

    let user = await User.findOne({ email: DEMO_EMAIL }).select('+passwordHash');
    const configuredDemoPassword = process.env.DEMO_PASSWORD || null;

    if (!user) {
      logger.info('Demo account does not exist. Initializing dedicated demo account...');
      const initialPassword = customPassword || configuredDemoPassword || `${crypto.randomBytes(12).toString('base64url')}!A1`;
      const passwordHash = await User.hashPassword(initialPassword);

      user = await User.create({
        name: DEMO_NAME,
        email: DEMO_EMAIL,
        passwordHash,
        role: 'user',
        isDemoUser: true,
        careerStage: 'Fresher',
        targetRole: 'Full Stack Engineer',
        defaultLocation: 'Bangalore, India',
        preferredWorkStyle: 'Hybrid',
      });

      saveLocalDemoPassword(initialPassword);

      // Verify created password immediately
      const verified = await user.comparePassword(initialPassword);
      if (!verified) {
        throw new Error('Initial demo password verification failed after creation.');
      }

      console.log('\n======================================================');
      console.log('✅ DEMO ACCOUNT INITIALIZED SUCCESSFULLY');
      console.log('======================================================');
      console.log(`Database:     ${dbName} (${isAtlas ? 'MongoDB Atlas' : 'Local MongoDB'})`);
      console.log(`Email:        ${user.email}`);
      console.log(`Name:         ${user.name}`);
      console.log(`User ID:      ${user._id}`);
      console.log(`Role:         ${user.role}`);
      console.log(`Is Demo User: ${user.isDemoUser}`);
      console.log(`Password:     [Securely hashed with bcrypt (cost=10)]`);
      console.log(`Local Store:  Saved to DEMO_PASSWORD in h2backend/.env`);
      console.log('------------------------------------------------------');
      console.log('To sign in via UI: Use email demo@companyiq.internal and your');
      console.log('configured DEMO_PASSWORD from h2backend/.env.');
      console.log('Or click "Explore with Demo Account" for zero-credential login.');
      console.log('======================================================\n');

    } else if (isResetRequested) {
      const targetPassword = customPassword || configuredDemoPassword || `${crypto.randomBytes(12).toString('base64url')}!A1`;
      if (targetPassword.length < 6) {
        throw new Error('Demo password must be at least 6 characters long.');
      }

      const passwordHash = await User.hashPassword(targetPassword);
      user.passwordHash = passwordHash;
      user.refreshTokens = []; // Invalidate previous sessions
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      user.isDemoUser = true;
      if (user.name !== DEMO_NAME) user.name = DEMO_NAME;
      await user.save();

      saveLocalDemoPassword(targetPassword);

      // Verify updated hash
      const verified = await user.comparePassword(targetPassword);
      if (!verified) {
        throw new Error('Demo password verification failed after hash update.');
      }

      console.log('\n======================================================');
      console.log('✅ DEMO PASSWORD RESET & VERIFIED SUCCESSFULLY');
      console.log('======================================================');
      console.log(`Database:     ${dbName} (${isAtlas ? 'MongoDB Atlas' : 'Local MongoDB'})`);
      console.log(`Email:        ${user.email}`);
      console.log(`User ID:      ${user._id}`);
      console.log(`Password:     [Securely hashed with bcrypt (cost=10)]`);
      console.log(`Verification: PASS (Verified with bcrypt.compare)`);
      console.log(`Local Store:  Updated in DEMO_PASSWORD in h2backend/.env`);
      console.log(`Sessions:     All previous sessions invalidated`);
      console.log('------------------------------------------------------');
      console.log('Plaintext password is NOT printed to console for security.');
      console.log('Inspect or edit DEMO_PASSWORD in h2backend/.env to retrieve.');
      console.log('======================================================\n');

    } else {
      // Normal inspection or verification
      let passwordStatus = '[Hashed with bcrypt]';
      let matchesConfigured = null;

      if (configuredDemoPassword) {
        const matches = await user.comparePassword(configuredDemoPassword);
        matchesConfigured = matches;
        if (!matches && process.argv.includes('--sync')) {
          // Sync hash with configured DEMO_PASSWORD
          const newHash = await User.hashPassword(configuredDemoPassword);
          user.passwordHash = newHash;
          user.isDemoUser = true;
          await user.save();
          matchesConfigured = true;
          passwordStatus = '[Synced with DEMO_PASSWORD from .env]';
        }
      }

      if (!user.isDemoUser) {
        user.isDemoUser = true;
        await user.save();
      }

      console.log('\n======================================================');
      console.log('📋 DEMO ACCOUNT STATUS & INTEGRITY AUDIT');
      console.log('======================================================');
      console.log(`Database:        ${dbName} (${isAtlas ? 'MongoDB Atlas' : 'Local MongoDB'})`);
      console.log(`Email:           ${user.email}`);
      console.log(`Name:            ${user.name}`);
      console.log(`User ID:         ${user._id}`);
      console.log(`Role:            ${user.role}`);
      console.log(`Is Demo User:    ${user.isDemoUser}`);
      console.log(`Password Hash:   ${passwordStatus} (bcrypt 10 rounds)`);
      console.log(`Has Active Hash: ${!!user.passwordHash}`);
      if (configuredDemoPassword) {
        console.log(`Matches .env:    ${matchesConfigured ? 'PASS (Matches DEMO_PASSWORD)' : 'FAIL (Does not match DEMO_PASSWORD, run with --sync to synchronize)'}`);
      } else {
        console.log(`Local .env:      DEMO_PASSWORD not set. Run with --reset to set.`);
      }
      console.log('------------------------------------------------------');
      console.log('Commands:');
      console.log('  node scripts/manageDemoAccount.js --reset <new_pwd>  # Set custom demo password');
      console.log('  node scripts/manageDemoAccount.js --sync             # Sync DB hash with DEMO_PASSWORD in .env');
      console.log('  node scripts/manageDemoAccount.js --verify           # Check password hash validity');
      console.log('======================================================\n');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Demo account operation failed:', err.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

main();
