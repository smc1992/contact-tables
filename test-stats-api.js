const fetch = require('node-fetch');

async function testStatsAPI() {
  try {
    console.log('Testing stats API endpoint...');
    
    const response = await fetch('http://localhost:3001/api/admin/campaigns/c0001d9b-be90-47d5-89cb-76d62775d583/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response body:', text);
    
    if (response.status === 500) {
      console.log('500 Error detected!');
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testStatsAPI();
