const fetch = require('node-fetch');

async function testAuthenticatedAPI() {
  const campaignId = 'c0001d9b-be90-47d5-89cb-76d62775d583';
  const baseUrl = 'http://localhost:3001';
  
  // Test with a mock session cookie (you would need to get this from a real login)
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': 'next-auth.session-token=test' // This would need to be a real session token
  };
  
  console.log('Testing API endpoints with authentication...\n');
  
  // Test stats endpoint
  try {
    console.log('Testing stats endpoint...');
    const statsResponse = await fetch(`${baseUrl}/api/admin/campaigns/${campaignId}/stats`, {
      headers
    });
    
    console.log(`Stats Status: ${statsResponse.status}`);
    const statsText = await statsResponse.text();
    console.log(`Stats Response: ${statsText}\n`);
  } catch (error) {
    console.error('Stats Error:', error.message);
  }
  
  // Test recipients endpoint
  try {
    console.log('Testing recipients endpoint...');
    const recipientsResponse = await fetch(`${baseUrl}/api/admin/campaigns/${campaignId}/recipients`, {
      headers
    });
    
    console.log(`Recipients Status: ${recipientsResponse.status}`);
    const recipientsText = await recipientsResponse.text();
    console.log(`Recipients Response: ${recipientsText}\n`);
  } catch (error) {
    console.error('Recipients Error:', error.message);
  }
  
  // Test clicks endpoint
  try {
    console.log('Testing clicks endpoint...');
    const clicksResponse = await fetch(`${baseUrl}/api/admin/campaigns/${campaignId}/clicks`, {
      headers
    });
    
    console.log(`Clicks Status: ${clicksResponse.status}`);
    const clicksText = await clicksResponse.text();
    console.log(`Clicks Response: ${clicksText}\n`);
  } catch (error) {
    console.error('Clicks Error:', error.message);
  }
}

testAuthenticatedAPI().catch(console.error);