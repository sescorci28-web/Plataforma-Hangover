const key = "sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ";
const baseUrl = "https://ouibyflexyntquwptkhh.supabase.co/rest/v1/clubs";

async function testColumn(column) {
  const url = `${baseUrl}?select=${column}`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    const text = await res.text();
    return { column, status: res.status, ok: res.ok, response: text };
  } catch (err) {
    return { column, error: err.message };
  }
}

async function run() {
  const columnsToTest = [
    "provider_id",
    "user_id",
    "creator_id",
    "owner_id",
    "logo",
    "address",
    "instagram",
    "opening_hours",
    "active"
  ];
  
  const results = [];
  for (const col of columnsToTest) {
    const res = await testColumn(col);
    results.push(res);
  }
  
  console.log(JSON.stringify(results, null, 2));
}

run();
