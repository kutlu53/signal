// V1/G1 — Mind map: a centre idea with branches around it; word cards fall into the pool, the player taps a card then the branch
// it belongs to. Wrong → the card shakes and stays. step.center, step.branches: [{ id, label }], step.cards: [{ text, b }]
import { el, wait } from '../engine/ui.js';

const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);

export async function run(step, ctx) {
  const { ui, audio } = ctx; ui.clear();
  const box = el('div', 'mindmap'), map = el('div', 'map'), pool = el('div', 'pool'); box.append(map, pool); ui.add(box);
  const n = step.branches.length, R = 36; // % radius
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('preserveAspectRatio', 'none'); map.appendChild(svg);
  const zones = {};
  step.branches.forEach((b, i) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2, x = 50 + Math.cos(a) * R, y = 50 + Math.sin(a) * R * .9;
    const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line'); ln.setAttribute('x1', 50); ln.setAttribute('y1', 50); ln.setAttribute('x2', x); ln.setAttribute('y2', y); svg.appendChild(ln);
    const z = el('div', 'branch'); z.style.left = `${x}%`; z.style.top = `${y}%`; z.dataset.b = b.id; z.append(el('div', 'bl', ctx.tpl(b.label)), el('div', 'items')); map.appendChild(z); zones[b.id] = z;
  });
  const c = el('div', 'center', ctx.tpl(step.center)); map.appendChild(c);
  let selected = null, left = step.cards.length;
  shuffle(step.cards).forEach((card, i) => {
    const e = el('div', 'evcard', ctx.tpl(card.text)); e.dataset.b = card.b; e.style.setProperty('--r', `${(i % 5 - 2) * 1.5}deg`); e.style.animationDelay = `${i * .05}s`;
    e.onclick = () => { if (e.parentElement !== pool) return; if (selected) selected.classList.remove('sel'); selected = e; e.classList.add('sel'); audio.speak(e.textContent, step.who || 'mei'); Object.values(zones).forEach(z => z.classList.add('hot')); };
    pool.appendChild(e);
  });
  await new Promise(res => Object.values(zones).forEach(z => z.onclick = () => {
    if (!selected) return; const card = selected;
    if (card.dataset.b === z.dataset.b) { z.querySelector('.items').appendChild(card); card.classList.remove('sel'); selected = null; audio.blip(); Object.values(zones).forEach(x => x.classList.remove('hot')); if (--left === 0) { Object.values(zones).forEach(x => x.classList.add('ok')); audio.chime(); setTimeout(res, 1500); } }
    else { audio.blip(true); card.style.animation = 'shake .3s'; setTimeout(() => card.style.animation = '', 350); }
  }));
}
