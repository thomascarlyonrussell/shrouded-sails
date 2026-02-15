export class InGameSettingsPanel {
    constructor(settingsRef, audioManager, onOpen = null, onClose = null) {
        this.settings = settingsRef;
        this.audioManager = audioManager;
        this.onOpen = onOpen;
        this.onClose = onClose;
        this.storageKey = 'shrouded_sails_settings_v1';
        this.isOpen = false;

        this.panelEl = document.getElementById('inGameSettingsPanel');
        this.backdropEl = document.getElementById('inGameSettingsBackdrop');
        this.buttonEl = document.getElementById('inGameSettingsButton');
        this.closeEl = document.getElementById('inGameSettingsClose');
        this.muteCheckbox = document.getElementById('igMuteAllCheckbox');
        this.masterSlider = document.getElementById('igMasterVolumeSlider');
        this.effectsSlider = document.getElementById('igEffectsVolumeSlider');
        this.uiSlider = document.getElementById('igUiVolumeSlider');
        this.musicSlider = document.getElementById('igMusicVolumeSlider');
        this.masterValue = document.getElementById('igMasterVolumeValue');
        this.effectsValue = document.getElementById('igEffectsVolumeValue');
        this.uiValue = document.getElementById('igUiVolumeValue');
        this.musicValue = document.getElementById('igMusicVolumeValue');
        this.boundToggle = () => this.toggle();
        this.boundClose = () => this.close();
        this.boundBackdropClose = () => this.close();
        this.boundMuteChange = (e) => {
            this.settings.audio.muted = e.target.checked;
            this.applyAndSave();
        };
        this.boundMasterInput = (e) => {
            this.settings.audio.masterVolume = this.normalizeVolume(e.target.value);
            this.updateValueLabels();
            this.applyAndSave();
        };
        this.boundEffectsInput = (e) => {
            this.settings.audio.effectsVolume = this.normalizeVolume(e.target.value);
            this.updateValueLabels();
            this.applyAndSave();
        };
        this.boundUiInput = (e) => {
            this.settings.audio.uiVolume = this.normalizeVolume(e.target.value);
            this.updateValueLabels();
            this.applyAndSave();
        };
        this.boundMusicInput = (e) => {
            this.settings.audio.musicVolume = this.normalizeVolume(e.target.value);
            this.updateValueLabels();
            this.applyAndSave();
        };

        this.boundKeyDown = (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        };

        this.initialize();
    }

    initialize() {
        if (this.buttonEl) {
            this.buttonEl.addEventListener('click', this.boundToggle);
        }
        if (this.closeEl) {
            this.closeEl.addEventListener('click', this.boundClose);
        }
        if (this.backdropEl) {
            this.backdropEl.addEventListener('click', this.boundBackdropClose);
        }

        this.setupAudioControls();
        this.syncFromSettings();
    }

    setupAudioControls() {
        if (this.muteCheckbox) {
            this.muteCheckbox.addEventListener('change', this.boundMuteChange);
        }
        if (this.masterSlider) {
            this.masterSlider.addEventListener('input', this.boundMasterInput);
        }
        if (this.effectsSlider) {
            this.effectsSlider.addEventListener('input', this.boundEffectsInput);
        }
        if (this.uiSlider) {
            this.uiSlider.addEventListener('input', this.boundUiInput);
        }
        if (this.musicSlider) {
            this.musicSlider.addEventListener('input', this.boundMusicInput);
        }
    }

    normalizeVolume(value) {
        const parsed = Number.parseInt(value, 10);
        if (!Number.isFinite(parsed)) return 0;
        return Math.max(0, Math.min(100, parsed));
    }

    applyAndSave() {
        if (this.audioManager) {
            this.audioManager.applySettings(this.settings.audio);
        }
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
        } catch (err) {
            console.warn('[InGameSettingsPanel] Failed to persist settings.', err);
        }
    }

    syncFromSettings() {
        if (this.muteCheckbox) this.muteCheckbox.checked = this.settings.audio.muted;
        if (this.masterSlider) this.masterSlider.value = String(this.settings.audio.masterVolume);
        if (this.effectsSlider) this.effectsSlider.value = String(this.settings.audio.effectsVolume);
        if (this.uiSlider) this.uiSlider.value = String(this.settings.audio.uiVolume);
        if (this.musicSlider) this.musicSlider.value = String(this.settings.audio.musicVolume || 50);
        this.updateValueLabels();
    }

    updateValueLabels() {
        if (this.masterValue) this.masterValue.textContent = `${this.settings.audio.masterVolume}%`;
        if (this.effectsValue) this.effectsValue.textContent = `${this.settings.audio.effectsVolume}%`;
        if (this.uiValue) this.uiValue.textContent = `${this.settings.audio.uiVolume}%`;
        if (this.musicValue) this.musicValue.textContent = `${this.settings.audio.musicVolume || 50}%`;
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        if (this.isOpen) return;
        this.isOpen = true;

        if (this.onOpen) this.onOpen();

        this.syncFromSettings();

        if (this.panelEl) this.panelEl.classList.remove('hidden');
        if (this.backdropEl) this.backdropEl.classList.remove('hidden');
        if (this.buttonEl) this.buttonEl.setAttribute('aria-expanded', 'true');
        document.addEventListener('keydown', this.boundKeyDown);

        if (this.audioManager) this.audioManager.play('menu_open');
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;

        if (this.panelEl) this.panelEl.classList.add('hidden');
        if (this.backdropEl) this.backdropEl.classList.add('hidden');
        if (this.buttonEl) this.buttonEl.setAttribute('aria-expanded', 'false');
        document.removeEventListener('keydown', this.boundKeyDown);

        if (this.audioManager) this.audioManager.play('menu_close');

        if (this.onClose) this.onClose();
    }

    destroy() {
        if (this.isOpen) {
            this.close();
        }

        document.removeEventListener('keydown', this.boundKeyDown);

        if (this.buttonEl) {
            this.buttonEl.removeEventListener('click', this.boundToggle);
        }
        if (this.closeEl) {
            this.closeEl.removeEventListener('click', this.boundClose);
        }
        if (this.backdropEl) {
            this.backdropEl.removeEventListener('click', this.boundBackdropClose);
        }

        if (this.muteCheckbox) {
            this.muteCheckbox.removeEventListener('change', this.boundMuteChange);
        }
        if (this.masterSlider) {
            this.masterSlider.removeEventListener('input', this.boundMasterInput);
        }
        if (this.effectsSlider) {
            this.effectsSlider.removeEventListener('input', this.boundEffectsInput);
        }
        if (this.uiSlider) {
            this.uiSlider.removeEventListener('input', this.boundUiInput);
        }
        if (this.musicSlider) {
            this.musicSlider.removeEventListener('input', this.boundMusicInput);
        }
    }
}
