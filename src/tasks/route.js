// V1/S — Route planner: a small city map; from A to B with transport options. Each option shows an icon and two short facts
// (a pro and a con); a character asks for the best one for a given need. The player picks; wrong picks get a one-line reply.
// step.rounds: [{ who, text, options: [{ id, ok?, reply? }] }], step.modes: [{ id, icon, name, pro, con }]
import { el, wait } from '../engine/ui.js';

export async function run(step, ctx) {
  const { ui, audio } = ctx; ui.clear(); const T = s => ctx.tpl(s || '');
  const box = el('div', 'routes'), ask = el('div', 'ask'), grid = el('div', 'modes'); box.append(ask, grid); ui.add(box);
  const cards = {};
  for (const m of step.modes) { const c = el('div', 'mode'); c.dataset.id = m.id; c.innerHTML = `<div class="ic">${m.icon}</div><div class="nm">${T(m.name)}</div><div class="pro">+ ${T(m.pro)}</div><div class="con">− ${T(m.con)}</div>`; grid.appendChild(c); cards[m.id] = c; }
  for (const round of step.rounds) {
    const who = round.who || step.who || 'leo';
    ask.innerHTML = ''; const listen = el('button', 'btn ghost', '▶'); ask.append(listen, el('div', 'line', T(round.text))); listen.onclick = () => audio.speak(T(round.text), who); audio.speak(T(round.text), who);
    let done = false;
    while (!done) {
      const pick = await new Promise(res => step.modes.forEach(m => cards[m.id].onclick = () => res(m.id)));
      Object.values(cards).forEach(c => c.onclick = null);
      const o = round.options.find(x => x.id === pick) || { ok: false };
      if (o.ok === false) { audio.blip(true); cards[pick].classList.add('bad'); setTimeout(() => cards[pick].classList.remove('bad'), 350); if (o.reply) { ask.innerHTML = ''; ask.appendChild(el('div', 'line', T(o.reply))); await audio.speak(T(o.reply), who); await wait(300); } ask.innerHTML = ''; ask.append(el('div', 'line', T(round.text))); }
      else { done = true; audio.blip(); cards[pick].classList.add('ok'); if (o.reply) { ask.innerHTML = ''; ask.appendChild(el('div', 'line', T(o.reply))); await audio.speak(T(o.reply), who); } await wait(600); cards[pick].classList.remove('ok'); }
    }
  }
  audio.chime(); await wait(900);
}
