// L2/V1 — Who's who: a friend describes a student in the yearbook (≤2 short lines, spoken); the player taps the right portrait.
// step.people: [{ id, name, spec, erased? }], step.rounds: [{ target: id, lines: [...] }]
import { el, wait } from '../engine/ui.js';
import { portraitSVG } from '../engine/portrait.js';

export async function run(step, ctx) {
  const { ui, audio } = ctx; ui.clear();
  const who = step.who || 'mei';
  const box = el('div', 'yearbook'), clue = el('div', 'clue'), page = el('div', 'page'); box.append(clue, page); ui.add(box);
  const cards = {};
  for (const p of step.people) {
    const c = el('div', 'yb' + (p.erased ? ' erased' : '')); c.dataset.id = p.id;
    c.append(el('div', 'pic', portraitSVG(p.spec)), el('div', 'tag', p.erased ? (p.name || '?') : '?'));
    page.appendChild(c); cards[p.id] = c;
  }
  for (const round of step.rounds) {
    const lines = round.lines.map(l => ctx.tpl(l));
    clue.innerHTML = ''; const listen = el('button', 'btn ghost', '▶'); clue.appendChild(listen); lines.forEach(l => clue.appendChild(el('div', 'line', l)));
    const say = async () => { for (const l of lines) { await audio.speak(l, who); await wait(150); } }; listen.onclick = say; say();
    await new Promise(res => Object.values(cards).forEach(c => c.onclick = () => {
      if (c.classList.contains('ok')) return;
      if (c.dataset.id === round.target) {
        audio.stopSpeech(); audio.blip(); c.classList.add('ok');
        c.querySelector('.tag').textContent = ctx.tpl(round.name || step.people.find(p => p.id === round.target)?.name || '');
        res();
      } else { audio.blip(true); c.classList.add('bad'); setTimeout(() => c.classList.remove('bad'), 350); }
    }));
    Object.values(cards).forEach(c => c.onclick = null);
    await wait(500);
  }
  audio.chime(); await wait(1200);
}
