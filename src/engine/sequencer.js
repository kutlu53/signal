// Runs a chapter: an ordered list of small steps. Content lives in JSON, not here.
import { wait, once } from './ui.js';
import * as brokenMessage from '../tasks/brokenMessage.js';
import * as evidenceBoard from '../tasks/evidenceBoard.js';
import * as voiceLock from '../tasks/voiceLock.js';
import * as interview from '../tasks/interview.js';
import * as journal from '../tasks/journal.js';
import * as sequence from '../tasks/sequence.js';
import * as signalGrid from '../tasks/signalGrid.js';
import * as note from '../tasks/note.js';
import * as whois from '../tasks/whois.js';
import * as composite from '../tasks/composite.js';
import * as match from '../tasks/match.js';
import * as family from '../tasks/family.js';
import * as floorplan from '../tasks/floorplan.js';
import * as stalls from '../tasks/stalls.js';
import * as tags from '../tasks/tags.js';
import * as mindmap from '../tasks/mindmap.js';
import * as body from '../tasks/body.js';
import * as thennow from '../tasks/thennow.js';
import * as route from '../tasks/route.js';
import * as shop from '../tasks/shop.js';
import * as link from '../tasks/link.js';
import * as orbit from '../tasks/orbit.js';

const TASKS = { broken_message: brokenMessage, evidence_board: evidenceBoard, voice_lock: voiceLock, interview, journal, sequence, signal_grid: signalGrid, note, whois, composite, match, family, floorplan, stalls, tags, mindmap, body, then_now: thennow, route, shop, link, orbit };

export async function runChapter(chapter, ctx) {
  const { ui, bg, audio, state } = ctx;
  const T = (s) => ctx.tpl(s);
  const scene = (s) => { if (s.vars) bg.vars = { ...bg.vars, ...s.vars }; if (s.preset) bg.set(s.preset); if (s.sfx) audio[s.sfx]?.(); if (s.signal != null) bg.setSignal(s.signal); if (s.rain != null) audio.rain(s.rain); if (s.static != null) audio.static(s.static); };

  for (const step of chapter.steps) {
    if (step.skipIf && state[step.skipIf]) continue; // e.g. name already known from an earlier episode
    switch (step.type) {
      case 'bg': scene(step); if (step.fadeIn) { await ui.fade(false); } break;
      case 'wait': await wait(step.ms); break;
      case 'sfx': audio[step.name]?.(); break;
      case 'fade': await ui.fade(step.on); break;

      case 'cold_open': {
        ui.clear(); ui.bars(true); const hint = ui.skipHint(); let skipped = false; hint.onclick = () => skipped = true;
        const skip = once(hint, 'click');
        for (const shot of step.shots) { if (skipped) break; scene(shot); await Promise.race([wait(shot.ms), skip]); }
        ui.bars(false); ui.clear(); break;
      }
      case 'title': await ui.title(step.text, step.sub, step.ms); break;
      case 'end': audio.rain(0); audio.static(0); bg.set('black'); bg.setSignal(0); ui.fade(false); await ui.endCard(step.label, step.text, step.ms || 5000); break;

      case 'say': await ui.balloon({ who: step.who, text: T(step.text), tr: T(step.tr || ''), expr: step.expr }); break;

      case 'choice': {
        let done = false;
        while (!done) {
          const i = await ui.choices({ who: step.who, text: T(step.text), tr: T(step.tr || ''), expr: step.expr }, step.options.map(o => ({ text: T(o.text), tr: T(o.tr || '') })));
          const o = step.options[i];
          await ui.balloon({ who: 'you', text: T(o.text), tr: T(o.tr || '') });
          if (o.ok === false) { audio.blip(true); if (o.reply) await ui.balloon({ who: o.reply.who || step.who, text: T(o.reply.text), tr: T(o.reply.tr || ''), expr: o.reply.expr }); }
          else { done = true; if (o.reply) await ui.balloon({ who: o.reply.who || step.who, text: T(o.reply.text), tr: T(o.reply.tr || ''), expr: o.reply.expr }); }
        }
        break;
      }

      case 'name_entry': {
        await ui.balloon({ who: step.who, text: T(step.text), tr: T(step.tr || '') });
        state.name = await ui.prompt("OK", "your name"); ctx.save?.(); break;
      }
      case 'flag_pick': {
        await ui.balloon({ who: step.who, text: T(step.text), tr: T(step.tr || '') });
        const c = await ui.cards(step.countries, it => `<div class="flag">${it.flag.startsWith('/') ? `<img src="${import.meta.env.BASE_URL}${it.flag.slice(1)}" alt="">` : it.flag}</div><div class="label">${it.name}</div>`);
        state.country = c.name; state.flag = c.flag; state.nationality = c.nat; state.language = c.lang; ctx.save?.();
        await ui.balloon({ who: 'you', text: T(step.say || "I'm from {country}."), tr: '' }); break;
      }

      default:
        if (TASKS[step.type]) { await TASKS[step.type].run(step, ctx); ui.clear(); }
        else console.warn('unknown step', step);
    }
  }
}
