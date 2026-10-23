// V1/R2 — Composite portrait ("robot resim"): witness clues on top; pick each feature until the face matches, the static clears.
// step.features: [{ key, label, values: [{ v, t }] }], step.target: spec, step.clues: [text], step.base: default spec.
// mode "reveal": the finished face with a name tag that flickers in letter by letter (cliffhanger).
import { el, wait } from '../engine/ui.js';
import { portraitSVG } from '../engine/portrait.js';

export async function run(step, ctx) {
  const { ui, audio, bg } = ctx; ui.clear();
  const box = el('div', 'composite' + (step.mode === 'reveal' ? ' reveal' : '')); ui.add(box);
  const face = el('div', 'face'), pic = el('div', 'pic'), stat = el('div', 'static'); face.append(pic, stat);

  if (step.mode === 'reveal') {
    pic.innerHTML = portraitSVG({ ...step.base, ...step.target }); stat.style.opacity = String(step.static ?? .3); box.appendChild(face);
    const tag = el('div', 'tag', ''); face.appendChild(tag); await wait(step.ms || 1500);
    const name = ctx.tpl(step.name || '');
    for (let i = 0; i < name.length; i++) { tag.textContent = name.slice(0, i + 1); audio.burst(250); bg.setSignal(0.3 + 0.7 * (i + 1) / name.length); await wait(step.letterMs || 260); }
    await wait(step.hold || 2200); return;
  }

  const clues = el('div', 'clues');
  (step.clues || []).forEach((c, i) => { const e = el('div', 'evcard', ctx.tpl(c)); e.style.setProperty('--r', `${(i % 3 - 1) * 1.5}deg`); e.onclick = () => audio.speak(ctx.tpl(c), step.who || 'mei'); clues.appendChild(e); });
  const feats = el('div', 'feats'), spec = {}, total = step.features.length;
  const render = () => { pic.innerHTML = portraitSVG({ ...step.base, ...spec }); const m = step.features.filter(f => spec[f.key] === step.target[f.key]).length; stat.style.opacity = String(1 - (m / total) * .92); return m; };
  box.append(clues, face, feats);
  await new Promise(res => {
    for (const f of step.features) {
      const row = el('div', 'feat'); row.appendChild(el('div', 'fl', f.label || f.key));
      for (const v of f.values) {
        const chip = el('button', 'chip', v.t || v.v);
        chip.onclick = () => {
          spec[f.key] = v.v; [...row.querySelectorAll('.chip')].forEach(c => c.classList.remove('on')); chip.classList.add('on'); audio.blip();
          if (render() === total) { feats.style.pointerEvents = 'none'; audio.chime(); bg.setSignal(.8); setTimeout(() => { bg.setSignal(0); res(); }, 1600); }
        };
        row.appendChild(chip);
      }
      feats.appendChild(row);
    }
    render();
  });
}
