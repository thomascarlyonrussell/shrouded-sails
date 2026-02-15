import { Game } from './core/Game.js';
import { Renderer } from './ui/Renderer.js';
import { InputHandler } from './core/InputHandler.js';
import { ShipPanel } from './ui/ShipPanel.js';
import { SettingsMenu } from './ui/SettingsMenu.js';
import { InGameSettingsPanel } from './ui/InGameSettingsPanel.js';
import { SplashScreen } from './ui/SplashScreen.js';
import { TutorialTour } from './ui/TutorialTour.js';
import { AudioManager } from './audio/AudioManager.js';

class GameApp {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.game = null;
        this.renderer = null;
        this.inputHandler = null;
        this.shipPanel = null;
        this.settingsMenu = null;
        this.inGameSettingsPanel = null;
        this.splashScreen = null;
        this.tutorialTour = null;
        this.audioManager = new AudioManager();
        this.audioManager.setupGlobalUIHoverSound();
        this.isRunning = false;
        this.hasShownInitialSplash = false;
        this.lastConfirmedSettings = null;
        this.setupMobileLayoutControls();
    }

    cloneSettings(settings) {
        if (!settings) return null;

        return {
            ...settings,
            audio: {
                ...(settings.audio || {})
            }
        };
    }

    getDefaultSettings() {
        return {
            fogEnabled: true,
            combatDetailLevel: 'detailed',
            boardLayout: 'landscape',
            audio: { masterVolume: 70, effectsVolume: 80, uiVolume: 70, muted: false }
        };
    }

    async initialize(settings = null, options = { launchMode: 'standard' }) {
        console.log('Initializing Shrouded Sails...');
        this.stop();
        this.teardownRuntime();
        this.setStartupOverlayState('none');
        const launchMode = options && options.launchMode === 'tutorial' ? 'tutorial' : 'standard';

        const resolvedSettings = this.cloneSettings(settings)
            || (this.settingsMenu ? this.cloneSettings(this.settingsMenu.getSettings()) : this.getDefaultSettings());

        this.lastConfirmedSettings = this.cloneSettings(resolvedSettings);

        // Create game
        const boardLayout = resolvedSettings?.boardLayout === 'portrait' ? 'portrait' : 'landscape';
        this.game = new Game(boardLayout);
        this.canvas.dataset.layout = boardLayout;
        this.game.setAudioManager(this.audioManager);

        // Apply settings if provided
        if (resolvedSettings) {
            this.game.fogEnabled = resolvedSettings.fogEnabled;
            if (this.game.hud && typeof this.game.hud.setCombatDetailLevel === 'function') {
                this.game.hud.setCombatDetailLevel(resolvedSettings.combatDetailLevel);
            }
            if (resolvedSettings.audio) {
                this.audioManager.applySettings(resolvedSettings.audio);
            }
        } else if (this.game.hud && typeof this.game.hud.setCombatDetailLevel === 'function') {
            this.game.hud.setCombatDetailLevel('detailed');
        }

        await this.audioManager.preload();
        this.game.initialize();

        // Start background music
        await this.audioManager.playBackgroundMusic();

        // Create renderer
        this.renderer = new Renderer(this.canvas, this.game.map, this.game);
        console.log('Renderer initialized');
        const combatHandler = (event) => this.renderer.handleCombatEvent(event);
        if (typeof this.game.setCombatEventHandler === 'function') {
            this.game.setCombatEventHandler(combatHandler);
        } else {
            // Fallback for stale module contexts where the setter method is unavailable.
            this.game.combatEventHandler = combatHandler;
        }

        // Create ship panel
        this.shipPanel = new ShipPanel(this.game, this.renderer);
        console.log('Ship panel initialized');

        // Create input handler
        this.inputHandler = new InputHandler(this.canvas, this.game, this.renderer);
        console.log('Input handler initialized');

        // Link ship panel to input handler for UI updates
        this.shipPanel.setInputHandler(this.inputHandler);

        // Setup restart button
        const restartButton = document.getElementById('restartBtn');
        if (restartButton) {
            restartButton.onclick = () => this.restart();
        }

        // Initial UI update
        this.inputHandler.updateUI();

        // Start render loop
        this.start();

        // Create in-game audio settings panel
        const settingsRef = this.settingsMenu
            ? this.settingsMenu.getSettings()
            : this.cloneSettings(resolvedSettings);
        this.inGameSettingsPanel = new InGameSettingsPanel(
            settingsRef,
            this.audioManager,
            () => { if (this.game && this.game.hud) this.game.hud.closeCombatFeed(); },
            null
        );

        // Wire up mutual exclusion: opening combat feed closes settings panel
        if (this.game && this.game.hud) {
            this.game.hud.setOnFeedOpen(() => {
                if (this.inGameSettingsPanel) this.inGameSettingsPanel.close();
            });
        }

        if (launchMode === 'tutorial') {
            this.startTutorialTour();
        }
    }

    startTutorialTour() {
        if (this.tutorialTour) {
            this.tutorialTour.destroy();
            this.tutorialTour = null;
        }

        this.tutorialTour = new TutorialTour({
            audioManager: this.audioManager,
            onComplete: async () => {
                this.tutorialTour = null;
                await this.audioManager.fadeOutTutorialMusic({ durationMs: 900, resumeBackground: true });
                await this.startFreshMatchFromTutorial();
            },
            onSkip: async () => {
                this.tutorialTour = null;
                await this.audioManager.fadeOutTutorialMusic({ durationMs: 900, resumeBackground: true });
            }
        });
        this.tutorialTour.start();
        this.audioManager.playTutorialMusicOnce();
    }

    async startFreshMatchFromTutorial() {
        const settings = (this.settingsMenu ? this.cloneSettings(this.settingsMenu.getSettings()) : null)
            || this.cloneSettings(this.lastConfirmedSettings)
            || this.getDefaultSettings();

        const gameOverModal = document.getElementById('gameOverModal');
        if (gameOverModal) {
            gameOverModal.classList.add('hidden');
        }

        await this.initialize(settings, { launchMode: 'standard' });
    }

    teardownRuntime() {
        if (this.tutorialTour) {
            this.tutorialTour.destroy();
            this.tutorialTour = null;
        }

        if (this.inGameSettingsPanel) {
            this.inGameSettingsPanel.destroy();
            this.inGameSettingsPanel = null;
        }

        if (this.inputHandler) {
            this.inputHandler.destroy();
            this.inputHandler = null;
        }

        if (this.game && this.game.hud) {
            this.game.hud.closeCombatFeed();
        }

        this.shipPanel = null;
        this.renderer = null;
        this.game = null;
    }

    restart() {
        console.log('Restarting game...');

        // Hide game over modal
        const gameOverModal = document.getElementById('gameOverModal');
        if (gameOverModal) {
            gameOverModal.classList.add('hidden');
        }
        this.audioManager.play('menu_close');

        // Stop current game
        this.stop();
        this.teardownRuntime();

        // Show settings menu again
        this.showSettingsMenu();
    }

    handleSettingsConfirmed(payload) {
        const launchMode = payload && payload.launchMode === 'tutorial' ? 'tutorial' : 'standard';
        const settings = payload && payload.settings ? payload.settings : payload;
        const normalizedSettings = this.cloneSettings(settings) || this.getDefaultSettings();

        this.lastConfirmedSettings = this.cloneSettings(normalizedSettings);
        this.initialize(normalizedSettings, { launchMode });
    }

    showSettingsMenu() {
        if (!this.settingsMenu) {
            this.settingsMenu = new SettingsMenu((payload) => this.handleSettingsConfirmed(payload), this.audioManager);
        }
        this.setStartupOverlayState('settings');
        this.settingsMenu.show();
    }

    showSplashThenSettings() {
        if (this.hasShownInitialSplash) {
            this.showSettingsMenu();
            return;
        }

        this.hasShownInitialSplash = true;
        if (!this.splashScreen) {
            this.splashScreen = new SplashScreen(() => this.showSettingsMenu(), this.audioManager);
        }

        this.setStartupOverlayState('splash');
        this.splashScreen.show();
    }

    setStartupOverlayState(mode) {
        const activeModes = new Set(['splash', 'settings']);
        if (activeModes.has(mode)) {
            document.body.classList.add('startup-overlay-active');
            document.body.dataset.startupOverlay = mode;
            return;
        }

        document.body.classList.remove('startup-overlay-active');
        delete document.body.dataset.startupOverlay;
    }

    setupMobileLayoutControls() {
        this.gameContainerEl = document.querySelector('.game-container');
        this.mobileHeaderToggleEl = document.getElementById('mobileHeaderToggle');
        this.mobileFooterToggleEl = document.getElementById('mobileFooterToggle');

        if (!this.gameContainerEl) return;

        const isPortraitMobile = window.matchMedia('(max-width: 768px) and (orientation: portrait)').matches;
        if (isPortraitMobile) {
            this.gameContainerEl.classList.add('is-header-collapsed', 'is-footer-collapsed');
        }

        const syncToggleLabels = () => {
            const headerCollapsed = this.gameContainerEl.classList.contains('is-header-collapsed');
            const footerCollapsed = this.gameContainerEl.classList.contains('is-footer-collapsed');

            if (this.mobileHeaderToggleEl) {
                this.mobileHeaderToggleEl.textContent = headerCollapsed ? 'Show Top' : 'Hide Top';
                this.mobileHeaderToggleEl.setAttribute('aria-expanded', (!headerCollapsed).toString());
            }
            if (this.mobileFooterToggleEl) {
                this.mobileFooterToggleEl.textContent = footerCollapsed ? 'Show Actions' : 'Hide Actions';
                this.mobileFooterToggleEl.setAttribute('aria-expanded', (!footerCollapsed).toString());
            }
        };

        if (this.mobileHeaderToggleEl) {
            this.mobileHeaderToggleEl.onclick = () => {
                this.gameContainerEl.classList.toggle('is-header-collapsed');
                syncToggleLabels();
            };
        }

        if (this.mobileFooterToggleEl) {
            this.mobileFooterToggleEl.onclick = () => {
                this.gameContainerEl.classList.toggle('is-footer-collapsed');
                syncToggleLabels();
            };
        }

        syncToggleLabels();
    }

    start() {
        this.isRunning = true;
        this.render();
        console.log('Game started! Click on your ships (bottom-left) to select them.');
        console.log('Red ships = Player 1, Blue ships = Player 2');
    }

    render() {
        if (!this.isRunning) return;
        if (!this.shipPanel || !this.renderer || !this.game) return;

        // Keep header status in sync with turn/wind changes that happen outside direct input events.
        if (this.inputHandler) {
            this.inputHandler.updateHeaderStatus();
        }

        // Update ship panel
        this.shipPanel.update();

        // Render game with hovered ship from panel
        const hoveredShip = this.shipPanel.getHoveredShip();
        this.renderer.render(hoveredShip);

        // Update fog of war last known positions
        if (this.game.fogOfWar) {
            this.game.fogOfWar.updateLastKnownPositions(this.game.currentPlayer);
        }

        // Continue render loop
        requestAnimationFrame(() => this.render());
    }

    stop() {
        this.isRunning = false;
    }
}

// Start game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new GameApp();
    game.showSplashThenSettings();
});
