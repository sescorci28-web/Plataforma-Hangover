const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ouibyflexyntquwptkhh.supabase.co';
const supabaseKey = 'sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyColumn(table, col) {
  const { data, error } = await supabase.from(table).select(col).limit(1);
  if (error) {
    return { exists: false, error: error.message };
  }
  return { exists: true, error: null };
}

async function verifyTableColumns(table, columns) {
  console.log(`\n========================================`);
  console.log(`VERIFYING TABLE: public.${table}`);
  console.log(`========================================`);
  
  const results = {};
  for (const col of columns) {
    const res = await verifyColumn(table, col);
    results[col] = res.exists;
    console.log(`  - ${col.padEnd(20)}: ${res.exists ? 'EXISTS' : 'NO EXISTE (' + res.error + ')'}`);
  }
  return results;
}

async function testRlsPolicies(table) {
  console.log(`\n--- RLS Read Test for public.${table} ---`);
  // Anon select
  const { data: anonData, error: anonError } = await supabase.from(table).select('*').limit(3);
  console.log(`  Anon SELECT * status: ${anonError ? 'BLOCKED/ERROR: ' + anonError.message : 'ALLOWED'}`);
  if (anonData) {
    console.log(`  Anon SELECT returned ${anonData.length} rows.`);
    if (anonData.length > 0) {
      console.log(`  Sample columns accessible to Anon:`, Object.keys(anonData[0]));
    }
  }
}

async function main() {
  const profilesCols = [
    'id', 'username', 'full_name', 'city', 'avatar_url', 'role', 'provider_type', 
    'phone', 'birth_date', 'gender', 'bio', 'instagram', 'tiktok', 'twitter', 'website', 'created_at', 'updated_at'
  ];

  const eventsCols = [
    'id', 'title', 'description', 'location', 'category', 'event_type', 'event_date',
    'creator_id', 'image_url', 'ticket_price', 'ticketing_enabled', 'dress_code', 'min_age',
    'average_rating', 'reviews_count', 'created_at', 'updated_at'
  ];

  const clubsCols = [
    'id', 'name', 'slug', 'description', 'city', 'address', 'club_type', 'active',
    'visibility', 'status', 'banner_image', 'logo', 'hero_image', 'opening_hours',
    'rating', 'cover_price', 'provider_id', 'owner_id', 'created_at'
  ];

  const servicesCols = [
    'id', 'title', 'slug', 'description', 'category', 'base_city', 'provider_id',
    'price', 'image_url', 'cover_url', 'video_url', 'created_at', 'updated_at'
  ];

  await verifyTableColumns('profiles', profilesCols);
  await testRlsPolicies('profiles');

  await verifyTableColumns('events', eventsCols);
  await testRlsPolicies('events');

  await verifyTableColumns('clubs', clubsCols);
  await testRlsPolicies('clubs');

  await verifyTableColumns('services', servicesCols);
  await testRlsPolicies('services');
}

main();
