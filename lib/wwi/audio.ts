// Original procedural soundtrack and cues. No recordings, samples, or copyrighted music.
export type AudioCue =
  | 'NAVIGATE'
  | 'CONFIRM'
  | 'DENY'
  | 'DEPLOY'
  | 'UPGRADE'
  | 'WITHDRAW'
  | 'WAVE'
  | 'ORDER_OFFER'
  | 'ORDER_CHOSEN'
  | 'COMMAND'
  | 'RIFLE_SKILL'
  | 'MG_SKILL'
  | 'ARTILLERY_SKILL'
  | 'REPAIR'
  | 'BREACH'
  | 'VICTORY'
  | 'DEFEAT';

export class FieldAudio {
  private context: AudioContext | null = null;
  private enabled = false;
  private menu = true;
  private visible = true;
  private timer: ReturnType<typeof setInterval> | null = null;
  private voices = new Set<AudioScheduledSourceNode>();
  private beat = 0;
  private nextBeat = 0;
  private lastShot = -1;
  private lastCue = new Map<AudioCue, number>();
  private disposed = false;
  constructor(private createContext = () => new AudioContext()) {}

  configure(enabled: boolean, menu: boolean, visible: boolean) {
    const changed =
      this.enabled !== enabled ||
      this.menu !== menu ||
      this.visible !== visible;
    this.enabled = enabled;
    this.menu = menu;
    this.visible = visible;
    if (changed) this.stopVoices();
    if (!enabled || !visible) {
      if (this.context?.state === 'running')
        void this.context.suspend().catch(() => {});
    } else this.startMusic();
  }

  // AudioContext is created only after a player gesture.
  async unlock() {
    if (this.disposed || !this.enabled || !this.visible) return;
    try {
      this.context ??= this.createContext();
      if (this.context.state !== 'running') await this.context.resume();
      if (this.disposed || !this.enabled || !this.visible) {
        if (this.context.state === 'running') await this.context.suspend();
        return;
      }
      this.startMusic();
    } catch {
      /* Audio refusal must never interrupt gameplay. */
    }
  }

  private ready(battleOnly = false) {
    return (
      this.enabled &&
      this.visible &&
      (!battleOnly || !this.menu) &&
      this.context?.state === 'running'
    );
  }

  private track(source: AudioScheduledSourceNode, nodes: AudioNode[]) {
    this.voices.add(source);
    source.onended = () => {
      this.voices.delete(source);
      source.disconnect();
      nodes.forEach((node) => node.disconnect());
    };
  }

  private tone(
    midi: number,
    at: number,
    duration: number,
    volume: number,
    voice: OscillatorType = 'triangle',
    attack = 0.015,
  ) {
    const context = this.context!;
    const source = context.createOscillator(),
      gain = context.createGain();
    source.type = voice;
    source.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(volume, at + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    source.connect(gain);
    gain.connect(context.destination);
    this.track(source, [gain]);
    source.start(at);
    source.stop(at + duration + 0.03);
  }

  private noise(
    at: number,
    length: number,
    frequency: number,
    volume: number,
    filterType: BiquadFilterType = 'lowpass',
  ) {
    const context = this.context!;
    const buffer = context.createBuffer(
      1,
      Math.ceil(context.sampleRate * length),
      context.sampleRate,
    );
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++)
      samples[i] =
        (Math.random() * 2 - 1) * Math.exp((-i / samples.length) * 6);
    const source = context.createBufferSource(),
      filter = context.createBiquadFilter(),
      gain = context.createGain();
    source.buffer = buffer;
    filter.type = filterType;
    filter.frequency.value = frequency;
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    this.track(source, [filter, gain]);
    source.start(at);
    source.stop(at + length + 0.03);
  }

  shot(kind: string) {
    const context = this.context;
    if (!this.ready(true) || !context) return;
    if (context.currentTime - this.lastShot < 0.065 || this.voices.size > 56)
      return;
    this.lastShot = context.currentTime;
    const artillery = kind === 'ARTILLERY';
    this.noise(
      context.currentTime,
      artillery ? 0.62 : 0.12,
      artillery ? 480 : kind === 'MG' ? 1900 : 2700,
      artillery ? 0.085 : 0.038,
    );
    if (artillery)
      this.tone(34, context.currentTime, 0.58, 0.045, 'sine', 0.005);
    if (kind === 'MG')
      this.noise(context.currentTime + 0.045, 0.085, 1650, 0.022);
  }

  cue(kind: AudioCue) {
    const context = this.context;
    if (!this.ready() || !context || this.voices.size > 60) return;
    const now = context.currentTime;
    const cooldown =
      kind === 'BREACH' ? 0.7 : kind === 'NAVIGATE' ? 0.08 : 0.03;
    if (now - (this.lastCue.get(kind) ?? -10) < cooldown) return;
    this.lastCue.set(kind, now);
    const note = (
      midi: number,
      delay: number,
      duration: number,
      volume: number,
      voice: OscillatorType = 'triangle',
    ) => this.tone(midi, now + delay, duration, volume, voice);
    switch (kind) {
      case 'NAVIGATE':
        note(62, 0, 0.1, 0.012, 'sine');
        break;
      case 'CONFIRM':
        note(62, 0, 0.13, 0.018);
        note(69, 0.09, 0.2, 0.016);
        break;
      case 'DENY':
        note(48, 0, 0.18, 0.022, 'square');
        note(47, 0.08, 0.22, 0.015, 'square');
        break;
      case 'DEPLOY':
        this.noise(now, 0.16, 720, 0.03);
        note(43, 0, 0.28, 0.025, 'sine');
        break;
      case 'UPGRADE':
        [60, 64, 67].forEach((n, i) => note(n, i * 0.08, 0.2, 0.018));
        break;
      case 'WITHDRAW':
        [57, 53, 50].forEach((n, i) => note(n, i * 0.07, 0.15, 0.014));
        break;
      case 'WAVE':
        [55, 62, 67].forEach((n, i) => note(n, i * 0.11, 0.32, 0.021));
        break;
      case 'ORDER_OFFER':
        [0, 0.065, 0.13].forEach((delay) =>
          this.noise(now + delay, 0.035, 2300, 0.018, 'highpass'),
        );
        note(67, 0.2, 0.26, 0.018);
        break;
      case 'ORDER_CHOSEN':
        [60, 64, 69].forEach((n, i) => note(n, i * 0.075, 0.2, 0.018));
        break;
      case 'COMMAND':
        note(79, 0, 0.34, 0.023, 'sine');
        note(72, 0.12, 0.38, 0.018, 'sine');
        break;
      case 'RIFLE_SKILL':
        [0, 0.09, 0.18].forEach((delay) =>
          this.noise(now + delay, 0.07, 2600, 0.03),
        );
        break;
      case 'MG_SKILL':
        [0, 0.055, 0.11, 0.22, 0.275, 0.33].forEach((delay) =>
          this.noise(now + delay, 0.065, 1800, 0.027),
        );
        break;
      case 'ARTILLERY_SKILL':
        this.noise(now, 0.85, 440, 0.09);
        note(31, 0, 0.8, 0.05, 'sine');
        break;
      case 'REPAIR':
        [55, 60, 64].forEach((n, i) => note(n, i * 0.1, 0.35, 0.017, 'sine'));
        break;
      case 'BREACH':
        this.noise(now, 0.5, 380, 0.065);
        note(38, 0, 0.55, 0.04, 'sawtooth');
        break;
      case 'VICTORY':
        [55, 60, 64, 67, 72].forEach((n, i) => note(n, i * 0.14, 0.7, 0.026));
        break;
      case 'DEFEAT':
        [55, 52, 48, 43].forEach((n, i) =>
          note(n, i * 0.18, 0.55, 0.024, 'sine'),
        );
        break;
    }
  }

  private startMusic() {
    if (
      this.disposed ||
      !this.enabled ||
      !this.visible ||
      this.context?.state !== 'running' ||
      this.timer !== null
    )
      return;
    this.nextBeat = this.context.currentTime + 0.08;
    this.beat = 0;
    const schedule = () => {
      const context = this.context!;
      if (context.state !== 'running') return;
      if (this.nextBeat < context.currentTime)
        this.nextBeat = context.currentTime + 0.08;
      while (this.nextBeat < context.currentTime + 0.45) {
        if (this.menu) this.scheduleMenuBeat(this.beat, this.nextBeat);
        else this.scheduleBattleBeat(this.beat, this.nextBeat);
        this.beat = (this.beat + 1) % 32;
        this.nextBeat += 60 / (this.menu ? 66 : 86);
      }
    };
    schedule();
    this.timer = setInterval(schedule, 180);
  }

  private scheduleMenuBeat(beat: number, at: number) {
    const melody = [
      62, 69, 65, 64, 62, 57, 60, 64, 65, 72, 69, 67, 65, 64, 60, 57, 58, 65,
      62, 60, 58, 57, 53, 57, 57, 64, 61, 59, 61, 64, 57, 61,
    ];
    const chords = [
      [38, 53, 57],
      [41, 57, 60],
      [34, 53, 58],
      [33, 52, 61],
    ];
    this.tone(melody[beat], at, 1.8, 0.022, 'triangle', 0.25);
    this.tone(melody[beat] + 12, at, 0.9, 0.003, 'sine', 0.28);
    if (beat % 8 === 0)
      chords[Math.floor(beat / 8)].forEach((n) =>
        this.tone(n, at, 6.2, 0.012, 'sine', 0.45),
      );
    if (beat % 4 === 2) this.noise(at, 0.15, 1100, 0.006);
  }

  private scheduleBattleBeat(beat: number, at: number) {
    const bass = [38, 38, 41, 38, 34, 34, 36, 33],
      brass = [62, 65, 64, 60];
    this.tone(
      bass[beat % 8],
      at,
      0.55,
      beat % 4 === 0 ? 0.018 : 0.011,
      'triangle',
      0.02,
    );
    if (beat % 2 === 0)
      this.noise(at, 0.11, 750, beat % 4 === 0 ? 0.012 : 0.007);
    if (beat % 8 === 0) {
      this.tone(brass[Math.floor(beat / 8)], at, 2.3, 0.013, 'sawtooth', 0.2);
      this.tone(bass[beat % 8] - 12, at, 2.5, 0.014, 'sine', 0.2);
    }
    if (beat === 15 || beat === 31) this.noise(at, 1.2, 300, 0.012);
  }

  private stopVoices() {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    this.voices.forEach((source) => {
      try {
        source.stop();
      } catch {
        /* Already ended. */
      }
    });
    this.voices.clear();
    this.lastShot = -1;
    this.lastCue.clear();
  }

  dispose() {
    this.disposed = true;
    this.stopVoices();
    void this.context?.close().catch(() => {});
  }
}
