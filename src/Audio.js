export default class AudioSystem {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.3; // Default volume
        this.isMuted = false;
    }

    init() {
        // Resume context if suspended (browser policy)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, type, duration) {
        if (this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playStartSound() {
        this.playTone(440, 'sine', 0.5);
        setTimeout(() => this.playTone(880, 'triangle', 0.5), 100);
    }

    playShootSound() {
        // Iconic Star Wars-style laser sound
        const now = this.ctx.currentTime;

        // Main laser tone - rapid frequency sweep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth'; // More authentic laser sound
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.15);

        // White noise burst for "zap" effect
        const bufferSize = this.ctx.sampleRate * 0.05;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        const noiseGain = this.ctx.createGain();
        const noiseFilter = this.ctx.createBiquadFilter();

        noise.buffer = buffer;
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(800, now);
        noiseGain.gain.setValueAtTime(0.08, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now);
        noise.stop(now + 0.05);
    }

    playExplosionSound() {
        this.playTone(100, 'sawtooth', 0.3);
        this.playTone(50, 'square', 0.4);
        // Noise simulation with multiple random frequencies
        for (let i = 0; i < 5; i++) {
            setTimeout(() => this.playTone(Math.random() * 200 + 50, 'sawtooth', 0.2), Math.random() * 200);
        }
    }

    playCollectSound() {
        this.playTone(1200, 'sine', 0.1);
        setTimeout(() => this.playTone(1800, 'sine', 0.2), 50);
    }

    startRefuelSound() {
        if (this.isMuted || this.isRefuelingSoundPlaying) return;

        this.isRefuelingSoundPlaying = true;
        this.refuelOsc = this.ctx.createOscillator();
        this.refuelGain = this.ctx.createGain();

        // River Raid style: Rising pitch siren-like or constant high pitch
        // Let's do a high pitch pulsing sound
        this.refuelOsc.type = 'square';
        this.refuelOsc.frequency.setValueAtTime(440, this.ctx.currentTime);

        // LFO for vibrato effect (classic arcade feel)
        this.refuelLFO = this.ctx.createOscillator();
        this.refuelLFO.frequency.value = 15; // Fast vibrato
        this.refuelLFOGain = this.ctx.createGain();
        this.refuelLFOGain.gain.value = 50;

        this.refuelLFO.connect(this.refuelLFOGain);
        this.refuelLFOGain.connect(this.refuelOsc.frequency);

        this.refuelGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

        this.refuelOsc.connect(this.refuelGain);
        this.refuelGain.connect(this.masterGain);

        this.refuelOsc.start();
        this.refuelLFO.start();
    }

    stopRefuelSound() {
        if (!this.isRefuelingSoundPlaying) return;

        if (this.refuelOsc) {
            this.refuelOsc.stop();
            this.refuelOsc.disconnect();
        }
        if (this.refuelLFO) {
            this.refuelLFO.stop();
            this.refuelLFO.disconnect();
        }

        this.isRefuelingSoundPlaying = false;
        this.refuelOsc = null;
        this.refuelLFO = null;
    }

    playLowFuelSound() {
        if (this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playCrashSound() {
        this.playTone(100, 'sawtooth', 0.5);
        this.playTone(80, 'square', 0.5);
    }
    playMusic() {
        if (this.isMuted || (this.isPlayingMusic && !this.isBossMusic)) return;

        // If switching from boss music, stop first
        if (this.isBossMusic) this.stopMusic();

        this.isPlayingMusic = true;
        this.isBossMusic = false;
        this.noteIndex = 0;
        this.tempo = 130; // Faster Battle Tempo
        this.nextNoteTime = this.ctx.currentTime;
        this.scheduleNextNote();
    }

    playBossMusic() {
        if (this.isMuted || (this.isPlayingMusic && this.isBossMusic)) return;

        // If switching from normal music, stop first
        if (this.isPlayingMusic) this.stopMusic();

        this.isPlayingMusic = true;
        this.isBossMusic = true;
        this.noteIndex = 0;
        this.tempo = 160; // Very Fast Boss Tempo
        this.nextNoteTime = this.ctx.currentTime;
        this.scheduleNextNote();
    }

    scheduleNextNote() {
        if (!this.isPlayingMusic) return;

        const secondsPerBeat = 60.0 / this.tempo;
        const lookahead = 0.1; // How far ahead to schedule audio (sec)

        while (this.nextNoteTime < this.ctx.currentTime + lookahead) {
            if (this.isBossMusic) {
                this.playBossStep(this.noteIndex, this.nextNoteTime);
            } else {
                this.playStep(this.noteIndex, this.nextNoteTime);
            }

            this.nextNoteTime += secondsPerBeat * 0.5; // Eighth notes
            this.noteIndex++;
            if (this.noteIndex >= 32) this.noteIndex = 0; // 4 bar loop
        }

        this.timerID = setTimeout(() => this.scheduleNextNote(), 25);
    }

    playStep(index, time) {
        // Bass Line (Imperial March-ish rhythm)
        // Dum Dum Dum Dum-te-Dum Dum-te-Dum
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.value = 110; // A2

        // Simple rhythmic pattern
        if ([0, 4, 8, 12, 16, 20, 24, 28].includes(index)) {
            // Downbeats
            bassOsc.frequency.value = 110; // A
        } else if ([14, 15, 30, 31].includes(index)) {
            // Fill
            bassOsc.frequency.value = 82.4; // E
        } else {
            // Offbeats (silence or lower volume)
            bassGain.gain.value = 0;
        }

        bassGain.gain.setValueAtTime(0.2, time);
        bassGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

        bassOsc.connect(bassGain);
        bassGain.connect(this.masterGain);
        bassOsc.start(time);
        bassOsc.stop(time + 0.2);

        // Melody / Brass (Triplets feel)
        if (index % 8 === 0) {
            const leadOsc = this.ctx.createOscillator();
            const leadGain = this.ctx.createGain();
            leadOsc.type = 'sawtooth';
            // Chord hits
            leadOsc.frequency.value = [440, 554, 659][Math.floor(Math.random() * 3)]; // A Major / F# Minor bits

            leadGain.gain.setValueAtTime(0.1, time);
            leadGain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

            leadOsc.connect(leadGain);
            leadGain.connect(this.masterGain);
            leadOsc.start(time);
            leadOsc.stop(time + 0.4);
        }
    }

    playBossStep(index, time) {
        // Intense, low, fast
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'square'; // Harsher sound

        // Driving 16th note bass
        bassOsc.frequency.value = 55; // A1 (Very Low)

        bassGain.gain.setValueAtTime(0.3, time);
        bassGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1); // Short decay

        bassOsc.connect(bassGain);
        bassGain.connect(this.masterGain);
        bassOsc.start(time);
        bassOsc.stop(time + 0.1);

        // Dramatic Stabs
        if (index % 16 === 0) {
            const stabOsc = this.ctx.createOscillator();
            const stabGain = this.ctx.createGain();
            stabOsc.type = 'sawtooth';
            stabOsc.frequency.value = 220; // A3

            // Pitch drop effect
            stabOsc.frequency.exponentialRampToValueAtTime(110, time + 0.5);

            stabGain.gain.setValueAtTime(0.4, time);
            stabGain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

            stabOsc.connect(stabGain);
            stabGain.connect(this.masterGain);
            stabOsc.start(time);
            stabOsc.stop(time + 0.5);
        }

        // High tension beep
        if (Math.random() > 0.8) {
            const beepOsc = this.ctx.createOscillator();
            const beepGain = this.ctx.createGain();
            beepOsc.type = 'sine';
            beepOsc.frequency.value = 880;

            beepGain.gain.setValueAtTime(0.1, time);
            beepGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

            beepOsc.connect(beepGain);
            beepGain.connect(this.masterGain);
            beepOsc.start(time);
            beepOsc.stop(time + 0.1);
        }
    }

    playShieldMusic() {
        if (this.isMuted) return;
        // Magical / Ethereal sound loop
        // For now, just a long chime
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 523.25; // C5

        // Vibrato
        const vibrato = this.ctx.createOscillator();
        vibrato.frequency.value = 5;
        const vibratoGain = this.ctx.createGain();
        vibratoGain.gain.value = 10;
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc.frequency);
        vibrato.start();

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 2);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 2);
    }

    playPowerDownSound() {
        if (this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.5);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }

    stopMusic() {
        this.isPlayingMusic = false;
        this.isBossMusic = false;
        clearTimeout(this.timerID);
    }
}
