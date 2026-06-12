const key = "sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ";
const baseUrl = "https://ouibyflexyntquwptkhh.supabase.co/rest/v1/";

async function inspectEvents() {
  const url = `${baseUrl}events?limit=1`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    const data = await res.json();
    console.log("Event columns:", data.length > 0 ? Object.keys(data[0]) : "No events found");
    console.log("Sample event record:", data[0]);
  } catch (err) {
    console.error("Error inspecting events:", err);
  }
}

inspectEvents();
