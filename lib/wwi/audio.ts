// Original procedural cues and score; no historical recordings or sampled music.
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

  // Called only from a player gesture, never creates a context on page load.
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
      /* Audio refusal must not interrupt gameplay. */
    }
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
    soft = false,
  ) {
    const context = this.context!;
    const source = context.createOscillator(),
      gain = context.createGain();
    source.type = soft ? 'sine' : 'triangle';
    source.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(volume, at + (soft ? 0.3 : 0.015));
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    source.connect(gain);
    gain.connect(context.destination);
    this.track(source, [gain]);
    source.start(at);
    source.stop(at + duration + 0.03);
  }
  private noise(at: number, length: number, frequency: number, volume: number) {
    const context = this.context!;
    const buffer = context.createBuffer(
      1,
      Math.ceil(context.sampleRate * length),
      context.sampleRate,
    );
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++)
      samples[i] =
        (Math.random() * 2 - 1) * Math.exp((-i / samples.length) * 7);
    const source = context.createBufferSource(),
      filter = context.createBiquadFilter(),
      gain = context.createGain();
    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.value = frequency;
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    this.track(source, [filter, gain]);
    source.start(at);
  }
  shot(kind: string) {
    const context = this.context;
    if (
      !this.enabled ||
      !this.visible ||
      this.menu ||
      context?.state !== 'running'
    )
      return;
    if (context.currentTime - this.lastShot < 0.065 || this.voices.size > 48)
      return;
    this.lastShot = context.currentTime;
    const artillery = kind === 'ARTILLERY';
    this.noise(
      context.currentTime,
      artillery ? 0.55 : 0.12,
      artillery ? 500 : kind === 'MG' ? 1900 : 2600,
      artillery ? 0.1 : 0.045,
    );
    if (artillery) this.tone(35, context.currentTime, 0.5, 0.055);
    if (kind === 'MG')
      this.noise(context.currentTime + 0.045, 0.09, 1700, 0.025);
  }
  private startMusic() {
    if (
      this.disposed ||
      !this.enabled ||
      !this.visible ||
      !this.menu ||
      this.context?.state !== 'running' ||
      this.timer !== null
    )
      return;
    this.nextBeat = this.context.currentTime + 0.08;
    this.beat = 0;
    const schedule = () => {
      const context = this.context!;
      if (context.state !== 'running') return;
      // Skip missed beats after throttling instead of replaying them in a burst.
      if (this.nextBeat < context.currentTime)
        this.nextBeat = context.currentTime + 0.08;
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
      while (this.nextBeat < context.currentTime + 0.4) {
        const at = this.nextBeat;
        this.tone(melody[this.beat], at, 1.8, 0.027);
        this.tone(melody[this.beat] + 12, at, 0.8, 0.004, true);
        if (this.beat % 8 === 0)
          chords[Math.floor(this.beat / 8)].forEach((note) =>
            this.tone(note, at, 5.9, 0.016, true),
          );
        if (this.beat % 4 === 2) this.noise(at, 0.14, 1300, 0.012);
        this.beat = (this.beat + 1) % melody.length;
        this.nextBeat += 60 / 72;
      }
    };
    schedule();
    this.timer = setInterval(schedule, 200);
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
  }
  dispose() {
    this.disposed = true;
    this.stopVoices();
    void this.context?.close().catch(() => {});
  }
}
