// L2/R2 — Signal Grid: the class timetable on the board. Tap a slot to listen; find every slot where the signal crackles.
// mode "reveal": the timetable appears, then a row that does not exist on it (the cliffhanger).
import { el, wait } from '../engine/ui.js';

export async function run(step, ctx) {
  const { ui, audio, bg } = ctx; ui.clear();
  const days = step.days, hours = step.hours;
  const box = el('div', 'tt'), g = el('div', 'grid'); g.style.gridTemplateColumns = `auto repeat(${days.length}, 1fr)`;
  g.appendChild(el('div', 'hd', '')); days.forEach(d => g.appendChild(el('div', 'hd', d)));
  const cells = [];
  hours.forEach((row, r) => { g.appendChild(el('div', 'hr', row.time)); row.lessons.forEach((lesson, c) => { const cell = el('div', 'cell', ctx.tpl(lesson)); cell.dataset.r = r; cell.dataset.c = c; g.appendChild(cell); cells.push(cell); }); });
  const status = el('div', 'state', ''); box.append(g, status); ui.add(box);

  if (step.mode === 'reveal') {
    await wait(step.ms || 1800);
    const ex = step.extra; g.appendChild(el('div', 'hr ghost', ex.time || '??:??')); audio.burst(700);
    const ghosts = ex.cells.map(() => { const c = el('div', 'cell ghost', ''); g.appendChild(c); return c; });
    for (let i = 0; i < ghosts.length; i++) { await wait(ex.ms || 550); ghosts[i].textContent = ctx.tpl(ex.cells[i]); audio.burst(300); bg.setSignal(0.3 + 0.7 * (i + 1) / ghosts.length); }
    await wait(step.hold || 2200); return;
  }

  const hot = new Set();
  (step.signalRows || []).forEach(r => days.forEach((_, c) => hot.add(`${r},${c}`)));
  (step.signalCells || []).forEach(([r, c]) => hot.add(`${r},${c}`));
  let found = 0; const total = hot.size; status.textContent = `${found} / ${total}`;
  await new Promise(res => cells.forEach(cell => cell.onclick = () => {
    if (cell.classList.contains('hot')) return;
    if (hot.has(`${cell.dataset.r},${cell.dataset.c}`)) {
      cell.classList.add('hot'); audio.burst(600); bg.setSignal(0.6); setTimeout(() => bg.setSignal(0.1), 700);
      found++; status.textContent = `${found} / ${total}`;
      if (found === total) { audio.chime(); setTimeout(res, 1300); }
    } else { audio.blip(); audio.speak(cell.textContent, 'leo'); }
  }));
  bg.setSignal(0);
}
