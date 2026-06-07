export const PREMIUM_EVENT_IMAGES = [
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1486591978090-58e619d37fe7?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?auto=format&fit=crop&w=1200&q=80"
];

import { slugify } from "./slugify";

export { slugify };

export function getEventImage(imageUrl: string | null | undefined, eventId: string): string {
  if (!imageUrl || imageUrl.includes("placeholder") || imageUrl.trim() === "" || imageUrl.includes("example.com")) {
    let hash = 0;
    for (let i = 0; i < eventId.length; i++) {
      hash += eventId.charCodeAt(i);
    }
    const index = hash % PREMIUM_EVENT_IMAGES.length;
    return PREMIUM_EVENT_IMAGES[index];
  }
  return imageUrl;
}

export function getEventBadges(event: any, index: number) {
  const badges = [];
  const titleLower = (event.title || "").toLowerCase();
  const descLower = (event.description || "").toLowerCase();
  
  if (index === 0 || event.attendeeCount > 10) {
    badges.push({
      text: "🔥 Trending",
      className: "bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.3)] border-none"
    });
  }
  
  if (titleLower.includes("barra libre") || titleLower.includes("open bar") || index % 3 === 1) {
    badges.push({
      text: "🍹 Open Bar",
      className: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_0_12px_rgba(20,184,166,0.3)] border-none"
    });
  }
  
  if (titleLower.includes("dj") || descLower.includes("dj") || index % 4 === 2) {
    badges.push({
      text: "🎧 DJ Invitado",
      className: "bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-[0_0_12px_rgba(217,70,239,0.3)] border-none"
    });
  }

  const eventDate = event.event_date ? new Date(event.event_date) : new Date();
  const daysDiff = (eventDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24);
  if (event.ticket_price > 0 && (daysDiff > 3 || index % 2 === 0)) {
    badges.push({
      text: "🎟️ Preventa",
      className: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)] border-none"
    });
  }

  return badges.slice(0, 2);
}
