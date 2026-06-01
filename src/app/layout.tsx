import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hangover | Tu Marketplace de Nightlife & Fiestas",
  description: "Encuentra los mejores DJs, discotecas, servicios de barra y más. Construye tu evento perfecto con Hangover.",
};

import { createClient } from "@/lib/supabase/server";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let navUser = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile) {
      navUser = {
        email: user.email,
        type: profile.role
      };
    }
  }

  return (
    <html lang="es" className={`${inter.variable} ${outfit.variable} h-full dark`}>
      <body className="min-h-full flex flex-col font-sans bg-[#05050a] text-zinc-100">
        <Navbar user={navUser} />
        <main className="flex-grow pt-20">
          {children}
        </main>
      </body>
    </html>
  );
}
