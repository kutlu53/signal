// Performance task — Interview recording: the player asks each question aloud, a friend answers,
// then the player answers too. One continuous audio recording; saved as a file for the teacher.
import { el, wait } from '../engine/ui.js';

export async function run(step, ctx) {
  const { ui, audio, state } = ctx; ui.clear();
  const box = el('div', 'interview'); const stp = el('div', 'step', ''); const q = el('div', 'q', ''); const btn = el('button', 'btn', '● Record'); const status = el('div', 'state', '');
  box.append(stp, q, btn, status); ui.add(box);
  q.innerHTML = ctx.tpl(step.title || "Interview · International School Day");
  await new Promise(r => btn.onclick = r);

  let rec = null, chunks = [], stream = null;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); rec = new MediaRecorder(stream); rec.ondataavailable = e => chunks.push(e.data); rec.start(); }
  catch { status.textContent = 'no microphone · practice mode'; }
  btn.textContent = 'Next ▸'; if (rec) stp.innerHTML = '<span class="rec"></span>recording';

  for (let i = 0; i < step.questions.length; i++) {
    const item = step.questions[i]; const total = step.questions.length;
    // 1) player asks
    stp.innerHTML = `${rec ? '<span class="rec"></span>' : ''}${i + 1} / ${total} · you ask`; q.textContent = ctx.tpl(item.q); btn.disabled = false;
    await new Promise(r => btn.onclick = r); btn.disabled = true;
    // 2) friend answers (spoken)
    stp.innerHTML = `${rec ? '<span class="rec"></span>' : ''}${i + 1} / ${total} · ${item.who} answers`; q.textContent = ctx.tpl(item.a);
    await audio.speak(ctx.tpl(item.a), item.who); await wait(300);
    // 3) player answers
    stp.innerHTML = `${rec ? '<span class="rec"></span>' : ''}${i + 1} / ${total} · now you`; q.textContent = ctx.tpl(item.you || item.q); btn.disabled = false;
    await new Promise(r => btn.onclick = r); btn.disabled = true;
  }

  if (rec) {
    await new Promise(r => { rec.onstop = r; rec.stop(); }); stream.getTracks().forEach(t => t.stop());
    const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' }); state.interviewBlob = blob;
    const url = URL.createObjectURL(blob); const a = el('a', 'btn', '⬇ Save recording'); a.href = url; a.download = `${step.file || "interview"}-${(state.name || 'student').replace(/\s+/g, '_')}.webm`;
    stp.textContent = 'done'; q.textContent = 'Saved for your teacher.'; btn.textContent = 'Continue ▸'; btn.disabled = false; box.insertBefore(a, btn);
  } else { stp.textContent = 'done'; q.textContent = 'Nice work.'; btn.textContent = 'Continue ▸'; btn.disabled = false; }
  await new Promise(r => btn.onclick = r);
}
