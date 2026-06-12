const key = "sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ";
const baseUrl = "https://ouibyflexyntquwptkhh.supabase.co/rest/v1/live_orders";

async function run() {
  // Exact query from the dashboard
  const url = `${baseUrl}?select=id,status,created_at,live_sessions!inner(user_id,club_id,club_tables!inner(table_number),profiles!inner(full_name)),live_order_items(id,quantity,price_at_order,club_menu_items(name))&limit=1`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Error details:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
