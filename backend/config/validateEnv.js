const validateEnv = () => {
  const requiredEnvVars = [
    'MONGO_URI',
    'JWT_SECRET',
  ];

  const optionalEnvVars = [
    'VTPASS_API_KEY',
    'VTPASS_SECRET_KEY',
    'VTPASS_BASE_URL',
  ];

  const missing = [];
  const warnings = [];

  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

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
