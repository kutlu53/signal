// G1 — Evidence Board: heard sentences fall onto a board as cards; group them, the lock opens.
// Then a speed round: use the pattern without thinking (timer).
import { el, wait } from '../engine/ui.js';

const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);

export async function run(step, ctx) {
  const { ui, audio } = ctx; ui.clear();
  const board = el('div', 'board'); const pool = el('div', 'pool'); const zones = el('div', 'zones'); const lock = el('div', 'lock', '🔒');
  board.appendChild(pool); board.appendChild(zones); board.appendChild(lock); ui.add(board);
  const zoneEls = {};
  for (const g of step.groups) { const z = el('div', 'zone'); z.dataset.g = g.id; z.appendChild(el('div', 'zl', g.label)); zones.appendChild(z); zoneEls[g.id] = z; }
  let selected = null;
  const cards = shuffle(step.cards).map((c, i) => {
    const e = el('div', 'evcard', ctx.tpl(c.text)); e.dataset.g = c.g; e.style.setProperty('--r', `${(i % 5 - 2) * 1.5}deg`);
    e.onclick = () => { if (selected) selected.classList.remove('sel'); selected = e; e.classList.add('sel'); audio.speak(e.textContent, 'yasemin'); Object.values(zoneEls).forEach(z => z.classList.add('hot')); };
    pool.appendChild(e); return e;
  });
  // drop cards one by one with a small delay (they "fall" onto the board)
  cards.forEach((c, i) => { c.style.animation = 'none'; c.style.opacity = 0; setTimeout(() => { c.style.animation = ''; c.style.opacity = 1; }, 150 * i); });

  await new Promise(res => {
    Object.values(zoneEls).forEach(z => z.onclick = () => {
      if (!selected) return; z.appendChild(selected); selected.classList.remove('sel'); selected = null; audio.blip();
      Object.values(zoneEls).forEach(x => x.classList.remove('hot'));
      if (pool.children.length === 0) check();
    });
    function check() {
      const wrong = cards.filter(c => c.parentElement.dataset.g !== c.dataset.g);
      if (wrong.length === 0) { Object.values(zoneEls).forEach(z => z.classList.add('ok')); lock.textContent = '🔓'; lock.classList.add('open'); audio.chime(); setTimeout(res, 1600); }
      else { audio.blip(true); wrong.forEach(c => { c.classList.add('bad'); c.style.animation = 'shake .3s'; setTimeout(() => { c.style.animation = ''; pool.appendChild(c); }, 350); }); }
    }
  });

  // Speed round
  if (step.speed?.length) {
    ui.clear(); const box = el('div', 'broken'); const line = el('div', 'line'); const bar = el('div'); bar.style.cssText = 'height:4px;background:var(--signal);margin:14px auto 0;transition:width .1s linear;width:100%';
    const opts = el('div', 'opts'); box.appendChild(line); box.appendChild(bar); box.appendChild(opts); ui.add(box);
    let score = 0;
    for (const q of step.speed) {
      line.innerHTML = ctx.tpl(q.text).replace('___', '<span class="gap active"></span>'); opts.innerHTML = '';
      const limit = (q.ms || 7000); const t0 = performance.now(); let timer;
      const ok = await new Promise(res => {
        timer = setInterval(() => { const p = 1 - (performance.now() - t0) / limit; bar.style.width = `${Math.max(0, p) * 100}%`; if (p <= 0) res(false); }, 100);
        shuffle(q.opts).forEach(o => { const b = el('button', 'opt', o); b.onclick = () => res(o === q.a); opts.appendChild(b); });
      });
      clearInterval(timer);
      line.querySelector('.gap').textContent = q.a; line.querySelector('.gap').classList.add('solved');
      if (ok) { score++; audio.blip(); } else audio.blip(true);
      await wait(700);
    }
    ctx.state.speedScore = score;
  }
}
