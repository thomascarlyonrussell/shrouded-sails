import { Game } from './core/Game.js?v=20260214e';
import { Renderer } from './ui/Renderer.js?v=20260214e';
import { InputHandler } from './core/InputHandler.js?v=20260214e';
import { ShipPanel } from './ui/ShipPanel.js?v=20260214e';
import { SettingsMenu } from './ui/SettingsMenu.js?v=20260214e';

class GameApp {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.game = null;
        this.renderer = null;
        this.inputHandler = null;
        this.shipPanel = null;
        this.settingsMenu = null;
        this.isRunning = false;
    }

    initialize(settings = null) {
        console.log('Initializing Shrouded Sails...');

        // Create game
        this.game = new Game();

        // Apply settings if provided
        if (settings) {
            this.game.fogEnabled = settings.fogEnabled;
        }

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
    }

    restart() {
        console.log('Restarting game...');

        // Hide game over modal
        document.getElementById('gameOverModal').classList.add('hidden');

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
            this.settingsMenu = new SettingsMenu((settings) => {
                this.initialize(settings);
            });
        }
        this.settingsMenu.show();
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
    game.showSettingsMenu();
});
