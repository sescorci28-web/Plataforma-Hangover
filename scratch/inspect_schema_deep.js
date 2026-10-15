const key = 'sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ';
const baseUrl = 'https://ouibyflexyntquwptkhh.supabase.co/rest/v1/';

async function deepAudit() {
  console.log('=== OPENAPI SCHEMA DEFINITIONS ===');
  const res = await fetch(`${baseUrl}?apikey=${key}`);
  const spec = await res.json();
  
  const targetTables = ['profiles', 'events', 'clubs', 'services', 'service_categories', 'service_subcategories', 'service_providers'];
  
  targetTables.forEach(tableName => {
    if (spec.definitions && spec.definitions[tableName]) {
      console.log(`\n--- TABLE: ${tableName} ---`);
      const props = spec.definitions[tableName].properties || {};
      Object.keys(props).forEach(col => {
        const info = props[col];
        console.log(`  - ${col} (${info.type || info.format || 'unknown'}) ${info.description || ''}`);
      });
    } else {
      console.log(`\n--- TABLE: ${tableName} NOT FOUND IN OPENAPI DEFINITIONS ---`);
    }
  });

  console.log('\n=== TESTING SELECT FOR EACH TABLE WITH ANON KEY ===');
  for (const t of targetTables) {
    try {
      const resp = await fetch(`${baseUrl}${t}?select=*&limit=1`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
      });
      console.log(`Table [${t}] status: ${resp.status} ${resp.statusText}`);
      if (resp.ok) {
        const d = await resp.json();
        console.log(`  Count/Rows returned: ${d.length}`);
        if (d.length > 0) {
          console.log(`  Sample keys: ${Object.keys(d[0]).join(', ')}`);
        }
      } else {
        const errText = await resp.text();
        console.log(`  Error: ${errText}`);
      }
    } catch (err) {
      console.error(`  Fetch error for [${t}]:`, err);
    }
  }
}

deepAudit();
