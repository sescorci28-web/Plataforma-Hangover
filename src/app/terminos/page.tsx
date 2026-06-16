import Link from "next/link";
import { FileText, ArrowLeft, ShieldCheck, Scale, AlertTriangle, AlertCircle } from "lucide-react";

export default function TerminosPage() {
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
            <FileText className="w-3.5 h-3.5 text-primary-400" />
            Acuerdo Legal
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-outfit uppercase">
            Términos de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-purple-500 to-indigo-500">
              Uso
            </span>
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm font-semibold uppercase tracking-wider">
            Última actualización: 12 de junio de 2026
          </p>
        </div>

        {/* Legal Sections */}
        <div className="space-y-6 pt-4 text-left">
          {/* Section 1 */}
          <div className="glass-card rounded-3xl border border-white/5 bg-[#07070c]/50 p-6 sm:p-8 hover:border-white/10 transition-all shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-white text-base sm:text-lg font-outfit uppercase">
                1. Uso de la Plataforma
              </h2>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Hangover provee un entorno digital para facilitar el descubrimiento de eventos, reserva de mesas VIP y contratación de servicios de entretenimiento. Al acceder, registrarte o usar la plataforma, declaras que tienes al menos 18 años de edad (o la mayoría de edad legal para consumir alcohol en tu jurisdicción) y aceptas quedar vinculado por estos Términos de Uso y nuestras políticas vigentes.
            </p>
          </div>

          {/* Section 2 */}
          <div className="glass-card rounded-3xl border border-white/5 bg-[#07070c]/50 p-6 sm:p-8 hover:border-white/10 transition-all shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Scale className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-white text-base sm:text-lg font-outfit uppercase">
                2. Responsabilidades del Usuario
              </h2>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Eres responsable de mantener la confidencialidad de las credenciales de tu cuenta y de toda actividad realizada bajo la misma. Queda estrictamente prohibido su uso para fines fraudulentos, reventa no autorizada de entradas, suplantación de identidad o interferencia técnica con los sistemas de la plataforma. Hangover se reserva el derecho de suspender permanentemente cualquier cuenta sospechosa.
            </p>
          </div>

          {/* Section 3 */}
          <div className="glass-card rounded-3xl border border-white/5 bg-[#07070c]/50 p-6 sm:p-8 hover:border-white/10 transition-all shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-white text-base sm:text-lg font-outfit uppercase">
                3. Política de Reembolsos
              </h2>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Todas las ventas de tickets y reservas de mesas son <strong>definitivas</strong>. Los reembolsos se emitirán únicamente bajo las siguientes circunstancias:
            </p>
            <ul className="list-disc list-inside text-zinc-400 text-xs sm:text-sm space-y-2 pl-4">
              <li>Cancelación total y definitiva del evento por parte del organizador.</li>
              <li>Modificación de la fecha original sin opción de reprogramación viable para el usuario.</li>
              <li>Errores de procesamiento duplicados en nuestra pasarela de pagos.</li>
            </ul>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Los depósitos de consumo mínimo para mesas VIP no son reembolsables en caso de inasistencia del usuario o denegación de acceso debido a infracción del código de vestimenta o conducta del local.
            </p>
          </div>

          {/* Section 4 */}
          <div className="glass-card rounded-3xl border border-white/5 bg-[#07070c]/50 p-6 sm:p-8 hover:border-white/10 transition-all shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-white text-base sm:text-lg font-outfit uppercase">
                4. Conducta en Eventos
              </h2>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              La adquisición de entradas o reservas no exime al usuario de cumplir con las normas internas, códigos de vestimenta y políticas de admisión que cada discoteca o local asociado aplique. Hangover y los organizadores locales colaboradores se reservan el derecho de admisión y expulsión de usuarios que muestren conductas violentas, vandálicas, de acoso, o bajo efectos de sustancias ilícitas durante el desarrollo de los eventos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
