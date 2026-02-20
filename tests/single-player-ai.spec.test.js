import assert from 'node:assert/strict';
import test from 'node:test';

import { SettingsMenu } from '../client/src/ui/SettingsMenu.js';
import { TurnManager } from '../client/src/core/TurnManager.js';
import { AIController } from '../client/src/ai/AIController.js';
import { Game } from '../client/src/core/Game.js';
import { InputHandler } from '../client/src/core/InputHandler.js';
import { Renderer } from '../client/src/ui/Renderer.js';
import { GAME_MODES, GAME_STATES, PLAYERS } from '../shared/constants.js';

const defaultSettings = {
    gameMode: GAME_MODES.HOTSEAT,
    fogEnabled: true,
    atmosphereEffectsEnabled: true,
    boardLayout: 'landscape',
    combatDetailLevel: 'detailed',
    audio: {
        masterVolume: 70,
        effectsVolume: 80,
        uiVolume: 70,
        musicVolume: 50,
        muted: false
    }
};

test('SettingsMenu.normalizeSettings defaults missing gameMode to hotseat', () => {
    const normalized = SettingsMenu.normalizeSettings({
        boardLayout: 'portrait'
    }, defaultSettings);

    assert.equal(normalized.gameMode, GAME_MODES.HOTSEAT);
    assert.equal(normalized.boardLayout, 'portrait');
});

test('SettingsMenu.normalizeSettings preserves single_player gameMode', () => {
    const normalized = SettingsMenu.normalizeSettings({
        gameMode: GAME_MODES.SINGLE_PLAYER
    }, defaultSettings);

    assert.equal(normalized.gameMode, GAME_MODES.SINGLE_PLAYER);
});

test('SettingsMenu save/load round-trip persists gameMode', () => {
    const originalLocalStorage = globalThis.localStorage;
    const store = new Map();
    globalThis.localStorage = {
        getItem: (key) => (store.has(key) ? store.get(key) : null),
        setItem: (key, value) => { store.set(key, String(value)); }
    };

    try {
        const menu = Object.create(SettingsMenu.prototype);
        menu.storageKey = 'shrouded_sails_settings_v1';
        menu.defaultSettings = defaultSettings;
        menu.settings = SettingsMenu.normalizeSettings({
            gameMode: GAME_MODES.SINGLE_PLAYER,
            boardLayout: 'portrait'
        }, defaultSettings);

        menu.saveSettings();

        const reloaded = Object.create(SettingsMenu.prototype);
        reloaded.storageKey = 'shrouded_sails_settings_v1';
        reloaded.defaultSettings = defaultSettings;
        const loaded = reloaded.loadSettings();

        assert.equal(loaded.gameMode, GAME_MODES.SINGLE_PLAYER);
        assert.equal(loaded.boardLayout, 'portrait');
    } finally {
        globalThis.localStorage = originalLocalStorage;
    }
});

test('TurnManager.endTurn skips handoff modal in single-player', () => {
    let switched = false;
    let transitioned = false;
    const game = {
        turnNumber: 1,
        currentPlayer: PLAYERS.PLAYER1,
        audioManager: null,
        fogOfWar: {},
        gameState: GAME_STATES.PLAYING,
        checkWinCondition: () => null,
        notifyEndTurnTransition: () => { transitioned = true; },
        isSinglePlayerMode: () => true
    };

    const manager = new TurnManager(game);
    manager.showTurnTransition = () => assert.fail('showTurnTransition should not run in single-player');
    manager.switchToNextPlayer = () => { switched = true; };
    manager.endTurn();

    assert.equal(transitioned, true);
    assert.equal(switched, true);
});

test('TurnManager.endTurn keeps hotseat handoff behavior', () => {
    let switched = false;
    let modalShown = false;
    const game = {
        turnNumber: 1,
        currentPlayer: PLAYERS.PLAYER1,
        audioManager: null,
        fogOfWar: {},
        gameState: GAME_STATES.PLAYING,
        checkWinCondition: () => null,
        notifyEndTurnTransition: () => {},
        isSinglePlayerMode: () => false
    };

    const manager = new TurnManager(game);
    manager.showTurnTransition = () => { modalShown = true; };
    manager.switchToNextPlayer = () => { switched = true; };
    manager.endTurn();

    assert.equal(modalShown, true);
    assert.equal(switched, false);
});

test('TurnManager.startTurn requests AI execution for ai-controlled turn', () => {
    let aiRequested = false;
    const game = {
        turnNumber: 1,
        currentPlayer: PLAYERS.PLAYER2,
        audioManager: null,
        wind: { update: () => {}, applyWindToShips: () => [] },
        map: { ships: [] },
        isAIControlledPlayer: () => true,
        requestAITurnExecution: () => {
            aiRequested = true;
            return true;
        },
        endTurn: () => {}
    };

    const manager = new TurnManager(game);
    manager.startTurn();

    assert.equal(aiRequested, true);
});

test('AIController only exposes visible enemies under fog', () => {
    const visibleEnemy = { id: 'v', owner: PLAYERS.PLAYER1, isDestroyed: false };
    const hiddenEnemy = { id: 'h', owner: PLAYERS.PLAYER1, isDestroyed: false };
    const game = {
        getEnemyShipsFor: () => [visibleEnemy, hiddenEnemy],
        fogOfWar: {
            isShipVisible: (ship) => ship.id === 'v',
            getGhostShips: () => []
        }
    };

    const ai = new AIController(game);
    const visible = ai.getVisibleEnemyShipsForAI();

    assert.deepEqual(visible.map((ship) => ship.id), ['v']);
});

test('AIController applies cinematic start/end delays before ending turn', { concurrency: false }, async () => {
    const timeoutCalls = [];
    const originalSetTimeout = globalThis.setTimeout;
    globalThis.setTimeout = (fn, ms = 0) => {
        timeoutCalls.push(ms);
        fn();
        return 0;
    };

    try {
        let endTurnCalls = 0;
        const game = {
            gameState: GAME_STATES.PLAYING,
            currentPlayer: PLAYERS.PLAYER2,
            setAITurnInProgress: () => {},
            isAIControlledPlayer: () => true,
            getShipsByOwner: () => [],
            endTurn: () => { endTurnCalls++; }
        };

        const ai = new AIController(game);
        const executed = await ai.executeTurn();

        assert.equal(executed, true);
        assert.equal(endTurnCalls, 1);
        assert(timeoutCalls.some((ms) => ms > 0), 'Expected non-zero cinematic delays');
    } finally {
        globalThis.setTimeout = originalSetTimeout;
    }
});

test('Game.getViewingPlayer stays player1 in single-player mode', () => {
    const originalDocument = globalThis.document;
    globalThis.document = { getElementById: () => null };

    try {
        const game = new Game('landscape', GAME_MODES.SINGLE_PLAYER);
        game.currentPlayer = PLAYERS.PLAYER2;
        assert.equal(game.getViewingPlayer(), PLAYERS.PLAYER1);
    } finally {
        globalThis.document = originalDocument;
    }
});

test('InputHandler blocks interaction handlers while human input is locked', () => {
    const handler = Object.create(InputHandler.prototype);
    handler.game = { isHumanInputLocked: () => true };
    let gridClicks = 0;
    handler.updateUI = () => {};
    handler.getCanvasPoint = () => ({ x: 0, y: 0 });
    handler.renderer = { screenToGrid: () => ({ x: 0, y: 0 }) };
    handler.mouseState = { suppressNextClick: false };
    handler.game.map = { isValidPosition: () => true };
    handler.game.handleGridClick = () => { gridClicks++; };

    handler.handleCanvasClick({ clientX: 10, clientY: 10 });
    handler.handleKeyPress({ key: 'Enter', preventDefault: () => {} });

    assert.equal(gridClicks, 0);
});

test('Renderer visibility checks use viewing player perspective', () => {
    const renderer = Object.create(Renderer.prototype);
    let requestedViewer = null;
    renderer.game = {
        currentPlayer: PLAYERS.PLAYER2,
        getViewingPlayer: () => PLAYERS.PLAYER1,
        fogOfWar: {
            isShipVisible: (_ship, viewer) => {
                requestedViewer = viewer;
                return false;
            }
        }
    };

    const visible = renderer.isShipVisibleToViewer({ owner: PLAYERS.PLAYER2 });
    assert.equal(visible, false);
    assert.equal(requestedViewer, PLAYERS.PLAYER1);
});
