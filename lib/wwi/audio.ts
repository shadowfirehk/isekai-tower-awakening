// Restrained procedural sound cues. These are synthesized, not historical recordings.
export function playShot(context: AudioContext, kind: string) {
  if (context.state !== 'running') return;
  const artillery = kind === 'ARTILLERY',
    length = artillery ? 0.55 : 0.12;
  const buffer = context.createBuffer(
    1,
    Math.ceil(context.sampleRate * length),
    context.sampleRate,
  );
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++)
    samples[i] =
      (Math.random() * 2 - 1) *
      Math.exp((-i / samples.length) * (artillery ? 5 : 9));
  const source = context.createBufferSource(),
    filter = context.createBiquadFilter(),
    volume = context.createGain();
  source.buffer = buffer;
  filter.type = 'lowpass';
  filter.frequency.value = artillery ? 500 : kind === 'MG' ? 1900 : 2600;
  volume.gain.value = artillery ? 0.1 : 0.055;
  source.connect(filter);
  filter.connect(volume);
  volume.connect(context.destination);
  source.start();
  if (artillery) {
    const bass = context.createOscillator(),
      gain = context.createGain();
    bass.frequency.setValueAtTime(65, context.currentTime);
    bass.frequency.exponentialRampToValueAtTime(24, context.currentTime + 0.4);
    gain.gain.setValueAtTime(0.06, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.45);
    bass.connect(gain);
    gain.connect(context.destination);
    bass.start();
    bass.stop(context.currentTime + 0.46);
  }
}
