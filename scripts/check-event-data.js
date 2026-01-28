// Script to check event data
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEventData() {
  const eventId = '001cdff8-a3b2-4fff-b331-7e06d14bf8ed';
  
  console.log('Checking event:', eventId);
  
  // Get event data
  const { data: event, error: eventError } = await supabase
    .from('contact_tables')
    .select('*')
    .eq('id', eventId)
    .single();
    
  if (eventError) {
    console.error('Error loading event:', eventError);
    return;
  }
  
  console.log('Event data:', JSON.stringify(event, null, 2));
  console.log('datetime field:', event.datetime);
  console.log('datetime type:', typeof event.datetime);
  console.log('datetime is null?', event.datetime === null);
  
  // Get participations
  const { data: participations, error: participationsError } = await supabase
    .from('participations')
    .select('*')
    .eq('event_id', eventId);
    
  if (participationsError) {
    console.error('Error loading participations:', participationsError);
    return;
  }
  
  console.log('Participations:', JSON.stringify(participations, null, 2));
}

checkEventData();
