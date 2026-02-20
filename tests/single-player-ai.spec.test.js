import assert from 'node:assert/strict';
import test from 'node:test';

import { SettingsMenu } from '../client/src/ui/SettingsMenu.js';
import { TurnManager } from '../client/src/core/TurnManager.js';
import { AIController } from '../client/src/ai/AIController.js';
import { Game } from '../client/src/core/Game.js';
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
