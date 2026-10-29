const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment from h2backend/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;

console.log('=== PHASE 2: REAL MONGODB ATLAS CONNECTIVITY TEST ===\n');

if (!uri) {
  console.error('[FAIL] MONGODB_URI is not set in environment.');
  process.exit(1);
}

// Redacted sanity check
const isSrv = uri.startsWith('mongodb+srv://');
console.log(`Connection Type: ${isSrv ? 'MongoDB Atlas (mongodb+srv://)' : 'Standard MongoDB'}`);

(async () => {
  const startTime = Date.now();
  let conn = null;

  try {
    console.log('[Test] Initiating connection with 8000ms bounded serverSelectionTimeoutMS...');

    conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      socketTimeoutMS: 10000,
      autoIndex: false, // Read-only test
    });

    const elapsed = Date.now() - startTime;
    console.log(`[PASS] Connected successfully to cluster in ${elapsed}ms!`);

    const nativeDb = mongoose.connection.db;
    const dbName = nativeDb.databaseName;
    console.log(`[Test] Active database name: "${dbName}"`);

    if (dbName === 'companyiq') {
      console.log('[PASS] Selected database matches required target: "companyiq"');
    } else {
      console.warn(`[WARN] Connected database is "${dbName}", expected "companyiq"`);
    }

    // Ping test (read-only minimal operation)
    console.log('[Test] Executing read-only ping command...');
    const pingResult = await nativeDb.command({ ping: 1 });
    console.log('[PASS] Ping command returned:', JSON.stringify(pingResult));

    // List collections to verify permissions and schema presence
    console.log('[Test] Listing collections (read-only)...');
    const collections = await nativeDb.listCollections().toArray();
    const collNames = collections.map(c => c.name).sort();
    console.log(`[PASS] Successfully retrieved collections (${collNames.length} collections found):`);
    console.log(`       Collections: ${collNames.join(', ') || '(empty database)'}`);

    // Count documents in key collection if exists
    if (collNames.includes('companies')) {
      const count = await nativeDb.collection('companies').countDocuments();
      console.log(`[PASS] Verified read access: 'companies' collection has ${count} documents.`);
    }

    console.log('\n=== CONNECTIVITY VERIFICATION RESULT: PASS ===');

  } catch (err) {
    const elapsed = Date.now() - startTime;
    console.error(`\n[FAIL] Atlas connection attempt failed after ${elapsed}ms.`);
    console.error(`Error Name: ${err.name}`);
    console.error(`Raw Message (Sanitized): ${sanitizeError(err.message)}`);

    // Diagnose category
    const diagnosis = diagnoseError(err);
    console.log(`\n--- DIAGNOSTIC CATEGORY: ${diagnosis.category} ---`);
    console.log(`Explanation: ${diagnosis.explanation}`);
    console.log(`Recommended Corrective Action: ${diagnosis.action}`);

  } finally {
    if (mongoose.connection.readyState !== 0) {
      console.log('\n[Test] Closing temporary connection cleanly...');
      await mongoose.disconnect();
      console.log('[PASS] Connection closed.');
    }
  }
})();

function sanitizeError(msg = '') {
  // Strip any passwords or full URIs
  return msg
    .replace(/mongodb(\+srv)?:\/\/[^@\s]+@/g, 'mongodb+srv://[REDACTED_USER]:[REDACTED_PASS]@')
    .replace(/password=[^&\s]+/gi, 'password=[REDACTED]');
}

function diagnoseError(err) {
  const msg = (err.message || '').toLowerCase();
  const name = err.name || '';

  if (msg.includes('bad auth') || msg.includes('authentication failed') || msg.includes('auth error') || err.code === 18) {
    return {
      category: 'AUTHENTICATION_FAILURE',
      explanation: 'The MongoDB Atlas user credentials (username or password) were rejected by the cluster.',
      action: 'Verify database user credentials in MongoDB Atlas (Database Access tab). Ensure password does not contain unescaped special characters or typo.',
    };
  }

  if (msg.includes('querysrv enotfound') || msg.includes('enotfound') || msg.includes('querysrv erefused') || msg.includes('querysrv')) {
    return {
      category: 'DNS_SRV_RESOLUTION_FAILURE',
      explanation: 'DNS resolution for the Atlas cluster SRV record failed.',
      action: 'Verify your DNS resolver and check if the cluster hostname is spelled correctly in the URI. Some corporate or VPN DNS resolvers block SRV records (use public DNS like 8.8.8.8 or 1.1.1.1).',
    };
  }

  if (msg.includes('ip') || msg.includes('not allowed to access') || msg.includes('whitelist') || msg.includes('serverselectionerror')) {
    // If it's a MongoServerSelectionError with timeout, it's typically IP Access List (firewall)
    return {
      category: 'IP_NETWORK_ACCESS_DENIED_OR_TIMEOUT',
      explanation: 'The MongoDB Atlas cluster could not be reached within the timeout limit. The most common cause is the current IP address is not whitelisted in Atlas Network Access, or a firewall/proxy is blocking port 27017.',
      action: 'Log in to MongoDB Atlas -> Security -> Network Access -> Add IP Address -> Add Current IP Address (or configure appropriate CIDR block for production hosting provider).',
    };
  }

  if (msg.includes('tls') || msg.includes('ssl') || msg.includes('certificate')) {
    return {
      category: 'TLS_SSL_FAILURE',
      explanation: 'TLS/SSL handshake with the Atlas cluster failed.',
      action: 'Ensure Node.js has access to system CA certificates and TLS is enabled in the connection string.',
    };
  }

  if (msg.includes('unauthorized') || msg.includes('not authorized') || err.code === 13) {
    return {
      category: 'MISSING_DATABASE_PERMISSIONS',
      explanation: 'The user authenticated but does not have read/write permissions on the target database.',
      action: 'In Atlas -> Database Access -> Edit User -> Built-in Roles: ensure user has "readWrite" role on "companyiq" database (or "readWriteAnyDatabase").',
    };
  }

  return {
    category: 'MONGODB_SERVER_SELECTION_FAILURE',
    explanation: 'General server selection failure or connection error.',
    action: 'Inspect cluster status in MongoDB Atlas console to verify the cluster is active and healthy.',
  };
}

