// G1/P1 — Question tags: a sentence with a missing tag ("…, isn't it?"). Pick the tag from ≤3 options; the full line is then
// spoken (rising or falling intonation is practised by listening and repeating). step.items: [{ text, opts, a, who? }]
import { el, wait } from '../engine/ui.js';

const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);

export async function run(step, ctx) {
  const { ui, audio } = ctx; ui.clear();
  const box = el('div', 'tags'); if (step.title) box.appendChild(el('div', 'mtitle', ctx.tpl(step.title)));
  const line = el('div', 'line'), opts = el('div', 'opts'), prog = el('div', 'state', ''); box.append(line, opts, prog); ui.add(box);
  for (let i = 0; i < step.items.length; i++) {
    const it = step.items[i], who = it.who || step.who || 'yasemin', text = ctx.tpl(it.text);
    prog.textContent = `${i + 1} / ${step.items.length}`;
    line.innerHTML = text.replace('___', '<span class="gap active">…</span>'); opts.innerHTML = '';
    audio.speak(text.replace('___', ''), who);
    await new Promise(res => shuffle(it.opts).forEach(o => {
      const b = el('button', 'opt', o);
      b.onclick = () => {
        if (o === it.a) { audio.blip(); const g = line.querySelector('.gap'); g.textContent = o; g.classList.remove('active'); g.classList.add('solved'); [...opts.children].forEach(x => x.disabled = true); res(); }
        else { audio.blip(true); b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 400); }
      };
      opts.appendChild(b);
    }));
    await audio.speak(text.replace('___', it.a), who); await wait(500);
  }
  audio.chime(); await wait(1000);
}
