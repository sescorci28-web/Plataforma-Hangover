const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ouibyflexyntquwptkhh.supabase.co';
const supabaseKey = 'sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: catData, error: catError } = await supabase
    .from('service_categories')
    .select('*')
    .limit(5);

  if (catError) {
    console.error('Error fetching service_categories:', catError);
  } else {
    console.log('service_categories:', catData);
  }

  const { data: subData, error: subError } = await supabase
    .from('service_subcategories')
    .select('*')
    .limit(5);

  if (subError) {
    console.error('Error fetching service_subcategories:', subError);
  } else {
    console.log('service_subcategories:', subData);
  }
}

check();
