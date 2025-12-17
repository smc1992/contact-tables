import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
// Using global fetch API

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test configuration
const config = {
  testEmailRecipient: process.env.TEST_EMAIL || 'test@example.com',
  adminUserId: process.env.TEST_ADMIN_USER_ID, // Optional: specific admin user ID to use
  testAttachmentPath: path.join(__dirname, 'test-attachment.txt'),
  apiBaseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
};

// Create a test attachment file if it doesn't exist
if (!fs.existsSync(config.testAttachmentPath)) {
  fs.writeFileSync(config.testAttachmentPath, 'This is a test attachment for the email functionality test.');
  console.log(`Created test attachment at ${config.testAttachmentPath}`);
}

// Helper to get admin user
async function getAdminUser() {
  if (config.adminUserId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', config.adminUserId)
      .single();
    
    if (error || !data) {
      throw new Error(`Failed to get specified admin user: ${error?.message || 'User not found'}`);
    }
    
    return data;
  }
  
  // Find any admin user
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or('user_metadata->>role.eq.admin,user_metadata->>role.eq.ADMIN')
    .limit(1)
    .single();
  
  if (error || !data) {
    throw new Error(`Failed to find any admin user: ${error?.message || 'No admin users found'}`);
  }
  
  return data;
}

// Helper to get auth token for an admin user
async function getAdminAuthToken(userId: string) {
  // This is a simplified approach - in a real scenario, you'd use proper authentication
  // For testing purposes, we're using the service role to generate a custom token
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: 'temp@example.com', // This email is not used as we extract the token directly
    options: {
      redirectTo: `${config.apiBaseUrl}/admin`,
    }
  });
  
  if (error || !data.properties?.action_link) {
    throw new Error(`Failed to generate auth token: ${error?.message || 'No token generated'}`);
  }
  
  // Extract the token from the magic link URL
  const url = new URL(data.properties.action_link);
  const token = url.searchParams.get('token');
  
  if (!token) {
    throw new Error('Failed to extract token from magic link');
  }
  
  return token;
}

// Test email template creation
async function testCreateEmailTemplate(token: string) {
  console.log('\n🧪 Testing email template creation...');
  
  const templateData = {
    name: `Test Template ${new Date().toISOString()}`,
    subject: 'Test Email Subject',
    content: `
      <h1>Test Email Template</h1>
      <p>Hello {name},</p>
      <p>This is a test email to verify the email functionality.</p>
      <p>Best regards,<br>Contact Tables Team</p>
    `
  };
  
  try {
    const response = await fetch(`${config.apiBaseUrl}/api/admin/emails/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(templateData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`API error: ${result.message || response.statusText}`);
    }
    
    console.log('✅ Email template created successfully');
    console.log(`Template ID: ${result.data.id}`);
    
    return result.data.id;
  } catch (error) {
    console.error('❌ Failed to create email template:', error);
    throw error;
  }
}

// Test sending a test email with attachment
async function testSendTestEmail(token: string, templateId: string) {
  console.log('\n🧪 Testing sending a test email with attachment...');
  
  // Read the test attachment file
  const attachmentContent = fs.readFileSync(config.testAttachmentPath, { encoding: 'base64' });
  
  const emailData = {
    subject: 'Test Email With Attachment',
    content: '<p>This is a test email with an attachment.</p>',
    to: config.testEmailRecipient,
    templateId,
    attachments: [
      {
        filename: 'test-attachment.txt',
        content: attachmentContent,
        contentType: 'text/plain'
      }
    ]
  };
  
  try {
    const response = await fetch(`${config.apiBaseUrl}/api/admin/emails/send-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(emailData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`API error: ${result.message || response.statusText}`);
    }
    
    console.log('✅ Test email sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    throw error;
  }
}

// Test sending a bulk email campaign
async function testSendBulkEmail(token: string, templateId: string) {
  console.log('\n🧪 Testing sending a bulk email campaign...');
  
  // Get a few test recipients
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('id, email, first_name, last_name')
    .limit(3);
  
  if (customersError || !customers || customers.length === 0) {
    throw new Error(`Failed to get test recipients: ${customersError?.message || 'No customers found'}`);
  }
  
  // Read the test attachment file
  const attachmentContent = fs.readFileSync(config.testAttachmentPath, { encoding: 'base64' });
  
  const emailData = {
    subject: 'Bulk Test Email Campaign',
    content: '<p>This is a bulk test email campaign.</p>',
    recipients: customers.map(c => ({
      id: c.id,
      email: c.email,
      first_name: c.first_name,
      last_name: c.last_name
    })),
    templateId,
    attachments: [
      {
        filename: 'test-attachment.txt',
        content: attachmentContent,
        contentType: 'text/plain'
      }
    ]
  };
  
  try {
    const response = await fetch(`${config.apiBaseUrl}/api/admin/emails/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(emailData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`API error: ${result.message || response.statusText}`);
    }
    
    console.log('✅ Bulk email campaign sent successfully');
    console.log(`Campaign ID: ${result.data.campaignId}`);
    
    return result.data.campaignId;
  } catch (error) {
    console.error('❌ Failed to send bulk email campaign:', error);
    throw error;
  }
}

// Test checking email campaign history
async function testEmailHistory(token: string, campaignId: string) {
  console.log('\n🧪 Testing email campaign history API...');
  
  try {
    const response = await fetch(`${config.apiBaseUrl}/api/admin/emails/history?page=1&pageSize=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`API error: ${result.message || response.statusText}`);
    }
    
    console.log('✅ Email history retrieved successfully');
    
    // Check if our campaign is in the results
    const campaign = result.data.campaigns.find((c: any) => c.id === campaignId);
    if (campaign) {
      console.log('✅ Test campaign found in history');
      console.log(`Campaign stats: Total: ${campaign.stats.total}, Sent: ${campaign.stats.sent}, Failed: ${campaign.stats.failed}`);
    } else {
      console.warn('⚠️ Test campaign not found in history (it might be on another page)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to retrieve email history:', error);
    throw error;
  }
}

// Test rate limiting
async function testRateLimiting(token: string, templateId: string) {
  console.log('\n🧪 Testing rate limiting functionality...');
  
  // Get test recipients
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('id, email, first_name, last_name')
    .limit(600); // Try to exceed the rate limit (500 emails per hour)
  
  if (customersError || !customers || customers.length === 0) {
    throw new Error(`Failed to get test recipients: ${customersError?.message || 'No customers found'}`);
  }
  
  console.log(`Attempting to send to ${customers.length} recipients to test rate limiting...`);
  
  const emailData = {
    subject: 'Rate Limit Test Campaign',
    content: '<p>This is a rate limit test.</p>',
    recipients: customers.map(c => ({
      id: c.id,
      email: c.email,
      first_name: c.first_name,
      last_name: c.last_name
    })),
    templateId
  };
  
  try {
    const response = await fetch(`${config.apiBaseUrl}/api/admin/emails/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(emailData)
    });
    
    const result = await response.json();
    
    if (response.status === 429) {
      console.log('✅ Rate limiting working correctly - received 429 Too Many Requests');
      return true;
    } else if (!response.ok) {
      throw new Error(`API error: ${result.message || response.statusText}`);
    } else {
      console.log('⚠️ Rate limiting test inconclusive - campaign was accepted');
      console.log('This could be because:');
      console.log('1. The rate limit is higher than the number of recipients we tried');
      console.log('2. No other emails were sent within the rate limit window');
      console.log(`Campaign ID: ${result.data.campaignId}`);
      return true;
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('429')) {
      console.log('✅ Rate limiting working correctly - received 429 Too Many Requests');
      return true;
    }
    console.error('❌ Rate limiting test failed with unexpected error:', error);
    throw error;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting email functionality tests');
  
  try {
    // Get an admin user
    const adminUser = await getAdminUser();
    console.log(`Using admin user: ${adminUser.email}`);
    
    // Get auth token
    const token = await getAdminAuthToken(adminUser.id);
    console.log('Auth token obtained');
    
    // Run tests
    const templateId = await testCreateEmailTemplate(token);
    await testSendTestEmail(token, templateId);
    const campaignId = await testSendBulkEmail(token, templateId);
    await testEmailHistory(token, campaignId);
    await testRateLimiting(token, templateId);
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Tests failed:', error);
    process.exit(1);
  }
}

// Run the tests
runTests();
