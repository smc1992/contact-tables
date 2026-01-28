// Script to check favorites table
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFavoritesTable() {
  const userId = '11339381-59d7-47ed-9435-ab3d660ea6d8';
  const restaurantId = '4d23d8fc-b666-418b-a03d-6e48d063be48';
  
  console.log('Checking favorites table...');
  console.log('User ID:', userId);
  console.log('Restaurant ID:', restaurantId);
  
  // Try to select from favorites table
  console.log('\n=== Trying to SELECT from favorites ===');
  const { data: selectData, error: selectError } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId);
    
  console.log('Select result:', { data: selectData, error: selectError });
  
  // Try to insert a favorite
  console.log('\n=== Trying to INSERT into favorites ===');
  const { data: insertData, error: insertError } = await supabase
    .from('favorites')
    .insert({
      user_id: userId,
      restaurant_id: restaurantId
    })
    .select();
    
  console.log('Insert result:', { data: insertData, error: insertError });
  
  // Check if it exists now
  console.log('\n=== Checking if favorite exists ===');
  const { data: checkData, error: checkError } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('restaurant_id', restaurantId)
    .single();
    
  console.log('Check result:', { data: checkData, error: checkError });
}

checkFavoritesTable().catch(console.error);
