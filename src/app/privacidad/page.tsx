import Link from "next/link";
import { Shield, ArrowLeft, Eye, Database, Info, Key } from "lucide-react";

export default function PrivacidadPage() {
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
            <Shield className="w-3.5 h-3.5 text-primary-400" />
            Privacidad & Protección
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-outfit uppercase">
            Política de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-purple-500 to-indigo-500">
              Privacidad
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
                <Eye className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-white text-base sm:text-lg font-outfit uppercase">
                1. Qué datos se recopilan
              </h2>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Recopilamos información personal básica necesaria para proveer el servicio y procesar transacciones. Esto incluye:
            </p>
            <ul className="list-disc list-inside text-zinc-400 text-xs sm:text-sm space-y-2 pl-4">
              <li>Información de registro (Nombre, dirección de correo electrónico, teléfono y ciudad).</li>
              <li>Información de transacción y facturación procesada mediante tokens seguros (no almacenamos tarjetas directamente).</li>
              <li>Datos de presencia y geolocalización en tiempo real al hacer uso de la función Hangover Connect (previo consentimiento).</li>
              <li>Archivos multimedia y perfiles subidos de forma voluntaria por los proveedores de servicios en la plataforma.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="glass-card rounded-3xl border border-white/5 bg-[#07070c]/50 p-6 sm:p-8 hover:border-white/10 transition-all shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Database className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-white text-base sm:text-lg font-outfit uppercase">
                2. Cómo se usan tus datos
              </h2>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Tus datos se utilizan con las siguientes finalidades:
            </p>
            <ul className="list-disc list-inside text-zinc-400 text-xs sm:text-sm space-y-2 pl-4">
              <li>Procesar reservas, tickets de eventos y contratos de servicios.</li>
              <li>Gestionar tu presencia en Hangover Connect para permitir la interacción en vivo con otros usuarios en el mismo recinto.</li>
              <li>Enviar notificaciones urgentes sobre tus reservas o cambios de último momento en eventos.</li>
              <li>Optimizar la seguridad de la plataforma previniendo fraudes y accesos no autorizados.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="glass-card rounded-3xl border border-white/5 bg-[#07070c]/50 p-6 sm:p-8 hover:border-white/10 transition-all shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Info className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-white text-base sm:text-lg font-outfit uppercase">
                3. Uso de Cookies
              </h2>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Utilizamos cookies técnicas de sesión y análisis para recordar tus preferencias de búsqueda, mantenerte autenticado de forma segura y recopilar estadísticas anónimas de rendimiento. Puedes desactivar el almacenamiento de cookies en los ajustes de tu navegador, aunque esto podría afectar el correcto funcionamiento de algunas secciones interactivas de Hangover.
            </p>
          </div>

          {/* Section 4 */}
          <div className="glass-card rounded-3xl border border-white/5 bg-[#07070c]/50 p-6 sm:p-8 hover:border-white/10 transition-all shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Key className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-white text-base sm:text-lg font-outfit uppercase">
                4. Derechos del Usuario
              </h2>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Tienes derecho a acceder, rectificar, limitar y solicitar la eliminación de tu información personal en cualquier momento. Para ejercer estos derechos o revocar el consentimiento del uso de datos de geolocalización o de perfil público de Connect, puedes enviar una solicitud formal por escrito a <a href="mailto:privacidad@hangover.la" className="text-primary-400 hover:underline">privacidad@hangover.la</a> detallando tu requerimiento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
