// Game Configuration Constants

export const GRID = {
    WIDTH: 20,
    HEIGHT: 15,
    TILE_SIZE: 60
};

export const CANVAS = {
    WIDTH: GRID.WIDTH * GRID.TILE_SIZE,  // 1200px
    HEIGHT: GRID.HEIGHT * GRID.TILE_SIZE  // 900px
};

export const TILE_TYPES = {
    WATER: 'water',
    ISLAND: 'island'
};

export const SHIP_TYPES = {
    1: {
        level: 1,
        name: 'Sloop',
        maxHP: 4,
        movement: 5,
        cannons: 1,
        range: 2,
        vision: 2
    },
    2: {
        level: 2,
        name: 'Frigate',
        maxHP: 8,
        movement: 4,
        cannons: 2,
        range: 3,
        vision: 3
    },
    3: {
        level: 3,
        name: 'Flagship',
        maxHP: 12,
        movement: 3,
        cannons: 4,
        range: 3,
        vision: 4
    }
};

export const WIND_DIRECTIONS = [
    { dx: 0, dy: -1, name: 'N', arrow: '↑' },
    { dx: 1, dy: -1, name: 'NE', arrow: '↗' },
    { dx: 1, dy: 0, name: 'E', arrow: '→' },
    { dx: 1, dy: 1, name: 'SE', arrow: '↘' },
    { dx: 0, dy: 1, name: 'S', arrow: '↓' },
    { dx: -1, dy: 1, name: 'SW', arrow: '↙' },
    { dx: -1, dy: 0, name: 'W', arrow: '←' },
    { dx: -1, dy: -1, name: 'NW', arrow: '↖' }
];

export const COLORS = {
    WATER: '#1e3a5f',
    ISLAND: '#8b7355',
    PLAYER1: '#c0392b',
    PLAYER2: '#2980b9',
    SELECTION: '#f1c40f',
    VALID_MOVE: 'rgba(52, 152, 219, 0.4)',
    ATTACK_RANGE: 'rgba(231, 76, 60, 0.4)',
    GRID_LINE: '#2c5f8d'
};

export const PLAYERS = {
    PLAYER1: 'player1',
    PLAYER2: 'player2'
};

export const FLEET_COMPOSITION = [
    { type: 1, count: 3 },  // 3 Sloops
    { type: 2, count: 2 },  // 2 Frigates
    { type: 3, count: 1 }   // 1 Flagship
];

export const MAP_GENERATION = {
    MIN_ISLANDS: 10,
    MAX_ISLANDS: 15,
    MIN_ISLAND_SIZE: 1,
    MAX_ISLAND_SIZE: 4,
    EDGE_BUFFER: 2,          // Keep islands away from edges
    STARTING_ZONE_SIZE: 4    // 4x4 starting areas
};

export const GAME_STATES = {
    SETUP: 'setup',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver'
};

export const ACTION_MODES = {
    NONE: null,
    MOVE: 'move',
    ATTACK: 'attack',
    BOARD: 'board'
};
