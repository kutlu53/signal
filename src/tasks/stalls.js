// L2/S/G1 — Night market stalls: tap a stall, the vendor speaks one line and asks a question (often "X or Y?"); the player answers
// from ≤3 options (ok:false options get a short reply and a retry). Each correct answer drops a clue card. All stalls → done.
// step.stalls: [{ id, icon, name, dish, line, q, options: [{ text, ok?, reply? }], clue }]
import { el, wait } from '../engine/ui.js';

export async function run(step, ctx) {
  const { ui, audio } = ctx; ui.clear(); const T = s => ctx.tpl(s || '');
  const who = step.who || 'vendor';
  const box = el('div', 'market'), row = el('div', 'stalls'), talk = el('div', 'vendor'), clues = el('div', 'clues'); box.append(row, talk, clues); ui.add(box);
  const cards = {};
  for (const s of step.stalls) { const c = el('div', 'stall'); c.dataset.id = s.id; c.append(el('div', 'ic', s.icon || '🏮'), el('div', 'nm', T(s.name)), el('div', 'dish', T(s.dish || ''))); row.appendChild(c); cards[s.id] = c; }
  let done = 0;
  while (done < step.stalls.length) {
    talk.innerHTML = ''; talk.appendChild(el('div', 'line muted', step.hint || 'tap a stall'));
    const s = await new Promise(res => step.stalls.forEach(st => { cards[st.id].onclick = () => { if (!cards[st.id].classList.contains('ok')) res(st); }; }));
    Object.values(cards).forEach(c => { c.onclick = null; c.classList.toggle('sel', c.dataset.id === s.id); });
    talk.innerHTML = ''; const line = el('div', 'line', T(s.line)); talk.appendChild(line); await audio.speak(T(s.line), who); await wait(200);
    let ok = false;
    while (!ok) {
      talk.innerHTML = ''; talk.appendChild(el('div', 'line', T(s.q))); const opts = el('div', 'opts'); talk.appendChild(opts); audio.speak(T(s.q), who);
      const o = await new Promise(res => s.options.forEach(op => { const b = el('button', 'choice', T(op.text)); b.onclick = () => res(op); opts.appendChild(b); }));
      audio.stopSpeech(); talk.innerHTML = ''; talk.appendChild(el('div', 'line you', T(o.text))); await audio.speak(T(o.text), 'you');
      if (o.ok === false) { audio.blip(true); if (o.reply) { talk.innerHTML = ''; talk.appendChild(el('div', 'line', T(o.reply.text))); await audio.speak(T(o.reply.text), who); await wait(300); } }
      else { ok = true; audio.blip(); if (o.reply) { talk.innerHTML = ''; talk.appendChild(el('div', 'line', T(o.reply.text))); await audio.speak(T(o.reply.text), who); } }
    }
    cards[s.id].classList.remove('sel'); cards[s.id].classList.add('ok'); done++;
    if (s.clue) { const e = el('div', 'evcard', T(s.clue)); e.style.setProperty('--r', `${((done % 3) - 1) * 2}deg`); clues.appendChild(e); audio.speak(T(s.clue), 'echo'); }
    await wait(900);
  }
  audio.chime(); await wait(1200);
}
