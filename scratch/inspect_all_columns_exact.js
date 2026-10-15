const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ouibyflexyntquwptkhh.supabase.co';
const supabaseKey = 'sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAll() {
  console.log('=== 1. PROFILES COLUMNS ===');
  // Attempt to select columns from profiles
  const { data: pData, error: pErr } = await supabase.from('profiles').select('*');
  if (pData && pData.length > 0) {
    console.log('Profiles columns:', Object.keys(pData[0]));
  } else {
    // Try selecting common columns to verify existence
    const testCols = ['id', 'full_name', 'username', 'role', 'provider_type', 'city', 'country', 'birth_date', 'gender', 'avatar_url', 'phone', 'bio', 'instagram', 'tiktok', 'twitter', 'website', 'created_at', 'updated_at'];
    for (const col of testCols) {
      const { error } = await supabase.from('profiles').select(col).limit(1);
      console.log(`  profiles.${col}: ${error ? 'MISSING (' + error.message + ')' : 'EXISTS'}`);
    }
  }

  console.log('\n=== 2. SERVICES COLUMNS ===');
  const { data: sData, error: sErr } = await supabase.from('services').select('*');
  if (sData && sData.length > 0) {
    console.log('Services columns:', Object.keys(sData[0]));
    console.log('Sample service:', sData[0]);
  } else {
    const testCols = ['id', 'provider_id', 'title', 'slug', 'description', 'category', 'price', 'base_city', 'image_url', 'cover_url', 'video_url', 'created_at', 'updated_at', 'status', 'is_active'];
    for (const col of testCols) {
      const { error } = await supabase.from('services').select(col).limit(1);
      console.log(`  services.${col}: ${error ? 'MISSING (' + error.message + ')' : 'EXISTS'}`);
    }
  }

  console.log('\n=== 3. RLS POLICIES CHECK (ANON SELECT) ===');
  const tables = ['profiles', 'events', 'clubs', 'services'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('id').limit(1);
    console.log(`Table [${t}] anon SELECT: ${error ? 'BLOCKED/ERROR: ' + error.message : 'ALLOWED (rows returned: ' + (data ? data.length : 0) + ')'}`);
  }
}

inspectAll();
