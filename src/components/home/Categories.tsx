"use calendar";
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Music, 
  Speaker, 
  Lightbulb, 
  UtensilsCrossed, 
  Armchair, 
  PartyPopper, 
  Building2, 
  CalendarDays 
} from "lucide-react";

const categories = [
  { id: "djs", name: "DJs", icon: Music, color: "from-blue-500 to-indigo-500" },
  { id: "sonido", name: "Sonido", icon: Speaker, color: "from-purple-500 to-fuchsia-500" },
  { id: "luces", name: "Luces", icon: Lightbulb, color: "from-pink-500 to-rose-500" },
  { id: "catering", name: "Catering", icon: UtensilsCrossed, color: "from-orange-500 to-red-500" },
  { id: "mobiliario", name: "Mobiliario", icon: Armchair, color: "from-amber-500 to-yellow-500" },
  { id: "decoracion", name: "Decoración", icon: PartyPopper, color: "from-emerald-500 to-teal-500" },
  { id: "discotecas", name: "Discotecas", icon: Building2, color: "from-cyan-500 to-blue-500" },
  { id: "eventos", name: "Eventos", icon: CalendarDays, color: "from-violet-500 to-purple-500" },
];

export function Categories() {
  return (
    <section className="py-24 relative z-10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-4 font-outfit"
          >
            Explora por <span className="text-gradient">Categorías</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 max-w-2xl text-lg"
          >
            Todo lo que necesitas para tu evento en un solo lugar. Conecta con los mejores profesionales del sector.
          </motion.p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={`/category/${category.id}`}
                  className="block group relative overflow-hidden rounded-3xl glass-card p-6 md:p-8 hover:bg-white/10 transition-all duration-300 border-white/5 hover:border-white/20"
                >
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${category.color} transition-opacity duration-300`} />
                  
                  <div className="flex flex-col items-center gap-4 relative z-10">
                    <div className="p-4 rounded-2xl bg-white/5 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <span className="font-semibold text-lg text-zinc-200 group-hover:text-white transition-colors">
                      {category.name}
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
