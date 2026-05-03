export const COLORS = {
  bg: '#1A1A2E',
  red: '#C0392B',
  gold: '#D4AF37',
  green: '#00713A',
  white: '#FFFFFF',
  goldLight: '#F0D060',
};

export const FONTS = {
  title: '"Playfair Display", serif',
  chinese: '"Noto Serif SC", serif',
  body: '"Source Sans 3", sans-serif',
};

// Timecodes in frames (30fps)
export const SCENES = {
  s1: { from: 0, duration: 240 },       // 0:00–0:08
  s2: { from: 240, duration: 660 },     // 0:08–0:30
  s3: { from: 900, duration: 900 },     // 0:30–1:00
  s4: { from: 1800, duration: 1350 },   // 1:00–1:45
  s5: { from: 3150, duration: 1050 },   // 1:45–2:20
  s6: { from: 4200, duration: 900 },    // 2:20–2:50
  s7: { from: 5100, duration: 600 },    // 2:50–3:10
};

export const TOTAL_FRAMES = 5700;
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const HANZI_CHARS = ['连接', '贸易', '法律', '桥梁', '商业', '投资', '合作', '发展'];

export const SERVICES = [
  { icon: '⚖️', pt: 'Direito Empresarial', zh: '商业法律' },
  { icon: '📦', pt: 'Importação & Exportação', zh: '进出口业务' },
  { icon: '🏢', pt: 'Estrutura Societária', zh: '公司架构' },
  { icon: '🤝', pt: 'Conexão Comercial', zh: '商业连接' },
  { icon: '🌏', pt: 'China Desk Especializado', zh: '专业中国业务部' },
];

export const CITIES = [
  { name: 'Campo Grande', x: 0.38, y: 0.62 },
  { name: 'São Paulo', x: 0.42, y: 0.68 },
  { name: 'Brasília', x: 0.44, y: 0.58 },
  { name: 'Fortaleza', x: 0.5, y: 0.5 },
];
