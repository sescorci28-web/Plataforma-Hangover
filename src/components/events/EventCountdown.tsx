"use client";

import { useEffect, useState, useRef } from "react";
import { Timer } from "lucide-react";

interface EventCountdownProps {
  targetDate: string;
  variant?: "compact" | "detailed";
}

export function EventCountdown({ targetDate, variant = "compact" }: EventCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    status: 'waiting' | 'active' | 'ended';
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, status: 'waiting' });
  const [mounted, setMounted] = useState(false);
  
  const targetTimeRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
    
    if (!targetDate) {
      setTimeLeft(prev => ({ ...prev, status: 'ended' }));
      return;
    }

    let parsed = Date.parse(targetDate);
    if (isNaN(parsed)) {
      const formatted = targetDate.replace(" ", "T");
      parsed = Date.parse(formatted);
    }

    if (isNaN(parsed)) {
      console.warn("Invalid date format passed to EventCountdown:", targetDate);
      setTimeLeft(prev => ({ ...prev, status: 'ended' }));
      return;
    }

    targetTimeRef.current = parsed;

    const calculateTime = () => {
      const now = Date.now();
      const difference = targetTimeRef.current - now;

      // Event duration is assumed to be 6 hours
      const durationMs = 6 * 60 * 60 * 1000;

      if (difference <= 0) {
        if (Math.abs(difference) < durationMs) {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, status: 'active' });
        } else {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, status: 'ended' });
        }
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, status: 'waiting' });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const padZero = (n: number) => String(n).padStart(2, "0");

  if (!mounted) {
    if (variant === "compact") {
      return (
        <div className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/5 text-[11px] font-mono text-zinc-400">
          <Timer className="w-3.5 h-3.5 animate-pulse text-primary-400" />
          <span>--d : --h : --m : --s</span>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-md mx-auto text-center font-mono">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-2xl px-2 py-3 sm:px-3 sm:py-4 animate-pulse w-full min-w-0">
            <span className="block text-xl md:text-2xl font-bold text-zinc-500 leading-none">--</span>
            <span className="text-[9px] sm:text-[10px] text-zinc-650 uppercase tracking-wider block mt-1.5 leading-none">...</span>
          </div>
        ))}
      </div>
    );
  }

  if (timeLeft.status === 'active') {
    if (variant === "compact") {
      return (
        <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-[11px] font-semibold text-emerald-400 uppercase tracking-wider select-none shadow-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>🔥 Evento en curso</span>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center p-6 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl max-w-md mx-auto text-center w-full">
        <span className="text-sm font-black text-emerald-400 uppercase tracking-widest animate-pulse">🔥 Evento en curso</span>
      </div>
    );
  }

  if (timeLeft.status === 'ended') {
    if (variant === "compact") {
      return (
        <div className="inline-flex items-center gap-1.5 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 text-[11px] font-semibold text-rose-400 uppercase tracking-wider select-none shadow-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          <span>✅ Evento finalizado</span>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center p-6 border border-rose-500/20 bg-rose-500/5 rounded-2xl max-w-md mx-auto text-center w-full">
        <span className="text-sm font-black text-rose-400 uppercase tracking-widest">✅ Evento finalizado</span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="inline-flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-mono text-white select-none shadow-lg">
        <Timer className="w-3.5 h-3.5 text-primary-400 shrink-0" />
        <span>
          {timeLeft.days > 0 ? `${padZero(timeLeft.days)}d ` : ""}
          {padZero(timeLeft.hours)}h : {padZero(timeLeft.minutes)}m : {padZero(timeLeft.seconds)}s
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-md mx-auto text-center select-none font-mono">
      <div className="flex flex-col items-center justify-center bg-gradient-to-b from-white/10 to-white/0 border border-white/10 rounded-2xl px-2 py-3 sm:px-3 sm:py-4 backdrop-blur-md relative overflow-hidden group hover:border-primary-500/30 transition-all duration-300 w-full min-w-0">
        <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="block text-2xl sm:text-3xl font-extrabold text-white leading-none tracking-tight text-center select-none w-full">
          {padZero(timeLeft.days)}
        </span>
        <span className="text-[9px] sm:text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block mt-1.5 leading-none">Días</span>
      </div>
      <div className="flex flex-col items-center justify-center bg-gradient-to-b from-white/10 to-white/0 border border-white/10 rounded-2xl px-2 py-3 sm:px-3 sm:py-4 backdrop-blur-md relative overflow-hidden group hover:border-primary-500/30 transition-all duration-300 w-full min-w-0">
        <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="block text-2xl sm:text-3xl font-extrabold text-white leading-none tracking-tight text-center select-none w-full">
          {padZero(timeLeft.hours)}
        </span>
        <span className="text-[9px] sm:text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block mt-1.5 leading-none">Horas</span>
      </div>
      <div className="flex flex-col items-center justify-center bg-gradient-to-b from-white/10 to-white/0 border border-white/10 rounded-2xl px-2 py-3 sm:px-3 sm:py-4 backdrop-blur-md relative overflow-hidden group hover:border-primary-500/30 transition-all duration-300 w-full min-w-0">
        <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="block text-2xl sm:text-3xl font-extrabold text-white leading-none tracking-tight text-center select-none w-full">
          {padZero(timeLeft.minutes)}
        </span>
        <span className="text-[9px] sm:text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block mt-1.5 leading-none">Mins</span>
      </div>
      <div className="flex flex-col items-center justify-center bg-gradient-to-b from-white/10 to-white/0 border border-white/10 rounded-2xl px-2 py-3 sm:px-3 sm:py-4 backdrop-blur-md relative overflow-hidden group hover:border-primary-500/30 transition-all duration-300 w-full min-w-0">
        <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="block text-2xl sm:text-3xl font-extrabold text-white leading-none tracking-tight text-center select-none w-full">
          {padZero(timeLeft.seconds)}
        </span>
        <span className="text-[9px] sm:text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block mt-1.5 leading-none">Segs</span>
      </div>
    </div>
  );
}
