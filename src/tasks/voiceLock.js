// P1/S — Voice Lock: say the phrase, the waveform matches, the door opens.
// Uses Web Speech API recognition when available; otherwise a mic-level fallback (hold and speak).
import { el, wait } from '../engine/ui.js';

const norm = s => s.toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean);
function similarity(a, b) { const A = norm(a), B = new Set(norm(b)); if (!A.length) return 0; return A.filter(w => B.has(w)).length / A.length; }

export async function run(step, ctx) {
  const { ui, audio, bg } = ctx; ui.clear();
  const phrase = ctx.tpl(step.phrase);
  const box = el('div', 'voice'); const ph = el('div', 'phrase', `“${phrase}”`); const mic = el('div', 'mic', '🎙'); const state = el('div', 'state', 'tap and speak'); const heard = el('div', 'heard', '');
  box.append(ph, mic, state, heard); ui.add(box);
  mic.onclick = () => audio.speak(phrase, 'echo'); // first tap plays the model once
  await audio.speak(phrase, 'echo');

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let tries = 0; const maxTries = step.tries || 3;
  const success = async () => { heard.style.color = 'var(--signal)'; state.textContent = 'match'; bg.setSignal(1); audio.chime(); await wait(1400); bg.setSignal(0); };

  if (SR) {
    while (true) {
      state.textContent = 'tap · speak'; mic.classList.remove('live');
      const text = await new Promise(res => {
        mic.onclick = () => {
          const r = new SR(); r.lang = 'en-GB'; r.interimResults = false; r.maxAlternatives = 3;
          mic.classList.add('live'); state.textContent = 'listening'; heard.textContent = '';
          r.onresult = e => res([...e.results[0]].map(a => a.transcript).join(' | '));
          r.onerror = () => res(''); r.onend = () => setTimeout(() => res(''), 50);
          try { r.start(); } catch { res(''); }
        };
      });
      mic.onclick = null; tries++;
      const best = text.split(' | ').reduce((m, t) => Math.max(m, similarity(phrase, t)), 0);
      heard.textContent = text.split(' | ')[0] || '…';
      if (best >= (step.threshold || 0.6)) { await success(); return; }
      audio.blip(true); state.textContent = tries >= maxTries ? 'the lock gives in…' : 'try again';
      if (tries >= maxTries) { await wait(900); await success(); return; } // never block the story
      await wait(600);
    }
  }

  // Fallback: hold the mic, speak for ~1.5 s of voice, lock opens.
  let stream; try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { state.textContent = 'no microphone · tap to continue'; mic.onclick = async () => { await success(); }; await new Promise(r => mic.addEventListener('click', r, { once: true })); return; }
  audio.start(); const src = audio.ctx.createMediaStreamSource(stream); const an = audio.ctx.createAnalyser(); an.fftSize = 512; src.connect(an); const buf = new Uint8Array(an.frequencyBinCount);
  state.textContent = 'hold · speak';
  await new Promise(res => {
    let voiced = 0, raf; const loop = () => { an.getByteTimeDomainData(buf); let s = 0; for (const v of buf) s += Math.abs(v - 128); const lv = s / buf.length; mic.style.setProperty('--lv', `${lv * 2}px`); if (lv > 6) voiced += 1 / 60; heard.textContent = '▮'.repeat(Math.min(20, Math.round(lv))); if (voiced > 1.5) { res(); return; } raf = requestAnimationFrame(loop); };
    mic.onpointerdown = () => { mic.classList.add('live'); voiced = 0; loop(); }; mic.onpointerup = mic.onpointerleave = () => { mic.classList.remove('live'); cancelAnimationFrame(raf); };
  });
  stream.getTracks().forEach(t => t.stop()); await success();
}
