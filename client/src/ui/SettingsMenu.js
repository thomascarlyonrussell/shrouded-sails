export class SettingsMenu {
    constructor(onSettingsConfirmed, audioManager = null) {
        this.storageKey = 'shrouded_sails_settings_v1';
        this.onSettingsConfirmed = onSettingsConfirmed;
        this.audioManager = audioManager;
        this.defaultSettings = {
            fogEnabled: true,  // Default to enabled
            combatDetailLevel: 'detailed',
            audio: {
                masterVolume: 70,
                effectsVolume: 80,
                uiVolume: 70,
                musicVolume: 50,
                muted: false
            }
        };
        this.settings = this.loadSettings();

        this.menuElement = null;
        this.fogCheckbox = null;
        this.combatDetailSelect = null;
        this.muteAllCheckbox = null;
        this.masterVolumeSlider = null;
        this.effectsVolumeSlider = null;
        this.uiVolumeSlider = null;
        this.musicVolumeSlider = null;
        this.masterVolumeValue = null;
        this.effectsVolumeValue = null;
        this.uiVolumeValue = null;
        this.musicVolumeValue = null;
        this.startGameBtn = null;
        this.startTutorialBtn = null;

        this.initialize();
    }

    loadSettings() {
        let persisted = null;
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                persisted = JSON.parse(raw);
            }
        } catch (error) {
            console.warn('[SettingsMenu] Failed to read settings from localStorage.', error);
        }

        const merged = {
            ...this.defaultSettings,
            ...(persisted || {}),
            audio: {
                ...this.defaultSettings.audio,
                ...((persisted && persisted.audio) || {})
            }
        };

        merged.audio.masterVolume = this.normalizeVolume(merged.audio.masterVolume, this.defaultSettings.audio.masterVolume);
        merged.audio.effectsVolume = this.normalizeVolume(merged.audio.effectsVolume, this.defaultSettings.audio.effectsVolume);
        merged.audio.uiVolume = this.normalizeVolume(merged.audio.uiVolume, this.defaultSettings.audio.uiVolume);
        merged.audio.musicVolume = this.normalizeVolume(merged.audio.musicVolume, this.defaultSettings.audio.musicVolume);
        merged.audio.muted = Boolean(merged.audio.muted);
        merged.combatDetailLevel = merged.combatDetailLevel === 'compact' ? 'compact' : 'detailed';
        merged.fogEnabled = Boolean(merged.fogEnabled);

        return merged;
    }

    saveSettings() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
        } catch (error) {
            console.warn('[SettingsMenu] Failed to persist settings to localStorage.', error);
        }
    }

    normalizeVolume(value, fallback = 0) {
        const parsed = Number.parseInt(value, 10);
        if (!Number.isFinite(parsed)) return fallback;
        return Math.max(0, Math.min(100, parsed));
    }

    applyAudioSettingsLive() {
        if (this.audioManager) {
            this.audioManager.applySettings(this.settings.audio);
        }
    }

    updateAudioValueLabels() {
        if (this.masterVolumeValue) {
            this.masterVolumeValue.textContent = `${this.settings.audio.masterVolume}%`;
        }
        if (this.effectsVolumeValue) {
            this.effectsVolumeValue.textContent = `${this.settings.audio.effectsVolume}%`;
        }
        if (this.uiVolumeValue) {
            this.uiVolumeValue.textContent = `${this.settings.audio.uiVolume}%`;
        }
        if (this.musicVolumeValue) {
            this.musicVolumeValue.textContent = `${this.settings.audio.musicVolume}%`;
        }
    }

    initialize() {
        // Get or create menu elements
        this.menuElement = document.getElementById('settingsModal');
        this.fogCheckbox = document.getElementById('fogOfWarCheckbox');
        this.combatDetailSelect = document.getElementById('combatDetailLevelSelect');
        this.muteAllCheckbox = document.getElementById('muteAllCheckbox');
        this.masterVolumeSlider = document.getElementById('masterVolumeSlider');
        this.effectsVolumeSlider = document.getElementById('effectsVolumeSlider');
        this.uiVolumeSlider = document.getElementById('uiVolumeSlider');
        this.musicVolumeSlider = document.getElementById('musicVolumeSlider');
        this.masterVolumeValue = document.getElementById('masterVolumeValue');
        this.effectsVolumeValue = document.getElementById('effectsVolumeValue');
        this.uiVolumeValue = document.getElementById('uiVolumeValue');
        this.musicVolumeValue = document.getElementById('musicVolumeValue');
        this.startGameBtn = document.getElementById('startGameBtn');
        this.startTutorialBtn = document.getElementById('startTutorialBtn');

        if (!this.menuElement || !this.fogCheckbox) {
            console.error('Settings menu elements not found in DOM');
            return;
        }

        // Set initial checkbox state
        this.fogCheckbox.checked = this.settings.fogEnabled;
        if (this.combatDetailSelect) {
            this.combatDetailSelect.value = this.settings.combatDetailLevel;
        }
        if (this.muteAllCheckbox) {
            this.muteAllCheckbox.checked = this.settings.audio.muted;
        }
        if (this.masterVolumeSlider) {
            this.masterVolumeSlider.value = String(this.settings.audio.masterVolume);
        }
        if (this.effectsVolumeSlider) {
            this.effectsVolumeSlider.value = String(this.settings.audio.effectsVolume);
        }
        if (this.uiVolumeSlider) {
            this.uiVolumeSlider.value = String(this.settings.audio.uiVolume);
        }
        if (this.musicVolumeSlider) {
            this.musicVolumeSlider.value = String(this.settings.audio.musicVolume);
        }
        this.updateAudioValueLabels();
        this.applyAudioSettingsLive();

        // Add event listener for checkbox
        this.fogCheckbox.addEventListener('change', (e) => {
            this.settings.fogEnabled = e.target.checked;
            console.log(`Fog of War: ${this.settings.fogEnabled ? 'Enabled' : 'Disabled'}`);
            this.saveSettings();
        });

        if (this.combatDetailSelect) {
            this.combatDetailSelect.addEventListener('change', (e) => {
                const nextLevel = e.target.value === 'compact' ? 'compact' : 'detailed';
                this.settings.combatDetailLevel = nextLevel;
                console.log(`Combat Report Detail: ${nextLevel}`);
                this.saveSettings();
            });
        }

        if (this.muteAllCheckbox) {
            this.muteAllCheckbox.addEventListener('change', (e) => {
                this.settings.audio.muted = e.target.checked;
                this.applyAudioSettingsLive();
                this.saveSettings();
            });
        }

        if (this.masterVolumeSlider) {
            this.masterVolumeSlider.addEventListener('input', (e) => {
                this.settings.audio.masterVolume = this.normalizeVolume(e.target.value, this.defaultSettings.audio.masterVolume);
                this.updateAudioValueLabels();
                this.applyAudioSettingsLive();
                this.saveSettings();
            });
        }

        if (this.effectsVolumeSlider) {
            this.effectsVolumeSlider.addEventListener('input', (e) => {
                this.settings.audio.effectsVolume = this.normalizeVolume(e.target.value, this.defaultSettings.audio.effectsVolume);
                this.updateAudioValueLabels();
                this.applyAudioSettingsLive();
                this.saveSettings();
            });
        }

        if (this.uiVolumeSlider) {
            this.uiVolumeSlider.addEventListener('input', (e) => {
                this.settings.audio.uiVolume = this.normalizeVolume(e.target.value, this.defaultSettings.audio.uiVolume);
                this.updateAudioValueLabels();
                this.applyAudioSettingsLive();
                this.saveSettings();
            });
        }

        if (this.musicVolumeSlider) {
            this.musicVolumeSlider.addEventListener('input', (e) => {
                this.settings.audio.musicVolume = this.normalizeVolume(e.target.value, this.defaultSettings.audio.musicVolume);
                this.updateAudioValueLabels();
                this.applyAudioSettingsLive();
                this.saveSettings();
            });
        }

        // Add event listener for start game button
        if (this.startGameBtn) {
            this.startGameBtn.addEventListener('click', () => this.confirmSettings('standard'));
        }

        if (this.startTutorialBtn) {
            this.startTutorialBtn.addEventListener('click', () => this.confirmSettings('tutorial'));
        }
    }

    confirmSettings(launchMode = 'standard') {
        this.hide();
        this.saveSettings();
        if (this.onSettingsConfirmed) {
            this.onSettingsConfirmed({
                settings: {
                    ...this.settings,
                    audio: { ...this.settings.audio }
                },
                launchMode: launchMode === 'tutorial' ? 'tutorial' : 'standard'
            });
        }
    }

    show() {
        if (this.menuElement) {
            // Re-sync audio UI in case values changed via in-game panel
            if (this.muteAllCheckbox) this.muteAllCheckbox.checked = this.settings.audio.muted;
            if (this.masterVolumeSlider) this.masterVolumeSlider.value = String(this.settings.audio.masterVolume);
            if (this.effectsVolumeSlider) this.effectsVolumeSlider.value = String(this.settings.audio.effectsVolume);
            if (this.uiVolumeSlider) this.uiVolumeSlider.value = String(this.settings.audio.uiVolume);
            if (this.musicVolumeSlider) this.musicVolumeSlider.value = String(this.settings.audio.musicVolume);
            this.updateAudioValueLabels();

            this.menuElement.classList.remove('hidden');
            this.applyAudioSettingsLive();
            if (this.audioManager) {
                this.audioManager.play('menu_open');
            }
        }
    }

    hide() {
        if (this.menuElement) {
            this.menuElement.classList.add('hidden');
            if (this.audioManager) {
                this.audioManager.play('menu_close');
            }
        }
    }

    getSettings() {
        return this.settings;
    }
}
