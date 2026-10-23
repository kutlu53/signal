import { Background } from './engine/bg.js';
import { Audio } from './engine/audio.js';
import { UI } from './engine/ui.js';
import { runChapter } from './engine/sequencer.js';

const bg = new Background(document.getElementById('stage'));
const audio = new Audio();
const ui = new UI(document.getElementById('ui'), audio);
// Player identity is remembered on the device so later episodes don't ask again (steps with "skipIf" are skipped).
const saved = (() => { try { return JSON.parse(localStorage.getItem('player') || '{}'); } catch { return {}; } })();
const state = { name: '', country: '', flag: '', ...saved };
const save = () => { try { localStorage.setItem('player', JSON.stringify({ name: state.name, country: state.country, flag: state.flag, nationality: state.nationality, language: state.language })); } catch {} };
const tpl = s => (s || '').replace(/\{(\w+)\}/g, (_, k) => state[k] ?? `{${k}}`);
const ctx = { bg, audio, ui, state, tpl, save };
window.signal = ctx; // debug hook: set scenes from the console, e.g. signal.bg.set('attic')

// HUD: Turkish subtitles + reduced motion (both remembered per device)
const sub = document.getElementById('btn-sub'), motion = document.getElementById('btn-motion');
const pref = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const setSub = on => { document.body.classList.toggle('sub', on); sub.classList.toggle('on', on); try { localStorage.setItem('sub', on ? '1' : '0'); } catch {} };
const setMotion = on => { document.body.classList.toggle('reduce', on); bg.reduce = on; motion.classList.toggle('on', on); try { localStorage.setItem('reduce', on ? '1' : '0'); } catch {} };
setSub(pref('sub', '0') === '1'); setMotion(pref('reduce', '0') === '1' || matchMedia('(prefers-reduced-motion: reduce)').matches);
sub.onclick = () => setSub(!document.body.classList.contains('sub'));
motion.onclick = () => setMotion(!document.body.classList.contains('reduce'));

const chapterId = new URLSearchParams(location.search).get('ch') || '01';
if (chapterId !== '01') { const n = Number(chapterId); document.querySelector('#start .tap').textContent = n > 8 ? `tap to begin · season 2 · episode ` : `tap to begin · episode `; }
// Shared classroom device: a saved player can be forgotten from the start screen.
const reset = document.getElementById("btn-reset");
if (state.name) { reset.hidden = false; reset.onclick = e => { e.stopPropagation(); try { localStorage.removeItem("player"); } catch {} location.href = location.pathname; }; }

document.getElementById('start').addEventListener('click', async function () {
  this.remove(); audio.start();
  if ('speechSynthesis' in window) await new Promise(r => { if (speechSynthesis.getVoices().length) r(); else { speechSynthesis.onvoiceschanged = r; setTimeout(r, 800); } });
  const chapter = await (await fetch(`${import.meta.env.BASE_URL}content/chapter-${chapterId}.json`)).json();
  await runChapter(chapter, ctx);
  await ui.fade(true);
  // chapter.next = id of the following episode; without it, back to the start.
  ui.clear(); location.href = chapter.next ? `${location.pathname}?ch=${chapter.next}` : location.pathname;
}, { once: true });

if (import.meta.env.PROD && 'serviceWorker' in navigator) navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js');
