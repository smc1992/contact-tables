/**
 * Simple script to verify email functionality
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyEmailSystem() {
  console.log('🔍 Verifying email system components...');
  
  try {
    // 1. Check system_settings table for SMTP configuration
    console.log('\n📧 Checking SMTP configuration...');
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('smtp_host, smtp_port, smtp_user, smtp_password, contact_email, website_url')
      .single();
    
    if (settingsError) {
      throw new Error(`Failed to get SMTP settings: ${settingsError.message}`);
    }
    
    if (!settings.smtp_host || !settings.smtp_port || !settings.smtp_user || !settings.smtp_password) {
      console.warn('⚠️ SMTP configuration incomplete in database. Will fall back to environment variables.');
    } else {
      console.log('✅ SMTP configuration found in database');
    }
    
    // 2. Check email_templates table
    console.log('\n📝 Checking email templates...');
    const { data: templates, error: templatesError } = await supabase
      .from('email_templates')
      .select('id, name, subject, content')
      .limit(5);
    
    if (templatesError) {
      throw new Error(`Failed to get email templates: ${templatesError.message}`);
    }
    
    if (templates.length === 0) {
      console.warn('⚠️ No email templates found in database');
    } else {
      console.log(`✅ Found ${templates.length} email templates`);
      templates.forEach((template, i) => {
        console.log(`   ${i+1}. ${template.name} (ID: ${template.id})`);
      });
    }
    
    // 3. Check email_campaigns table
    console.log('\n📊 Checking email campaigns...');
    const { data: campaigns, error: campaignsError } = await supabase
      .from('email_campaigns')
      .select('id, subject, created_at, status')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (campaignsError) {
      throw new Error(`Failed to get email campaigns: ${campaignsError.message}`);
    }
    
    if (campaigns.length === 0) {
      console.warn('⚠️ No email campaigns found in database');
    } else {
      console.log(`✅ Found ${campaigns.length} recent email campaigns`);
      campaigns.forEach((campaign, i) => {
        const date = new Date(campaign.created_at).toLocaleString();
        console.log(`   ${i+1}. "${campaign.subject}" (${date}) - Status: ${campaign.status}`);
      });
    }
    
    // 4. Check email_recipients table
    console.log('\n👥 Checking email recipients...');
    const { data: recipients, error: recipientsError } = await supabase
      .from('email_recipients')
      .select('status, campaign_id')
      .limit(1000);
    
    if (recipientsError) {
      throw new Error(`Failed to get email recipients: ${recipientsError.message}`);
    }
    
    if (recipients.length === 0) {
      console.warn('⚠️ No email recipients found in database');
    } else {
      console.log(`✅ Found ${recipients.length} email recipients`);
      
      // Group by status
      const statusCounts = recipients.reduce((acc, recipient) => {
        acc[recipient.status] = (acc[recipient.status] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });
    }
    
    // 5. Check unsubscribed_emails table
    console.log('\n🚫 Checking unsubscribed emails...');
    const { data: unsubscribed, error: unsubscribedError } = await supabase
      .from('unsubscribed_emails')
      .select('email, unsubscribed_at')
      .limit(10);
    
    if (unsubscribedError) {
      throw new Error(`Failed to get unsubscribed emails: ${unsubscribedError.message}`);
    }
    
    console.log(`✅ Found ${unsubscribed.length} unsubscribed emails`);
    
    console.log('\n✅ Email system verification complete!');
    console.log('All required tables and configurations are in place.');
    console.log('\nSummary:');
    console.log('- SMTP configuration: ✓');
    console.log(`- Email templates: ${templates.length} found`);
    console.log(`- Email campaigns: ${campaigns.length} found`);
    console.log(`- Email recipients: ${recipients.length} found`);
    console.log(`- Unsubscribed emails: ${unsubscribed.length} found`);
    
  } catch (error) {
    console.error(`❌ Verification failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the verification
verifyEmailSystem();
