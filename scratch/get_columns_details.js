const key = 'sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ';
const baseUrl = 'https://ouibyflexyntquwptkhh.supabase.co/rest/v1/';

async function getCols(table) {
  // Query with an invalid column to force PostgREST to output available column names in error hint
  const res = await fetch(`${baseUrl}${table}?select=invalid_col_test&limit=1`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const json = await res.json();
  console.log(`\n=== TABLE [${table}] COLUMN INSPECTION ===`);
  console.log('Error hint / message:', json.message || json.hint || json);
}

async function main() {
  await getCols('profiles');
  await getCols('events');
  await getCols('clubs');
  await getCols('services');
  await getCols('service_categories');
  await getCols('service_subcategories');
}

main();
