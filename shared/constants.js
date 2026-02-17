// Game Configuration Constants

export const SUBDIVISION_RATIO = 2;

export const GRID = {
    WIDTH: 40,
    HEIGHT: 30,
    TILE_SIZE: 30
};

export const BOARD_LAYOUTS = {
    landscape: {
        width: 40,
        height: 30
    },
    portrait: {
        width: 30,
        height: 40
    }
};

export const CANVAS = {
    getDimensions(layout = 'landscape') {
        const board = BOARD_LAYOUTS[layout] || BOARD_LAYOUTS.landscape;
        return {
            width: board.width * GRID.TILE_SIZE,
            height: board.height * GRID.TILE_SIZE
        };
    },
    get WIDTH() {
        return this.getDimensions('landscape').width;  // 1200px
    },
    get HEIGHT() {
        return this.getDimensions('landscape').height; // 900px
    }
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
        movement: 10,
        cannons: 1,
        range: 4,
        vision: 8,
        footprint: { width: 1, height: 1 }
    },
    2: {
        level: 2,
        name: 'Frigate',
        maxHP: 8,
        movement: 8,
        cannons: 2,
        range: 6,
        vision: 6,
        footprint: { width: 2, height: 1 }
    },
    3: {
        level: 3,
        name: 'Flagship',
        maxHP: 12,
        movement: 6,
        cannons: 4,
        range: 6,
        vision: 4,
        footprint: { width: 2, height: 2 }
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
    INVALID_MOVE: 'rgba(231, 76, 60, 0.35)',
    MOVE_PREVIEW_VALID_FILL: 'rgba(52, 152, 219, 0.48)',
    MOVE_PREVIEW_INVALID_FILL: 'rgba(231, 76, 60, 0.38)',
    MOVE_PREVIEW_VALID_OUTLINE: 'rgba(124, 205, 255, 0.95)',
    MOVE_PREVIEW_INVALID_OUTLINE: 'rgba(255, 150, 150, 0.95)',
    ATTACK_RANGE: 'rgba(231, 76, 60, 0.4)',
    GRID_LINE: '#2c5f8d'
};

export const ATMOSPHERE = {
    ENABLED: true,
    BASE_WATER: {
        DEEP_COLOR: '#152f4c',
        SHALLOW_COLOR: '#25577c',
        HAZE_ALPHA: 0.08,
        MOTTLE_COUNT: 90,
        MOTTLE_MIN_RADIUS: 36,
        MOTTLE_MAX_RADIUS: 140,
        MOTTLE_ALPHA_MIN: 0.015,
        MOTTLE_ALPHA_MAX: 0.05
    },
    MIST: {
        TEXTURE_SIZE: 256,
        PUFF_COUNT: 40,
        BASE_ALPHA: 0.085,
        STRENGTH_ALPHA_SCALE: 0.059,
        CALM_DRIFT_SPEED: 3.2,
        STRENGTH_DRIFT_SCALE: 8.4,
        DRIFT_SMOOTHING: 0.14,
        LAYER_PARALLAX: 0.58,
        LAYER_ALPHA_MULTIPLIER: 0.85
    },
    VIGNETTE: {
        ENABLED: true,
        ALPHA: 0.035
    }
};

export const FOG_VISUALS = {
    FRONTIER_DISTANCE: 2,
    MID_DISTANCE: 5,
    FRONTIER_ALPHA: 0.2,
    MID_ALPHA: 0.28,
    DEEP_ALPHA: 0.36,
    FEATHER_ALPHA: 0.16
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
    MIN_ISLAND_SIZE: 2,
    MAX_ISLAND_SIZE: 8,
    EDGE_BUFFER: 4,          // Keep islands away from edges
    STARTING_ZONE_SIZE: 8    // 8x8 starting areas
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
