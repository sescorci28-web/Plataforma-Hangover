import Link from "next/link";
import { HelpCircle, ArrowLeft, Calendar, Building2, Sparkles, MessageSquare } from "lucide-react";

export default function AyudaPage() {
  return (
    <div className="relative min-h-screen bg-[#020205] text-zinc-100 overflow-hidden font-sans pb-16">
      {/* Background Neon Ambient Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-primary-950/10 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-indigo-950/10 rounded-full blur-[150px] mix-blend-screen" />
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-8 max-w-4xl pt-8 space-y-8">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-wider group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver al Inicio
        </Link>

        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-[10px] font-bold uppercase tracking-wider text-primary-400">
            <HelpCircle className="w-3.5 h-3.5 text-primary-400" />
            Soporte al Usuario
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-outfit uppercase">
            Centro de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-purple-500 to-indigo-500">
              Ayuda
            </span>
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-xl">
            ¿Tienes dudas sobre cómo funciona Hangover? Aquí encontrarás respuestas rápidas a las preguntas más frecuentes.
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-6 pt-4">
          {/* FAQ Item 1 */}
          <div className="glass-card rounded-3xl border border-white/5 bg-[#07070c]/50 p-6 sm:p-8 hover:border-white/10 transition-all shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
                <Calendar className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-white text-base sm:text-lg font-outfit uppercase">
                ¿Cómo comprar tickets?
              </h2>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Explora nuestra cartelera en la sección de <strong>Eventos</strong>, selecciona la fiesta que te interesa y haz clic en <strong>Comprar Entrada</strong>. Podrás elegir tus accesos, ingresar los datos de pago de forma 100% segura mediante nuestra pasarela encriptada y recibirás tus tickets inmediatamente con código QR en tu panel de control (sección Mi Cuenta).
            </p>
          </div>

          {/* FAQ Item 2 */}
          <div className="glass-card rounded-3xl border border-white/5 bg-[#07070c]/50 p-6 sm:p-8 hover:border-white/10 transition-all shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Building2 className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-white text-base sm:text-lg font-outfit uppercase">
                ¿Cómo reservar una mesa?
              </h2>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Ingresa a la sección de <strong>Discotecas</strong>, elige tu club nocturno preferido y presiona <strong>Reservar Mesa</strong>. Selecciona el plano interactivo de zonas, elige el número de mesa que prefieras, realiza el pago del depósito de consumo mínimo requerido y tu reserva quedará confirmada al instante en el sistema del club.
            </p>
          </div>

          {/* FAQ Item 3 */}
          <div className="glass-card rounded-3xl border border-white/5 bg-[#07070c]/50 p-6 sm:p-8 hover:border-white/10 transition-all shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-white text-base sm:text-lg font-outfit uppercase">
                ¿Cómo contratar un servicio?
              </h2>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Visita el catálogo de <strong>Servicios</strong> para buscar DJs, fotógrafos, iluminación, sonido, barras móviles y bartenders. Entra al perfil del profesional, revisa su portafolio multimedia y disponibilidad en el calendario, y haz clic en <strong>Solicitar Cotización</strong>. Tras detallar los datos de tu evento, recibirás la propuesta formal del proveedor para confirmarla.
            </p>
          </div>

          {/* FAQ Item 4 */}
          <div className="glass-card rounded-3xl border border-white/5 bg-[#07070c]/50 p-6 sm:p-8 hover:border-white/10 transition-all shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-white text-base sm:text-lg font-outfit uppercase">
                ¿Cómo contactar soporte?
              </h2>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Nuestro equipo de atención al cliente está disponible 24/7 para resolver cualquier inconveniente con tus tickets, reservas VIP o pagos. Puedes escribirnos directamente por correo electrónico a <a href="mailto:soporte@hangover.la" className="text-primary-400 hover:underline">soporte@hangover.la</a> o abrir un ticket de soporte interactivo desde la configuración de tu panel de usuario.
            </p>
          </div>
        </div>

        {/* Footer info card */}
        <div className="glass-card rounded-3xl border border-white/5 bg-gradient-to-r from-primary-950/20 to-indigo-950/20 p-6 text-center space-y-3">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">¿Aún tienes dudas?</h3>
          <p className="text-zinc-400 text-xs max-w-lg mx-auto leading-relaxed">
            Estamos comprometidos con brindarte la mejor experiencia para tu noche. Si tienes alguna solicitud particular de mesa VIP corporativa o problemas técnicos, escríbenos directamente.
          </p>
          <div className="pt-2">
            <a
              href="mailto:soporte@hangover.la"
              className="inline-flex justify-center items-center bg-white hover:bg-zinc-200 active:scale-95 text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
            >
              Contactar Soporte
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
