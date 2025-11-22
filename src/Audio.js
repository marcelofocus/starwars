export default class AudioSystem {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.3; // Default volume
        this.isMuted = false;
        this.isMenuMusic = false;
    }

    init() {
        // Resume context if suspended (browser policy)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        this.loadMusic();
    }

    async loadMusic() {
        try {
            // Load Game Music
            const response = await fetch('music/background.mp3');
            const arrayBuffer = await response.arrayBuffer();
            this.musicBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            console.log('Background music loaded');

            // Load Menu Music
            const menuResponse = await fetch('music/menu.mp3');
            const menuArrayBuffer = await menuResponse.arrayBuffer();
            this.menuMusicBuffer = await this.ctx.decodeAudioData(menuArrayBuffer);
            console.log('Menu music loaded');

            // Load Boss Music
            const bossResponse = await fetch('music/boss.mp3');
            const bossArrayBuffer = await bossResponse.arrayBuffer();
            this.bossMusicBuffer = await this.ctx.decodeAudioData(bossArrayBuffer);
            console.log('Boss music loaded');

            if (this.playWhenReady) {
                if (this.playWhenReady === 'MENU') this.playMenuMusic();
                else this.playMusic();
            }
        } catch (error) {
            console.error('Error loading music:', error);
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
        if (this.isMuted) return;
        const now = this.ctx.currentTime;

        // "Cable Guy" Blaster Sound (Star Wars Style)
        // Source: Sawtooth for rich harmonics
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';

        // Pitch Sweep: High to Low (Pew!)
        osc.frequency.setValueAtTime(2000, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);

        // Filter Sweep: Resonant Lowpass (The "Laser" character)
        filter.type = 'lowpass';
        filter.Q.value = 15; // High resonance for the "zap"
        filter.frequency.setValueAtTime(2500, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.15);

        // Envelope: Punchy attack, quick decay
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        // Connect: Osc -> Filter -> Gain -> Master
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.2);
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

    playMusic() {
        if (this.isMuted || (this.isPlayingMusic && !this.isBossMusic && !this.isMenuMusic)) return;

        this.stopMusic();

        if (this.musicBuffer) {
            this.isPlayingMusic = true;
            this.isBossMusic = false;
            this.isMenuMusic = false;

            this.musicSource = this.ctx.createBufferSource();
            this.musicSource.buffer = this.musicBuffer;
            this.musicSource.loop = true;
            this.musicSource.connect(this.masterGain);
            this.musicSource.start();
        } else {
            console.log('Game music not ready yet, queuing...');
            this.playWhenReady = 'GAME';
        }
    }

    playMenuMusic() {
        if (this.isMuted || (this.isPlayingMusic && this.isMenuMusic)) return;

        this.stopMusic();

        if (this.menuMusicBuffer) {
            this.isPlayingMusic = true;
            this.isMenuMusic = true;
            this.isBossMusic = false;

            this.musicSource = this.ctx.createBufferSource();
            this.musicSource.buffer = this.menuMusicBuffer;
            this.musicSource.loop = true;
            this.musicSource.connect(this.masterGain);
            this.musicSource.start();
        } else {
            console.log('Menu music not ready yet, queuing...');
            this.playWhenReady = 'MENU';
        }
    }

    playBossMusic() {
        if (this.isMuted || (this.isPlayingMusic && this.isBossMusic)) return;

        this.stopMusic();

        if (this.bossMusicBuffer) {
            this.isPlayingMusic = true;
            this.isBossMusic = true;
            this.isMenuMusic = false;

            this.musicSource = this.ctx.createBufferSource();
            this.musicSource.buffer = this.bossMusicBuffer;
            this.musicSource.loop = true;
            this.musicSource.connect(this.masterGain);
            this.musicSource.start();
        } else {
            console.log('Boss music not ready yet');
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
        this.isMenuMusic = false;
        clearTimeout(this.timerID);

        if (this.musicSource) {
            try {
                this.musicSource.stop();
            } catch (e) {
                // Ignore if already stopped
            }
            this.musicSource = null;
        }
    }
}
