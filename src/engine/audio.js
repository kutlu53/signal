// Sound: synthesized ambience (rain, static, chime) + browser TTS per character.
// Real voice files can replace tts() later: look up `voice/<id>.mp3` by line id.

const VOICES = {
  yasemin: { pitch: 1.15, rate: 0.95 }, omar: { pitch: 0.9, rate: 1.0 }, leo: { pitch: 1.0, rate: 0.92 },
  mei: { pitch: 1.25, rate: 0.9 }, leyla: { pitch: 1.05, rate: 0.9 }, vendor: { pitch: 0.8, rate: 1.05 }, echo: { pitch: 0.55, rate: 0.82 }, staff: { pitch: 1.0, rate: 0.95 }, you: { pitch: 1.0, rate: 0.95 },
};

export class Audio {
  constructor() { this.ctx = null; this.rainGain = null; this.staticGain = null; this.muted = false; }
  start() {
    if (this.ctx) return; const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    this.ctx = new C(); const n = this.noiseSource();
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    this.rainGain = this.ctx.createGain(); this.rainGain.gain.value = 0; n.connect(lp).connect(this.rainGain).connect(this.ctx.destination);
    const n2 = this.noiseSource(); const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = .7;
    this.staticGain = this.ctx.createGain(); this.staticGain.gain.value = 0; n2.connect(bp).connect(this.staticGain).connect(this.ctx.destination);
    if (speechSynthesis) speechSynthesis.getVoices();
  }
  noiseSource() { const sr = this.ctx.sampleRate, buf = this.ctx.createBuffer(1, sr * 2, sr), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = this.ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(); return s; }
  ramp(g, v, t = 1.5) { if (!g) return; g.gain.cancelScheduledValues(this.ctx.currentTime); g.gain.setTargetAtTime(v, this.ctx.currentTime, t / 3); }
  rain(v) { this.ramp(this.rainGain, v * .12); }
  static(v) { this.ramp(this.staticGain, v * .08, .4); }
  chime() {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => { const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t + i * .08); g.gain.linearRampToValueAtTime(.12, t + i * .08 + .02); g.gain.exponentialRampToValueAtTime(.001, t + i * .08 + 1.2); o.connect(g).connect(this.ctx.destination); o.start(t + i * .08); o.stop(t + i * .08 + 1.3); });
  }
  alarm() {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    for (let i = 0; i < 6; i++) { const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = "square"; o.frequency.value = 1400; const s = t + i * .22; g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(.07, s + .01); g.gain.setValueAtTime(.07, s + .1); g.gain.linearRampToValueAtTime(0, s + .12); o.connect(g).connect(this.ctx.destination); o.start(s); o.stop(s + .13); }
  }
  // short static burst on top of the current static level
  burst(ms = 500) { if (!this.staticGain) return; const g = this.staticGain.gain, t = this.ctx.currentTime, cur = g.value; g.cancelScheduledValues(t); g.setValueAtTime(cur, t); g.linearRampToValueAtTime(.12, t + .05); g.linearRampToValueAtTime(cur, t + ms / 1000); }
  hoot() { // owl, two soft notes
    if (!this.ctx) return; const t = this.ctx.currentTime;
    [[t, 420], [t + .35, 360]].forEach(([s, f]) => { const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f, s); o.frequency.exponentialRampToValueAtTime(f * .9, s + .3); g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(.12, s + .05); g.gain.exponentialRampToValueAtTime(.001, s + .35); o.connect(g).connect(this.ctx.destination); o.start(s); o.stop(s + .4); });
  }
  thud() { if (!this.ctx) return; const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(30, t + .4); g.gain.setValueAtTime(.3, t); g.gain.exponentialRampToValueAtTime(.001, t + .5); o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + .5); }
  blip(bad = false) { if (!this.ctx) return; const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = 'square'; o.frequency.value = bad ? 160 : 880; g.gain.setValueAtTime(.06, t); g.gain.exponentialRampToValueAtTime(.001, t + .15); o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + .16); }

  pickVoice() {
    const vs = speechSynthesis.getVoices(); const en = vs.filter(v => /^en(-|_)?(GB|US|AU)?/i.test(v.lang));
    return en.find(v => /Google UK English Female|Libby|Sonia|Zira|Samantha/i.test(v.name)) || en.find(v => /female/i.test(v.name)) || en[0] || vs[0];
  }
  speak(text, who = 'you') {
    return new Promise(res => {
      if (!('speechSynthesis' in window) || this.muted) return setTimeout(res, 400 + text.length * 45);
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[…]/g, ', ')); const v = VOICES[who] || VOICES.you;
      u.pitch = v.pitch; u.rate = v.rate; u.lang = 'en-GB'; const voice = this.pickVoice(); if (voice) u.voice = voice;
      let done = false; const end = () => { if (!done) { done = true; res(); } };
      u.onend = end; u.onerror = end; speechSynthesis.speak(u);
      setTimeout(end, 1500 + text.length * 120); // safety: some browsers never fire onend
    });
  }
  stopSpeech() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }
}
