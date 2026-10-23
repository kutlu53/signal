// V1/L2 — Body map: a half-body figure with hotspots; a line names a body part or a symptom ("My forehead hurts."),
// the player taps the right spot, the label appears. step.rounds: [{ text, target }]. Targets: forehead, eye, eyelash, nose,
// chin, ear, neck, shoulder, chest, stomach, arm, hand, wrist, elbow.
import { el, wait } from '../engine/ui.js';
import { charSVG } from '../engine/chars.js';

const SPOTS = { forehead: [50, 31], eye: [40, 43], eyelash: [60, 42], nose: [50, 49], chin: [50, 62], ear: [28, 44], neck: [50, 70], shoulder: [22, 78], chest: [50, 83], stomach: [50, 94], arm: [82, 84], elbow: [86, 90], wrist: [88, 97], hand: [92, 99] };

export async function run(step, ctx) {
  const { ui, audio } = ctx; ui.clear();
  const who = step.who || 'omar';
  const box = el('div', 'bodymap'), clue = el('div', 'clue'), fig = el('div', 'figure'); fig.innerHTML = charSVG(step.model || 'omar', step.expr || 'worried'); box.append(clue, fig); ui.add(box);
  const spots = {};
  for (const id of step.spots || Object.keys(SPOTS)) { const [x, y] = SPOTS[id]; const s = el('div', 'spot'); s.style.left = `${x}%`; s.style.top = `${y}%`; s.dataset.id = id; s.appendChild(el('div', 'lb', '')); fig.appendChild(s); spots[id] = s; }
  for (const round of step.rounds) {
    const text = ctx.tpl(round.text);
    clue.innerHTML = ''; const listen = el('button', 'btn ghost', '▶'); clue.append(listen, el('div', 'line', text)); listen.onclick = () => audio.speak(text, who); audio.speak(text, who);
    await new Promise(res => Object.values(spots).forEach(s => s.onclick = () => {
      if (s.classList.contains('ok')) return;
      if (s.dataset.id === round.target) { audio.stopSpeech(); audio.blip(); s.classList.add('ok'); s.querySelector('.lb').textContent = round.label || round.target; audio.speak(round.label || round.target, who); res(); }
      else { audio.blip(true); s.classList.add('bad'); setTimeout(() => s.classList.remove('bad'), 350); }
    }));
    Object.values(spots).forEach(s => s.onclick = null);
    await wait(700);
  }
  audio.chime(); await wait(1200);
}
