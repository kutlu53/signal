// W/L4/R4 — Captain's Log: short journal with picture hints; a friend gives one-line feedback; revise or keep.
import { el } from '../engine/ui.js';

const sentences = t => (t.match(/[^.!?]+[.!?]/g) || []).length;

export async function run(step, ctx) {
  const { ui, audio, state } = ctx;
  let text = state.journal || '';
  while (true) {
    ui.clear();
    const sheet = el('div', 'sheet'); sheet.appendChild(el('div', 'title2', ctx.tpl(step.title || "Captain's log")));
    sheet.appendChild(el('div', 'hints', (step.hints || []).map(h => { h = ctx.tpl(h); return h.startsWith('/') ? `<img src="${h}" alt="">` : `<span>${h}</span>`; }).join('')));
    const ta = el('textarea'); ta.value = text; ta.placeholder = ctx.tpl(step.placeholder || "I'm …"); sheet.appendChild(ta);
    const row = el('div', 'row'); const send = el('button', 'btn', 'Send ▸'); const min = step.min || 2; send.disabled = sentences(ta.value) < min;
    ta.oninput = () => send.disabled = sentences(ta.value) < min; row.appendChild(send); sheet.appendChild(row); ui.add(sheet); ta.focus();
    await new Promise(r => send.onclick = r); text = ta.value.trim(); state.journal = text; audio.blip();

    // feedback: first rule whose "contains" words all appear (case-insensitive) wins
    const low = text.toLowerCase();
    const rule = (step.feedback || []).find(f => (f.contains || []).every(w => low.includes(w.toLowerCase()))) || { who: 'yasemin', text: 'Nice.' };
    const i = await ui.choices({ who: rule.who || 'yasemin', text: ctx.tpl(rule.text), tr: ctx.tpl(rule.tr || ''), expr: rule.expr }, [{ text: 'Keep it.', tr: 'Böyle kalsın.' }, { text: 'Let me fix it.', tr: 'Düzelteyim.' }]);
    if (i === 0) break;
  }
}
