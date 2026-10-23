// V1/G1 — Match: two columns (e.g. job ↔ workplace, job ↔ activity). Tap one on the left, then its partner on the right.
// step.pairs: [{ a, b }] (a = left, b = right); right column is shuffled. step.who = voice for the left items.
import { el, wait } from '../engine/ui.js';

const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);

export async function run(step, ctx) {
  const { ui, audio } = ctx; ui.clear();
  const box = el('div', 'match'); if (step.title) box.appendChild(el('div', 'mtitle', ctx.tpl(step.title)));
  const cols = el('div', 'cols'), L = el('div', 'col'), R = el('div', 'col'); cols.append(L, R); box.appendChild(cols); ui.add(box);
  const pairs = step.pairs.map((p, i) => ({ a: ctx.tpl(p.a), b: ctx.tpl(p.b), i }));
  let sel = null, done = 0;
  const left = pairs.map(p => { const c = el('div', 'mcard', p.a); c.dataset.i = p.i; c.onclick = () => { if (c.classList.contains('ok')) return; if (sel) sel.classList.remove('sel'); sel = c; c.classList.add('sel'); audio.speak(c.textContent, step.who || 'yasemin'); }; L.appendChild(c); return c; });
  await new Promise(res => shuffle(pairs).forEach(p => {
    const c = el('div', 'mcard', p.b); c.dataset.i = p.i;
    c.onclick = () => {
      if (!sel || c.classList.contains('ok')) return;
      if (c.dataset.i === sel.dataset.i) {
        audio.blip(); c.classList.add('ok'); sel.classList.add('ok'); sel.classList.remove('sel'); audio.speak(`${sel.textContent}. ${c.textContent}.`, step.who || 'yasemin'); sel = null; done++;
        if (done === pairs.length) { audio.chime(); setTimeout(res, 1500); }
      } else { audio.blip(true); c.classList.add('bad'); setTimeout(() => c.classList.remove('bad'), 350); }
    };
    R.appendChild(c);
  }));
}
