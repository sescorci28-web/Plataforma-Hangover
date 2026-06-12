const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ouibyflexyntquwptkhh.supabase.co';
const supabaseKey = 'sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .limit(1);
  if (error) {
    console.error('Error fetching clubs:', error);
  } else if (data && data.length > 0) {
    console.log('Columns in clubs table:', Object.keys(data[0]));
    console.log('Sample data:', data[0]);
  } else {
    console.log('No clubs records found to inspect.');
  }
}

check();
