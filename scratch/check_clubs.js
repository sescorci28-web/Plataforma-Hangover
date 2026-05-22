const url = "https://ouibyflexyntquwptkhh.supabase.co/rest/v1/clubs?select=id,name,city,description,rating,banner_image,slug,created_at";
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
  const json = await res.json();
  console.log("Response:", json);
})
.catch(err => {
  console.error("Error:", err);
});
