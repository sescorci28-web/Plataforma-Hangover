const key = "sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ";
const baseUrl = "https://ouibyflexyntquwptkhh.supabase.co/rest/v1/";

async function inspectClubs() {
  const url = `${baseUrl}clubs?limit=1`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    const data = await res.json();
    console.log("Club columns:", data.length > 0 ? Object.keys(data[0]) : "No clubs found");
    console.log("Sample club record:", data[0]);
  } catch (err) {
    console.error("Error inspecting clubs:", err);
  }
}

inspectClubs();
