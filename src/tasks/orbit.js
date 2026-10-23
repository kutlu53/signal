// V1/L2 — Orbit: the solar system with empty orbits; a clue is spoken ("The red planet, fourth from the Sun."), the player
// taps the right orbit slot, the planet appears and its name shows. step.planets: [{ id, name, icon, color, size }] in order,
// step.rounds: [{ text, target }]. mode "reveal": all planets shown, then an extra object appears beyond them (step.extra).
import { el, wait } from '../engine/ui.js';

export async function run(step, ctx) {
  const { ui, audio, bg } = ctx; ui.clear();
  const who = step.who || 'mei', reveal = step.mode === 'reveal';
  const box = el('div', 'orbit' + (reveal ? ' reveal' : '')), clue = el('div', 'clue'), sys = el('div', 'system'); if (!reveal) box.appendChild(clue); box.appendChild(sys); ui.add(box);
  const n = step.planets.length; sys.appendChild(el('div', 'sun', '☀️'));
  const slots = {};
  step.planets.forEach((p, i) => {
    const r = 12 + (i + 1) * (86 / (n + 1)); const ring = el('div', 'ring'); ring.style.width = `${r}%`; ring.style.height = `${r}%`; sys.appendChild(ring);
    const a = -Math.PI / 2 + i * 1.1; const s = el('div', 'pslot' + (reveal ? ' ok' : '')); s.dataset.id = p.id; s.style.left = `${50 + Math.cos(a) * r / 2}%`; s.style.top = `${50 + Math.sin(a) * r / 2}%`;
    const ball = el('div', 'planet', reveal ? '' : '?'); ball.style.setProperty('--c', p.color || '#8a8fa8'); ball.style.setProperty('--s', `${p.size || 22}px`); if (reveal) ball.style.background = p.color;
    s.append(ball, el('div', 'pl', reveal ? ctx.tpl(p.name) : '')); sys.appendChild(s); slots[p.id] = s;
  });
  if (reveal) {
    await wait(step.ms || 1800); const ex = step.extra || {}; const e = el('div', 'pslot extra'); e.style.left = '92%'; e.style.top = '14%'; const ball = el('div', 'planet', ex.icon || '📡'); ball.style.setProperty('--s', '30px'); e.append(ball, el('div', 'pl', ctx.tpl(ex.label || '?'))); sys.appendChild(e);
    audio.burst(700); bg.setSignal(.9); await wait(step.hold || 2600); bg.setSignal(.3); return;
  }
  for (const round of step.rounds) {
    const text = ctx.tpl(round.text);
    clue.innerHTML = ''; const listen = el('button', 'btn ghost', '▶'); clue.append(listen, el('div', 'line', text)); listen.onclick = () => audio.speak(text, who); audio.speak(text, who);
    await new Promise(res => Object.values(slots).forEach(s => s.onclick = () => {
      if (s.classList.contains('ok')) return;
      if (s.dataset.id === round.target) { audio.stopSpeech(); audio.blip(); const p = step.planets.find(x => x.id === round.target); s.classList.add('ok'); const b = s.querySelector('.planet'); b.textContent = ''; b.style.background = p.color; s.querySelector('.pl').textContent = ctx.tpl(p.name); audio.speak(ctx.tpl(p.name), who); res(); }
      else { audio.blip(true); s.classList.add('bad'); setTimeout(() => s.classList.remove('bad'), 350); }
    }));
    Object.values(slots).forEach(s => s.onclick = null);
    await wait(700);
  }
  audio.chime(); await wait(1200);
}
