import { Game } from './core/Game.js';
import { Renderer } from './ui/Renderer.js';
import { InputHandler } from './core/InputHandler.js';
import { ShipPanel } from './ui/ShipPanel.js';
import { SettingsMenu } from './ui/SettingsMenu.js';
import { InGameSettingsPanel } from './ui/InGameSettingsPanel.js';
import { SplashScreen } from './ui/SplashScreen.js';
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
        this.audioManager = new AudioManager();
        this.audioManager.setupGlobalUIHoverSound();
        this.isRunning = false;
        this.hasShownInitialSplash = false;
    }

    async initialize(settings = null) {
        console.log('Initializing Shrouded Sails...');
        this.setStartupOverlayState('none');

        // Create game
        this.game = new Game();
        this.game.setAudioManager(this.audioManager);

        // Apply settings if provided
        if (settings) {
            this.game.fogEnabled = settings.fogEnabled;
            if (this.game.hud && typeof this.game.hud.setCombatDetailLevel === 'function') {
                this.game.hud.setCombatDetailLevel(settings.combatDetailLevel);
            }
            if (settings.audio) {
                this.audioManager.applySettings(settings.audio);
            }
        } else if (this.game.hud && typeof this.game.hud.setCombatDetailLevel === 'function') {
            this.game.hud.setCombatDetailLevel('detailed');
        }

        await this.audioManager.preload();
        this.game.initialize();

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
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restart();
        });

        // Initial UI update
        this.inputHandler.updateUI();

        // Start render loop
        this.start();

        // Create in-game audio settings panel
        const settingsRef = this.settingsMenu ? this.settingsMenu.getSettings() : {
            fogEnabled: true,
            combatDetailLevel: 'detailed',
            audio: { masterVolume: 70, effectsVolume: 80, uiVolume: 70, muted: false }
        };
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
    }

    restart() {
        console.log('Restarting game...');

        // Close in-game settings panel if open
        if (this.inGameSettingsPanel) {
            this.inGameSettingsPanel.close();
            this.inGameSettingsPanel = null;
        }

        // Hide game over modal
        document.getElementById('gameOverModal').classList.add('hidden');
        this.audioManager.play('menu_close');

        // Stop current game
        this.stop();

        // Reinitialize
        this.game = null;
        this.renderer = null;
        this.inputHandler = null;
        this.shipPanel = null;

        // Show settings menu again
        this.showSettingsMenu();
    }

    showSettingsMenu() {
        if (!this.settingsMenu) {
            this.settingsMenu = new SettingsMenu((settings) => this.initialize(settings), this.audioManager);
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

    start() {
        this.isRunning = true;
        this.render();
        console.log('Game started! Click on your ships (bottom-left) to select them.');
        console.log('Red ships = Player 1, Blue ships = Player 2');
    }

    render() {
        if (!this.isRunning) return;

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
