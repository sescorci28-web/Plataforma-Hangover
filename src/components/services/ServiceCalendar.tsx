'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from 'lucide-react';

interface AvailabilityItem {
  date: string;
  status: 'available' | 'booked' | 'blocked';
  notes?: string | null;
}

interface ServiceCalendarProps {
  serviceId: string;
  manualAvailability: AvailabilityItem[];
  bookings: string[]; // array of 'YYYY-MM-DD' dates
}

export function ServiceCalendar({ serviceId, manualAvailability, bookings }: ServiceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calendar generation helpers
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay(); // 0 is Sunday, 1 is Monday...

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month); // Day index for padding

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Map availability states
  const getDayStatus = (day: number) => {
    // Format date string to match YYYY-MM-DD in local time
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

    // 1. Check if date is in bookings
    if (bookings.includes(dateStr)) {
      return { status: 'booked', label: 'Reservado' };
    }

    // 2. Check if date has manual override
    const manualMatch = manualAvailability.find((item) => item.date === dateStr);
    if (manualMatch) {
      if (manualMatch.status === 'blocked') {
        return { status: 'blocked', label: 'No disponible' };
      }
      if (manualMatch.status === 'booked') {
        return { status: 'booked', label: 'Reservado' };
      }
    }

    // Default
    return { status: 'available', label: 'Disponible' };
  };

  // Grid items
  const calendarDays = [];
  
  // Padding for empty spots before first day of month
  // If firstDay is 0 (Sunday), we want 6 padding spots if we start on Monday, or 0 if we start on Sunday.
  // Let's align calendar to start on Monday for standard Latin representation
  // Monday = 1, Sunday = 0.
  const paddingCount = firstDay === 0 ? 6 : firstDay - 1;

  for (let i = 0; i < paddingCount; i++) {
    calendarDays.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="bg-zinc-950/40 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white font-outfit uppercase tracking-widest text-primary-400 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary-450" />
            Calendario de Disponibilidad
          </h2>
          <p className="text-zinc-400 text-xs mt-1">Revisa las fechas libres para planificar tu fiesta o evento.</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400" />
            <span className="text-zinc-450">Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-450" />
            <span className="text-zinc-450">Reservado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-800 border border-white/5 text-zinc-650" />
            <span className="text-zinc-450">No disponible</span>
          </div>
        </div>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white text-md font-outfit">
          {monthNames[month]} {year}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-zinc-300 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-zinc-300 transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 text-center">
        {/* Day Header Labels */}
        {dayLabels.map((lbl) => (
          <span key={lbl} className="text-[10px] font-black uppercase tracking-wider text-zinc-550 py-1">
            {lbl}
          </span>
        ))}

        {/* Calendar Day Slots */}
        {calendarDays.map((day, idx) => {
          if (day === null) {
            return <div key={`pad-${idx}`} className="aspect-square bg-transparent" />;
          }

          const { status, label } = getDayStatus(day);
          
          let dayStyle = "bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/10 text-emerald-400";
          if (status === 'booked') {
            dayStyle = "bg-rose-500/10 border-rose-500/20 text-rose-400 cursor-not-allowed";
          } else if (status === 'blocked') {
            dayStyle = "bg-zinc-900/40 border-white/5 text-zinc-600 cursor-not-allowed line-through";
          }

          return (
            <div
              key={`day-${day}`}
              title={`${day} de ${monthNames[month]} - ${label}`}
              className={`aspect-square rounded-2xl border flex flex-col items-center justify-center text-xs font-bold font-sans transition-all relative ${dayStyle}`}
            >
              <span>{day}</span>
              {/* Micro Status Dot */}
              <span className={`w-1 h-1 rounded-full absolute bottom-2 ${
                status === 'available' ? 'bg-emerald-500' :
                status === 'booked' ? 'bg-rose-500 animate-pulse' : 'bg-zinc-600'
              }`} />
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start gap-2.5 text-[11px] text-zinc-450">
        <Info className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Para contratar el servicio en una fecha <strong>Reservada</strong> o <strong>No disponible</strong>, por favor ponte en contacto directamente con el proveedor para consultar por montajes simultáneos o cambios de agenda.
        </p>
      </div>
    </div>
  );
}
