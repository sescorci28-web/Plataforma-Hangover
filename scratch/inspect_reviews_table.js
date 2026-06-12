const key = "sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ";
const baseUrl = "https://ouibyflexyntquwptkhh.supabase.co/rest/v1/";

async function checkTable(table) {
  const url = `${baseUrl}${table}?limit=1`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    return { table, status: res.status, ok: res.ok };
  } catch (err) {
    return { table, error: err.message };
  }
}

async function run() {
  const tables = ["reviews", "club_reviews", "comments", "opiniones"];
  const results = [];
  for (const t of tables) {
    results.push(await checkTable(t));
  }
  console.log("Check reviews tables result:", JSON.stringify(results, null, 2));
}

run();
