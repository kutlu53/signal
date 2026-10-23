// DOM overlay: balloons, choices, cards, title cards. Everything is short and tappable.
import { charSVG, CHARS_ART } from './chars.js';

export const CHARS = {
  yasemin: { name: 'Yasemin', color: '#e2554f', init: 'Y' },
  omar: { name: 'Omar', color: '#f2b35b', init: 'O' },
  leo: { name: 'Leo', color: '#4fb36b', init: 'L' },
  mei: { name: 'Mei', color: '#8a7fe8', init: 'M' },
  echo: { name: 'Echo', color: '#38e8d8', init: '~' },
  staff: { name: 'Reception', color: '#9aa4b8', init: 'R' },
  leyla: { name: 'Leyla', color: '#d98a4f', init: 'L' },
  vendor: { name: 'Vendor', color: '#e8c872', init: 'V' },
  you: { name: 'You', color: '#ffffff', init: '•' },
};
const EXPR = { neutral: '', surprised: '😮', smile: '🙂', worried: '😟', excited: '✨', wink: '😉', think: '🤔' };

export function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
export const wait = ms => new Promise(r => setTimeout(r, ms));
export const once = (target, ev) => new Promise(r => target.addEventListener(ev, r, { once: true }));

export class UI {
  constructor(root, audio) { this.root = root; this.audio = audio; this.fadeEl = el('div', 'fade'); document.body.appendChild(this.fadeEl); }
  clear() { this.root.innerHTML = ''; }
  add(e) { this.root.appendChild(e); return e; }
  fade(on) { this.fadeEl.classList.toggle('on', on); return wait(900); }
  bars(on) { document.body.classList.toggle('bars', on); }

  // Small avatar in the balloon: the character's head (art) or an initial (echo, you).
  avatar(who, expr) {
    const c = CHARS[who] || CHARS.you; const a = el('div', 'avatar');
    a.style.border = `2px solid ${c.color}`; a.style.background = who === 'echo' ? 'transparent' : c.color + '33';
    if (CHARS_ART[who]) { a.classList.add('art'); a.innerHTML = charSVG(who, expr, '48 34 104 104'); }
    else { a.textContent = c.init; a.style.color = c.color; if (expr && EXPR[expr]) a.appendChild(el('span', 'expr', EXPR[expr])); }
    return a;
  }
  // Half-body portrait of the speaker at the left of the screen (visual-novel style). Cleared with the rest of the overlay.
  cast(who, expr) { if (!CHARS_ART[who]) return null; const e = el('div', 'cast'); e.innerHTML = charSVG(who, expr); return this.add(e); }

  // Show one balloon, speak it, wait for a tap (after speech starts). Resolves when dismissed.
  async balloon({ who = 'you', text, tr = '', expr = 'neutral', keep = false }) {
    this.clear(); this.cast(who, expr);
    const c = CHARS[who] || CHARS.you;
    const b = el('div', 'balloon' + (who === 'echo' ? ' echo' : ''));
    b.appendChild(this.avatar(who, expr));
    const body = el('div', 'body'); body.appendChild(el('div', 'who', c.name)); body.appendChild(el('div', 'text', text)); body.appendChild(el('div', 'tr', tr)); b.appendChild(body);
    b.appendChild(el('div', 'next', '▸')); this.add(b);
    const tapped = once(b, 'click');
    await Promise.race([this.audio.speak(text, who), tapped]);
    await tapped; this.audio.stopSpeech();
    if (!keep) this.clear();
  }

  // Short options under a balloon (balloon stays). Returns chosen option index.
  async choices(bal, options) {
    this.clear(); this.cast(bal.who, bal.expr);
    const c = CHARS[bal.who] || CHARS.you;
    const b = el('div', 'balloon' + (bal.who === 'echo' ? ' echo' : '')); b.style.cursor = 'default';
    b.appendChild(this.avatar(bal.who, bal.expr)); const body = el('div', 'body'); body.appendChild(el('div', 'who', c.name)); body.appendChild(el('div', 'text', bal.text)); body.appendChild(el('div', 'tr', bal.tr || '')); b.appendChild(body); this.add(b);
    const box = el('div', 'choices'); this.add(box);
    this.audio.speak(bal.text, bal.who);
    return new Promise(res => options.forEach((o, i) => { const btn = el('button', 'choice', `${o.text}<div class="tr">${o.tr || ''}</div>`); btn.style.animationDelay = `${i * .08}s`; btn.onclick = () => { this.audio.stopSpeech(); res(i); }; box.appendChild(btn); }));
  }

  async title(text, sub, ms = 3200) { this.clear(); const t = el('div', 'title'); t.appendChild(el('h1', '', text)); if (sub) t.appendChild(el('p', '', sub)); this.add(t); await wait(ms); this.clear(); }
  async endCard(label, text, ms = 4000) { this.clear(); const t = el('div', 'endcard'); t.appendChild(el('p', '', label)); t.appendChild(el('h2', '', text)); this.add(t); await wait(ms); }
  skipHint(text = 'tap to skip') { return this.add(el('div', 'skip', text)); }

  // Flag/country cards. Returns the chosen item.
  async cards(items, render) {
    this.clear(); const box = el('div', 'cards'); this.add(box);
    return new Promise(res => items.forEach((it, i) => { const c = el('div', 'card', render(it)); c.style.animationDelay = `${i * .05}s`; c.onclick = async () => { [...box.children].forEach(x => x.onclick = null); c.classList.add('picked'); this.audio.blip(); await wait(700); res(it); }; box.appendChild(c); }));
  }

  async prompt(label, placeholder = '') {
    this.clear(); const p = el('div', 'prompt'); const inp = el('input'); inp.placeholder = placeholder; inp.maxLength = 20; inp.autocomplete = 'off';
    const btn = el('button', 'btn', label); btn.disabled = true; inp.oninput = () => btn.disabled = inp.value.trim().length < 2; p.appendChild(inp); p.appendChild(btn); this.add(p); inp.focus();
    return new Promise(res => { const go = () => { if (!btn.disabled) { this.audio.blip(); res(inp.value.trim()); } }; btn.onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') go(); }; });
  }
}
