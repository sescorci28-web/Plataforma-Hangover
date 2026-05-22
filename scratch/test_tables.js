const key = "sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ";
const baseUrl = "https://ouibyflexyntquwptkhh.supabase.co/rest/v1/";

async function testTable(table) {
  const url = `${baseUrl}${table}?limit=1`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    const text = await res.text();
    return { table, status: res.status, ok: res.ok, response: text.substring(0, 200) };
  } catch (err) {
    return { table, error: err.message };
  }
}

async function run() {
  const tables = [
    "club_providers",
    "provider_clubs",
    "club_owners",
    "clubs_providers",
    "providers_clubs",
    "venues"
  ];
  const results = [];
  for (const t of tables) {
    results.push(await testTable(t));
  }
  console.log(JSON.stringify(results, null, 2));
}

run();
