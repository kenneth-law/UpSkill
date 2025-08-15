// audio-processor.js
// This is an AudioWorkletProcessor that processes audio data from the microphone
// and sends it to the WebSocket connection

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096; // Buffer size in samples
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    // Get input data
    const input = inputs[0];
    if (!input || !input.length) return true;

    const channel = input[0];
    if (!channel) return true;

    // Fill buffer with input data
    for (let i = 0; i < channel.length; i++) {
      this.buffer[this.bufferIndex++] = channel[i];

      // When buffer is full, send it to the main thread
      if (this.bufferIndex >= this.bufferSize) {
        // Convert to 16-bit PCM
        const pcmBuffer = new Int16Array(this.bufferSize);
        for (let j = 0; j < this.bufferSize; j++) {
          // Convert float32 to int16
          pcmBuffer[j] = Math.max(-1, Math.min(1, this.buffer[j])) * 0x7FFF;
        }

        // Send buffer to main thread
        this.port.postMessage({
          audio: pcmBuffer.buffer,
        });

        // Reset buffer
        this.bufferIndex = 0;
      }
    }

    // Keep processor alive
    return true;
  }
}

// Register the processor
registerProcessor('audio-processor', AudioProcessor);