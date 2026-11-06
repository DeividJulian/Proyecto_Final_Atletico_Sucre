import { Player, PaymentRecord, AcademySettings } from '../types';

export const ATLETICO_SUCRE_DEFAULT_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" width="200" height="220">
  <defs>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#047857"/>
      <stop offset="50%" stop-color="#065f46"/>
      <stop offset="100%" stop-color="#022c22"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Stars at top -->
  <g fill="url(#goldGrad)">
    <polygon points="100,5 103,13 111,13 105,18 107,26 100,21 93,26 95,18 89,13 97,13"/>
    <polygon points="70,10 72,16 78,16 73,20 75,26 70,22 65,26 67,20 62,16 68,16" transform="scale(0.85) translate(15, 2)"/>
    <polygon points="130,10 132,16 138,16 133,20 135,26 130,22 125,26 127,20 122,16 128,16" transform="scale(0.85) translate(20, 2)"/>
  </g>

  <!-- Outer Shield Border -->
  <path d="M 100,28 L 175,48 C 175,135 145,180 100,212 C 55,180 25,135 25,48 Z" 
        fill="url(#goldGrad)" filter="url(#shadow)"/>

  <!-- Inner Shield -->
  <path d="M 100,34 L 168,52 C 168,131 140,173 100,204 C 60,173 32,131 32,52 Z" 
        fill="url(#shieldGrad)"/>

  <!-- Vertical White Stripes -->
  <path d="M 85,50 L 95,50 C 95,170 95,170 85,170 Z" fill="#ffffff" opacity="0.15"/>
  <path d="M 105,50 L 115,50 C 115,170 115,170 105,170 Z" fill="#ffffff" opacity="0.15"/>

  <!-- Club Name Ribbon / Arc Top -->
  <path d="M 38,62 Q 100,45 162,62 L 164,88 Q 100,72 36,88 Z" fill="#0f172a" stroke="url(#goldGrad)" stroke-width="1.5"/>
  <text x="100" y="78" font-family="'Impact', 'Arial Black', sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">
    ATLÉTICO SUCRE
  </text>

  <!-- Soccer Ball & Heart Centerpiece -->
  <g transform="translate(100, 126)">
    <!-- Ball circle -->
    <circle r="30" fill="#ffffff" stroke="#0f172a" stroke-width="2.5"/>
    <!-- Ball pentagons -->
    <polygon points="0,-10 9.5,-3 5.9,8 -5.9,8 -9.5,-3" fill="#0f172a"/>
    <line x1="0" y1="-10" x2="0" y2="-28" stroke="#0f172a" stroke-width="2"/>
    <line x1="9.5" y1="-3" x2="26" y2="-10" stroke="#0f172a" stroke-width="2"/>
    <line x1="5.9" y1="8" x2="18" y2="22" stroke="#0f172a" stroke-width="2"/>
    <line x1="-5.9" y1="8" x2="-18" y2="22" stroke="#0f172a" stroke-width="2"/>
    <line x1="-9.5" y1="-3" x2="-26" y2="-10" stroke="#0f172a" stroke-width="2"/>
    
    <!-- Red heart in the center ("De Corazón a Corazón") -->
    <g transform="translate(0, 0) scale(0.85)">
      <circle r="14" fill="#ffffff" stroke="#ef4444" stroke-width="2"/>
      <path d="M 0,5 C -8,-3 -10,-8 -5,-11 C -2,-13 0,-11 0,-8 C 0,-11 2,-13 5,-11 C 10,-8 8,-3 0,5 Z" 
            fill="#ef4444" transform="scale(1.1) translate(0, 2)"/>
    </g>
  </g>

  <!-- Bottom Slogan Ribbon -->
  <path d="M 46,168 Q 100,186 154,168 L 150,188 Q 100,205 50,188 Z" fill="#b91c1c" stroke="#ffffff" stroke-width="1"/>
  <text x="100" y="182" font-family="Arial, sans-serif" font-size="8.5" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">
    DE CORAZÓN A CORAZÓN
  </text>
</svg>
`)}`;

export const ATLETICO_SUCRE_REAL_LOGO = '/assets/aistudio/03caefd5-a1fd-4140-9f99-e95f36de3697_9ee162e8.JPG';

export const DEFAULT_ACADEMY_SETTINGS: AcademySettings = {
  name: 'Club de Fútbol Atlético Sucre',
  slogan: 'En Atlético Sucre enseñamos de corazón a corazón',
  logoUrl: ATLETICO_SUCRE_REAL_LOGO,
  directorName: 'Prof. Carlos Meneses',
  phone: '+57 312 456 7890',
  email: 'contacto@atleticosucre.com',
  address: 'Cancha Sintética Municipal, Ipiales - Nariño, Colombia',
  currencySymbol: '$',
  currencyCode: 'COP',
  defaultMonthlyFee: 130000,
  defaultDueDay: 5,
  directorPin: '1973',
  paymentInstructions: 'Las únicas cuentas avaladas son Cuenta Nequi 3188948054 a nombre de Nora Nallely Morán o puedes cancelar en efectivo en el sitio de entrenamiento.',
  bankAccounts: [
    {
      bankName: 'Nequi',
      accountType: 'Celular / Cuenta Digital',
      accountNumber: '3188948054',
      accountHolder: 'Nora Nallely Morán',
    },
    {
      bankName: 'Efectivo en Cancha',
      accountType: 'Presencial',
      accountNumber: 'En el sitio de entrenamiento',
      accountHolder: 'Dirección Oficial Atlético Sucre',
    },
  ],
};

// Generates an SVG voucher placeholder for demo receipts
export function generateDemoVoucherSvg(
  playerName: string,
  monthName: string,
  amount: number,
  ref: string,
  date: string,
  method: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750">
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="brand" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="600" height="750" fill="#f8fafc" rx="16"/>
    <!-- Top banner -->
    <rect width="600" height="150" fill="url(#grad1)" rx="16 16 0 0"/>
    <circle cx="300" cy="55" r="32" fill="#10b981" />
    <text x="300" y="66" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">✓</text>
    <text x="300" y="115" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">COMPROBANTE DE TRANSFERENCIA EXITOSA</text>
    <text x="300" y="136" font-family="Arial, sans-serif" font-size="12" fill="#94a3b8" text-anchor="middle">${method.toUpperCase()}</text>

    <!-- Body card -->
    <rect x="35" y="175" width="530" height="480" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" rx="12"/>

    <!-- Amount banner -->
    <text x="300" y="225" font-family="Arial, sans-serif" font-size="13" fill="#64748b" text-anchor="middle">MONTO TRANSFERIDO</text>
    <text x="300" y="265" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#0f172a" text-anchor="middle">$ ${amount.toLocaleString('es-CO')}</text>
    <line x1="60" y1="285" x2="540" y2="285" stroke="#f1f5f9" stroke-width="2"/>

    <!-- Details -->
    <text x="70" y="325" font-family="Arial, sans-serif" font-size="13" fill="#64748b">Concepto / Mensualidad</text>
    <text x="530" y="325" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="end">Mes de ${monthName}</text>

    <text x="70" y="365" font-family="Arial, sans-serif" font-size="13" fill="#64748b">Deportista</text>
    <text x="530" y="365" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="end">${playerName}</text>

    <text x="70" y="405" font-family="Arial, sans-serif" font-size="13" fill="#64748b">Academia Destino</text>
    <text x="530" y="405" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#059669" text-anchor="end">Club Atlético Sucre</text>

    <text x="70" y="445" font-family="Arial, sans-serif" font-size="13" fill="#64748b">Fecha de Operación</text>
    <text x="530" y="445" font-family="Arial, sans-serif" font-size="14" fill="#0f172a" text-anchor="end">${date}</text>

    <text x="70" y="485" font-family="Arial, sans-serif" font-size="13" fill="#64748b">Número de Aprobación</text>
    <text x="530" y="485" font-family="Arial, sans-serif" font-size="14" font-family="monospace" font-weight="bold" fill="#2563eb" text-anchor="end">${ref}</text>

    <text x="70" y="525" font-family="Arial, sans-serif" font-size="13" fill="#64748b">Medio de Pago</text>
    <text x="530" y="525" font-family="Arial, sans-serif" font-size="14" fill="#0f172a" text-anchor="end">${method}</text>

    <text x="70" y="565" font-family="Arial, sans-serif" font-size="13" fill="#64748b">Estado Bancario</text>
    <text x="530" y="565" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#10b981" text-anchor="end">Aprobada / Liquidada</text>

    <!-- Footer stamp -->
    <rect x="70" y="600" width="460" height="38" fill="#f0fdf4" stroke="#bbf7d0" rx="8"/>
    <text x="300" y="624" font-family="Arial, sans-serif" font-size="12" fill="#166534" font-weight="bold" text-anchor="middle">✓ Validado para registro en Club Deportivo Atlético Sucre</text>

    <text x="300" y="705" font-family="Arial, sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">Documento digital informativo generado como soporte de pago</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Initial data starts completely blank as requested by the academy
export const INITIAL_PLAYERS: Player[] = [];

export function buildInitialPayments(): PaymentRecord[] {
  return [];
}

