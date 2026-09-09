/**
 * WebOS Audio Digital Signal Processor (DSP) Engine
 */

export interface BiquadFilterCoefficients {
  a0: number;
  a1: number;
  a2: number;
  b0: number;
  b1: number;
  b2: number;
}

export class AudioDSPEngine {
  private sampleRate = 48000;
  private masterGain = 1.0;
  private isMuted = false;

  public calculateLowpass(cutoffFreq: number, q: number): BiquadFilterCoefficients {
    const omega = (2 * Math.PI * cutoffFreq) / this.sampleRate;
    const alpha = Math.sin(omega) / (2 * q);
    const cosOmega = Math.cos(omega);

    const b0 = (1 - cosOmega) / 2;
    const b1 = 1 - cosOmega;
    const b2 = (1 - cosOmega) / 2;
    const a0 = 1 + alpha;
    const a1 = -2 * cosOmega;
    const a2 = 1 - alpha;

    return {
      b0: b0 / a0,
      b1: b1 / a0,
      b2: b2 / a0,
      a0: 1.0,
      a1: a1 / a0,
      a2: a2 / a0,
    };
  }

  public calculateHighpass(cutoffFreq: number, q: number): BiquadFilterCoefficients {
    const omega = (2 * Math.PI * cutoffFreq) / this.sampleRate;
    const alpha = Math.sin(omega) / (2 * q);
    const cosOmega = Math.cos(omega);

    const b0 = (1 + cosOmega) / 2;
    const b1 = -(1 + cosOmega);
    const b2 = (1 + cosOmega) / 2;
    const a0 = 1 + alpha;
    const a1 = -2 * cosOmega;
    const a2 = 1 - alpha;

    return {
      b0: b0 / a0,
      b1: b1 / a0,
      b2: b2 / a0,
      a0: 1.0,
      a1: a1 / a0,
      a2: a2 / a0,
    };
  }

  public processBuffer(samples: Float32Array, filter: BiquadFilterCoefficients): Float32Array {
    const output = new Float32Array(samples.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;

    for (let i = 0; i < samples.length; i++) {
      const x0 = samples[i];
      let y0 = filter.b0 * x0 + filter.b1 * x1 + filter.b2 * x2 - filter.a1 * y1 - filter.a2 * y2;
      
      x2 = x1;
      x1 = x0;
      y2 = y1;
      y1 = y0;

      output[i] = this.isMuted ? 0 : y0 * this.masterGain;
    }

    return output;
  }

  public setMasterGain(gain: number): void {
    this.masterGain = Math.max(0, Math.min(2.0, gain));
  }

  public setMute(muted: boolean): void {
    this.isMuted = muted;
  }

  public getMasterGain(): number {
    return this.masterGain;
  }
}

export const audioDsp = new AudioDSPEngine();
