// L2/L3 — Routine Sequence: listen to a friend's day (up to 3 times), then put each routine card on its time.
// step.items are in the correct order: { icon, text, time, say }. Cards are shuffled; slots show only the time.
import { el, wait } from '../engine/ui.js';

const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);

export async function run(step, ctx) {
  const { ui, audio } = ctx; ui.clear();
  const who = step.who || 'leo', items = step.items, max = step.listens || 3;
  const box = el('div', 'seq'), line = el('div', 'timeline'), bar = el('div', 'bar'), pool = el('div', 'pool');
  const listen = el('button', 'btn ghost', '▶ listen'); bar.appendChild(listen); box.append(line, bar, pool); ui.add(box);
  const slots = items.map((it, i) => { const s = el('div', 'slot'); s.dataset.i = i; s.appendChild(el('div', 'time', it.time)); line.appendChild(s); return s; });

  let selected = null;
  shuffle(items.map((it, i) => ({ it, i }))).forEach(({ it, i }, k) => {
    const c = el('div', 'rcard', `<span class="ic">${it.icon || ''}</span><span>${ctx.tpl(it.text)}</span>`); c.dataset.i = i; c.style.animationDelay = `${k * .06}s`;
    c.onclick = () => { if (c.parentElement !== pool) return; if (selected) selected.classList.remove('sel'); selected = c; c.classList.add('sel'); audio.speak(ctx.tpl(it.text), who); slots.forEach(s => s.classList.toggle('hot', !s.classList.contains('ok'))); };
    pool.appendChild(c);
  });

  let plays = 0, speaking = false;
  const play = async () => {
    if (speaking) return; speaking = true; listen.disabled = true;
    for (const it of items) { await audio.speak(ctx.tpl(it.say || it.text), who); await wait(200); }
    plays++; speaking = false; listen.disabled = plays >= max; listen.textContent = plays >= max ? '▶ listen' : `▶ listen again · ${max - plays}`;
  };
  listen.onclick = play; await play();

  await new Promise(res => slots.forEach(s => s.onclick = () => {
    if (!selected || s.classList.contains('ok')) return;
    const c = selected;
    if (s.dataset.i === c.dataset.i) {
      s.appendChild(c); c.classList.remove('sel'); selected = null; s.classList.add('ok'); audio.blip(); slots.forEach(x => x.classList.remove('hot'));
      if (slots.every(x => x.classList.contains('ok'))) { audio.chime(); setTimeout(res, 1400); }
    } else { audio.blip(true); c.style.animation = 'shake .3s'; setTimeout(() => c.style.animation = '', 350); }
  }));
}
