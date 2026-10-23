// Procedural half-body portraits (SVG) for the yearbook and composite-portrait tasks. Placeholder art until real illustrations arrive.
// spec: { hair: straight|wavy|curly|short|bald, hairColor: blond|brown|dark|red|grey, skin: fair|tan|dark|pale,
//         build: slim|medium|well-built|plump, height: short|medium|tall, age: young|middle-aged|elderly,
//         mood: cheerful|serious|shy|calm|moody, glasses: bool, shirt: css color }

const SKIN = { fair: '#f3d9c4', pale: '#f7ebe3', tan: '#d9a677', dark: '#7a4b2a' };
const HAIR = { blond: '#e8c872', brown: '#7a4a2a', dark: '#23201f', red: '#b5502a', grey: '#b8b8b8' };

function backHair(type, cx, cy, hw, color) {
  const l = cx - hw - 6, r = cx + hw + 6, top = cy - 14, bot = cy + 44;
  if (type === 'straight') return `<path d="M${l} ${top} L${r} ${top} L${r} ${bot} Q${cx} ${bot + 6} ${l} ${bot} Z" fill="${color}"/>`;
  if (type === 'wavy') {
    let d = `M${l} ${top} L${r} ${top}`;
    for (let y = top; y < bot; y += 10) d += ` Q${r + 6} ${y + 5} ${r} ${y + 10}`;
    d += ` L${l} ${bot}`;
    for (let y = bot; y > top; y -= 10) d += ` Q${l - 6} ${y - 5} ${l} ${y - 10}`;
    return `<path d="${d} Z" fill="${color}"/>`;
  }
  if (type === 'curly') { let s = ''; for (let y = top + 4; y < bot; y += 9) s += `<circle cx="${l + 2}" cy="${y}" r="7" fill="${color}"/><circle cx="${r - 2}" cy="${y}" r="7" fill="${color}"/>`; return s; }
  return '';
}

function topHair(type, cx, cy, hw, color) {
  if (type === 'bald') return `<path d="M${cx - hw - 1} ${cy - 4} Q${cx - hw + 2} ${cy - 18} ${cx - hw + 8} ${cy - 22} L${cx - hw + 2} ${cy - 2} Z M${cx + hw + 1} ${cy - 4} Q${cx + hw - 2} ${cy - 18} ${cx + hw - 8} ${cy - 22} L${cx + hw - 2} ${cy - 2} Z" fill="${color}"/>`;
  const cap = `<path d="M${cx - hw - 2} ${cy - 2} Q${cx - hw - 2} ${cy - 34} ${cx} ${cy - 32} Q${cx + hw + 2} ${cy - 34} ${cx + hw + 2} ${cy - 2} Q${cx + hw - 4} ${cy - 14} ${cx} ${cy - 16} Q${cx - hw + 4} ${cy - 14} ${cx - hw - 2} ${cy - 2} Z" fill="${color}"/>`;
  if (type === 'curly') { let s = cap; for (let a = -1.15; a <= 1.16; a += .38) s += `<circle cx="${(cx + Math.sin(a) * (hw + 2)).toFixed(1)}" cy="${(cy - 10 - Math.cos(a) * 24).toFixed(1)}" r="7" fill="${color}"/>`; return s; }
  if (type === 'wavy') return cap + `<path d="M${cx - hw - 2} ${cy - 2} Q${cx - hw - 6} ${cy + 6} ${cx - hw - 1} ${cy + 12} M${cx + hw + 2} ${cy - 2} Q${cx + hw + 6} ${cy + 6} ${cx + hw + 1} ${cy + 12}" stroke="${color}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  return cap;
}

export function portraitSVG(s = {}) {
  const skin = SKIN[s.skin] || SKIN.fair;
  const hair = s.age === 'elderly' ? HAIR.grey : (HAIR[s.hairColor] || HAIR.dark);
  const bw = { slim: 34, medium: 42, 'well-built': 54, plump: 58 }[s.build] || 42;
  const hw = s.build === 'plump' ? 26 : s.build === 'well-built' ? 25 : 23;
  const hy = { short: 18, medium: 9, tall: 0 }[s.height] ?? 9;
  const cx = 60, cy = 46 + hy, long = s.hair === 'straight' || s.hair === 'wavy' || s.hair === 'curly';
  let o = `<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg">`;
  o += `<path d="M${cx - bw} 150 Q${cx - bw} ${108 + hy} ${cx - 14} ${100 + hy} L${cx + 14} ${100 + hy} Q${cx + bw} ${108 + hy} ${cx + bw} 150 Z" fill="${s.shirt || '#3b5a8a'}"/>`;
  if (s.build === 'well-built') o += `<path d="M${cx - bw + 4} ${112 + hy} Q${cx - bw - 6} ${130 + hy} ${cx - bw} 150 M${cx + bw - 4} ${112 + hy} Q${cx + bw + 6} ${130 + hy} ${cx + bw} 150" stroke="${s.shirt || '#3b5a8a'}" stroke-width="10" fill="none"/>`;
  o += `<rect x="${cx - 8}" y="${cy + 26}" width="16" height="18" fill="${skin}"/>`;
  if (long) o += backHair(s.hair, cx, cy, hw, hair);
  o += `<ellipse cx="${cx}" cy="${cy}" rx="${hw}" ry="28" fill="${skin}"/>`;
  o += topHair(s.hair || 'short', cx, cy, hw, hair);
  // eyes
  o += `<circle cx="${cx - 9}" cy="${cy - 1}" r="2.4" fill="#222"/><circle cx="${cx + 9}" cy="${cy - 1}" r="2.4" fill="#222"/>`;
  // eyebrows by mood
  const eb = { moody: `M${cx - 14} ${cy - 10} L${cx - 4} ${cy - 7} M${cx + 14} ${cy - 10} L${cx + 4} ${cy - 7}`, serious: `M${cx - 14} ${cy - 8} L${cx - 4} ${cy - 8} M${cx + 4} ${cy - 8} L${cx + 14} ${cy - 8}`, shy: `M${cx - 14} ${cy - 7} Q${cx - 9} ${cy - 11} ${cx - 4} ${cy - 8} M${cx + 4} ${cy - 8} Q${cx + 9} ${cy - 11} ${cx + 14} ${cy - 7}` }[s.mood] || `M${cx - 14} ${cy - 8} Q${cx - 9} ${cy - 10} ${cx - 4} ${cy - 8} M${cx + 4} ${cy - 8} Q${cx + 9} ${cy - 10} ${cx + 14} ${cy - 8}`;
  o += `<path d="${eb}" stroke="#333" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  if (s.glasses) o += `<g fill="none" stroke="#222" stroke-width="1.5"><circle cx="${cx - 9}" cy="${cy - 1}" r="6.5"/><circle cx="${cx + 9}" cy="${cy - 1}" r="6.5"/><line x1="${cx - 2.5}" y1="${cy - 1}" x2="${cx + 2.5}" y2="${cy - 1}"/></g>`;
  // nose + mouth
  o += `<path d="M${cx} ${cy + 2} L${cx - 2} ${cy + 8} L${cx + 2} ${cy + 8}" stroke="#b08a74" stroke-width="1.2" fill="none"/>`;
  const mouth = { cheerful: `M${cx - 8} ${cy + 13} Q${cx} ${cy + 21} ${cx + 8} ${cy + 13}`, serious: `M${cx - 7} ${cy + 15} L${cx + 7} ${cy + 15}`, shy: `M${cx - 4} ${cy + 15} Q${cx} ${cy + 17} ${cx + 4} ${cy + 15}`, moody: `M${cx - 7} ${cy + 17} Q${cx} ${cy + 11} ${cx + 7} ${cy + 17}` }[s.mood] || `M${cx - 6} ${cy + 14} Q${cx} ${cy + 18} ${cx + 6} ${cy + 14}`;
  o += `<path d="${mouth}" stroke="#8a4a4a" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  if (s.age === 'middle-aged' || s.age === 'elderly') o += `<path d="M${cx - 16} ${cy + 4} Q${cx - 13} ${cy + 8} ${cx - 15} ${cy + 12} M${cx + 16} ${cy + 4} Q${cx + 13} ${cy + 8} ${cx + 15} ${cy + 12}" stroke="#b08a74" stroke-width="1.2" fill="none"/>`;
  if (s.age === 'elderly') o += `<path d="M${cx - 12} ${cy - 16} L${cx - 2} ${cy - 16} M${cx + 2} ${cy - 16} L${cx + 12} ${cy - 16} M${cx - 20} ${cy + 20} L${cx - 14} ${cy + 24} M${cx + 20} ${cy + 20} L${cx + 14} ${cy + 24}" stroke="#b08a74" stroke-width="1" fill="none"/>`;
  return o + '</svg>';
}
