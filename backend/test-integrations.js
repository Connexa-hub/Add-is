require('dotenv').config();
const axios = require('axios');

async function testVTPass() {
  try {
    const token = Buffer.from(`${process.env.VTPASS_USERNAME}:${process.env.VTPASS_API_KEY}`).toString('base64');
    const response = await axios.get('https://sandbox.vtpass.com/api/service-variations?serviceID=mtn', {
      headers: { 'Authorization': `Basic ${token}` }
    });
    console.log('✅ VTPass API: Connected successfully');
    return true;
  } catch (error) {
    console.log('❌ VTPass API:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testMonnify() {
  try {
    const creds = Buffer.from(`${process.env.MONNIFY_API_KEY}:${process.env.MONNIFY_SECRET_KEY}`).toString('base64');
    const response = await axios.post('https://sandbox.monnify.com/api/v1/auth/login', {}, {
      headers: { 'Authorization': `Basic ${creds}` }
    });
    console.log('✅ Monnify API: Connected successfully');
    return true;
  } catch (error) {
    console.log('❌ Monnify API:', error.response?.data?.responseMessage || error.message);
    return false;
  }
}

(async () => {
  console.log('\n=== Testing API Integrations ===\n');
  await testVTPass();
  await testMonnify();
  console.log('\n================================\n');
  process.exit(0);
})();
