// Script to check event data
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEventData() {
  const eventId = '001cdff8-a3b2-4fff-b331-7e06d14bf8ed';
  const userId = '11339381-59d7-47ed-9435-ab3d660ea6d8';
  
  console.log('Checking event:', eventId);
  console.log('User ID:', userId);
  
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
  
  console.log('\n=== EVENT DATA ===');
  console.log('Event data:', JSON.stringify(event, null, 2));
  console.log('datetime field:', event.datetime);
  console.log('datetime type:', typeof event.datetime);
  console.log('datetime is null?', event.datetime === null);
  
  // Get ALL participations for this event
  console.log('\n=== ALL PARTICIPATIONS ===');
  const { data: allParticipations, error: allParticipationsError } = await supabase
    .from('participations')
    .select('*')
    .eq('event_id', eventId);
    
  if (allParticipationsError) {
    console.error('Error loading participations:', allParticipationsError);
  } else {
    console.log('All Participations:', JSON.stringify(allParticipations, null, 2));
    console.log('Total participants:', allParticipations?.length || 0);
  }
  
  // Get user's participation
  console.log('\n=== USER PARTICIPATION ===');
  const { data: userParticipation, error: userParticipationError } = await supabase
    .from('participations')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId);
    
  if (userParticipationError) {
    console.error('Error loading user participation:', userParticipationError);
  } else {
    console.log('User Participation:', JSON.stringify(userParticipation, null, 2));
  }
}

checkEventData();
