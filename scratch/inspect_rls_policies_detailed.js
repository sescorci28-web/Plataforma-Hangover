const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ouibyflexyntquwptkhh.supabase.co';
const supabaseKey = 'sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectPolicies() {
  console.log('=== AUDITING RLS READ ACCESS FOR ANON AND AUTH USERS ===');

  const tables = ['profiles', 'events', 'clubs', 'services'];

  for (const table of tables) {
    console.log(`\n--- Table: ${table} ---`);
    // 1. Anon query
    const { data: anonData, error: anonErr } = await supabase.from(table).select('count', { count: 'exact', head: true });
    console.log(`  Anon SELECT result: ${anonErr ? 'ERROR (' + anonErr.message + ')' : 'SUCCESS (count: ' + anonData + ')'}`);

    // 2. Select 1 record with anon key
    const { data: sampleData, error: sampleErr } = await supabase.from(table).select('*').limit(1);
    if (sampleErr) {
      console.log(`  Anon SELECT sample error: ${sampleErr.message}`);
    } else {
      console.log(`  Anon SELECT sample count returned: ${sampleData.length}`);
    }
  }
}

inspectPolicies();
