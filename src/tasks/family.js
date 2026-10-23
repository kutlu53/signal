// V1/L2 — Family tree: generations of cards; a line describes a relative ("Omar's mother's brother."), the player taps the person,
// the relation word appears on the card. step.rows: [[{ id, name, icon }]], step.rounds: [{ text, target, label }], step.who = voice.
import { el, wait } from '../engine/ui.js';

export async function run(step, ctx) {
  const { ui, audio } = ctx; ui.clear();
  const who = step.who || 'omar';
  const box = el('div', 'family'), clue = el('div', 'clue'), tree = el('div', 'tree'); box.append(clue, tree); ui.add(box);
  const cards = {};
  for (const row of step.rows) {
    const gen = el('div', 'gen');
    for (const p of row) { const c = el('div', 'fcard'); c.dataset.id = p.id; c.append(el('div', 'ic', p.icon || '🙂'), el('div', 'nm', ctx.tpl(p.name)), el('div', 'rel', p.rel ? ctx.tpl(p.rel) : '')); gen.appendChild(c); cards[p.id] = c; }
    tree.appendChild(gen);
  }
  for (const round of step.rounds) {
    const text = ctx.tpl(round.text);
    clue.innerHTML = ''; const listen = el('button', 'btn ghost', '▶'); clue.append(listen, el('div', 'line', text)); listen.onclick = () => audio.speak(text, who); audio.speak(text, who);
    await new Promise(res => Object.values(cards).forEach(c => c.onclick = () => {
      if (c.dataset.id === round.target) { audio.stopSpeech(); audio.blip(); c.classList.add('ok'); c.querySelector('.rel').textContent = ctx.tpl(round.label || ''); audio.speak(`${c.querySelector('.nm').textContent}. ${round.label || ''}`, who); res(); }
      else { audio.blip(true); c.classList.add('bad'); setTimeout(() => c.classList.remove('bad'), 350); }
    }));
    Object.values(cards).forEach(c => c.onclick = null);
    await wait(900);
  }
  audio.chime(); await wait(1200);
}
