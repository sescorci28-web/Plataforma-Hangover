const url = "https://ouibyflexyntquwptkhh.supabase.co/rest/v1/profiles";
const key = "sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ";

fetch(url, {
  method: 'HEAD',
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
})
.then(async res => {
  console.log("Status:", res.status);
  console.log("Headers:", Object.fromEntries(res.headers.entries()));
})
.catch(err => {
  console.error("Error:", err);
});
