"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, Wine } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";

interface NavbarProps {
  user: { email: string | undefined; type: string } | null;
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "glass-nav py-3" : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary-600/20 p-2 rounded-xl group-hover:bg-primary-600/30 transition-colors">
              <Wine className="w-6 h-6 text-primary-400 group-hover:text-primary-300 transition-colors" />
            </div>
            <span className="text-xl font-bold tracking-wider text-white">
              HANG<span className="text-primary-400">OVER</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/events" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              Eventos
            </Link>
            <Link href="/services" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              Servicios
            </Link>
            <Link href="/discotecas" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              Discotecas
            </Link>
            <Link href="/connect" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              Connect
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-white hover:text-primary-300 transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-full transition-colors"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-white hover:text-primary-300 transition-colors">
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-full transition-colors"
                >
                  Regístrate
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-zinc-300 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden absolute top-full left-0 right-0 bg-[#09090f] border-t border-white/10 shadow-2xl"
        >
          <div className="flex flex-col p-4 gap-4">
            <Link
              href="/events"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-zinc-300 hover:text-white py-2"
            >
              Eventos
            </Link>
            <Link
              href="/services"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-zinc-300 hover:text-white py-2"
            >
              Servicios
            </Link>
            <Link
              href="/discotecas"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-zinc-300 hover:text-white py-2"
            >
              Discotecas
            </Link>
            <Link
              href="/connect"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-zinc-300 hover:text-white py-2"
            >
              Connect
            </Link>
            <hr className="border-white/10 my-2" />
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-zinc-300 hover:text-white py-2"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-center bg-zinc-800 text-white px-4 py-3 rounded-xl mt-2 transition-all cursor-pointer"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-zinc-300 hover:text-white py-2"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-center bg-primary-600 text-white px-4 py-3 rounded-xl mt-2 glow cursor-pointer"
                >
                  Regístrate
                </Link>
              </>
            )}
          </div>
        </motion.div>
      )}
    </header>
  );
}
