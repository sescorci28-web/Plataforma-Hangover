'use client';

import { useState } from 'react';
import { Calendar, MessageSquare } from 'lucide-react';
import { ServiceQuotationModal } from './ServiceQuotationModal';

interface ServiceProfileActionsProps {
  serviceId: string;
  providerId: string;
  serviceTitle: string;
  price: number;
  user: any;
}

export function ServiceProfileActions({
  serviceId,
  providerId,
  serviceTitle,
  price,
  user
}: ServiceProfileActionsProps) {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);

  const handleScrollToCalendar = () => {
    const calendarEl = document.getElementById('disponibilidad-calendario');
    if (calendarEl) {
      calendarEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setIsQuoteOpen(true)}
          className="bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold uppercase tracking-wider px-6 py-3.5 rounded-2xl transition-all cursor-pointer shadow-lg shadow-primary-500/15 transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5"
        >
          <MessageSquare className="w-4 h-4" />
          Solicitar Cotización
        </button>

        <button
          onClick={handleScrollToCalendar}
          className="bg-zinc-900 hover:bg-zinc-800 text-zinc-350 hover:text-white border border-white/5 hover:border-white/10 text-xs font-bold uppercase tracking-wider px-6 py-3.5 rounded-2xl transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Calendar className="w-4 h-4" />
          Ver Disponibilidad
        </button>
      </div>

      <ServiceQuotationModal
        serviceId={serviceId}
        providerId={providerId}
        serviceTitle={serviceTitle}
        price={price}
        user={user}
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
      />
    </>
  );
}
