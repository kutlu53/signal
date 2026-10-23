// G1 — Sentence link: two halves and a connector slot ("Solar energy is a resource ___ never runs out."). Pick the connector
// (which / who / that / so / because…) from ≤3 chips; the full sentence is spoken. step.items: [{ a, b, opts, ans }]
import { el, wait } from '../engine/ui.js';

const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);

export async function run(step, ctx) {
  const { ui, audio } = ctx; ui.clear();
  const who = step.who || 'leo';
  const box = el('div', 'link'); if (step.title) box.appendChild(el('div', 'mtitle', ctx.tpl(step.title)));
  const row = el('div', 'row'), opts = el('div', 'opts'), prog = el('div', 'state', ''); box.append(row, opts, prog); ui.add(box);
  for (let i = 0; i < step.items.length; i++) {
    const it = step.items[i], a = ctx.tpl(it.a), b = ctx.tpl(it.b);
    prog.textContent = `${i + 1} / ${step.items.length}`;
    row.innerHTML = ''; row.append(el('div', 'half', a), el('div', 'slot active', '…'), el('div', 'half', b)); opts.innerHTML = '';
    audio.speak(`${a}. ${b}`, who);
    await new Promise(res => shuffle(it.opts).forEach(o => {
      const c = el('button', 'chip', o);
      c.onclick = () => {
        if (o === it.ans) { audio.blip(); const s = row.querySelector('.slot'); s.textContent = o; s.classList.remove('active'); s.classList.add('on'); [...opts.children].forEach(x => x.disabled = true); res(); }
        else { audio.blip(true); c.classList.add('bad'); setTimeout(() => c.classList.remove('bad'), 400); }
      };
      opts.appendChild(c);
    }));
    await audio.speak(`${a} ${it.ans} ${b}`, who); await wait(500);
  }
  audio.chime(); await wait(1000);
}
