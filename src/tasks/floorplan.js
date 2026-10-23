// V1/L2/G1 — Floor plan: rooms on a schematic plan; a line describes a room or what someone is doing there now, the player taps it,
// the room's name appears. step.rooms: [{ id, label, icon, area: "rowStart / colStart / rowEnd / colEnd" }], step.rounds: [{ text, target }].
// mode "reveal": all rooms labelled; after a wait an extra room that is not in the building appears (step.extra = { label, area }).
import { el, wait } from '../engine/ui.js';

export async function run(step, ctx) {
  const { ui, audio, bg } = ctx; ui.clear();
  const who = step.who || 'yasemin', reveal = step.mode === 'reveal';
  const box = el('div', 'planbox' + (reveal ? ' reveal' : '')), clue = el('div', 'clue'), plan = el('div', 'plan');
  plan.style.gridTemplateColumns = `repeat(${step.cols || 6}, 1fr)`; plan.style.gridTemplateRows = `repeat(${step.rowsN || 4}, 1fr)`;
  if (!reveal) box.appendChild(clue); box.appendChild(plan); ui.add(box);
  const rooms = {};
  for (const r of step.rooms) {
    const e = el('div', 'room' + (reveal ? ' ok' : '')); e.dataset.id = r.id; e.style.gridArea = r.area;
    e.append(el('div', 'ic', r.icon || ''), el('div', 'lb', reveal ? ctx.tpl(r.label) : '?')); plan.appendChild(e); rooms[r.id] = e;
  }
  if (reveal) {
    await wait(step.ms || 1800);
    const g = el('div', 'room ghost'); g.style.gridArea = step.extra.area; g.append(el('div', 'ic', step.extra.icon || '📻'), el('div', 'lb', ctx.tpl(step.extra.label || 'ROOM 0'))); plan.appendChild(g);
    audio.burst(700); bg.setSignal(.8); await wait(step.hold || 2600); bg.setSignal(.2); return;
  }
  for (const round of step.rounds) {
    const text = ctx.tpl(round.text);
    clue.innerHTML = ''; const listen = el('button', 'btn ghost', '▶'); clue.append(listen, el('div', 'line', text)); listen.onclick = () => audio.speak(text, who); audio.speak(text, who);
    await new Promise(res => Object.values(rooms).forEach(e => e.onclick = () => {
      if (e.classList.contains('ok')) return;
      if (e.dataset.id === round.target) { audio.stopSpeech(); audio.blip(); e.classList.add('ok'); const lb = ctx.tpl(step.rooms.find(r => r.id === round.target).label); e.querySelector('.lb').textContent = lb; audio.speak(lb, who); res(); }
      else { audio.blip(true); e.classList.add('bad'); setTimeout(() => e.classList.remove('bad'), 350); }
    }));
    Object.values(rooms).forEach(e => e.onclick = null);
    await wait(800);
  }
  audio.chime(); await wait(1200);
}
