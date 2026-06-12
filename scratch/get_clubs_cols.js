const url = "https://ouibyflexyntquwptkhh.supabase.co/rest/v1/";
const key = "sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ";

// We query information_schema.columns or we can just query a single club
fetch(`${url}clubs?select=*&limit=1`, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`
  }
})
.then(async res => {
  const json = await res.json();
  console.log("Club keys:", Object.keys(json[0] || {}));
})
.catch(console.error);
