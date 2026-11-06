/**
 * Fixed texts of the club, taken from the current website (github.com/DeividJulian/pagina_atletico_sucre).
 * Data that changes (fees, categories, schedule, venues, coaches, news, gallery) comes from the API instead.
 */

export const CLUB = {
  name: 'Club Atlético Sucre',
  nickname: 'Embajadores del Sur',
  city: 'Ipiales, Nariño',
  years: 15,
  ages: 'de 4 a 16 años',
  motto: 'Importa más el cómo se gana que el resultado',
  heart: 'En Atlético Sucre enseñamos de corazón a corazón',
  footerLine: 'Formando campeones dentro y fuera de la cancha',
};

export const ABOUT = {
  integralTitle: 'Formación integral',
  integral:
    'Procesos de entrenamiento para niñas y niños desde los 4 hasta los 16 años. Disciplina, valores y desarrollo ' +
    'deportivo con metodología profesional. Formamos técnica, táctica, mentalidad y carácter.',
  philosophyTitle: 'Nuestra filosofía',
  philosophy:
    'No solo formamos futbolistas, formamos personas íntegras. Nuestra identidad se basa en la unión, el respeto, ' +
    'la disciplina y la excelencia.',
  coachTitle: 'Coach de rendimiento',
  coach:
    'Además de ser formadores, nuestros profesores se convierten en verdaderos coach de entrenamiento: ejemplo de ' +
    'liderazgo, disciplina y ética. Diseñan entrenamientos estructurados, priorizan la salud física y emocional del ' +
    'deportista y fortalecen el sentido de pertenencia.',
};

export const PILLARS = [
  { icon: '👟', title: 'Técnica', text: 'Dominio del balón, pase, conducción y definición.' },
  { icon: '🧠', title: 'Táctica', text: 'Lectura del juego, posición y trabajo colectivo.' },
  { icon: '💪', title: 'Mentalidad', text: 'Disciplina, constancia y confianza en sí mismos.' },
  { icon: '❤️', title: 'Carácter', text: 'Respeto, juego limpio y sentido de familia.' },
];

export const VALUES = [
  { icon: '🤝', title: 'Juego limpio', text: 'Respeto total' },
  { icon: '👥', title: 'Somos un equipo', text: 'Unidos siempre' },
  { icon: '🔥', title: 'Entrega total', text: 'Dar el máximo' },
  { icon: '⏳', title: 'Proceso', text: 'Sobre el resultado' },
  { icon: '⭐', title: 'Mérito', text: 'Con disciplina' },
  { icon: '🛡️', title: 'Respeto', text: 'Base fundamental' },
];

export const FAMILY_DUTIES = [
  'Cumplir los horarios',
  'No intervenir tácticamente',
  'Conducta ejemplar',
  'Cumplir los compromisos administrativos',
  'Fomentar los valores del club',
  'Informar las condiciones médicas',
];

export interface Uniform {
  title: string;
  description: string;
  price: number;
  image: string;
}

export const UNIFORMS: Uniform[] = [
  { title: 'Uniforme principal', description: 'Camiseta y pantaloneta blancas', price: 50000, image: '/img/uniformes/uniforme_principal.jpg' },
  { title: 'Uniforme alternativo', description: 'Camiseta y pantaloneta rojas', price: 50000, image: '/img/uniformes/uniforme_alternativo.jpg' },
  { title: 'Entrenamiento', description: 'Camiseta y pantaloneta azules', price: 50000, image: '/img/uniformes/uniforme_entrenamiento.jpg' },
  { title: 'Portero', description: 'Uniforme para porteros', price: 50000, image: '/img/uniformes/uniforme_portero.jpg' },
  { title: 'Alternativo 2', description: 'Uniforme completo', price: 50000, image: '/img/uniformes/uniforme_alternativo_2.jpg' },
  { title: 'Mochila', description: 'Roja y negra', price: 40000, image: '/img/uniformes/mochila.jpg' },
];

export const ANDROID_STEPS = [
  'Toca "Descargar APK" desde tu celular Android (o escanea el código QR).',
  'Abre el archivo descargado. Si Android lo bloquea, toca "Configuración".',
  'Activa "Permitir de esta fuente" (orígenes desconocidos) para tu navegador.',
  'Vuelve atrás, toca "Instalar" y abre la app con tu correo y contraseña.',
];

export interface NavLink {
  fragment: string;
  label: string;
  /** Shorter text for the desktop bar; links without it are only in the mobile menu and the footer. */
  short?: string;
}

export const NAV_LINKS: NavLink[] = [
  { fragment: 'inicio', label: 'Inicio' },
  { fragment: 'nosotros', label: 'Nosotros', short: 'Nosotros' },
  { fragment: 'categorias', label: 'Categorías', short: 'Categorías' },
  { fragment: 'horarios', label: 'Horarios y sedes', short: 'Horarios' },
  { fragment: 'cuerpo-tecnico', label: 'Cuerpo técnico', short: 'Profesores' },
  { fragment: 'costos', label: 'Costos y uniformes', short: 'Costos' },
  { fragment: 'galeria', label: 'Galería', short: 'Galería' },
  { fragment: 'app', label: 'Descarga la app', short: 'App' },
  { fragment: 'contacto', label: 'Contacto', short: 'Contacto' },
];
