import assert from 'node:assert/strict';
import test from 'node:test';

import { Ship } from '../client/src/entities/Ship.js';
import { GameMap } from '../client/src/map/GameMap.js';
import { Camera } from '../client/src/ui/Camera.js';
import { Wind } from '../client/src/map/Wind.js';
import { Fleet } from '../client/src/entities/Fleet.js';
import { MAP_GENERATION, SHIP_TYPES } from '../shared/constants.js';
import { FogOfWar } from '../client/src/fog/FogOfWar.js';
import { BoardingSystem } from '../client/src/combat/BoardingSystem.js';
import { CombatResolver } from '../client/src/combat/CombatResolver.js';

function clearMapWater(gameMap) {
    for (let y = 0; y < gameMap.height; y++) {
        for (let x = 0; x < gameMap.width; x++) {
            gameMap.tiles[y][x].setType('water');
        }
    }
    gameMap.ships = [];
}

test('Ship.getCenterPoint uses geometric center of occupied tile centers', () => {
    const sloop = new Ship(1, 'player1', 10, 5);
    assert.deepEqual(sloop.getCenterPoint(), { x: 10.5, y: 5.5 });

    const frigate = new Ship(2, 'player1', 10, 5, 'horizontal');
    assert.deepEqual(frigate.getCenterPoint(), { x: 11, y: 5.5 });
    assert.deepEqual(frigate.getCenterPoint(10, 5, 'vertical'), { x: 10.5, y: 6 });

    const flagship = new Ship(3, 'player1', 10, 5);
    assert.deepEqual(flagship.getCenterPoint(), { x: 11, y: 6 });
});

test('Ship.getOccupiedTiles respects frigate orientation and flagship footprint', () => {
    const frigate = new Ship(2, 'player1', 10, 5, 'horizontal');
    assert.deepEqual(frigate.getOccupiedTiles(), [{ x: 10, y: 5 }, { x: 11, y: 5 }]);
    assert.deepEqual(
        frigate.getOccupiedTiles(10, 5, 'vertical'),
        [{ x: 10, y: 5 }, { x: 10, y: 6 }]
    );

    const flagship = new Ship(3, 'player1', 10, 5);
    assert.deepEqual(flagship.getOccupiedTiles(), [
        { x: 10, y: 5 },
        { x: 11, y: 5 },
        { x: 10, y: 6 },
        { x: 11, y: 6 }
    ]);
});

test('GameMap.getFootprintConflicts returns unique ship conflicts across footprint tiles', () => {
    const map = new GameMap('landscape');
    clearMapWater(map);

    const sloopA = new Ship(1, 'player1', 10, 10);
    const sloopB = new Ship(1, 'player2', 11, 10);
    map.addShip(sloopA);
    map.addShip(sloopB);

    const conflicts = map.getFootprintConflicts(10, 10, { width: 2, height: 1 }, 'horizontal');
    assert.equal(conflicts.length, 2);
    assert(conflicts.some(ship => ship.id === sloopA.id));
    assert(conflicts.some(ship => ship.id === sloopB.id));
});

test('GameMap.isFootprintInStartingZone validates all occupied tiles', () => {
    const landscapeMap = new GameMap('landscape');
    clearMapWater(landscapeMap);

    assert.equal(landscapeMap.isFootprintInStartingZone(6, 10, { width: 2, height: 1 }, 'horizontal'), true);
    assert.equal(landscapeMap.isFootprintInStartingZone(7, 10, { width: 2, height: 1 }, 'horizontal'), false);

    const portraitMap = new GameMap('portrait');
    clearMapWater(portraitMap);

    assert.equal(portraitMap.isFootprintInStartingZone(10, 6, { width: 2, height: 1 }, 'vertical'), true);
    assert.equal(portraitMap.isFootprintInStartingZone(10, 7, { width: 2, height: 1 }, 'vertical'), false);
});

test('Boarding uses nearest-tile adjacency for multi-tile ships', () => {
    const map = new GameMap('landscape');
    clearMapWater(map);

    const attacker = new Ship(3, 'player1', 10, 5);
    const adjacentEnemy = new Ship(1, 'player2', 12, 6);
    const farEnemy = new Ship(1, 'player2', 14, 6);

    const boardable = attacker.getBoardableTargets(map, [adjacentEnemy, farEnemy]);
    assert.equal(boardable.length, 1);
    assert.equal(boardable[0].id, adjacentEnemy.id);
});

test('GameMap.getFootprintConflicts detects hidden occupancy that fog-filtered checks skip', () => {
    const map = new GameMap('landscape');
    clearMapWater(map);

    const hiddenEnemy = new Ship(1, 'player2', 10, 10);
    map.addShip(hiddenEnemy);

    const fogStubGame = {
        fogOfWar: {
            isShipVisible: () => false
        }
    };

    const fogFiltered = map.isFootprintClear(
        10,
        10,
        { width: 1, height: 1 },
        'horizontal',
        null,
        fogStubGame,
        'player1'
    );
    assert.equal(fogFiltered.clear, true);

    const conflicts = map.getFootprintConflicts(10, 10, { width: 1, height: 1 }, 'horizontal', null);
    assert.equal(conflicts.length, 1);
    assert.equal(conflicts[0].id, hiddenEnemy.id);
});

test('GameMap.getLineOfSightTiles handles fractional coordinates without unbounded loops', () => {
    const map = new GameMap('landscape');
    clearMapWater(map);

    const tiles = map.getLineOfSightTiles(10.5, 5.5, 22.5, 14.5);
    assert(tiles.length > 0);
    assert(tiles.length < 200);
});

test('Camera clamps zoom and keeps coordinate transforms reversible', () => {
    const camera = new Camera();
    camera.setZoom(5, 200, 100);
    assert.equal(camera.zoom, 3);

    camera.setZoom(0.25, 200, 100);
    assert.equal(camera.zoom, 1);

    camera.setZoom(2, 100, 50);
    camera.pan(-40, 20);

    const source = { x: 320, y: 240 };
    const canvasPoint = camera.screenToCanvas(source.x, source.y);
    const roundTrip = camera.canvasToScreen(canvasPoint.x, canvasPoint.y);

    assert(Math.abs(roundTrip.x - source.x) < 0.0001);
    assert(Math.abs(roundTrip.y - source.y) < 0.0001);
});

test('Wind drift keeps multi-tile ships fully inside bounds', () => {
    const map = new GameMap('landscape');
    clearMapWater(map);

    const frigate = new Ship(2, 'player1', 38, 10, 'horizontal');
    map.addShip(frigate);

    const wind = new Wind();
    wind.directionIndex = 2; // East
    wind.strength = 1;
    wind.applyWindToShips([frigate], map);

    const occupied = frigate.getOccupiedTiles();
    for (const tile of occupied) {
        assert(map.isValidPosition(tile.x, tile.y), `Tile out of bounds after wind drift: ${tile.x},${tile.y}`);
    }
});

test('Fleet deployment respects scaled edge buffer and full starting zone footprint', () => {
    const map = new GameMap('landscape');
    clearMapWater(map);

    const fleet = new Fleet('player1', map);
    assert.equal(fleet.ships.length, 6);

    for (const ship of fleet.ships) {
        assert(ship.x >= MAP_GENERATION.EDGE_BUFFER, `Anchor x below edge buffer: ${ship.x}`);
        assert(map.isFootprintInStartingZone(ship.x, ship.y, ship.footprint, ship.orientation));
    }
});

test('Fleet placement logic provides symmetric multi-tile valid anchors between sides', () => {
    const layouts = ['landscape', 'portrait'];

    for (const layout of layouts) {
        const setupFleet = (owner) => {
            const localMap = new GameMap(layout);
            clearMapWater(localMap);
            const fleet = Object.create(Fleet.prototype);
            fleet.owner = owner;
            fleet.ships = [];
            return { fleet, localMap, positions: fleet.getStartingPositions(localMap) };
        };

        const player1 = setupFleet('player1');
        const player2 = setupFleet('player2');

        const countValid = (fleet, localMap, positions, type) => {
            const shipType = type;
            const orientation = shipType === 2 ? 'horizontal' : 'horizontal';
            return positions.filter(pos => fleet.canPlaceShipAtPosition(
                localMap,
                pos,
                SHIP_TYPES[shipType].footprint,
                orientation
            )).length;
        };

        assert.equal(
            countValid(player1.fleet, player1.localMap, player1.positions, 2),
            countValid(player2.fleet, player2.localMap, player2.positions, 2),
            `${layout}: frigate valid anchor count should be symmetric`
        );

        assert.equal(
            countValid(player1.fleet, player1.localMap, player1.positions, 3),
            countValid(player2.fleet, player2.localMap, player2.positions, 3),
            `${layout}: flagship valid anchor count should be symmetric`
        );
    }
});

test('GameMap add/remove and registration track all occupied tiles', () => {
    const map = new GameMap('landscape');
    clearMapWater(map);

    const frigate = new Ship(2, 'player1', 10, 10, 'horizontal');
    map.addShip(frigate);
    assert.equal(map.getShipAt(10, 10)?.id, frigate.id);
    assert.equal(map.getShipAt(11, 10)?.id, frigate.id);

    frigate.moveTo(11, 10);
    map.refreshShipRegistration(frigate);
    assert.equal(map.getShipAt(10, 10), null);
    assert.equal(map.getShipAt(11, 10)?.id, frigate.id);
    assert.equal(map.getShipAt(12, 10)?.id, frigate.id);

    map.removeShip(frigate);
    assert.equal(map.getShipAt(11, 10), null);
    assert.equal(map.getShipAt(12, 10), null);
});

test('Sloop movement on fine grid respects 10-tile range', () => {
    const map = new GameMap('landscape');
    clearMapWater(map);
    const sloop = new Ship(1, 'player1', 20, 15);
    map.addShip(sloop);

    const validMoves = sloop.getValidMovePositions(map);
    assert(validMoves.some(pos => pos.x === 30 && pos.y === 15));
    assert(validMoves.every(pos => Math.abs(pos.x - 20) + Math.abs(pos.y - 15) <= 10));
});

test('Frigate movement validates oriented footprint collisions', () => {
    const map = new GameMap('landscape');
    clearMapWater(map);

    const frigate = new Ship(2, 'player1', 10, 10, 'horizontal');
    map.addShip(frigate);

    map.getTile(10, 12).setType('island');
    const moves = frigate.getValidMovePositions(map);

    // Moving south one tile makes Frigate vertical at (10,11), occupying (10,11) and (10,12) -> blocked.
    assert(!moves.some(pos => pos.x === 10 && pos.y === 11 && pos.orientation === 'vertical'));
});

test('Flagship movement excludes anchors blocked by footprint island overlap', () => {
    const map = new GameMap('landscape');
    clearMapWater(map);

    const flagship = new Ship(3, 'player1', 10, 10, 'horizontal');
    map.addShip(flagship);

    map.getTile(12, 11).setType('island');
    const moves = flagship.getValidMovePositions(map);
    assert(!moves.some(pos => pos.x === 11 && pos.y === 10));
});

test('BoardingSystem rejects non-adjacent multi-tile boarding attempts', () => {
    const map = new GameMap('landscape');
    clearMapWater(map);

    const attacker = new Ship(3, 'player1', 10, 10);
    const defender = new Ship(1, 'player2', 15, 10);
    const result = BoardingSystem.attemptBoarding(attacker, defender, map);
    assert.equal(result.success, false);
    assert.equal(result.outOfRange, true);
});

test('FogOfWar isPositionVisible uses fine-grid center-based coverage', () => {
    const map = new GameMap('landscape');
    clearMapWater(map);

    const friendly = new Ship(1, 'player1', 10, 10);
    map.addShip(friendly);

    const gameStub = {
        map,
        getShipsByOwner: (owner) => map.ships.filter(ship => !ship.isDestroyed && ship.owner === owner),
        getEnemyShipsFor: (owner) => map.ships.filter(ship => !ship.isDestroyed && ship.owner !== owner)
    };

    const fog = new FogOfWar(gameStub);
    assert.equal(fog.isPositionVisible(10, 10, 'player1'), true);
    assert.equal(fog.isPositionVisible(30, 30, 'player1'), false);
});

test('Ghost ship data preserves anchor and orientation for multi-tile ships', () => {
    const map = new GameMap('landscape');
    clearMapWater(map);

    const friendly = new Ship(1, 'player1', 10, 10);
    const enemy = new Ship(2, 'player2', 12, 10, 'vertical');
    map.addShip(friendly);
    map.addShip(enemy);

    const gameStub = {
        map,
        getShipsByOwner: (owner) => map.ships.filter(ship => !ship.isDestroyed && ship.owner === owner),
        getEnemyShipsFor: (owner) => map.ships.filter(ship => !ship.isDestroyed && ship.owner !== owner)
    };

    const fog = new FogOfWar(gameStub);
    fog.updateLastKnownPositions('player1');

    // Move enemy out of vision and keep old ghost record
    enemy.x = 30;
    enemy.y = 30;
    enemy.orientation = 'horizontal';
    map.refreshShipRegistration(enemy);

    const ghosts = fog.getGhostShips('player1');
    assert.equal(ghosts.length, 1);
    assert.equal(ghosts[0].orientation, 'vertical');
    assert.equal(ghosts[0].lastX, 12);
    assert.equal(ghosts[0].lastY, 10);
});

test('Multi-tile ship can be resolved from any occupied tile', () => {
    const map = new GameMap('landscape');
    clearMapWater(map);

    const flagship = new Ship(3, 'player1', 10, 10);
    map.addShip(flagship);

    assert.equal(map.getShipAt(10, 10)?.id, flagship.id);
    assert.equal(map.getShipAt(11, 10)?.id, flagship.id);
    assert.equal(map.getShipAt(10, 11)?.id, flagship.id);
    assert.equal(map.getShipAt(11, 11)?.id, flagship.id);
});

test('CombatResolver hit chance uses provided center-to-center distance value', () => {
    const attacker = new Ship(3, 'player1', 10, 10);
    const defender = new Ship(1, 'player2', 14, 10);
    const chance = CombatResolver.calculateHitChance(attacker, defender, 5);
    // base 70 + range(-40) + level(+20) = 50
    assert.equal(chance, 50);
});

test('Map generation creates islands with scaled constants and no starting-zone islands', () => {
    const map = new GameMap('landscape');
    let islandCount = 0;

    for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
            if (!map.getTile(x, y).isIsland()) continue;
            islandCount++;
            assert.equal(map.isInStartingZone(x, y), false, `Island found in starting zone at ${x},${y}`);
        }
    }

    assert(islandCount > 0);
    const density = islandCount / (map.width * map.height);
    assert(density > 0.03 && density < 0.25, `Unexpected island density: ${density}`);
});

test('generateSingleIsland respects scaled edge buffer and size bounds', () => {
    const map = new GameMap('landscape');
    clearMapWater(map);

    let captured = null;
    map.placeIslandCluster = (x, y, size) => {
        captured = { x, y, size };
        return true;
    };

    map.generateSingleIsland();

    assert(captured);
    assert(captured.x >= MAP_GENERATION.EDGE_BUFFER && captured.x <= map.width - MAP_GENERATION.EDGE_BUFFER - 1);
    assert(captured.y >= MAP_GENERATION.EDGE_BUFFER && captured.y <= map.height - MAP_GENERATION.EDGE_BUFFER - 1);
    assert(captured.size >= MAP_GENERATION.MIN_ISLAND_SIZE && captured.size <= MAP_GENERATION.MAX_ISLAND_SIZE);
});

test('placeIslandCluster creates bounded cluster sizes', () => {
    const map = new GameMap('landscape');
    clearMapWater(map);

    const requestedSize = MAP_GENERATION.MAX_ISLAND_SIZE;
    const placed = map.placeIslandCluster(20, 15, requestedSize);
    assert.equal(placed, true);

    let islandCount = 0;
    for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
            if (map.getTile(x, y).isIsland()) {
                islandCount++;
            }
        }
    }

    assert(islandCount >= 1 && islandCount <= requestedSize);
});
