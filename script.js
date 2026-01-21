// ===================================
// AUDIO ENGINE & CONFIGURATION
// ===================================

class PianoAudioEngine {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.gain.value = 0.7;

        // Active notes for polyphony support
        this.activeNotes = new Map();

        // Sustain pedal state
        this.sustainActive = false;
        this.sustainedNotes = new Set();

        // Note frequencies (A4 = 440Hz)
        this.noteFrequencies = {
            'C4': 261.63,
            'C#4': 277.18,
            'D4': 293.66,
            'D#4': 311.13,
            'E4': 329.63,
            'F4': 349.23,
            'F#4': 369.99,
            'G4': 392.00,
            'G#4': 415.30,
            'A4': 440.00,
            'A#4': 466.16,
            'B4': 493.88,
            'C5': 523.25,
            'C#5': 554.37,
            'D5': 587.33,
            'D#5': 622.25,
            'E5': 659.25
        };
    }

    // Create a pure piano sound using Web Audio API
    createPianoSound(frequency, duration = 2.0) {
        const now = this.audioContext.currentTime;

        // Use a single sine oscillator for a pure, clean tone
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;

        // Create gain node for envelope
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 0.5;

        // Create envelope (ADSR)
        const attackTime = 0.01;
        const decayTime = 0.2;
        const sustainLevel = 0.3;
        const releaseTime = 0.5;

        // Attack
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.5, now + attackTime);

        // Decay to sustain
        gainNode.gain.linearRampToValueAtTime(0.5 * sustainLevel, now + attackTime + decayTime);

        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        // Start oscillator
        oscillator.start(now);

        // Store for later stopping
        return {
            oscillators: [oscillator],
            gains: [gainNode],
            stop: () => {
                const stopTime = this.audioContext.currentTime;

                // Release envelope
                gainNode.gain.cancelScheduledValues(stopTime);
                gainNode.gain.setValueAtTime(gainNode.gain.value, stopTime);
                gainNode.gain.linearRampToValueAtTime(0, stopTime + releaseTime);

                // Stop oscillator after release
                oscillator.stop(stopTime + releaseTime);
            }
        };
    }

    playNote(note) {
        if (!this.noteFrequencies[note]) return;

        // Resume audio context if suspended (browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // Stop existing note if playing
        if (this.activeNotes.has(note)) {
            this.stopNote(note);
        }

        const frequency = this.noteFrequencies[note];
        const sound = this.createPianoSound(frequency);
        this.activeNotes.set(note, sound);

        return sound;
    }

    stopNote(note) {
        if (this.sustainActive) {
            this.sustainedNotes.add(note);
            return;
        }

        const sound = this.activeNotes.get(note);
        if (sound) {
            sound.stop();
            this.activeNotes.delete(note);
        }
    }

    setVolume(value) {
        this.masterGain.gain.value = value / 100;
    }

    setSustain(active) {
        this.sustainActive = active;

        if (!active) {
            // Release all sustained notes
            this.sustainedNotes.forEach(note => {
                const sound = this.activeNotes.get(note);
                if (sound) {
                    sound.stop();
                    this.activeNotes.delete(note);
                }
            });
            this.sustainedNotes.clear();
        }
    }
}

// ===================================
// RECORDING & PLAYBACK
// ===================================

class RecordingEngine {
    constructor() {
        this.recording = false;
        this.recordedNotes = [];
        this.startTime = 0;
    }

    startRecording() {
        this.recording = true;
        this.recordedNotes = [];
        this.startTime = Date.now();
    }

    stopRecording() {
        this.recording = false;
    }

    recordNote(note, isPress) {
        if (!this.recording) return;

        const timestamp = Date.now() - this.startTime;
        this.recordedNotes.push({
            note,
            timestamp,
            isPress
        });
    }

    async playback(piano) {
        if (this.recordedNotes.length === 0) return;

        const startTime = Date.now();

        for (const event of this.recordedNotes) {
            const targetTime = startTime + event.timestamp;
            const delay = targetTime - Date.now();

            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            if (event.isPress) {
                piano.pressKey(event.note);
            } else {
                piano.releaseKey(event.note);
            }
        }
    }

    hasRecording() {
        return this.recordedNotes.length > 0;
    }
}

// ===================================
// METRONOME
// ===================================

class Metronome {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.isPlaying = false;
        this.bpm = 120;
        this.intervalId = null;
    }

    start() {
        if (this.isPlaying) return;

        this.isPlaying = true;
        const interval = (60 / this.bpm) * 1000;

        this.tick();
        this.intervalId = setInterval(() => this.tick(), interval);
    }

    stop() {
        this.isPlaying = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    tick() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = 1000;
        gainNode.gain.value = 0.1;

        const now = this.audioContext.currentTime;
        oscillator.start(now);

        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.stop(now + 0.1);
    }
}

// ===================================
// AI COMPOSER ENGINE
// ===================================

class AIComposer {
    constructor(piano) {
        this.piano = piano;
        this.isPlaying = false;
        this.intervalId = null;
        this.currentMood = null;
        this.currentComposition = null;

        // Musical theory database
        this.musicTheory = {
            // Chord progressions for different moods
            chordProgressions: {
                happy: [
                    ['C4', 'E4', 'G4'], ['F4', 'A4', 'C5'], ['G4', 'B4', 'D5'], ['C4', 'E4', 'G4']
                ],
                sad: [
                    ['C4', 'D#4', 'G4'], ['G#4', 'C5', 'D#5'], ['F4', 'G#4', 'C5'], ['C4', 'D#4', 'G4']
                ],
                peaceful: [
                    ['C4', 'E4', 'G4'], ['G4', 'B4', 'D5'], ['A4', 'C5', 'E5'], ['F4', 'A4', 'C5']
                ],
                energetic: [
                    ['C4', 'E4', 'G4'], ['D4', 'F#4', 'A4'], ['G4', 'B4', 'D5'], ['C4', 'E4', 'G4']
                ],
                mysterious: [
                    ['C4', 'D#4', 'F#4'], ['D4', 'F4', 'G#4'], ['C4', 'E4', 'G#4'], ['C4', 'D#4', 'F#4']
                ],
                romantic: [
                    ['C4', 'E4', 'G4'], ['A4', 'C5', 'E5'], ['F4', 'A4', 'C5'], ['G4', 'B4', 'D5']
                ],
                epic: [
                    ['C4', 'E4', 'G4'], ['D4', 'F#4', 'A4'], ['E4', 'G#4', 'B4'], ['C4', 'E4', 'G4']
                ]
            },

            // Melodic scales for different moods
            scales: {
                major: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'],
                minor: ['C4', 'D4', 'D#4', 'F4', 'G4', 'G#4', 'A#4', 'C5', 'D5', 'D#5'],
                pentatonic: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5'],
                blues: ['C4', 'D#4', 'F4', 'F#4', 'G4', 'A#4', 'C5', 'D#5'],
                harmonic: ['C4', 'D4', 'D#4', 'F4', 'G4', 'G#4', 'B4', 'C5'],
                chromatic: ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5']
            },

            // Rhythmic patterns (in milliseconds)
            rhythms: {
                slow: [800, 1200, 800, 1600],
                moderate: [400, 600, 400, 800],
                fast: [200, 300, 200, 400],
                flowing: [500, 500, 500, 500],
                syncopated: [300, 200, 500, 400]
            }
        };

        // Mood configurations with expert musical parameters
        this.moodConfigs = {
            spring: {
                name: '🌸 Spring Blossom',
                scale: 'pentatonic',
                progression: 'happy',
                rhythm: 'moderate',
                tempo: 450,
                dynamics: 'light',
                pattern: 'ascending',
                description: 'Bright, uplifting melody with gentle flowing notes'
            },
            summer: {
                name: '☀️ Summer Joy',
                scale: 'major',
                progression: 'energetic',
                rhythm: 'fast',
                tempo: 350,
                dynamics: 'bright',
                pattern: 'playful',
                description: 'Energetic, joyful composition with vibrant rhythms'
            },
            autumn: {
                name: '🍂 Autumn Melancholy',
                scale: 'minor',
                progression: 'sad',
                rhythm: 'slow',
                tempo: 600,
                dynamics: 'mellow',
                pattern: 'descending',
                description: 'Melancholic, reflective melody with falling notes'
            },
            winter: {
                name: '❄️ Winter Serenity',
                scale: 'harmonic',
                progression: 'peaceful',
                rhythm: 'slow',
                tempo: 700,
                dynamics: 'soft',
                pattern: 'sparse',
                description: 'Serene, crystalline notes creating peaceful atmosphere'
            },
            rain: {
                name: '🌧️ Rainy Day',
                scale: 'blues',
                progression: 'sad',
                rhythm: 'flowing',
                tempo: 500,
                dynamics: 'gentle',
                pattern: 'cascading',
                description: 'Gentle, flowing melody like raindrops falling'
            },
            storm: {
                name: '⛈️ Thunderstorm',
                scale: 'chromatic',
                progression: 'mysterious',
                rhythm: 'syncopated',
                tempo: 300,
                dynamics: 'intense',
                pattern: 'chaotic',
                description: 'Dramatic, intense composition with powerful dynamics'
            },
            sunrise: {
                name: '🌅 Sunrise Hope',
                scale: 'major',
                progression: 'happy',
                rhythm: 'slow',
                tempo: 550,
                dynamics: 'building',
                pattern: 'ascending',
                description: 'Gradually brightening melody symbolizing new beginnings'
            },
            night: {
                name: '🌙 Peaceful Night',
                scale: 'pentatonic',
                progression: 'peaceful',
                rhythm: 'slow',
                tempo: 800,
                dynamics: 'whisper',
                pattern: 'gentle',
                description: 'Calm, soothing notes creating tranquil nighttime ambiance'
            },
            joy: {
                name: '😊 Pure Joy',
                scale: 'major',
                progression: 'happy',
                rhythm: 'fast',
                tempo: 300,
                dynamics: 'bright',
                pattern: 'jumping',
                description: 'Exuberant, uplifting melody full of happiness'
            },
            sadness: {
                name: '😢 Deep Sadness',
                scale: 'minor',
                progression: 'sad',
                rhythm: 'slow',
                tempo: 900,
                dynamics: 'soft',
                pattern: 'descending',
                description: 'Deeply emotional, sorrowful melody with heavy heart'
            },
            romantic: {
                name: '💕 Romantic Love',
                scale: 'major',
                progression: 'romantic',
                rhythm: 'moderate',
                tempo: 500,
                dynamics: 'warm',
                pattern: 'flowing',
                description: 'Tender, passionate melody expressing deep affection'
            },
            epic: {
                name: '⚔️ Epic Adventure',
                scale: 'major',
                progression: 'epic',
                rhythm: 'syncopated',
                tempo: 400,
                dynamics: 'powerful',
                pattern: 'heroic',
                description: 'Grand, heroic composition with powerful progressions'
            }
        };
    }

    // Analyze custom mood input and map to musical parameters
    analyzeMood(moodText) {
        const text = moodText.toLowerCase();

        // Keywords mapping to moods
        const keywords = {
            spring: ['spring', 'bloom', 'flower', 'fresh', 'renewal'],
            summer: ['summer', 'sun', 'bright', 'warm', 'vibrant'],
            autumn: ['autumn', 'fall', 'melancholy', 'nostalgic', 'leaves'],
            winter: ['winter', 'snow', 'cold', 'serene', 'quiet'],
            rain: ['rain', 'drizzle', 'wet', 'drops'],
            storm: ['storm', 'thunder', 'lightning', 'intense', 'dramatic'],
            sunrise: ['sunrise', 'dawn', 'morning', 'hope', 'beginning'],
            night: ['night', 'evening', 'dark', 'peaceful', 'calm'],
            joy: ['joy', 'happy', 'cheerful', 'excited', 'celebration'],
            sadness: ['sad', 'sorrow', 'grief', 'lonely', 'depressed'],
            romantic: ['love', 'romantic', 'passion', 'tender', 'affection'],
            epic: ['epic', 'heroic', 'grand', 'adventure', 'battle']
        };

        // Find best matching mood
        let bestMatch = 'peaceful';
        let maxScore = 0;

        for (const [mood, words] of Object.entries(keywords)) {
            const score = words.filter(word => text.includes(word)).length;
            if (score > maxScore) {
                maxScore = score;
                bestMatch = mood;
            }
        }

        return bestMatch;
    }

    // Generate melodic pattern based on mood configuration
    generateMelody(config) {
        const scale = this.musicTheory.scales[config.scale];
        const pattern = config.pattern;
        const melody = [];

        switch (pattern) {
            case 'ascending':
                // Gradually ascending melody
                for (let i = 0; i < 8; i++) {
                    melody.push(scale[Math.min(i, scale.length - 1)]);
                }
                break;

            case 'descending':
                // Gradually descending melody
                for (let i = 7; i >= 0; i--) {
                    melody.push(scale[Math.min(i, scale.length - 1)]);
                }
                break;

            case 'playful':
                // Jumping around playfully
                for (let i = 0; i < 8; i++) {
                    const jump = Math.floor(Math.random() * 4) - 2;
                    const index = Math.max(0, Math.min(scale.length - 1, i + jump));
                    melody.push(scale[index]);
                }
                break;

            case 'cascading':
                // Like water falling
                for (let i = 0; i < 8; i++) {
                    const index = Math.floor(Math.random() * scale.length);
                    melody.push(scale[index]);
                }
                break;

            case 'chaotic':
                // Random, intense
                for (let i = 0; i < 8; i++) {
                    melody.push(scale[Math.floor(Math.random() * scale.length)]);
                }
                break;

            case 'gentle':
            case 'flowing':
                // Smooth, connected notes
                let currentIndex = Math.floor(scale.length / 2);
                for (let i = 0; i < 8; i++) {
                    melody.push(scale[currentIndex]);
                    currentIndex += Math.random() > 0.5 ? 1 : -1;
                    currentIndex = Math.max(0, Math.min(scale.length - 1, currentIndex));
                }
                break;

            case 'jumping':
                // Large intervals
                for (let i = 0; i < 8; i++) {
                    const index = Math.floor(Math.random() * scale.length);
                    melody.push(scale[index]);
                }
                break;

            case 'heroic':
                // Strong, ascending with power
                melody.push(scale[0], scale[2], scale[4], scale[7], scale[9] || scale[7]);
                melody.push(scale[7], scale[4], scale[2], scale[0]);
                break;

            case 'sparse':
                // Few notes, lots of space
                for (let i = 0; i < 4; i++) {
                    melody.push(scale[i * 2]);
                }
                break;

            default:
                // Random from scale
                for (let i = 0; i < 8; i++) {
                    melody.push(scale[Math.floor(Math.random() * scale.length)]);
                }
        }

        return melody;
    }

    // Start composing based on mood
    compose(moodKey) {
        if (this.isPlaying) {
            this.stop();
        }

        const config = this.moodConfigs[moodKey];
        if (!config) return;

        this.currentMood = config;
        this.isPlaying = true;

        // Generate composition
        const melody = this.generateMelody(config);
        const chords = this.musicTheory.chordProgressions[config.progression];
        const rhythmPattern = this.musicTheory.rhythms[config.rhythm];

        this.currentComposition = {
            melody,
            chords,
            rhythmPattern,
            tempo: config.tempo
        };

        // Start playing
        this.playComposition();
    }

    playComposition() {
        let melodyIndex = 0;
        let chordIndex = 0;
        let rhythmIndex = 0;

        const playNextNote = () => {
            if (!this.isPlaying) return;

            // Play melody note
            const note = this.currentComposition.melody[melodyIndex];
            this.piano.pressKey(note);

            // Sometimes play chord (30% chance)
            if (Math.random() > 0.7) {
                const chord = this.currentComposition.chords[chordIndex];
                chord.forEach(chordNote => {
                    if (chordNote !== note) {
                        setTimeout(() => this.piano.pressKey(chordNote), 50);
                    }
                });
                chordIndex = (chordIndex + 1) % this.currentComposition.chords.length;
            }

            // Release note after duration
            const duration = this.currentComposition.rhythmPattern[rhythmIndex];
            setTimeout(() => {
                this.piano.releaseKey(note);
            }, duration * 0.8);

            // Move to next note
            melodyIndex = (melodyIndex + 1) % this.currentComposition.melody.length;
            rhythmIndex = (rhythmIndex + 1) % this.currentComposition.rhythmPattern.length;

            // Schedule next note
            this.intervalId = setTimeout(playNextNote, duration);
        };

        playNextNote();
    }

    stop() {
        this.isPlaying = false;
        if (this.intervalId) {
            clearTimeout(this.intervalId);
            this.intervalId = null;
        }
        this.currentMood = null;
    }
}


// ===================================
// MAESTRO AVATAR CONTROLLER
// ===================================

class MaestroAvatar {
    constructor() {
        this.container = document.querySelector('.maestro-container');
        this.statusDot = document.querySelector('.status-dot');
        this.statusText = document.getElementById('maestro-text');
        this.mouth = document.getElementById('maestro-mouth');
        this.isPlaying = false;
        this.reactionTimeout = null;
    }

    startComposing(moodName) {
        this.isPlaying = true;
        this.container.classList.add('maestro-playing');
        this.statusDot.classList.add('active');
        this.statusText.textContent = `Composing: ${moodName}`;
    }

    stopComposing() {
        this.isPlaying = false;
        this.container.classList.remove('maestro-playing');
        this.statusDot.classList.remove('active');
        this.statusText.textContent = 'Listening...';
    }

    reactToNote(note) {
        // Simple reaction even when not "composing" (user playing)
        if (!this.isPlaying) {
            this.statusDot.classList.add('active');

            // Random mouth movement
            const curve = Math.random() * 10 + 20;
            if (this.mouth) {
                this.mouth.setAttribute('d', `M-20,20 Q0,${curve} 20,20`);
            }

            if (this.reactionTimeout) clearTimeout(this.reactionTimeout);
            this.reactionTimeout = setTimeout(() => {
                this.statusDot.classList.remove('active');
                if (this.mouth) {
                    this.mouth.setAttribute('d', "M-20,20 Q0,20 20,20");
                }
            }, 200);
        }
    }
}

// ===================================
// PIANO CONTROLLER
// ===================================

class VirtualPiano {
    constructor() {
        this.audioEngine = new PianoAudioEngine();
        this.recordingEngine = new RecordingEngine();
        this.metronome = new Metronome(this.audioEngine.audioContext);
        this.recordingEngine = new RecordingEngine();
        this.metronome = new Metronome(this.audioEngine.audioContext);
        this.aiComposer = new AIComposer(this);
        this.maestro = new MaestroAvatar();

        // Key mapping
        this.keyMap = {
            'A': 'C4', 'W': 'C#4', 'S': 'D4', 'E': 'D#4', 'D': 'E4',
            'F': 'F4', 'T': 'F#4', 'G': 'G4', 'Y': 'G#4', 'H': 'A4',
            'U': 'A#4', 'J': 'B4', 'K': 'C5', 'O': 'C#5', 'L': 'D5',
            'P': 'D#5', ';': 'E5'
        };

        this.pressedKeys = new Set();
        this.notesPlayed = 0;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupControls();
        this.updateUI();
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Mouse events for piano keys
        document.querySelectorAll('.key').forEach(key => {
            key.addEventListener('mousedown', () => {
                const note = key.dataset.note;
                this.pressKey(note);
            });

            key.addEventListener('mouseup', () => {
                const note = key.dataset.note;
                this.releaseKey(note);
            });

            key.addEventListener('mouseleave', () => {
                const note = key.dataset.note;
                this.releaseKey(note);
            });
        });
    }

    setupControls() {
        // Volume control
        const volumeSlider = document.getElementById('volume');
        const volumeValue = document.getElementById('volumeValue');

        volumeSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            this.audioEngine.setVolume(value);
            volumeValue.textContent = `${value}%`;
        });

        // Sustain button
        const sustainBtn = document.getElementById('sustainBtn');
        sustainBtn.addEventListener('click', () => {
            this.toggleSustain();
        });

        // Record button
        const recordBtn = document.getElementById('recordBtn');
        recordBtn.addEventListener('click', () => {
            this.toggleRecording();
        });

        // Playback button
        const playbackBtn = document.getElementById('playbackBtn');
        playbackBtn.addEventListener('click', () => {
            this.playRecording();
        });

        // Metronome button
        const metronomeBtn = document.getElementById('metronomeBtn');
        metronomeBtn.addEventListener('click', () => {
            this.toggleMetronome();
        });

        // AI Composer controls
        const moodInput = document.getElementById('moodInput');
        const composeMoodBtn = document.getElementById('composeMoodBtn');
        const stopComposerBtn = document.getElementById('stopComposerBtn');

        // Compose from custom input
        composeMoodBtn.addEventListener('click', () => {
            const moodText = moodInput.value.trim();
            if (moodText) {
                const moodKey = this.aiComposer.analyzeMood(moodText);
                this.composeMusic(moodKey, moodText);
            }
        });

        // Allow Enter key to compose
        moodInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const moodText = moodInput.value.trim();
                if (moodText) {
                    const moodKey = this.aiComposer.analyzeMood(moodText);
                    this.composeMusic(moodKey, moodText);
                }
            }
        });

        // Preset mood buttons
        document.querySelectorAll('.mood-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                const moodKey = btn.dataset.mood;
                const moodName = btn.textContent;
                this.composeMusic(moodKey, moodName);

                // Visual feedback
                document.querySelectorAll('.mood-preset').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Stop composer button
        stopComposerBtn.addEventListener('click', () => {
            this.stopComposer();
        });
    }

    handleKeyDown(e) {
        const key = e.key.toUpperCase();

        // Prevent repeat events
        if (this.pressedKeys.has(key)) return;

        // Handle spacebar for sustain
        if (e.code === 'Space') {
            e.preventDefault();
            if (!this.audioEngine.sustainActive) {
                this.toggleSustain();
            }
            return;
        }

        const note = this.keyMap[key];
        if (note) {
            e.preventDefault();
            this.pressedKeys.add(key);
            this.pressKey(note);
        }
    }

    handleKeyUp(e) {
        const key = e.key.toUpperCase();

        // Handle spacebar for sustain
        if (e.code === 'Space') {
            e.preventDefault();
            if (this.audioEngine.sustainActive) {
                this.toggleSustain();
            }
            return;
        }

        const note = this.keyMap[key];
        if (note) {
            e.preventDefault();
            this.pressedKeys.delete(key);
            this.releaseKey(note);
        }
    }

    pressKey(note) {
        // Play sound
        this.audioEngine.playNote(note);

        // Visual feedback
        const keyElement = document.querySelector(`[data-note="${note}"]`);
        if (keyElement) {
            keyElement.classList.add('active');
        }

        // Record if recording
        this.recordingEngine.recordNote(note, true);

        // Notify Maestro
        this.maestro.reactToNote(note);

        // Update stats
        this.notesPlayed++;
        this.updateUI();
    }

    releaseKey(note) {
        // Stop sound
        this.audioEngine.stopNote(note);

        // Visual feedback
        const keyElement = document.querySelector(`[data-note="${note}"]`);
        if (keyElement && !this.audioEngine.sustainActive) {
            keyElement.classList.remove('active');
        }

        // Record if recording
        this.recordingEngine.recordNote(note, false);
    }

    toggleSustain() {
        const isActive = !this.audioEngine.sustainActive;
        this.audioEngine.setSustain(isActive);

        const sustainBtn = document.getElementById('sustainBtn');
        sustainBtn.classList.toggle('active', isActive);

        // Remove visual feedback from all keys if sustain is off
        if (!isActive) {
            document.querySelectorAll('.key.active').forEach(key => {
                key.classList.remove('active');
            });
        }

        this.updateUI();
    }

    toggleRecording() {
        const recordBtn = document.getElementById('recordBtn');

        if (this.recordingEngine.recording) {
            this.recordingEngine.stopRecording();
            recordBtn.classList.remove('active');

            // Enable playback if we have a recording
            if (this.recordingEngine.hasRecording()) {
                document.getElementById('playbackBtn').disabled = false;
            }
        } else {
            this.recordingEngine.startRecording();
            recordBtn.classList.add('active');
        }

        this.updateUI();
    }

    async playRecording() {
        const playbackBtn = document.getElementById('playbackBtn');
        playbackBtn.disabled = true;
        playbackBtn.classList.add('active');

        await this.recordingEngine.playback(this);

        playbackBtn.disabled = false;
        playbackBtn.classList.remove('active');
    }

    toggleMetronome() {
        const metronomeBtn = document.getElementById('metronomeBtn');

        if (this.metronome.isPlaying) {
            this.metronome.stop();
            metronomeBtn.classList.remove('active');
        } else {
            this.metronome.start();
            metronomeBtn.classList.add('active');
        }

        this.updateUI();
    }

    composeMusic(moodKey, displayName) {
        this.aiComposer.compose(moodKey);

        // Update UI
        const currentMoodEl = document.getElementById('currentMood');
        const stopBtn = document.getElementById('stopComposerBtn');

        currentMoodEl.textContent = `♪ Playing: ${displayName}`;
        currentMoodEl.classList.add('active');
        stopBtn.disabled = false;

        // Activate Maestro
        this.maestro.startComposing(displayName);
    }

    stopComposer() {
        this.aiComposer.stop();

        // Update UI
        const currentMoodEl = document.getElementById('currentMood');
        const stopBtn = document.getElementById('stopComposerBtn');

        currentMoodEl.textContent = 'No composition playing';
        currentMoodEl.classList.remove('active');
        stopBtn.disabled = true;

        // Remove active state from preset buttons
        document.querySelectorAll('.mood-preset').forEach(b => b.classList.remove('active'));

        // Deactivate Maestro
        this.maestro.stopComposing();
    }

    updateUI() {
        // Update status displays
        document.getElementById('recordStatus').textContent =
            this.recordingEngine.recording ? 'Recording...' : 'Inactive';
        document.getElementById('recordStatus').classList.toggle(
            'active',
            this.recordingEngine.recording
        );

        document.getElementById('sustainStatus').textContent =
            this.audioEngine.sustainActive ? 'On' : 'Off';
        document.getElementById('sustainStatus').classList.toggle(
            'active',
            this.audioEngine.sustainActive
        );

        document.getElementById('metronomeStatus').textContent =
            this.metronome.isPlaying ? 'On' : 'Off';
        document.getElementById('metronomeStatus').classList.toggle(
            'active',
            this.metronome.isPlaying
        );



        document.getElementById('notesPlayed').textContent = this.notesPlayed;
    }
}

// ===================================
// INITIALIZATION
// ===================================

// Initialize piano when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const piano = new VirtualPiano();

    // Add visual feedback for page load
    console.log('%c🎹 Virtual Piano Studio Loaded', 'color: #667eea; font-size: 16px; font-weight: bold;');
    console.log('%cPress any key to start playing!', 'color: #a0aec0; font-size: 12px;');
});
