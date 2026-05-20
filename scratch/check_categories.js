const url = "https://ouibyflexyntquwptkhh.supabase.co/rest/v1/categories";
const key = "sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ";

fetch(url, {
  method: 'GET',
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
})
.then(async res => {
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text);
})
.catch(err => {
  console.error("Error:", err);
});
