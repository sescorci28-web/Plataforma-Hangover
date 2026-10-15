const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ouibyflexyntquwptkhh.supabase.co';
const supabaseKey = 'sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectPgPolicies() {
  console.log('=== INSPECTING PG_POLICIES FOR PUBLIC.PROFILES ===\n');

  // Attempt 1: Query pg_policies via RPC or table (if exposed)
  const { data: pgData, error: pgErr } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'profiles');

  if (pgErr) {
    console.log('Attempting direct pg_policies query error:', pgErr.message);
  } else {
    console.log('pg_policies data:', JSON.stringify(pgData, null, 2));
  }
}

inspectPgPolicies();
