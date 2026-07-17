const validateEnv = () => {
  const requiredEnvVars = [
    'MONGO_URI',
    'JWT_SECRET',
    // Every money-movement path (funding, verification, webhooks) depends on
    // these. Previously unvalidated, which meant a misconfigured deployment
    // would boot successfully and only fail — or silently misbehave — the
    // first time a real transaction hit Monnify.
    'MONNIFY_API_KEY',
    'MONNIFY_SECRET_KEY',
    'MONNIFY_CONTRACT_CODE',
  ];

  const optionalEnvVars = [
    'VTPASS_API_KEY',
    'VTPASS_SECRET_KEY',
    'VTPASS_BASE_URL',
    'MONNIFY_BASE_URL', // has a hardcoded sandbox fallback in monnifyClient.js
    'EMAIL_HOST',
    'EMAIL_USER',
    'EMAIL_PASSWORD',
  ];

  const missing = [];
  const warnings = [];

  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ CRITICAL: JWT_SECRET is too short (< 32 characters)');
    console.error('A short secret is brute-forceable and undermines every');
    console.error('signed token in the system. Generate one with:');
    console.error('  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(1);
  }

  if (missing.length > 0) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ CRITICAL: Missing Required Environment Variables');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    missing.forEach(varName => {
      console.error(`   • ${varName}`);
    });
    console.error('');
    console.error('The application cannot start without these variables.');
    console.error('Please set them in your environment or .env file.');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(1);
  }

  optionalEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  });

  if (warnings.length > 0) {
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.warn('⚠️  WARNING: Missing Optional Environment Variables');
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    warnings.forEach(varName => {
      console.warn(`   • ${varName}`);
    });
    console.warn('');
    console.warn('Some features may not work without these variables.');
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  console.log('✅ Environment validation passed');
  return true;
};

module.exports = validateEnv;
