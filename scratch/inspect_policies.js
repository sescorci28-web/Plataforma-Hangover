const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ouibyflexyntquwptkhh.supabase.co';
const supabaseKey = 'sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectPolicies() {
  // We can query pg_policies using a RPC if one exists, or query a system table if allowed.
  // Let's try executing a select on pg_policies or similar via supabase if we can.
  // Since we cannot run raw SQL directly, let's see if we can query it or if it fails.
  const { data, error } = await supabase.from('pg_policies').select('*').limit(1);
  if (error) {
    console.log('Cannot query pg_policies directly (as expected via public API):', error.message);
  } else {
    console.log('Policies:', data);
  }
}
inspectPolicies();
