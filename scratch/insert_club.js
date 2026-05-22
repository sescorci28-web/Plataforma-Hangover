const url = "https://ouibyflexyntquwptkhh.supabase.co/rest/v1/clubs";
const key = "sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ";

const testClub = {
  name: "Pacha Ibiza",
  city: "Ibiza",
  description: "La discoteca más emblemática del mundo, conocida por las cerezas y la mejor música electrónica.",
  rating: 4.8,
  banner_image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop"
};

fetch(url, {
  method: 'POST',
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },
  body: JSON.stringify(testClub)
})
.then(async res => {
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text);
})
.catch(err => {
  console.error("Error:", err);
});
