-- Check the event data for the problematic event
SELECT 
  id,
  title,
  datetime,
  max_participants,
  restaurant_id,
  created_at
FROM contact_tables
WHERE id = '001cdff8-a3b2-4fff-b331-7e06d14bf8ed';

-- Check all participations for this event
SELECT 
  id,
  event_id,
  user_id,
  reservation_date,
  joined_at
FROM participations
WHERE event_id = '001cdff8-a3b2-4fff-b331-7e06d14bf8ed';
