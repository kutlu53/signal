// Arena: individual quick rounds that reuse the story content. Points ("signal strength") and nicknames live on this device
// (localStorage key "arena"). Three games for the MVP: Static Blitz (V1), Spot the Mistake (G1), Sound Hunt (L2/L3).
import { Background } from '../engine/bg.js';
import { Audio } from '../engine/audio.js';
import { el, wait, CHARS } from '../engine/ui.js';
import { charSVG, CHARS_ART } from '../engine/chars.js';

const bg = new Background(document.getElementById('stage')); const audio = new Audio(); const root = document.getElementById('ui');
bg.vars = { radio: true, star: true }; bg.set('attic_sky'); bg.setSignal(.25);

const AV = ['🦊', '🐼', '🐸', '🦉', '🐯', '🐨', '🦋', '🐙', '🦄', '🐧', '🦁', '🐳'];
const GAMES = {
  blitz: { name: 'Static Blitz', icon: '📻', tag: 'V1 · words', limit: 8000, n: 10 },
  mistake: { name: 'Spot the Mistake', icon: '🔍', tag: 'G1 · grammar', limit: 9000, n: 10 },
  hunt: { name: 'Sound Hunt', icon: '👂', tag: 'L2 · L3 · listening', limit: 12000, n: 8 },
};
const WEEK = 7 * 24 * 3600 * 1000;
const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
const load = () => { try { return JSON.parse(localStorage.getItem('arena') || '{}'); } catch { return {}; } };
const data = load(); data.players ||= {}; const save = () => { try { localStorage.setItem('arena', JSON.stringify(data)); } catch {} };
let me = null;
const tpl = s => (s || '').replace(/\{(\w+)\}/g, (_, k) => ({ name: me?.nick || 'you', country: 'Türkiye', nationality: 'Turkish', language: 'Turkish', flag: '' })[k] ?? '');
const clear = () => { root.innerHTML = ''; };
const panel = () => { clear(); return root.appendChild(el('div', 'apanel')); };

// ---------- question pools from the chapters ----------
const pools = { blitz: [], mistake: [], hunt: [] };
async function loadContent() {
  for (let i = 1; i <= 24; i++) {
    const id = String(i).padStart(2, '0'); let ch; try { const r = await fetch(`${import.meta.env.BASE_URL}content/chapter-${id}.json`); if (!r.ok) break; ch = await r.json(); } catch { break; }
    for (const s of ch.steps) {
      if (s.type === 'broken_message') {
        const parts = s.text.split(/(\[[^\]]+\])/); const gaps = parts.filter(p => /^\[.+\]$/.test(p)).map(p => p.slice(1, -1));
        gaps.forEach(g => pools.blitz.push({ ch: id, text: parts.map(p => /^\[.+\]$/.test(p) ? (p.slice(1, -1) === g ? '___' : p.slice(1, -1)) : p).join(''), opts: s.options?.[g] || [g], a: g, hints: s.hints || {} }));
      }
      if (s.type === 'choice' && s.options?.length >= 3 && s.options.some(o => o.ok === false)) {
        pools.mistake.push({ ch: id, kind: 'pick', who: s.who, ctx: s.text, opts: s.options.map(o => ({ text: o.text, ok: o.ok !== false })) });
      }
      if (s.type === 'evidence_board' && s.speed) s.speed.forEach(q => pools.mistake.push({ ch: id, kind: 'fill', text: q.text, opts: q.opts, a: q.a }));
      if (s.type === 'note' && s.question && s.text) pools.hunt.push({ ch: id, kind: 'note', clip: s.text, q: s.question.text, opts: s.question.options.map(o => ({ text: o.text, ok: o.ok !== false })) });
      if (s.type === 'sequence' && s.items?.length >= 3) s.items.forEach(it => { if (it.say && it.time) { const others = shuffle(s.items.filter(x => x !== it)).slice(0, 2).map(x => x.time); pools.hunt.push({ ch: id, kind: 'time', who: s.who, clip: it.say, q: 'What time?', opts: shuffle([it.time, ...others]).map(t => ({ text: t, ok: t === it.time })) }); } });
      if (s.type === 'say' && CHARS_ART[s.who] && s.text.split(/\s+/).length >= 4 && !/\{/.test(s.text)) pools.hunt.push({ ch: id, kind: 'who', who: s.who, clip: s.text, q: 'Who is speaking?' });
    }
  }
}

// ---------- players & scores ----------
function player(nick) { return data.players[nick] ||= { nick, av: AV[Object.keys(data.players).length % AV.length], total: 0, best: {}, bestStreak: 0, history: [] }; }
function week(p) { const t0 = Date.now() - WEEK; return p.history.filter(h => h.t >= t0).reduce((s, h) => s + h.score, 0); }
function progress(p) { const h = p.history; if (h.length < 4) return null; const last = h.slice(-3), prev = h.slice(-6, -3); const avg = a => a.reduce((s, x) => s + x.score, 0) / a.length; return Math.round(avg(last) - avg(prev.length ? prev : h.slice(0, -3))); }

// ---------- screens ----------
function login() {
  const p = panel(); p.appendChild(el('h1', '', 'SIGNAL<small>arena</small>')); p.appendChild(el('div', 'sub', 'who is playing?'));
  const names = Object.keys(data.players);
  if (names.length) { const row = el('div', 'row'); names.forEach(n => { const c = el('div', 'pchip', `<span class="av">${data.players[n].av}</span>${n}`); c.onclick = () => { audio.start(); me = data.players[n]; menu(); }; row.appendChild(c); }); p.appendChild(row); p.appendChild(el('div', 'sub', 'or a new player')); }
  const inp = el('input'); inp.placeholder = 'nickname'; inp.maxLength = 14; inp.autocomplete = 'off'; const row = el('div', 'row'); row.appendChild(inp); p.appendChild(row);
  const picks = el('div', 'avpick'); let av = AV[names.length % AV.length]; AV.forEach(a => { const b = el('button', a === av ? 'on' : '', a); b.onclick = () => { av = a; [...picks.children].forEach(x => x.classList.remove('on')); b.classList.add('on'); }; picks.appendChild(b); }); p.appendChild(picks);
  const go = el('button', 'btn', 'Enter ▸'); go.disabled = true; inp.oninput = () => go.disabled = inp.value.trim().length < 2; inp.onkeydown = e => { if (e.key === 'Enter' && !go.disabled) go.click(); };
  go.onclick = () => { audio.start(); const nick = inp.value.trim(); me = player(nick); me.av = av; save(); audio.blip(); menu(); };
  const r2 = el('div', 'row'); r2.appendChild(go); p.appendChild(r2); inp.focus();
}

function menu() {
  const p = panel();
  const head = el('div', 'me'); head.appendChild(el('div', 'who', `<span class="av">${me.av}</span>${me.nick}`)); head.appendChild(el('div', 'pts', `${me.total}<small>SIGNAL</small>`)); p.appendChild(head);
  const g = el('div', 'games');
  for (const [id, G] of Object.entries(GAMES)) { const c = el('div', 'gcard'); c.append(el('div', 'ic', G.icon), el('div', 'nm', G.name), el('div', 'tg', G.tag), el('div', 'best', me.best[id] ? `best ${me.best[id]}` : `${pools[id].length} questions`)); c.onclick = () => play(id); g.appendChild(c); }
  p.appendChild(g);
  const row = el('div', 'row'); const lb = el('button', 'btn ghost small', '🏆 League'); lb.onclick = league; const sw = el('button', 'btn ghost small', '↺ switch player'); sw.onclick = () => { me = null; login(); }; row.append(lb, sw); p.appendChild(row);
}

async function play(id) {
  const G = GAMES[id]; const qs = shuffle(pools[id]).slice(0, G.n); let score = 0, correct = 0, streak = 0, best = 0;
  for (let i = 0; i < qs.length; i++) {
    const q = qs[i]; const p = panel();
    p.appendChild(el('div', 'qhead', `<span>${G.icon} ${G.name} · ${i + 1} / ${qs.length}</span><span class="streak">${streak >= 2 ? '🔥 ' + streak : ''}</span><span>${score}</span>`));
    const timer = el('div', 'timer'); const bar = el('i'); timer.appendChild(bar); p.appendChild(timer);
    const result = await ask(id, q, p, timer, bar, G.limit);
    if (result.ok) { correct++; streak++; best = Math.max(best, streak); const pts = 10 + Math.round(5 * result.left) + (streak % 3 === 0 ? 5 : 0); score += pts; audio.blip(); const gain = el('div', 'gain', `+${pts}`); document.body.appendChild(gain); setTimeout(() => gain.remove(), 1000); }
    else { streak = 0; audio.blip(true); }
    await wait(result.ok ? 700 : 1100);
  }
  me.total += score; me.best[id] = Math.max(me.best[id] || 0, score); me.bestStreak = Math.max(me.bestStreak, best); me.history.push({ t: Date.now(), game: id, score, correct, n: qs.length, streak: best }); save(); audio.chime();
  const p = panel(); const r = el('div', 'result'); r.append(el('div', 'stat', `${G.icon} ${G.name}`), el('div', 'big', String(score)), el('div', 'stat', `${correct} / ${qs.length} correct · best streak ${best}`));
  const pr = progress(me); if (pr != null) r.appendChild(el('div', 'stat up', pr >= 0 ? `▲ ${pr} vs. your last rounds` : `▼ ${-pr} vs. your last rounds`)); p.appendChild(r);
  const row = el('div', 'row'); const again = el('button', 'btn', 'Again ▸'); again.onclick = () => play(id); const lb = el('button', 'btn ghost', '🏆 League'); lb.onclick = league; const m = el('button', 'btn ghost', 'Menu'); m.onclick = menu; row.append(again, lb, m); p.appendChild(row);
}

// Renders one question into panel p; resolves { ok, left } (left = fraction of time remaining).
function ask(id, q, p, timer, bar, limit) {
  return new Promise(res => {
    let t0 = null, raf, done = false;
    const finish = (ok) => { if (done) return; done = true; cancelAnimationFrame(raf); audio.stopSpeech(); const left = t0 ? Math.max(0, 1 - (performance.now() - t0) / limit) : 0; res({ ok, left }); };
    const startTimer = () => { t0 = performance.now(); const tick = () => { const pct = Math.max(0, 1 - (performance.now() - t0) / limit); bar.style.width = `${pct * 100}%`; timer.classList.toggle('low', pct < .25); if (pct <= 0) { markAll(false); finish(false); } else raf = requestAnimationFrame(tick); }; tick(); };
    const opts = el('div', 'qopts'); let buttons = [];
    const markAll = (chosenOk, chosen) => { buttons.forEach(b => { b.disabled = true; if (b.dataset.ok === '1') b.classList.add('good'); }); if (chosen && !chosenOk) chosen.classList.add('bad'); };
    const addOpt = (html, ok) => { const b = el('button', 'qopt', html); b.dataset.ok = ok ? '1' : '0'; b.onclick = () => { if (done) return; markAll(ok, b); finish(ok); }; opts.appendChild(b); buttons.push(b); return b; };

    if (id === 'blitz') {
      p.appendChild(el('div', 'qtext mono', tpl(q.text).replace('___', '<span class="gap">…</span>')));
      opts.classList.add('wide'); shuffle(q.opts).forEach(o => addOpt(`${q.hints[o] ? `<span>${q.hints[o]}</span>` : ''}${o}`, o === q.a)); p.appendChild(opts); startTimer();
    } else if (id === 'mistake') {
      if (q.kind === 'fill') { p.appendChild(el('div', 'qtext', tpl(q.text).replace('___', '<span class="gap">…</span>'))); opts.classList.add('wide'); shuffle(q.opts).forEach(o => addOpt(o, o === q.a)); }
      else { const c = CHARS[q.who] || CHARS.you; p.appendChild(el('div', 'qctx', `<b>${c.name}:</b> ${tpl(q.ctx)}`)); p.appendChild(el('div', 'sub', 'tap the correct sentence')); shuffle(q.opts).forEach(o => addOpt(tpl(o.text), o.ok)); }
      p.appendChild(opts); startTimer();
    } else {
      const clip = el('div', 'clip'); const play = el('button', 'play', '▶'); const left = el('div', 'left', ''); clip.append(play, left); p.appendChild(clip);
      p.appendChild(el('div', 'qtext', q.q));
      if (q.kind === 'who') { const names = shuffle([q.who, ...shuffle(Object.keys(CHARS_ART).filter(k => k !== q.who)).slice(0, 2)]); names.forEach(n => addOpt(`<span class="av">${charSVG(n, 'neutral', '48 34 104 104')}</span>${CHARS[n].name}`, n === q.who)); }
      else shuffle(q.opts).forEach(o => addOpt(tpl(o.text), o.ok));
      p.appendChild(opts); buttons.forEach(b => b.disabled = true);
      let plays = 0; const max = 3; const voice = q.kind === 'note' ? 'staff' : (q.who || 'yasemin');
      const speak = async () => { if (plays >= max || play.classList.contains('live')) return; plays++; left.textContent = `${max - plays} replays`; play.classList.add('live'); await audio.speak(tpl(q.clip), voice); play.classList.remove('live'); if (!t0) { buttons.forEach(b => b.disabled = false); startTimer(); } };
      play.onclick = speak; speak();
    }
  });
}

function league() {
  const p = panel(); p.appendChild(el('h1', '', 'LEAGUE<small>this device</small>'));
  const tabs = el('div', 'tabs'), list = el('div', 'lb'); p.append(tabs, list);
  const views = {
    total: { label: 'Total', val: x => x.total, fmt: v => String(v) },
    week: { label: 'This week', val: x => week(x), fmt: v => String(v) },
    progress: { label: 'Progress', val: x => progress(x) ?? -Infinity, fmt: v => v === -Infinity ? 'new' : (v >= 0 ? `▲ ${v}` : `▼ ${-v}`) },
    streak: { label: 'Streak', val: x => x.bestStreak, fmt: v => `🔥 ${v}` },
  };
  const show = key => { [...tabs.children].forEach(b => b.classList.toggle('on', b.dataset.k === key)); list.innerHTML = ''; const V = views[key]; const rows = Object.values(data.players).map(x => ({ x, v: V.val(x) })).sort((a, b) => b.v - a.v); if (!rows.length) list.appendChild(el('div', 'empty', 'no players yet')); rows.forEach((r, i) => { const row = el('div', 'lrow' + (me && r.x.nick === me.nick ? ' me' : '')); row.innerHTML = `<span class="rk">${i + 1}</span><span class="av">${r.x.av}</span><span>${r.x.nick}</span><span class="val${key === 'progress' && r.v > 0 ? ' up' : ''}">${V.fmt(r.v)}</span>`; list.appendChild(row); }); };
  Object.entries(views).forEach(([k, V]) => { const b = el('button', '', V.label); b.dataset.k = k; b.onclick = () => show(k); tabs.appendChild(b); }); show('total');
  const row = el('div', 'row'); const m = el('button', 'btn', me ? 'Menu' : 'Play'); m.onclick = () => me ? menu() : login(); row.appendChild(m); p.appendChild(row);
}

loadContent().then(login);
