const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ouibyflexyntquwptkhh.supabase.co';
const supabaseKey = 'sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ';
const supabase = createClient(supabaseUrl, supabaseKey);

function sanitizeSearchTerm(input) {
  if (!input) return '';
  // Remove or escape double quotes and special PostgREST characters that could break string literal in .or()
  return input.replace(/"/g, '').replace(/,/g, ' ').replace(/\(/g, '').replace(/\)/g, '').trim();
}

async function testSearch(queryText) {
  const rawClean = queryText ? queryText.trim() : '';
  const searchTerm = rawClean.startsWith('@') ? rawClean.slice(1).trim() : rawClean;
  const safeTerm = sanitizeSearchTerm(searchTerm);
  
  if (safeTerm.length < 2) {
    console.log(`Query '${queryText}' -> skipped (< 2 chars)`);
    return;
  }

  // Wrap in double quotes for PostgREST .or() string values containing spaces
  const pattern = `"%${safeTerm}%"`;

  console.log(`\n--- Testing query: '${queryText}' | safeTerm: '${safeTerm}' | pattern: ${pattern} ---`);

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, city, role, provider_type')
    .or(`full_name.ilike.${pattern},username.ilike.${pattern},city.ilike.${pattern}`)
    .limit(20);

  if (error) {
    console.error(`ERROR for '${queryText}':`, error.message);
  } else {
    console.log(`SUCCESS! Rows returned: ${data.length}`);
    if (data.length > 0) {
      console.log('Sample rows:', data);
    }
  }
}

async function main() {
  await testSearch('Daniel Taborda');
  await testSearch('Juan Carlos');
  await testSearch('@sergio');
  await testSearch('Barranquilla');
  await testSearch('test"quote,with(parentheses)');
}

main();
