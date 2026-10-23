// Character art: half-body SVG portraits with expressions, drawn in code.
// Style: graphic novel / anime-lite — bold soft ink outlines, flat fills, one cel-shade layer, limited palette
// (night blue ink, amber, turquoise signal). viewBox 0 0 200 260; pass a viewBox to crop (e.g. the head for avatars).

const INK = '#1a1f3a';
const SKIN = { fair: ['#f6dcc8', '#e3bfa6'], tan: ['#e3b58c', '#c9956a'], olive: ['#dcb892', '#bf9a70'], brown: ['#a8734d', '#8a5a3a'], dark: ['#7a4b2a', '#5e3a20'] };

export const CHARS_ART = {
  yasemin: { skin: 'olive', hair: '#2b1d1a', style: 'longwavy', top: '#e2554f', top2: '#f6f1ea', acc: 'headband' },
  omar:    { skin: 'brown', hair: '#1c1412', style: 'curly',    top: '#f2b35b', top2: '#2a2238', acc: 'hoodie' },
  leo:     { skin: 'tan',   hair: '#5a3a22', style: 'short',    top: '#4fb36b', top2: '#f6f1ea', acc: 'watch' },
  mei:     { skin: 'fair',  hair: '#1a1a22', style: 'bob',      top: '#8a7fe8', top2: '#f6f1ea', acc: 'pencil' },
  leyla:   { skin: 'brown', hair: '#2a1a14', style: 'bun',      top: '#d98a4f', top2: '#3a3a4a', acc: 'headset' },
  staff:   { skin: 'fair',  hair: '#b9bcc6', style: 'grey',     top: '#9aa4b8', top2: '#f6f1ea', acc: 'glasses' },
  vendor:  { skin: 'tan',   hair: '#3a2a1e', style: 'cap',      top: '#e8c872', top2: '#c23b3b', acc: 'apron' },
};

const S = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const shade = 'rgba(26,31,58,.18)';

function body(c) {
  const [skin, skin2] = SKIN[c.skin];
  let o = '';
  if (c.acc === 'hoodie') o += `<path d="M60 200 C60 170 80 160 100 160 C120 160 140 170 140 200 Z" fill="${c.top}" ${S}/>`;
  o += `<path d="M28 262 C28 206 58 190 100 188 C142 190 172 206 172 262 Z" fill="${c.top}" ${S}/>`;
  o += `<path d="M138 198 C160 208 168 232 170 262 L150 262 C150 238 146 216 138 198 Z" fill="${shade}"/>`;
  if (c.acc === 'apron') o += `<path d="M70 262 L70 215 Q100 205 130 215 L130 262 Z" fill="${c.top2}" ${S}/><path d="M86 215 L88 196 M114 215 L112 196" fill="none" ${S}/>`;
  else o += `<path d="M76 192 L100 222 L124 192 L121 262 L79 262 Z" fill="${c.top2}" ${S}/>`;
  if (c.acc === 'watch') o += `<rect x="150" y="238" width="18" height="14" rx="3" fill="#2a2238" ${S}/><circle cx="159" cy="245" r="4" fill="#38e8d8"/>`;
  if (c.acc === 'headset') o += `<path d="M140 150 Q150 185 128 196" fill="none" ${S}/><circle cx="128" cy="197" r="5" fill="#2a2238" ${S}/>`;
  // neck
  o += `<path d="M86 156 L86 196 L114 196 L114 156 Z" fill="${skin}" ${S}/><path d="M100 156 L114 156 L114 196 L100 196 Z" fill="${skin2}" opacity=".6"/>`;
  return o;
}

function hairBack(c) {
  const h = c.hair;
  switch (c.style) {
    case 'longwavy': return `<path d="M52 92 C40 120 34 160 40 205 C50 196 60 200 66 212 C72 196 80 194 86 206 L114 206 C120 194 128 196 134 212 C140 200 150 196 160 205 C166 160 160 120 148 92 C136 60 64 60 52 92 Z" fill="${h}" ${S}/>`;
    case 'bob': return `<path d="M50 100 C44 130 46 150 52 160 L148 160 C154 150 156 130 150 100 C140 58 60 58 50 100 Z" fill="${h}" ${S}/>`;
    case 'bun': return `<circle cx="150" cy="78" r="19" fill="${h}" ${S}/>`;
    default: return '';
  }
}

function hairFront(c) {
  const h = c.hair;
  switch (c.style) {
    case 'longwavy': return `<path d="M54 100 C50 70 70 46 100 46 C130 46 150 70 146 100 C140 84 128 78 118 90 C110 72 92 70 84 86 C76 78 62 84 54 100 Z" fill="${h}" ${S}/>` +
      (c.acc === 'headband' ? `<path d="M56 86 C70 72 130 72 144 86" fill="none" stroke="#e2554f" stroke-width="7" stroke-linecap="round"/><path d="M56 86 C70 72 130 72 144 86" fill="none" ${S} stroke-width="2"/>` : '');
    case 'curly': { let o = ''; const pts = [[58, 96], [62, 74], [76, 58], [96, 50], [116, 52], [134, 62], [144, 80], [146, 100]]; pts.forEach(([x, y]) => o += `<circle cx="${x}" cy="${y}" r="17" fill="${h}" ${S}/>`); o += `<path d="M64 94 C70 76 86 66 100 68 C116 66 132 76 138 94 C124 86 110 84 100 86 C90 84 76 86 64 94 Z" fill="${h}"/>`; return o; }
    case 'short': return `<path d="M54 102 C50 72 66 46 100 46 C132 46 150 68 146 98 C138 84 130 80 124 86 C118 74 104 70 92 76 C84 68 70 74 66 86 C60 88 56 94 54 102 Z" fill="${h}" ${S}/>`;
    case 'bob': return `<path d="M52 104 C48 68 70 46 100 46 C130 46 152 68 148 104 L138 104 C134 90 128 84 120 92 L112 84 C104 92 96 92 88 84 L80 92 C72 84 66 90 62 104 Z" fill="${h}" ${S}/>`;
    case 'bun': return `<path d="M54 100 C52 68 72 48 100 48 C128 48 148 68 146 100 C136 82 120 78 100 78 C80 78 64 82 54 100 Z" fill="${h}" ${S}/>` +
      (c.acc === 'headset' ? `<path d="M52 108 C50 66 150 66 148 108" fill="none" stroke="#2a2238" stroke-width="6" stroke-linecap="round"/><rect x="136" y="104" width="14" height="22" rx="5" fill="#2a2238" ${S}/>` : '');
    case 'grey': return `<path d="M56 100 C54 76 68 58 86 56 C98 50 112 50 124 58 C140 64 148 80 146 100 C136 86 124 82 112 90 C104 80 92 80 84 90 C74 84 62 90 56 100 Z" fill="${h}" ${S}/>`;
    case 'cap': return `<path d="M50 96 C50 60 150 60 150 96 Z" fill="${c.top2}" ${S}/><path d="M44 96 L160 96 C166 96 168 104 160 106 L44 106 C38 104 38 96 44 96 Z" fill="${c.top2}" ${S}/><path d="M52 104 C50 120 52 130 56 136 L62 104 Z M148 104 C150 120 148 130 144 136 L138 104 Z" fill="${h}" ${S}/>`;
  }
  return '';
}

function face(c, expr) {
  const [, skin2] = SKIN[c.skin];
  let o = '';
  const L = [80, 112], R = [120, 112];
  const eyeOpen = (x, y, rx = 9, ry = 10, dx = 0, dy = 0, ir = 6) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" ${S} stroke-width="2.5"/><circle cx="${x + dx}" cy="${y + dy + 1}" r="${ir}" fill="#2a2030"/><circle cx="${x + dx - 2}" cy="${y + dy - 2}" r="2" fill="#fff"/>`;
  const eyeHappy = (x, y) => `<path d="M${x - 10} ${y + 2} Q${x} ${y - 12} ${x + 10} ${y + 2}" fill="none" ${S}/>`;
  const brow = (x, y, tilt = 0, lift = 0) => `<path d="M${x - 12} ${y - 18 - lift + tilt} Q${x} ${y - 24 - lift} ${x + 12} ${y - 18 - lift - tilt}" fill="none" ${S} stroke-width="3.5"/>`;
  const blush = `<ellipse cx="70" cy="130" rx="8" ry="4" fill="#e2554f" opacity=".35"/><ellipse cx="130" cy="130" rx="8" ry="4" fill="#e2554f" opacity=".35"/>`;
  const nose = `<path d="M100 120 Q95 132 102 134" fill="none" ${S} stroke-width="2.5"/>`;
  switch (expr) {
    case 'surprised': o += eyeOpen(...L, 11, 13, 0, 0, 5) + eyeOpen(...R, 11, 13, 0, 0, 5) + brow(...L, 0, 8) + brow(...R, 0, 8) + nose + `<ellipse cx="100" cy="150" rx="7" ry="9" fill="#5a2a2a" ${S}/>` + `<path d="M150 70 L156 58 M160 78 L172 72" fill="none" ${S}/>`; break;
    case 'smile': o += eyeOpen(...L, 9, 8) + eyeOpen(...R, 9, 8) + brow(...L) + brow(...R) + nose + `<path d="M84 144 Q100 160 116 144" fill="none" ${S}/>` + blush; break;
    case 'worried': o += eyeOpen(...L) + eyeOpen(...R) + brow(...L, -5, 2) + brow(...R, 5, 2) + nose + `<path d="M88 150 Q94 144 100 150 Q106 156 112 150" fill="none" ${S}/>` + `<path d="M154 92 Q162 104 154 108 Q146 104 154 92 Z" fill="#38e8d8" ${S} stroke-width="2"/>`; break;
    case 'excited': o += eyeHappy(...L) + eyeHappy(...R) + brow(...L, 0, 6) + brow(...R, 0, 6) + nose + `<path d="M82 142 Q100 166 118 142 Z" fill="#5a2a2a" ${S}/><path d="M90 145 Q100 150 110 145" fill="#fff"/>` + blush + `<path d="M156 60 L160 70 L170 74 L160 78 L156 88 L152 78 L142 74 L152 70 Z" fill="#38e8d8"/><path d="M38 86 L40 92 L46 94 L40 96 L38 102 L36 96 L30 94 L36 92 Z" fill="#f2b35b"/>`; break;
    case 'wink': o += eyeHappy(...L) + eyeOpen(...R, 9, 9) + brow(...L, 0, 2) + brow(...R) + nose + `<path d="M84 144 Q104 162 118 146" fill="none" ${S}/>` + blush; break;
    case 'think': o += eyeOpen(...L, 9, 10, 3, -3) + eyeOpen(...R, 9, 10, 3, -3) + brow(...L, 0, 0) + brow(...R, 3, 8) + nose + `<path d="M90 150 L110 148" fill="none" ${S}/>` + `<circle cx="150" cy="80" r="3" fill="${INK}"/><circle cx="160" cy="68" r="4" fill="${INK}"/><circle cx="172" cy="54" r="5" fill="${INK}"/>`; break;
    default: o += eyeOpen(...L) + eyeOpen(...R) + brow(...L) + brow(...R) + nose + `<path d="M88 148 Q100 154 112 148" fill="none" ${S}/>`;
  }
  if (c.acc === 'glasses') o += `<g fill="none" ${S} stroke-width="2.5"><rect x="66" y="100" width="28" height="22" rx="8"/><rect x="106" y="100" width="28" height="22" rx="8"/><path d="M94 110 L106 110"/></g>`;
  if (c.style === 'cap') o += `<path d="M84 138 Q100 130 116 138 Q108 142 100 140 Q92 142 84 138 Z" fill="${c.hair}" ${S} stroke-width="2"/>`;
  if (c.style === 'grey') o += `<path d="M72 126 Q74 134 72 140 M128 126 Q126 134 128 140" fill="none" stroke="${skin2}" stroke-width="2"/>`;
  return o;
}

export function charSVG(id, expr = 'neutral', viewBox = '0 0 200 260') {
  const c = CHARS_ART[id]; if (!c) return '';
  const [skin, skin2] = SKIN[c.skin];
  const head = `<path d="M56 102 C56 150 78 170 100 170 C122 170 144 150 144 102 C144 62 124 48 100 48 C76 48 56 62 56 102 Z"`;
  return `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">` +
    body(c) + hairBack(c) +
    `<circle cx="56" cy="114" r="9" fill="${skin}" ${S}/><circle cx="144" cy="114" r="9" fill="${skin}" ${S}/>` +
    `${head} fill="${skin}" ${S}/>` +
    `<path d="M118 54 C140 64 146 96 140 126 C136 150 118 166 100 170 C118 160 128 140 128 110 C128 84 124 66 118 54 Z" fill="${skin2}" opacity=".55"/>` +
    face(c, expr) + hairFront(c) + '</svg>';
}

export const EXPRESSIONS = ['neutral', 'surprised', 'smile', 'worried', 'excited', 'wink', 'think'];
