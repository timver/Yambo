/**
 * Audio Service
 * Handles Web Audio API context, loading, decoding, and playback
 * No jQuery or Modernizr dependencies - uses native feature detection
 */

export class AudioService {
  // Sound effect names mapped to file names
  static FX = {
    fullHouse: 'fullhouse',
    threeOfAKind: 'threeofakind',
    fourOfAKind: 'fourofakind',
    straight: 'street',
    yambo: 'yam',
    rollDice: 'rolldice2',
    juggleDice: 'juggledice3',
    selectDice: 'select3',
    deselectDice: 'deselect4',
    save: 'save5',
    scratch: 'shit',
    minimize: 'minimize5',
    maximize: 'maximize',
    timer: 'clock',
    woosh: 'woosh',
    error: 'error5'
  };

  #context = null;
  #buffers = new Map();
  #currentSource = null;
  #enabled = true;
  #basePath = 'audio';

  constructor(options = {}) {
    this.#basePath = options.basePath || 'audio';
    this.#enabled = options.enabled ?? true;
  }

  /**
   * Check if Web Audio API is supported
   * @returns {boolean}
   */
  get isSupported() {
    return typeof AudioContext !== 'undefined' &&
           typeof XMLHttpRequest !== 'undefined' &&
           typeof ArrayBuffer !== 'undefined';
  }

  /**
   * Get the best supported audio extension
   * @returns {string} 'mp3', 'ogg', or 'wav'
   */
  get extension() {
    const audio = document.createElement('audio');
    if (audio.canPlayType('audio/mpeg')) return 'mp3';
    if (audio.canPlayType('audio/ogg')) return 'ogg';
    return 'wav';
  }

  /**
   * Check if audio is enabled
   * @returns {boolean}
   */
  get enabled() {
    return this.#enabled;
  }

  /**
   * Enable or disable audio
   * @param {boolean} value
   */
  set enabled(value) {
    this.#enabled = value;
    if (!value) {
      this.stop();
    }
  }

  /**
   * Initialize the audio context and load all sound effects
   * Must be called after a user interaction (browser autoplay policy)
   * @returns {Promise<void>}
   */
  async init() {
    if (!this.isSupported) {
      console.warn('Web Audio API not supported');
      return;
    }

    if (this.#context) {
      return; // Already initialized
    }

    this.#context = new AudioContext();

    // Load all sound effects in parallel
    const loadPromises = Object.values(AudioService.FX).map(filename =>
      this.#loadFile(filename)
    );

    await Promise.allSettled(loadPromises);
  }

  /**
   * Resume audio context (required after user interaction)
   * @returns {Promise<void>}
   */
  async resume() {
    if (this.#context?.state === 'suspended') {
      await this.#context.resume();
    }
  }

  /**
   * Load and decode an audio file
   * @param {string} filename - Audio file name (without extension)
   * @returns {Promise<void>}
   */
  async #loadFile(filename) {
    if (this.#buffers.has(filename)) {
      return; // Already loaded
    }

    const filepath = `${this.#basePath}/${this.extension}/${filename}.${this.extension}`;

    try {
      const response = await fetch(filepath);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.#context.decodeAudioData(arrayBuffer);
      this.#buffers.set(filename, audioBuffer);
    } catch (error) {
      console.warn(`Failed to load audio: ${filename}`, error);
    }
  }

  /**
   * Play a sound effect
   * @param {string} filename - Sound effect file name
   * @param {boolean} loop - Whether to loop the sound
   * @returns {AudioBufferSourceNode|null}
   */
  play(filename, loop = false) {
    if (!this.#enabled || !this.#context || !filename) {
      return null;
    }

    const buffer = this.#buffers.get(filename);
    if (!buffer) {
      console.warn(`Audio not loaded: ${filename}`);
      return null;
    }

    // Resume context if suspended
    if (this.#context.state === 'suspended') {
      this.#context.resume();
    }

    const source = this.#context.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    source.connect(this.#context.destination);
    source.start(0);

    // Keep reference for looping sounds
    if (loop) {
      this.#currentSource = source;
    }

    return source;
  }

  /**
   * Stop the currently looping sound
   */
  stop() {
    if (this.#currentSource) {
      try {
        this.#currentSource.stop(0);
        this.#currentSource.disconnect();
      } catch (e) {
        // Ignore if already stopped
      }
      this.#currentSource = null;
    }
  }

  /**
   * Play sound for dice selection
   * @param {boolean} selected - True if selecting, false if deselecting
   */
  playDiceSelect(selected) {
    const fx = selected ? AudioService.FX.selectDice : AudioService.FX.deselectDice;
    this.play(fx);
  }

  /**
   * Play sound for dice roll
   */
  playRoll() {
    this.play(AudioService.FX.rollDice);
  }

  /**
   * Start juggling sound (loops)
   */
  startJuggle() {
    this.play(AudioService.FX.juggleDice, true);
  }

  /**
   * Stop juggling sound
   */
  stopJuggle() {
    this.stop();
  }

  /**
   * Play sound for a combination
   * @param {'fullHouse'|'threeOfAKind'|'fourOfAKind'|'straight'|'yambo'} combo
   */
  playCombination(combo) {
    const fx = AudioService.FX[combo];
    if (fx) {
      this.play(fx);
    }
  }

  /**
   * Play sound for saving a score
   */
  playSave() {
    this.play(AudioService.FX.save);
  }

  /**
   * Play sound for scratching a cell
   */
  playScratch() {
    this.play(AudioService.FX.scratch);
  }

  /**
   * Play error sound
   */
  playError() {
    this.play(AudioService.FX.error);
  }
}

// Singleton instance for convenience
export const audioService = new AudioService();
