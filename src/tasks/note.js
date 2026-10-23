// R1-R3 — Note: a short reading object (note, message, poster; ≤60 words). Read it, then answer one question about a detail.
// The sheet stays on screen while the question is asked, so the player can scan it again.
// mode "reveal": typewriter lines appear one by one with static bursts (cliffhanger), no question.
import { el, wait } from '../engine/ui.js';

export async function run(step, ctx) {
  const { ui, audio, bg } = ctx; const T = s => ctx.tpl(s || '');

  if (step.mode === 'reveal') {
    ui.clear(); const s = el('div', 'sheet note reveal'); if (step.title) s.appendChild(el('div', 'title2', T(step.title))); const body = el('div', 'text'); s.appendChild(body); ui.add(s);
    await wait(step.ms || 1200);
    const lines = step.lines || [];
    for (let i = 0; i < lines.length; i++) {
      const line = el('div', ''); body.appendChild(line); const txt = T(lines[i]); audio.burst(300); bg.setSignal(0.2 + 0.7 * (i + 1) / lines.length);
      for (let k = 1; k <= txt.length; k++) { line.textContent = txt.slice(0, k); await wait(step.charMs || 35); }
      await wait(step.lineMs || 500);
    }
    await wait(step.hold || 2400); return;
  }

  const sheet = () => { const s = el('div', 'sheet note'); if (step.title) s.appendChild(el('div', 'title2', T(step.title))); s.appendChild(el('div', 'text', T(step.text))); return s; };
  ui.clear(); const first = sheet(); const row = el('div', 'row center'); const btn = el('button', 'btn', step.button || 'Read ▸'); row.appendChild(btn); first.appendChild(row); ui.add(first);
  await new Promise(r => btn.onclick = r); audio.blip();
  const q = step.question; if (!q) return;
  while (true) {
    const p = ui.choices({ who: q.who, text: T(q.text), tr: T(q.tr), expr: q.expr }, q.options.map(o => ({ text: T(o.text), tr: T(o.tr) })));
    ui.add(sheet());
    const o = q.options[await p];
    await ui.balloon({ who: 'you', text: T(o.text), tr: T(o.tr) });
    const reply = o.reply ? ui.balloon({ who: o.reply.who || q.who, text: T(o.reply.text), tr: T(o.reply.tr), expr: o.reply.expr }) : null;
    if (o.ok === false) { audio.blip(true); await reply; } else { await reply; return; }
  }
}
