// V1/G1 — Shopping: shelves of items (countable / uncountable). A line asks for something ("We need some rice.");
// the player taps the right item, it goes into the trolley with the right quantity word. step.items: [{ id, icon, name, q }],
// step.rounds: [{ text, target }]. Wrong tap → shake. At the end the trolley reads the list aloud.
import { el, wait } from '../engine/ui.js';

export async function run(step, ctx) {
  const { ui, audio } = ctx; ui.clear();
  const who = step.who || 'omar';
  const box = el('div', 'shop'), clue = el('div', 'clue'), shelves = el('div', 'shelves'), trolley = el('div', 'trolley'); trolley.appendChild(el('div', 'tl', '🛒 ' + ctx.tpl(step.title || 'shopping list'))); box.append(clue, shelves, trolley); ui.add(box);
  const items = {};
  for (const it of step.items) { const e = el('div', 'item'); e.dataset.id = it.id; e.append(el('div', 'ic', it.icon), el('div', 'nm', ctx.tpl(it.name))); shelves.appendChild(e); items[it.id] = e; }
  const got = [];
  for (const round of step.rounds) {
    const text = ctx.tpl(round.text);
    clue.innerHTML = ''; const listen = el('button', 'btn ghost', '▶'); clue.append(listen, el('div', 'line', text)); listen.onclick = () => audio.speak(text, who); audio.speak(text, who);
    await new Promise(res => Object.values(items).forEach(e => e.onclick = () => {
      if (e.classList.contains('ok')) return;
      if (e.dataset.id === round.target) { audio.stopSpeech(); audio.blip(); e.classList.add('ok'); const it = step.items.find(i => i.id === round.target); const line = ctx.tpl(round.label || `${it.q} ${it.name}`); got.push(line); trolley.appendChild(el('div', 'evcard', `${it.icon} ${line}`)); audio.speak(line, who); res(); }
      else { audio.blip(true); e.classList.add('bad'); setTimeout(() => e.classList.remove('bad'), 350); }
    }));
    Object.values(items).forEach(e => e.onclick = null);
    await wait(700);
  }
  audio.chime(); await wait(1200);
}
