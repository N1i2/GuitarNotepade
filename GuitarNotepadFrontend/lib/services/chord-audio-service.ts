export class ChordAudioService {
  private audioContext: AudioContext | null = null;
  private activeSources: { stop: () => void }[] = [];

  private readonly noteFrequencies: { [key: string]: number } = {
    E2: 82.41,
    A2: 110.0,
    D3: 146.83,
    G3: 196.0,
    B3: 246.94,
    E4: 329.63,
  };

  private readonly stringNotes = ["E2", "A2", "D3", "G3", "B3", "E4"];

  async generateChordAudio(fingering: string): Promise<void> {
    this.stopAll();

    if (!this.audioContext) {
      this.audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    }

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    const notesToPlay = this.parseFingering(fingering);

    if (notesToPlay.length === 0) return;

    notesToPlay.forEach((note) => {
      this.playString(note);
    });

    return new Promise((resolve) => {
      const maxDuration = this.getMaxDuration();
      setTimeout(resolve, maxDuration);
    });
  }

  private getMaxDuration(): number {
    const attackTime = 0.05;
    const decayTime = 0.3;
    const releaseTime = 1.8;

    return (attackTime + decayTime + releaseTime) * 1000;
  }

  private parseFingering(
    fingering: string,
  ): Array<{ frequency: number; stringIndex: number; isOpen: boolean }> {
    let parts: string[];
    if (fingering.includes("-")) {
      parts = fingering.split("-");
    } else {
      parts = fingering.split("");
    }

    const values = parts.slice(0, 6);
    const notes: Array<{
      frequency: number;
      stringIndex: number;
      isOpen: boolean;
    }> = [];

    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      const stringNote = this.stringNotes[i];
      const baseFrequency = this.noteFrequencies[stringNote];

      if (value === "0") {
        notes.push({
          frequency: baseFrequency,
          stringIndex: i,
          isOpen: true,
        });
      } else if (value !== "X" && value !== "x" && value !== "") {
        const fret = parseInt(value, 10);
        if (!isNaN(fret) && fret > 0 && fret <= 24) {
          const frequency = baseFrequency * Math.pow(2, fret / 12);
          notes.push({
            frequency,
            stringIndex: i,
            isOpen: false,
          });
        }
      }
    }

    return notes;
  }

  private playString(note: {
    frequency: number;
    stringIndex: number;
    isOpen: boolean;
  }): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;

    const oscillator = this.audioContext.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.value = note.frequency;

    const harmonic2 = this.audioContext.createOscillator();
    harmonic2.type = "sine";
    harmonic2.frequency.value = note.frequency * 2;

    const lowPassFilter = this.audioContext.createBiquadFilter();
    lowPassFilter.type = "lowpass";
    lowPassFilter.frequency.value = 1200;
    lowPassFilter.Q.value = 0.7;

    const peakFilter = this.audioContext.createBiquadFilter();
    peakFilter.type = "peaking";
    peakFilter.frequency.value = 400;
    peakFilter.gain.value = 3;
    peakFilter.Q.value = 1;

    const mainGain = this.audioContext.createGain();
    const harmonicGain = this.audioContext.createGain();
    harmonicGain.gain.value = 0.15;

    const reverb = this.createWarmReverb();
    const dryGain = this.audioContext.createGain();
    const wetGain = this.audioContext.createGain();

    oscillator.connect(lowPassFilter);
    harmonic2.connect(harmonicGain);
    harmonicGain.connect(lowPassFilter);
    lowPassFilter.connect(peakFilter);
    peakFilter.connect(dryGain);
    peakFilter.connect(reverb);
    reverb.connect(wetGain);

    dryGain.gain.value = 0.85;
    wetGain.gain.value = 0.15;

    dryGain.connect(mainGain);
    wetGain.connect(mainGain);
    mainGain.connect(this.audioContext.destination);

    const attackTime = 0.05;
    const decayTime = 0.3;
    const releaseTime = 1.8;

    mainGain.gain.setValueAtTime(0, now);
    mainGain.gain.linearRampToValueAtTime(0.35, now + attackTime);
    mainGain.gain.exponentialRampToValueAtTime(
      0.2,
      now + attackTime + decayTime,
    );
    mainGain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + attackTime + decayTime + releaseTime,
    );

    const duration = attackTime + decayTime + releaseTime;

    oscillator.start(now);
    oscillator.stop(now + duration);

    harmonic2.start(now);
    harmonic2.stop(now + duration);

    this.activeSources.push({
      stop: () => {
        try {
          oscillator.stop();
          harmonic2.stop();
        } catch (e) {}
      },
    });
  }

  private createWarmReverb(): ConvolverNode {
    if (!this.audioContext) throw new Error("AudioContext not initialized");

    const convolver = this.audioContext.createConvolver();
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * 1.2;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const decay = Math.exp(-t * 2.5);
        const random = Math.sin(i * 0.01) * 0.3 + (Math.random() - 0.5) * 0.2;
        channelData[i] = random * decay;
      }
    }

    convolver.buffer = impulse;
    return convolver;
  }

  stopAll(): void {
    this.activeSources.forEach((source) => {
      try {
        source.stop();
      } catch (e) {}
    });
    this.activeSources = [];
  }

  async cleanup(): Promise<void> {
    this.stopAll();
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const chordAudioService = new ChordAudioService();
