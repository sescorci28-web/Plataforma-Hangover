const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ouibyflexyntquwptkhh.supabase.co';
const supabaseKey = 'sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfileQuery() {
  console.log('=== TEST 1: FETCH ANY ROW FROM PROFILES TO GET A VALID ID ===');
  const { data: firstRow, error: firstErr } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, city, role, provider_type, bio')
    .limit(1);

  if (firstErr) {
    console.log('Error fetching first row:', firstErr.message);
    return;
  }

  if (!firstRow || firstRow.length === 0) {
    console.log('No rows returned from public.profiles');
    return;
  }

  const sampleId = firstRow[0].id;
  console.log('Found sample profile:', {
    id: sampleId,
    full_name: firstRow[0].full_name,
    username: firstRow[0].username,
  });

  console.log('\n=== TEST 2: QUERY PUBLIC.PROFILES BY EXACT UUID ===');
  console.log('[PROFILE QUERY]', { idUtilized: sampleId });

  const { data: targetProfile, error: queryErr } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, city, role, provider_type, bio, is_verified')
    .eq('id', sampleId)
    .maybeSingle();

  console.log('[PROFILE QUERY RESULT]', {
    errorMessage: queryErr?.message || null,
    errorCode: queryErr?.code || null,
    dataExists: !!targetProfile,
    receivedProfileId: targetProfile?.id || null,
    full_name: targetProfile?.full_name,
    username: targetProfile?.username
  });
}

testProfileQuery();
