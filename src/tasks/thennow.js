// G1/L2 — Then & Now: two photo frames (1996 / today). A line is spoken ("Grandma used to walk to school."); the player taps
// the frame it belongs to; the sentence is pinned under the frame. step.then / step.now = { label, icon }, step.items: [{ text, side }]
import { el, wait } from '../engine/ui.js';

const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);

export async function run(step, ctx) {
  const { ui, audio } = ctx; ui.clear();
  const who = step.who || 'yasemin';
  const box = el('div', 'thennow'), clue = el('div', 'clue'), frames = el('div', 'frames'); box.append(clue, frames); ui.add(box);
  const sides = {};
  for (const side of ['then', 'now']) { const f = el('div', 'frame'); f.dataset.side = side; f.append(el('div', 'photo', `<span>${step[side]?.icon || (side === 'then' ? '📻' : '📱')}</span>`), el('div', 'fl', ctx.tpl(step[side]?.label || side)), el('div', 'pins')); frames.appendChild(f); sides[side] = f; }
  for (const it of shuffle(step.items)) {
    const text = ctx.tpl(it.text);
    clue.innerHTML = ''; const listen = el('button', 'btn ghost', '▶'); clue.append(listen, el('div', 'line', text)); listen.onclick = () => audio.speak(text, who); audio.speak(text, who);
    Object.values(sides).forEach(f => f.classList.add('hot'));
    await new Promise(res => Object.values(sides).forEach(f => f.onclick = () => {
      if (f.dataset.side === it.side) { audio.stopSpeech(); audio.blip(); const p = el('div', 'evcard', text); p.style.setProperty('--r', `${(f.querySelector('.pins').children.length % 3 - 1) * 1.5}deg`); f.querySelector('.pins').appendChild(p); Object.values(sides).forEach(x => x.classList.remove('hot')); res(); }
      else { audio.blip(true); f.classList.add('bad'); setTimeout(() => f.classList.remove('bad'), 350); }
    }));
    Object.values(sides).forEach(f => f.onclick = null);
    await wait(500);
  }
  Object.values(sides).forEach(f => f.classList.add('ok')); audio.chime(); await wait(1300);
}
