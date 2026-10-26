// -----------------------------------------------------------------------------
// Shadow AI Web Audio API Pipeline for Gemini 3.8 Live Streaming
// Handles 16kHz input PCM capture and 24kHz gapless output PCM playback
// -----------------------------------------------------------------------------

/**
 * Encodes Float32 microphone audio buffer into 16-bit PCM little-endian base64 string
 * Expected by Gemini Live API (audio/pcm;rate=16000)
 */
export function floatTo16BitPCM(input: Float32Array): string {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  let binary = '';
  const bytes = new Uint8Array(output.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes base64 raw 16-bit little-endian PCM (24kHz) from Gemini Live into an AudioBuffer
 */
export function pcm16ToAudioBuffer(ctx: AudioContext, base64: string): AudioBuffer {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16Array = new Int16Array(bytes.buffer);
  const audioBuffer = ctx.createBuffer(1, int16Array.length, 24000);
  const channelData = audioBuffer.getChannelData(0);
  for (let i = 0; i < int16Array.length; i++) {
    channelData[i] = int16Array[i] / 32768.0;
  }
  return audioBuffer;
}

/**
 * Schedules incoming 24kHz PCM chunk for gapless, zero-latency playback
 */
export function scheduleAudioChunk(
  ctx: AudioContext,
  base64: string,
  nextStartTimeRef: { current: number },
  activeSourcesRef: { current: AudioBufferSourceNode[] }
): void {
  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const buffer = pcm16ToAudioBuffer(ctx, base64);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    // Add small 20ms safety margin if buffer fell behind current time
    if (nextStartTimeRef.current < now) {
      nextStartTimeRef.current = now + 0.02;
    }

    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += buffer.duration;

    activeSourcesRef.current.push(source);

    source.onended = () => {
      const idx = activeSourcesRef.current.indexOf(source);
      if (idx !== -1) {
        activeSourcesRef.current.splice(idx, 1);
      }
    };
  } catch (err) {
    console.warn('[Live Audio] Schedule chunk error:', err);
  }
}

/**
 * Immediately terminates all queued and currently playing audio nodes on interruption
 */
export function stopAllAudioSources(
  activeSourcesRef: { current: AudioBufferSourceNode[] },
  nextStartTimeRef: { current: number }
): void {
  try {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
    nextStartTimeRef.current = 0;
  } catch (err) {
    console.warn('[Live Audio] Stop sources error:', err);
  }
}
