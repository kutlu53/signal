// V1 — Broken Message: static-corrupted sentence; guess the missing word from context.
// step.text uses [word] for gaps; step.options maps word -> list of options; step.hints maps word -> emoji.
import { el, wait } from '../engine/ui.js';

const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);

export async function run(step, ctx) {
  const { ui, audio, bg } = ctx; ui.clear(); bg.setSignal(0.5); audio.static(0.6);
  const box = el('div', 'broken'); const line = el('div', 'line'); const opts = el('div', 'opts'); box.appendChild(line); box.appendChild(opts); ui.add(box);
  const gaps = [];
  ctx.tpl(step.text).split(/(\[[^\]]+\])/).forEach(part => {
    const m = part.match(/^\[(.+)\]$/);
    if (m) { const g = el('span', 'gap noise', m[1]); g.dataset.w = m[1]; line.appendChild(g); gaps.push(g); }
    else line.appendChild(document.createTextNode(part));
  });
  for (const g of gaps) {
    const word = g.dataset.w; g.classList.remove('noise'); g.classList.add('active'); g.textContent = '';
    opts.innerHTML = '';
    await new Promise(res => shuffle(step.options[word] || [word]).forEach(o => {
      const b = el('button', 'opt', `${step.hints?.[o] ? `<span>${step.hints[o]}</span>` : ''}${o}`);
      b.onclick = () => { if (o === word) { audio.blip(); g.textContent = word; g.classList.remove('active'); g.classList.add('solved'); res(); } else { audio.blip(true); b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 400); } };
      opts.appendChild(b);
    }));
  }
  opts.innerHTML = ''; audio.static(0.15); bg.setSignal(0.9);
  await audio.speak(line.textContent.replace(/\s+/g, ' '), 'echo');
  await wait(600); bg.setSignal(0.3);
}
