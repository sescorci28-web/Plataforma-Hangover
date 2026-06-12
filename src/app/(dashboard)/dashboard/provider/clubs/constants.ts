export interface ClubModule {
  id: string;
  label: string;
  description: string;
  category: 'recommended' | 'advanced';
}

export const CLUB_MODULES: ClubModule[] = [
  { id: 'reservations', label: 'Reservas de Mesa', description: 'Permite gestionar reservas de mesas VIP y generales.', category: 'recommended' },
  { id: 'covers', label: 'Venta de Cover', description: 'Vende entradas anticipadas y pases de acceso.', category: 'recommended' },
  { id: 'qr', label: 'Validación QR', description: 'Habilita la lectura de pases en portería mediante QR.', category: 'recommended' },
  { id: 'events', label: 'Eventos y Shows', description: 'Promociona y vende entradas para eventos especiales.', category: 'advanced' },
  { id: 'connect', label: 'Hangover Connect', description: 'Activa la red social interactiva en tiempo real del local.', category: 'advanced' },
  { id: 'orders', label: 'Pedidos desde Mesa', description: 'Habilita comanda y pago digital directo desde la mesa.', category: 'advanced' }
];

export interface WizardStep {
  id: string;
  label: string;
}

export const WIZARD_STEPS: WizardStep[] = [
  { id: 'general', label: 'Información General' },
  { id: 'multimedia', label: 'Identidad Visual' },
  { id: 'operation', label: 'Operación del Local' },
  { id: 'modules', label: 'Módulos de Negocio' },
  { id: 'preview', label: 'Vista Previa' }
];
