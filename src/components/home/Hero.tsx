"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Search, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20 pb-32">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-[128px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-600/20 rounded-full blur-[128px] mix-blend-screen animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary-900/30 rounded-[100%] blur-[100px] opacity-50" />
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-6 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 border-primary-500/30"
        >
          <Sparkles className="w-4 h-4 text-primary-400" />
          <span className="text-sm font-medium text-zinc-300">El Marketplace #1 de Nightlife</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 font-outfit"
        >
          Eleva tus <span className="text-gradient">Noches</span>
          <br /> a Otro Nivel
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10"
        >
          Encuentra DJs, sonido, iluminación, discotecas y todo lo que necesitas para que tu próxima fiesta sea legendaria.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center"
        >
          <Link
            href="/search"
            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all glow group"
          >
            Explorar Servicios
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/register?type=provider"
            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 glass hover:bg-white/10 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all border-white/20"
          >
            Soy Proveedor
          </Link>
        </motion.div>

        {/* Floating Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-16 w-full max-w-3xl glass-card p-2 flex flex-col md:flex-row items-center gap-2 rounded-3xl"
        >
          <div className="flex-1 flex items-center px-4 py-2 w-full">
            <Search className="w-5 h-5 text-zinc-400 mr-3" />
            <input
              type="text"
              placeholder="¿Qué estás buscando? (ej. DJ, Luces, Catering...)"
              className="bg-transparent border-none outline-none text-white w-full placeholder:text-zinc-500"
            />
          </div>
          <button className="w-full md:w-auto bg-white text-black px-8 py-3 rounded-2xl font-semibold hover:bg-zinc-200 transition-colors">
            Buscar
          </button>
        </motion.div>
      </div>
    </section>
  );
}
