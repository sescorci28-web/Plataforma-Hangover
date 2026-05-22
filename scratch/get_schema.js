const url = "https://ouibyflexyntquwptkhh.supabase.co/rest/v1/";
const key = "sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ";

fetch(url, {
  method: 'GET',
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
})
.then(async res => {
  const json = await res.json();
  console.log("JSON response:", json);
})
.catch(err => {
  console.error("Error:", err);
});
