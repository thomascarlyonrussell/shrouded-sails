const DEFAULT_AUDIO_SETTINGS = {
    masterVolume: 70,
    effectsVolume: 80,
    uiVolume: 70,
    muted: false
};

const SOUND_DEFINITIONS = {
    cannon_fire: { category: 'effects', gain: 0.9, cooldownMs: 70 },
    cannon_hit: { category: 'effects', gain: 0.8, cooldownMs: 40 },
    cannon_miss: { category: 'effects', gain: 0.65, cooldownMs: 40 },
    boarding_attempt: { category: 'effects', gain: 0.75, cooldownMs: 80 },
    boarding_success: { category: 'effects', gain: 0.9, cooldownMs: 120 },
    boarding_failure: { category: 'effects', gain: 0.8, cooldownMs: 120 },
    ship_sunk: { category: 'effects', gain: 1.0, cooldownMs: 220 },
    ship_move: { category: 'effects', gain: 0.65, cooldownMs: 100 },
    turn_start: { category: 'effects', gain: 0.75, cooldownMs: 140 },
    turn_end: { category: 'effects', gain: 0.7, cooldownMs: 140 },
    ship_select: { category: 'ui', gain: 0.55, cooldownMs: 70 },
    invalid_action: { category: 'ui', gain: 0.8, cooldownMs: 90 },
    button_hover: { category: 'ui', gain: 0.4, cooldownMs: 120 },
    menu_open: { category: 'ui', gain: 0.6, cooldownMs: 120 },
    menu_close: { category: 'ui', gain: 0.55, cooldownMs: 120 }
};

export class AudioManager {
    constructor() {
        this.soundDefinitions = SOUND_DEFINITIONS;
        this.settings = { ...DEFAULT_AUDIO_SETTINGS };
        this.soundSources = new Map();
        this.warnedMissing = new Set();
        this.lastPlayAt = new Map();
        this.hoverListenerBound = false;
        this.basePath = 'assets/sounds';
    }

    getSupportedExtensions() {
        const probe = document.createElement('audio');
        const oggSupport = probe.canPlayType('audio/ogg; codecs="vorbis"');
        const mp3Support = probe.canPlayType('audio/mpeg');
        const prefersOgg = oggSupport === 'probably' || oggSupport === 'maybe';
        const prefersMp3 = mp3Support === 'probably' || mp3Support === 'maybe';

        if (prefersOgg && prefersMp3) return ['ogg', 'mp3'];
        if (prefersOgg) return ['ogg', 'mp3'];
        if (prefersMp3) return ['mp3', 'ogg'];
        return ['ogg', 'mp3'];
    }

    async preload() {
        const keys = Object.keys(this.soundDefinitions);
        await Promise.all(keys.map(key => this.resolveSourceForKey(key)));
    }

    async resolveSourceForKey(key) {
        if (this.soundSources.has(key)) {
            return this.soundSources.get(key);
        }

        const supportedExtensions = this.getSupportedExtensions();
        for (const extension of supportedExtensions) {
            const source = `${this.basePath}/${key}.${extension}`;
            const available = await this.canLoadSource(source);
            if (available) {
                this.soundSources.set(key, source);
                return source;
            }
        }

        this.soundSources.set(key, null);
        if (!this.warnedMissing.has(key)) {
            console.warn(`[Audio] Missing sound asset pair for "${key}" in ${this.basePath}/ (${key}.ogg + ${key}.mp3 expected).`);
            this.warnedMissing.add(key);
        }
        return null;
    }

    canLoadSource(source) {
        return new Promise((resolve) => {
            const audio = new Audio();
            let settled = false;

            const cleanup = () => {
                audio.oncanplaythrough = null;
                audio.onerror = null;
                audio.onstalled = null;
                audio.onabort = null;
            };

            const finish = (result) => {
                if (settled) return;
                settled = true;
                cleanup();
                resolve(result);
            };

            audio.preload = 'auto';
            audio.oncanplaythrough = () => finish(true);
            audio.onerror = () => finish(false);
            audio.onstalled = () => finish(false);
            audio.onabort = () => finish(false);
            audio.src = source;
            audio.load();

            setTimeout(() => finish(false), 3000);
        });
    }

    applySettings(nextSettings = {}) {
        const merged = {
            ...this.settings,
            ...nextSettings
        };

        this.settings.masterVolume = this.clampVolume(merged.masterVolume);
        this.settings.effectsVolume = this.clampVolume(merged.effectsVolume);
        this.settings.uiVolume = this.clampVolume(merged.uiVolume);
        this.settings.muted = Boolean(merged.muted);
    }

    getSettings() {
        return { ...this.settings };
    }

    clampVolume(value) {
        const numeric = Number.parseInt(value, 10);
        if (!Number.isFinite(numeric)) return 0;
        return Math.max(0, Math.min(100, numeric));
    }

    async play(key, options = {}) {
        const definition = this.soundDefinitions[key];
        if (!definition) return false;
        if (this.settings.muted) return false;

        const now = performance.now();
        const cooldownMs = Number.isFinite(options.cooldownMs) ? options.cooldownMs : definition.cooldownMs;
        const lastPlayedAt = this.lastPlayAt.get(key) || 0;
        if (now - lastPlayedAt < cooldownMs) {
            return false;
        }

        const source = await this.resolveSourceForKey(key);
        if (!source) {
            return false;
        }

        const audio = new Audio(source);
        audio.volume = this.computeVolume(definition, options.volumeMultiplier);
        this.lastPlayAt.set(key, now);

        try {
            await audio.play();
            return true;
        } catch (error) {
            return false;
        }
    }

    playDelayed(key, delayMs = 0, options = {}) {
        setTimeout(() => {
            this.play(key, options);
        }, Math.max(0, delayMs));
    }

    computeVolume(definition, volumeMultiplier = 1) {
        const master = this.settings.masterVolume / 100;
        const channel = definition.category === 'ui'
            ? this.settings.uiVolume / 100
            : this.settings.effectsVolume / 100;
        const output = master * channel * definition.gain * Math.max(0, volumeMultiplier);
        return Math.max(0, Math.min(1, output));
    }

    setupGlobalUIHoverSound() {
        if (this.hoverListenerBound) return;
        this.hoverListenerBound = true;

        document.addEventListener('mouseover', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            if (!target.closest('button, .action-btn, .combat-feed-button, .combat-feed-close')) return;
            this.play('button_hover');
        });
    }
}
