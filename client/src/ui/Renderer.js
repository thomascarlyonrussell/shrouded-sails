import { GRID, COLORS, ATMOSPHERE, FOG_VISUALS } from '../../../shared/constants.js';
import { Camera } from './Camera.js';
import {
    buildVisibilityDistanceMap,
    getFogOpacityForDistance,
    getWindAtmosphereTarget,
    hasUnseenNeighbor
} from './AtmosphereMath.js';

export class Renderer {
    constructor(canvas, gameMap, game) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gameMap = gameMap;
        this.game = game;
        this.tileSize = GRID.TILE_SIZE;
        this.combatEffects = [];
        this.shakeUntil = 0;
        this.shakeIntensity = 0;
        this.camera = new Camera();
        this.fogCacheCanvas = null;
        this.fogCacheCtx = null;
        this.fogCacheKey = null;
        this.fogVisibilityStateKey = null;
        this.fogVisibleTilesCache = new Set();
        this.fogVisibleTilesHash = 0;
        this.cameraTransition = null;
        this.atmosphereConfig = ATMOSPHERE;
        this.fogVisualConfig = FOG_VISUALS;
        this.waterAtmosphereCanvas = null;
        this.waterAtmosphereCtx = null;
        this.mistTextureCanvas = null;
        this.mistTextureCtx = null;
        this.mistOffsetX = 0;
        this.mistOffsetY = 0;
        this.mistVelocityX = 0;
        this.mistVelocityY = 0;
        this.mistAlpha = this.atmosphereConfig.MIST.BASE_ALPHA;
        this.lastAtmosphereTick = performance.now();

        this.canvas.width = this.gameMap.width * this.tileSize;
        this.canvas.height = this.gameMap.height * this.tileSize;
    }

    render(hoveredShip = null) {
        this.hoveredShip = hoveredShip;
        const now = performance.now();
        this.updateCameraTransition(now);
        const shakeOffset = this.getCurrentShakeOffset();

        this.clear();
        this.ctx.save();
        this.ctx.setTransform(this.camera.zoom, 0, 0, this.camera.zoom, this.camera.offsetX + shakeOffset.x, this.camera.offsetY + shakeOffset.y);
        this.drawWaterAtmosphere();
        this.drawMap();
        this.drawAtmosphereMist(now);
        this.drawFogOverlay();  // Draw fog after terrain but before ships
        this.drawAtmosphereVignette();
        this.drawValidMoveHighlights();
        this.drawMovementPreviewTiles();
        this.drawValidTargetHighlights();
        this.drawShips();
        this.drawGhostShips();  // Draw ghost ships after real ships
        this.drawMovementPreviewShip();
        this.drawSelection();
        this.drawSelectedCapturedBadge();
        this.drawHoveredShipHighlight();
        this.drawGrid();
        this.drawCombatEffects();
        this.ctx.restore();
    }

    startAutoFrameForOwner(owner, options = {}) {
        if (!owner || this.camera.zoom <= 1) {
            return false;
        }

        const bounds = this.getFleetBoundsForOwner(owner);
        if (!bounds) {
            return false;
        }

        const target = this.calculateCameraTargetForBounds(bounds, options.paddingPx);
        if (!target) {
            return false;
        }

        const durationMs = Number.isFinite(options.durationMs)
            ? Math.max(120, options.durationMs)
            : 650;

        const deltaZoom = Math.abs(target.zoom - this.camera.zoom);
        const deltaX = Math.abs(target.offsetX - this.camera.offsetX);
        const deltaY = Math.abs(target.offsetY - this.camera.offsetY);
        if (deltaZoom < 0.01 && deltaX < 1 && deltaY < 1) {
            return false;
        }

        this.cameraTransition = {
            startedAt: performance.now(),
            durationMs,
            fromZoom: this.camera.zoom,
            fromOffsetX: this.camera.offsetX,
            fromOffsetY: this.camera.offsetY,
            toZoom: target.zoom,
            toOffsetX: target.offsetX,
            toOffsetY: target.offsetY
        };

        return true;
    }

    cancelCameraTransition() {
        this.cameraTransition = null;
    }

    updateCameraTransition(now = performance.now()) {
        if (!this.cameraTransition) return;

        const transition = this.cameraTransition;
        const elapsed = now - transition.startedAt;
        const progress = Math.max(0, Math.min(1, elapsed / transition.durationMs));
        const eased = this.easeInOutCubic(progress);

        this.camera.zoom = this.lerp(transition.fromZoom, transition.toZoom, eased);
        this.camera.offsetX = this.lerp(transition.fromOffsetX, transition.toOffsetX, eased);
        this.camera.offsetY = this.lerp(transition.fromOffsetY, transition.toOffsetY, eased);
        this.camera.clampToBounds(
            this.canvas.width,
            this.canvas.height,
            this.gameMap.width * this.tileSize,
            this.gameMap.height * this.tileSize
        );

        if (progress >= 1) {
            this.cameraTransition = null;
        }
    }

    easeInOutCubic(value) {
        if (value < 0.5) {
            return 4 * value * value * value;
        }
        return 1 - Math.pow(-2 * value + 2, 3) / 2;
    }

    lerp(from, to, t) {
        return from + (to - from) * t;
    }

    getFleetBoundsForOwner(owner) {
        const ships = this.game.getShipsByOwner(owner, false);
        if (!ships || ships.length === 0) {
            return null;
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const ship of ships) {
            const bounds = this.getShipBounds(ship);
            minX = Math.min(minX, bounds.x);
            minY = Math.min(minY, bounds.y);
            maxX = Math.max(maxX, bounds.x + bounds.width);
            maxY = Math.max(maxY, bounds.y + bounds.height);
        }

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    calculateCameraTargetForBounds(bounds, paddingPx = this.tileSize * 1.5) {
        if (!bounds) return null;

        const paddedWidth = Math.max(1, bounds.width + paddingPx * 2);
        const paddedHeight = Math.max(1, bounds.height + paddingPx * 2);
        const fitZoom = Math.min(this.canvas.width / paddedWidth, this.canvas.height / paddedHeight);
        const targetZoom = Math.max(this.camera.minZoom, Math.min(this.camera.maxZoom, fitZoom));

        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        let targetOffsetX = this.canvas.width / 2 - centerX * targetZoom;
        let targetOffsetY = this.canvas.height / 2 - centerY * targetZoom;

        const boardWidthPx = this.gameMap.width * this.tileSize;
        const boardHeightPx = this.gameMap.height * this.tileSize;
        const minOffsetX = Math.min(0, this.canvas.width - boardWidthPx * targetZoom);
        const minOffsetY = Math.min(0, this.canvas.height - boardHeightPx * targetZoom);

        targetOffsetX = Math.max(minOffsetX, Math.min(0, targetOffsetX));
        targetOffsetY = Math.max(minOffsetY, Math.min(0, targetOffsetY));

        return {
            zoom: targetZoom,
            offsetX: targetOffsetX,
            offsetY: targetOffsetY
        };
    }

    clear() {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.fillStyle = COLORS.WATER;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    isAtmosphereEffectsEnabled() {
        return this.atmosphereConfig.ENABLED && this.game?.atmosphereEffectsEnabled !== false;
    }

    drawWaterAtmosphere() {
        if (!this.isAtmosphereEffectsEnabled()) return;

        this.ensureWaterAtmosphereCanvas();
        this.ctx.drawImage(this.waterAtmosphereCanvas, 0, 0);
    }

    ensureWaterAtmosphereCanvas() {
        const boardWidth = this.gameMap.width * this.tileSize;
        const boardHeight = this.gameMap.height * this.tileSize;

        if (!this.waterAtmosphereCanvas) {
            this.waterAtmosphereCanvas = document.createElement('canvas');
            this.waterAtmosphereCtx = this.waterAtmosphereCanvas.getContext('2d');
        }

        if (this.waterAtmosphereCanvas.width === boardWidth && this.waterAtmosphereCanvas.height === boardHeight) {
            return;
        }

        this.waterAtmosphereCanvas.width = boardWidth;
        this.waterAtmosphereCanvas.height = boardHeight;

        const cfg = this.atmosphereConfig.BASE_WATER;
        const ctx = this.waterAtmosphereCtx;

        ctx.clearRect(0, 0, boardWidth, boardHeight);

        const gradient = ctx.createLinearGradient(0, 0, boardWidth, boardHeight);
        gradient.addColorStop(0, cfg.SHALLOW_COLOR);
        gradient.addColorStop(1, cfg.DEEP_COLOR);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, boardWidth, boardHeight);

        const hazeGradient = ctx.createRadialGradient(
            boardWidth * 0.5,
            boardHeight * 0.46,
            boardHeight * 0.08,
            boardWidth * 0.5,
            boardHeight * 0.46,
            boardWidth * 0.8
        );
        hazeGradient.addColorStop(0, `rgba(225, 242, 255, ${cfg.HAZE_ALPHA})`);
        hazeGradient.addColorStop(1, 'rgba(225, 242, 255, 0)');
        ctx.fillStyle = hazeGradient;
        ctx.fillRect(0, 0, boardWidth, boardHeight);

        for (let i = 0; i < cfg.MOTTLE_COUNT; i++) {
            const x = Math.random() * boardWidth;
            const y = Math.random() * boardHeight;
            const radius = cfg.MOTTLE_MIN_RADIUS + Math.random() * (cfg.MOTTLE_MAX_RADIUS - cfg.MOTTLE_MIN_RADIUS);
            const alpha = cfg.MOTTLE_ALPHA_MIN + Math.random() * (cfg.MOTTLE_ALPHA_MAX - cfg.MOTTLE_ALPHA_MIN);
            const mottle = ctx.createRadialGradient(x, y, radius * 0.18, x, y, radius);
            mottle.addColorStop(0, `rgba(200, 232, 255, ${alpha})`);
            mottle.addColorStop(1, 'rgba(200, 232, 255, 0)');
            ctx.fillStyle = mottle;
            ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        }
    }

    drawAtmosphereMist(now = performance.now()) {
        if (!this.isAtmosphereEffectsEnabled()) return;

        this.ensureMistTextureCanvas();
        this.updateMistDrift(now);

        const boardWidth = this.gameMap.width * this.tileSize;
        const boardHeight = this.gameMap.height * this.tileSize;
        const textureSize = this.mistTextureCanvas.width;
        const drawStartX = -textureSize + this.getTiledOffset(this.mistOffsetX, textureSize);
        const drawStartY = -textureSize + this.getTiledOffset(this.mistOffsetY, textureSize);

        this.ctx.save();
        this.ctx.globalAlpha = this.mistAlpha;
        for (let x = drawStartX; x < boardWidth + textureSize; x += textureSize) {
            for (let y = drawStartY; y < boardHeight + textureSize; y += textureSize) {
                this.ctx.drawImage(this.mistTextureCanvas, x, y, textureSize, textureSize);
            }
        }

        const parallax = this.atmosphereConfig.MIST.LAYER_PARALLAX;
        const layerTwoOffsetX = -textureSize + this.getTiledOffset(this.mistOffsetX * -parallax, textureSize);
        const layerTwoOffsetY = -textureSize + this.getTiledOffset(this.mistOffsetY * -parallax, textureSize);
        this.ctx.globalAlpha = this.mistAlpha * this.atmosphereConfig.MIST.LAYER_ALPHA_MULTIPLIER;
        for (let x = layerTwoOffsetX; x < boardWidth + textureSize; x += textureSize) {
            for (let y = layerTwoOffsetY; y < boardHeight + textureSize; y += textureSize) {
                this.ctx.drawImage(this.mistTextureCanvas, x, y, textureSize, textureSize);
            }
        }
        this.ctx.restore();
    }

    ensureMistTextureCanvas() {
        const mistCfg = this.atmosphereConfig.MIST;
        const size = mistCfg.TEXTURE_SIZE;

        if (!this.mistTextureCanvas) {
            this.mistTextureCanvas = document.createElement('canvas');
            this.mistTextureCtx = this.mistTextureCanvas.getContext('2d');
        }

        if (this.mistTextureCanvas.width === size && this.mistTextureCanvas.height === size) {
            return;
        }

        this.mistTextureCanvas.width = size;
        this.mistTextureCanvas.height = size;

        const ctx = this.mistTextureCtx;
        ctx.clearRect(0, 0, size, size);

        for (let i = 0; i < mistCfg.PUFF_COUNT; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = size * (0.15 + Math.random() * 0.28);
            const alpha = 0.045 + Math.random() * 0.07;
            this.drawWrappedMistPuff(ctx, x, y, radius, alpha, size);
        }
    }

    drawWrappedMistPuff(ctx, x, y, radius, alpha, size) {
        for (const offsetX of [-size, 0, size]) {
            for (const offsetY of [-size, 0, size]) {
                const drawX = x + offsetX;
                const drawY = y + offsetY;
                const puff = ctx.createRadialGradient(drawX, drawY, radius * 0.2, drawX, drawY, radius);
                puff.addColorStop(0, `rgba(235, 246, 255, ${alpha})`);
                puff.addColorStop(1, 'rgba(235, 246, 255, 0)');
                ctx.fillStyle = puff;
                ctx.fillRect(drawX - radius, drawY - radius, radius * 2, radius * 2);
            }
        }
    }

    updateMistDrift(now = performance.now()) {
        const elapsedMs = Math.max(0, now - this.lastAtmosphereTick);
        this.lastAtmosphereTick = now;
        const deltaSeconds = Math.min(0.1, elapsedMs / 1000);
        if (deltaSeconds <= 0) return;

        const target = getWindAtmosphereTarget(this.game.wind, this.atmosphereConfig.MIST);
        const smoothing = this.atmosphereConfig.MIST.DRIFT_SMOOTHING;
        const blend = 1 - Math.pow(1 - smoothing, deltaSeconds * 60);

        this.mistVelocityX = this.lerp(this.mistVelocityX, target.velocityX, blend);
        this.mistVelocityY = this.lerp(this.mistVelocityY, target.velocityY, blend);
        this.mistAlpha = this.lerp(this.mistAlpha, target.alpha, blend);

        this.mistOffsetX += this.mistVelocityX * deltaSeconds;
        this.mistOffsetY += this.mistVelocityY * deltaSeconds;
    }

    getTiledOffset(value, size) {
        if (!size) return 0;
        return ((value % size) + size) % size;
    }

    drawAtmosphereVignette() {
        if (!this.isAtmosphereEffectsEnabled() || !this.atmosphereConfig.VIGNETTE.ENABLED) return;

        const boardWidth = this.gameMap.width * this.tileSize;
        const boardHeight = this.gameMap.height * this.tileSize;
        const alpha = this.atmosphereConfig.VIGNETTE.ALPHA;
        const vignette = this.ctx.createRadialGradient(
            boardWidth / 2,
            boardHeight / 2,
            Math.min(boardWidth, boardHeight) * 0.2,
            boardWidth / 2,
            boardHeight / 2,
            Math.max(boardWidth, boardHeight) * 0.65
        );
        vignette.addColorStop(0, 'rgba(3, 8, 14, 0)');
        vignette.addColorStop(1, `rgba(3, 8, 14, ${alpha})`);
        this.ctx.fillStyle = vignette;
        this.ctx.fillRect(0, 0, boardWidth, boardHeight);
    }

    getCurrentShakeOffset() {
        const now = performance.now();
        if (now >= this.shakeUntil) {
            return { x: 0, y: 0 };
        }

        return {
            x: (Math.random() - 0.5) * this.shakeIntensity,
            y: (Math.random() - 0.5) * this.shakeIntensity
        };
    }

    triggerScreenShake(durationMs, intensity = 8) {
        this.shakeUntil = performance.now() + durationMs;
        this.shakeIntensity = intensity;
    }

    handleCombatEvent(event) {
        if (!event || !event.result) return;

        if (event.type === 'attack') {
            this.enqueueAttackEffects(event.result);
        } else if (event.type === 'board') {
            this.enqueueBoardingEffects(event.result);
        }
    }

    enqueueAttackEffects(result) {
        const center = this.gridToCenter(result.defender.x, result.defender.y);
        const baseDelay = 90;
        const rollResults = result.cannonResults || result.rolls || [];

        rollResults.forEach((roll, index) => {
            const delay = index * baseDelay;
            if (roll.hit) {
                this.combatEffects.push({
                    kind: 'hit-burst',
                    x: center.x,
                    y: center.y,
                    duration: 450,
                    delay: delay,
                    start: performance.now()
                });
            } else {
                this.combatEffects.push({
                    kind: 'miss-splash',
                    x: center.x + (Math.random() - 0.5) * this.tileSize * 0.8,
                    y: center.y + (Math.random() - 0.5) * this.tileSize * 0.8,
                    duration: 500,
                    delay: delay,
                    start: performance.now()
                });
            }
        });

        if (result.totalDamage > 0) {
            this.combatEffects.push({
                kind: 'damage-text',
                x: center.x,
                y: center.y - this.tileSize * 0.2,
                text: `-${result.totalDamage}`,
                duration: 900,
                delay: rollResults.length * baseDelay,
                start: performance.now()
            });
        } else {
            this.combatEffects.push({
                kind: 'damage-text',
                x: center.x,
                y: center.y - this.tileSize * 0.2,
                text: 'MISS',
                duration: 750,
                delay: rollResults.length * baseDelay,
                start: performance.now()
            });
        }

        if (result.defenderDestroyed) {
            this.combatEffects.push({
                kind: 'sink-blast',
                x: center.x,
                y: center.y,
                duration: 900,
                delay: rollResults.length * baseDelay,
                start: performance.now()
            });
        }

        const isCritical = result.totalHits === result.attacker.cannons && result.attacker.cannons >= 2;
        if (isCritical || result.defenderDestroyed) {
            this.triggerScreenShake(300, result.defenderDestroyed ? 14 : 9);
        }
    }

    enqueueBoardingEffects(result) {
        const center = this.gridToCenter(result.defender.x, result.defender.y);
        this.combatEffects.push({
            kind: 'boarding-clash',
            x: center.x,
            y: center.y,
            duration: 700,
            delay: 0,
            start: performance.now()
        });

        if (result.success) {
            this.triggerScreenShake(220, 7);
        }
    }

    gridToCenter(gridX, gridY) {
        return {
            x: gridX * this.tileSize + this.tileSize / 2,
            y: gridY * this.tileSize + this.tileSize / 2
        };
    }

    drawCombatEffects() {
        const now = performance.now();

        this.combatEffects = this.combatEffects.filter(effect => {
            const elapsed = now - effect.start - effect.delay;
            if (elapsed < 0) return true;
            if (elapsed > effect.duration) return false;

            const progress = elapsed / effect.duration;
            this.drawEffect(effect, progress);
            return true;
        });
    }

    drawEffect(effect, progress) {
        if (effect.kind === 'hit-burst') {
            const radius = 8 + progress * this.tileSize * 0.45;
            const alpha = 1 - progress;
            this.ctx.strokeStyle = `rgba(255, 80, 80, ${alpha})`;
            this.ctx.fillStyle = `rgba(255, 140, 60, ${alpha * 0.45})`;
            this.ctx.lineWidth = 2.5;
            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            return;
        }

        if (effect.kind === 'miss-splash') {
            const radius = 4 + progress * this.tileSize * 0.35;
            const alpha = 0.85 - progress * 0.85;
            this.ctx.strokeStyle = `rgba(180, 220, 255, ${Math.max(alpha, 0)})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
            this.ctx.stroke();
            return;
        }

        if (effect.kind === 'damage-text') {
            const alpha = 1 - progress;
            const rise = progress * 26;
            this.ctx.fillStyle = effect.text === 'MISS'
                ? `rgba(200, 220, 240, ${alpha})`
                : `rgba(255, 90, 90, ${alpha})`;
            this.ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
            this.ctx.lineWidth = 3;
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.strokeText(effect.text, effect.x, effect.y - rise);
            this.ctx.fillText(effect.text, effect.x, effect.y - rise);
            return;
        }

        if (effect.kind === 'sink-blast') {
            const alpha = 1 - progress;
            const radius = this.tileSize * (0.2 + progress * 0.9);
            this.ctx.fillStyle = `rgba(255, 110, 40, ${alpha * 0.45})`;
            this.ctx.strokeStyle = `rgba(255, 210, 120, ${alpha})`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            return;
        }

        if (effect.kind === 'boarding-clash') {
            const alpha = 1 - progress;
            const size = this.tileSize * (0.3 + progress * 0.5);
            this.ctx.strokeStyle = `rgba(245, 245, 245, ${alpha})`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(effect.x - size / 2, effect.y - size / 2);
            this.ctx.lineTo(effect.x + size / 2, effect.y + size / 2);
            this.ctx.moveTo(effect.x + size / 2, effect.y - size / 2);
            this.ctx.lineTo(effect.x - size / 2, effect.y + size / 2);
            this.ctx.stroke();
        }
    }

    drawMap() {
        for (let y = 0; y < this.gameMap.height; y++) {
            for (let x = 0; x < this.gameMap.width; x++) {
                const tile = this.gameMap.getTile(x, y);
                this.drawTile(tile, x, y);
            }
        }
    }

    drawTile(tile, x, y) {
        const screenX = x * this.tileSize;
        const screenY = y * this.tileSize;

        if (tile.isIsland()) {
            this.ctx.fillStyle = COLORS.ISLAND;
            this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

            // Add simple shading for islands
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.ctx.fillRect(screenX, screenY + this.tileSize - 5, this.tileSize, 5);
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = COLORS.GRID_LINE;
        this.ctx.lineWidth = 0.5;

        // Vertical lines
        for (let x = 0; x <= this.gameMap.width; x++) {
            const screenX = x * this.tileSize;
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, 0);
            this.ctx.lineTo(screenX, this.canvas.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= this.gameMap.height; y++) {
            const screenY = y * this.tileSize;
            this.ctx.beginPath();
            this.ctx.moveTo(0, screenY);
            this.ctx.lineTo(this.canvas.width, screenY);
            this.ctx.stroke();
        }
    }

    screenToGrid(screenX, screenY) {
        const canvasPoint = this.camera.screenToCanvas(screenX, screenY);
        return {
            x: Math.floor(canvasPoint.x / this.tileSize),
            y: Math.floor(canvasPoint.y / this.tileSize)
        };
    }

    gridToScreen(gridX, gridY) {
        return {
            x: gridX * this.tileSize,
            y: gridY * this.tileSize
        };
    }


    getShipBounds(ship, anchorX = ship.x, anchorY = ship.y, orientation = ship.orientation) {
        const tiles = ship.getOccupiedTiles(anchorX, anchorY, orientation);
        const xs = tiles.map(tile => tile.x);
        const ys = tiles.map(tile => tile.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);

        return {
            x: minX * this.tileSize,
            y: minY * this.tileSize,
            width: (maxX - minX + 1) * this.tileSize,
            height: (maxY - minY + 1) * this.tileSize
        };
    }

    drawShips() {
        const ships = this.gameMap.ships;

        for (const ship of ships) {
            if (ship.isDestroyed) continue;

            // Check visibility for enemy ships with fog of war
            if (this.game.fogOfWar) {
                const isEnemyShip = ship.owner !== this.game.currentPlayer;
                if (isEnemyShip && !this.game.fogOfWar.isShipVisible(ship, this.game.currentPlayer)) {
                    // Enemy ship not visible - skip rendering (will be shown as ghost instead)
                    continue;
                }
            }

            const bounds = this.getShipBounds(ship);
            const centerX = bounds.x + bounds.width / 2;
            const centerY = bounds.y + bounds.height / 2;

            // Determine ship color
            let shipColor = ship.owner === 'player1' ? COLORS.PLAYER1 : COLORS.PLAYER2;

            // If captured, show with a different shade
            if (ship.isCaptured) {
                shipColor = this.adjustColorBrightness(shipColor, 40);
            }

            // Draw ship as a triangle (pointing up by default)
            let shipWidth = Math.min(bounds.width, bounds.height) * 0.6;
            let shipHeight = Math.max(bounds.width, bounds.height) * 0.8;
            if (ship.type === 2) {
                shipWidth = bounds.width * 0.82;
                shipHeight = bounds.height * 0.68;
            }

            this.ctx.save();
            this.ctx.translate(centerX, centerY);

            // Rotate based on facing (0 = north, clockwise)
            // For now, point all ships north
            // this.ctx.rotate((ship.facing * Math.PI) / 4);

            // Draw ship based on type
            if (ship.type === 1) {
                // Sloop - Small triangle
                this.drawSloop(shipColor, shipWidth, shipHeight);
            } else if (ship.type === 2) {
                // Frigate - Pentagon shape (wider)
                this.drawFrigate(shipColor, shipWidth, shipHeight, ship.orientation);
            } else if (ship.type === 3) {
                // Flagship - Large hexagon with details
                this.drawFlagship(shipColor, shipWidth, shipHeight);
            }

            // Draw flagship indicator
            if (ship.isFlagship) {
                this.ctx.fillStyle = '#f1c40f';
                this.ctx.beginPath();
                this.ctx.arc(0, -shipHeight / 2 - 5, 4, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }

            this.ctx.restore();

            // Draw HP bar
            this.drawHPBar(ship, bounds.x, bounds.y, bounds.width, bounds.height);

            // Draw captured indicator
            if (ship.isCaptured) {
                this.drawCapturedIndicator(bounds.x, bounds.y, bounds.width);
            }

            // Draw action indicators only for the current player's ships
            if (ship.owner === this.game.currentPlayer) {
                this.drawActionIndicators(ship, bounds.x, bounds.y);

                // Draw dim overlay if ship has completed all actions
                if (ship.isDone()) {
                    this.drawCompletedOverlay(bounds.x, bounds.y, bounds.width, bounds.height);
                }
            }
        }
    }

    adjustColorBrightness(color, percent) {
        // Simple brightness adjustment for hex colors
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    drawCapturedIndicator(screenX, screenY, width = this.tileSize) {
        const x = screenX + width - 15;
        const y = screenY + 5;

        this.ctx.fillStyle = '#f1c40f';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;

        // Draw flag/star
        this.ctx.beginPath();
        this.ctx.arc(x, y, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('C', x, y);
    }

    drawActionIndicators(ship, screenX, screenY) {
        const indicatorSize = 8;
        const startX = screenX + 5;
        const startY = screenY + 5;

        // Draw movement indicator (checkmark if moved)
        if (ship.isMovementExhausted()) {
            this.ctx.fillStyle = '#3498db';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 1;

            this.ctx.beginPath();
            this.ctx.arc(startX, startY, indicatorSize / 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();

            // Draw 'M' for moved
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 8px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('M', startX, startY);
        }

        // Draw action indicator (checkmark if fired)
        if (ship.hasFired) {
            const actionX = startX + indicatorSize + 3;
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 1;

            this.ctx.beginPath();
            this.ctx.arc(actionX, startY, indicatorSize / 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();

            // Draw 'A' for action (attack/board)
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 8px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('A', actionX, startY);
        }
    }

    drawCompletedOverlay(screenX, screenY, width = this.tileSize, height = this.tileSize) {
        // Draw semi-transparent dark overlay to show ship has completed all actions
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fillRect(screenX, screenY, width, height);

        // Draw "DONE" text
        const centerX = screenX + width / 2;
        const centerY = screenY + height / 2;

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';

        this.ctx.strokeText('DONE', centerX, screenY + height - 12);
        this.ctx.fillText('DONE', centerX, screenY + height - 12);
    }

    drawHPBar(ship, screenX, screenY, width = this.tileSize, height = this.tileSize) {
        const barWidth = width;
        const barHeight = 5;
        const barX = screenX;
        const barY = screenY + height - barHeight - 3;

        // Background (red)
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        // Foreground (green) based on HP percentage
        const hpPercent = ship.currentHP / ship.maxHP;
        this.ctx.fillStyle = hpPercent > 0.5 ? '#27ae60' : hpPercent > 0.25 ? '#f39c12' : '#e74c3c';
        this.ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

        // Border
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    drawSelection() {
        if (!this.game.selectedShip) return;

        const ship = this.game.selectedShip;
        const bounds = this.getShipBounds(ship);

        // Draw yellow outline
        this.ctx.strokeStyle = COLORS.SELECTION;
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(bounds.x + 2, bounds.y + 2, bounds.width - 4, bounds.height - 4);

        // Draw corner brackets
        const bracketSize = 10;
        this.ctx.lineWidth = 3;

        // Top-left
        this.ctx.beginPath();
        this.ctx.moveTo(bounds.x + 2, bounds.y + bracketSize);
        this.ctx.lineTo(bounds.x + 2, bounds.y + 2);
        this.ctx.lineTo(bounds.x + bracketSize, bounds.y + 2);
        this.ctx.stroke();

        // Top-right
        this.ctx.beginPath();
        this.ctx.moveTo(bounds.x + bounds.width - bracketSize, bounds.y + 2);
        this.ctx.lineTo(bounds.x + bounds.width - 2, bounds.y + 2);
        this.ctx.lineTo(bounds.x + bounds.width - 2, bounds.y + bracketSize);
        this.ctx.stroke();

        // Bottom-left
        this.ctx.beginPath();
        this.ctx.moveTo(bounds.x + 2, bounds.y + bounds.height - bracketSize);
        this.ctx.lineTo(bounds.x + 2, bounds.y + bounds.height - 2);
        this.ctx.lineTo(bounds.x + bracketSize, bounds.y + bounds.height - 2);
        this.ctx.stroke();

        // Bottom-right
        this.ctx.beginPath();
        this.ctx.moveTo(bounds.x + bounds.width - bracketSize, bounds.y + bounds.height - 2);
        this.ctx.lineTo(bounds.x + bounds.width - 2, bounds.y + bounds.height - 2);
        this.ctx.lineTo(bounds.x + bounds.width - 2, bounds.y + bounds.height - bracketSize);
        this.ctx.stroke();
    }

    drawSelectedCapturedBadge() {
        const ship = this.game.selectedShip;
        if (!ship || !ship.isCaptured || ship.isDestroyed) return;

        const bounds = this.getShipBounds(ship);
        const badgeX = bounds.x + bounds.width / 2;
        const badgeY = Math.max(14, bounds.y - 8);

        this.ctx.save();
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        const text = 'CAPTURED';
        const paddingX = 7;
        const paddingY = 4;
        const textWidth = this.ctx.measureText(text).width;
        const boxWidth = textWidth + paddingX * 2;
        const boxHeight = 12 + paddingY * 2;

        this.ctx.fillStyle = 'rgba(155, 89, 182, 0.92)';
        this.ctx.strokeStyle = '#f1c40f';
        this.ctx.lineWidth = 1.5;
        this.ctx.fillRect(badgeX - boxWidth / 2, badgeY - boxHeight / 2, boxWidth, boxHeight);
        this.ctx.strokeRect(badgeX - boxWidth / 2, badgeY - boxHeight / 2, boxWidth, boxHeight);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(text, badgeX, badgeY + 0.5);
        this.ctx.restore();
    }

    drawHoveredShipHighlight() {
        if (!this.hoveredShip || this.hoveredShip.isDestroyed) return;

        const ship = this.hoveredShip;

        // Defense-in-depth: never highlight hidden enemy positions through panel hover.
        if (this.game.fogOfWar) {
            const isEnemyShip = ship.owner !== this.game.currentPlayer;
            if (isEnemyShip && !this.game.fogOfWar.isShipVisible(ship, this.game.currentPlayer)) {
                return;
            }
        }

        const bounds = this.getShipBounds(ship);

        // Draw cyan glow outline for hovered ship from panel
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 3]);
        this.ctx.strokeRect(bounds.x + 3, bounds.y + 3, bounds.width - 6, bounds.height - 6);
        this.ctx.setLineDash([]);

        // Add a subtle glow effect
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 10;
        this.ctx.strokeRect(bounds.x + 3, bounds.y + 3, bounds.width - 6, bounds.height - 6);
        this.ctx.shadowBlur = 0;
    }

    drawValidMoveHighlights() {
        if (this.game.actionMode !== 'move') return;

        for (const pos of this.game.validMovePositions) {
            const screenPos = this.gridToScreen(pos.x, pos.y);
            this.ctx.fillStyle = COLORS.VALID_MOVE;
            this.ctx.fillRect(screenPos.x, screenPos.y, this.tileSize, this.tileSize);
        }
    }

    drawMovementPreviewTiles() {
        if (this.game.actionMode !== 'move') return;

        const preview = this.game.movementPreview;
        if (!preview || !Array.isArray(preview.occupiedTiles)) return;

        const fillColor = preview.isValid
            ? COLORS.MOVE_PREVIEW_VALID_FILL
            : COLORS.MOVE_PREVIEW_INVALID_FILL;
        const outlineColor = preview.isValid
            ? COLORS.MOVE_PREVIEW_VALID_OUTLINE
            : COLORS.MOVE_PREVIEW_INVALID_OUTLINE;

        for (const tile of preview.occupiedTiles) {
            if (!this.gameMap.isValidPosition(tile.x, tile.y)) continue;
            const screenPos = this.gridToScreen(tile.x, tile.y);
            this.ctx.fillStyle = fillColor;
            this.ctx.fillRect(screenPos.x, screenPos.y, this.tileSize, this.tileSize);

            this.ctx.strokeStyle = outlineColor;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(screenPos.x + 1, screenPos.y + 1, this.tileSize - 2, this.tileSize - 2);
        }
    }

    drawMovementPreviewShip() {
        if (this.game.actionMode !== 'move') return;

        const preview = this.game.movementPreview;
        if (!preview || !preview.ship) return;

        const ship = preview.ship;
        const bounds = this.getShipBounds(ship, preview.x, preview.y, preview.orientation);
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;

        const baseColor = ship.owner === 'player1' ? COLORS.PLAYER1 : COLORS.PLAYER2;
        const outlineColor = preview.isValid
            ? COLORS.MOVE_PREVIEW_VALID_OUTLINE
            : COLORS.MOVE_PREVIEW_INVALID_OUTLINE;
        const ghostColor = `${baseColor}88`;

        let shipWidth = Math.min(bounds.width, bounds.height) * 0.6;
        let shipHeight = Math.max(bounds.width, bounds.height) * 0.8;
        if (ship.type === 2) {
            shipWidth = bounds.width * 0.82;
            shipHeight = bounds.height * 0.68;
        }

        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.setLineDash([6, 4]);

        if (ship.type === 1) {
            this.drawSloop(ghostColor, shipWidth, shipHeight);
        } else if (ship.type === 2) {
            this.drawFrigate(ghostColor, shipWidth, shipHeight, preview.orientation);
        } else if (ship.type === 3) {
            this.drawFlagship(ghostColor, shipWidth, shipHeight);
        }

        this.ctx.strokeStyle = outlineColor;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.restore();
    }

    drawValidTargetHighlights() {
        if (this.game.actionMode !== 'attack' && this.game.actionMode !== 'board') return;

        for (const target of this.game.validTargets) {
            const bounds = this.getShipBounds(target);
            this.ctx.fillStyle = COLORS.ATTACK_RANGE;
            this.ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
        }
    }

    drawSloop(shipColor, shipSize, shipHeight) {
        const width = shipSize;
        const height = shipHeight;
        const bowY = -height / 2;
        const sternY = height / 2;

        // Compact hull silhouette: pointed bow, curved sides, flat stern.
        this.ctx.fillStyle = shipColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, bowY);
        this.ctx.quadraticCurveTo(width * 0.42, -height * 0.06, width * 0.3, sternY);
        this.ctx.lineTo(-width * 0.3, sternY);
        this.ctx.quadraticCurveTo(-width * 0.42, -height * 0.06, 0, bowY);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Inner deck region.
        const deckColor = this.adjustColorBrightness(shipColor, 24);
        this.ctx.fillStyle = deckColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -height * 0.27);
        this.ctx.quadraticCurveTo(width * 0.19, -height * 0.07, width * 0.14, height * 0.25);
        this.ctx.lineTo(-width * 0.14, height * 0.25);
        this.ctx.quadraticCurveTo(-width * 0.19, -height * 0.07, 0, -height * 0.27);
        this.ctx.closePath();
        this.ctx.fill();

        // Single mast with outlined shaft and crossbar.
        const mastX = -width * 0.1;
        const mastTop = -height * 0.2;
        const mastBottom = height * 0.2;
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(mastX, mastBottom);
        this.ctx.lineTo(mastX, mastTop);
        this.ctx.stroke();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1.2;
        this.ctx.beginPath();
        this.ctx.moveTo(mastX, mastBottom);
        this.ctx.lineTo(mastX, mastTop);
        this.ctx.stroke();
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(mastX - width * 0.09, -height * 0.04);
        this.ctx.lineTo(mastX + width * 0.09, -height * 0.04);
        this.ctx.stroke();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(mastX - width * 0.09, -height * 0.04);
        this.ctx.lineTo(mastX + width * 0.09, -height * 0.04);
        this.ctx.stroke();
    }

    drawFrigate(shipColor, shipWidth, shipHeight, orientation = 'horizontal') {
        const width = shipWidth;
        const height = shipHeight;
        const bowY = -height / 2;
        const sternY = height / 2;
        const sternHalfWidth = width * (orientation === 'vertical' ? 0.16 : 0.22);

        // Elongated hull silhouette with pronounced bow and tapered stern.
        this.ctx.fillStyle = shipColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, bowY);
        this.ctx.quadraticCurveTo(width * 0.58, -height * 0.02, sternHalfWidth, sternY);
        this.ctx.lineTo(-sternHalfWidth, sternY);
        this.ctx.quadraticCurveTo(-width * 0.58, -height * 0.02, 0, bowY);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Inner deck.
        const deckColor = this.adjustColorBrightness(shipColor, 24);
        this.ctx.fillStyle = deckColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -height * 0.3);
        this.ctx.quadraticCurveTo(width * 0.32, -height * 0.04, sternHalfWidth * 0.75, height * 0.28);
        this.ctx.lineTo(-sternHalfWidth * 0.75, height * 0.28);
        this.ctx.quadraticCurveTo(-width * 0.32, -height * 0.04, 0, -height * 0.3);
        this.ctx.closePath();
        this.ctx.fill();

        // Two outlined masts with small crossbars.
        const mastXs = [-width * 0.2, width * 0.2];
        for (const mastX of mastXs) {
            const mastTop = -height * 0.22;
            const mastBottom = height * 0.24;
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(mastX, mastBottom);
            this.ctx.lineTo(mastX, mastTop);
            this.ctx.stroke();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 1.2;
            this.ctx.beginPath();
            this.ctx.moveTo(mastX, mastBottom);
            this.ctx.lineTo(mastX, mastTop);
            this.ctx.stroke();
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(mastX - width * 0.07, -height * 0.03);
            this.ctx.lineTo(mastX + width * 0.07, -height * 0.03);
            this.ctx.stroke();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(mastX - width * 0.07, -height * 0.03);
            this.ctx.lineTo(mastX + width * 0.07, -height * 0.03);
            this.ctx.stroke();
        }

        // Single row of gun ports, one per side.
        this.ctx.fillStyle = '#000';
        const portY = height * 0.2;
        const portWidth = Math.max(2, Math.min(4, width * 0.08));
        const portHeight = Math.max(2, Math.min(4, height * 0.2));
        this.ctx.fillRect(-width * 0.33, portY, portWidth, portHeight);
        this.ctx.fillRect(width * 0.33 - portWidth, portY, portWidth, portHeight);
    }

    drawFlagship(shipColor, shipSize, shipHeight) {
        const width = shipSize;
        const height = shipHeight * 1.1;
        const bowY = -height / 2;
        const sternY = height / 2;

        // Wide hull silhouette with stronger curve and tapered stern point.
        this.ctx.fillStyle = shipColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, bowY);
        this.ctx.quadraticCurveTo(width * 0.64, -height * 0.02, 0, sternY);
        this.ctx.quadraticCurveTo(-width * 0.64, -height * 0.02, 0, bowY);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2.5;
        this.ctx.stroke();

        // Main deck.
        const deckColor = this.adjustColorBrightness(shipColor, 24);
        this.ctx.fillStyle = deckColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -height * 0.33);
        this.ctx.quadraticCurveTo(width * 0.39, -height * 0.02, 0, height * 0.24);
        this.ctx.quadraticCurveTo(-width * 0.39, -height * 0.02, 0, -height * 0.33);
        this.ctx.closePath();
        this.ctx.fill();

        // Upper deck.
        const upperDeckColor = this.adjustColorBrightness(shipColor, 40);
        this.ctx.fillStyle = upperDeckColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -height * 0.22);
        this.ctx.quadraticCurveTo(width * 0.22, -height * 0.04, 0, height * 0.1);
        this.ctx.quadraticCurveTo(-width * 0.22, -height * 0.04, 0, -height * 0.22);
        this.ctx.closePath();
        this.ctx.fill();

        // Three outlined masts with crossbars.
        const mastXs = [-width * 0.22, 0, width * 0.22];
        for (const mastX of mastXs) {
            const mastTop = -height * 0.22;
            const mastBottom = height * 0.22;
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 3.2;
            this.ctx.beginPath();
            this.ctx.moveTo(mastX, mastBottom);
            this.ctx.lineTo(mastX, mastTop);
            this.ctx.stroke();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 1.4;
            this.ctx.beginPath();
            this.ctx.moveTo(mastX, mastBottom);
            this.ctx.lineTo(mastX, mastTop);
            this.ctx.stroke();
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(mastX - width * 0.07, -height * 0.02);
            this.ctx.lineTo(mastX + width * 0.07, -height * 0.02);
            this.ctx.stroke();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(mastX - width * 0.07, -height * 0.02);
            this.ctx.lineTo(mastX + width * 0.07, -height * 0.02);
            this.ctx.stroke();
        }

        // Two rows of gun ports, two ports per side per row.
        this.ctx.fillStyle = '#000';
        const portWidth = Math.max(2, Math.min(4, width * 0.08));
        const portHeight = Math.max(2, Math.min(4, height * 0.07));
        const rows = [-height * 0.06, height * 0.14];
        for (const y of rows) {
            this.ctx.fillRect(-width * 0.36, y, portWidth, portHeight);
            this.ctx.fillRect(-width * 0.24, y, portWidth, portHeight);
            this.ctx.fillRect(width * 0.24 - portWidth, y, portWidth, portHeight);
            this.ctx.fillRect(width * 0.36 - portWidth, y, portWidth, portHeight);
        }
    }

    drawFogOverlay() {
        if (!this.game.fogOfWar) return;

        this.ensureFogCacheCanvas();
        const advancedFogEnabled = this.isAtmosphereEffectsEnabled();

        const visibilityStateKey = this.buildFogVisibilityStateKey();
        if (this.fogVisibilityStateKey !== visibilityStateKey) {
            this.fogVisibleTilesCache = this.game.fogOfWar.calculateVisionCoverage(this.game.currentPlayer);
            this.fogVisibleTilesHash = this.hashTileSet(this.fogVisibleTilesCache);
            this.fogVisibilityStateKey = visibilityStateKey;
            this.fogCacheKey = null;
        }

        const visibleTiles = this.fogVisibleTilesCache;
        const fogCacheKey = this.buildFogCacheKey(
            visibilityStateKey,
            this.fogVisibleTilesHash,
            visibleTiles.size,
            advancedFogEnabled
        );

        if (this.fogCacheKey !== fogCacheKey) {
            this.fogCacheCtx.clearRect(0, 0, this.fogCacheCanvas.width, this.fogCacheCanvas.height);
            if (advancedFogEnabled) {
                this.rebuildFogCacheLayer(visibleTiles);
            } else {
                this.rebuildClassicFogLayer(visibleTiles);
            }

            this.fogCacheKey = fogCacheKey;
        }

        this.ctx.drawImage(this.fogCacheCanvas, 0, 0);
    }

    ensureFogCacheCanvas() {
        if (!this.fogCacheCanvas) {
            this.fogCacheCanvas = document.createElement('canvas');
            this.fogCacheCtx = this.fogCacheCanvas.getContext('2d');
        }

        if (this.fogCacheCanvas.width !== this.canvas.width || this.fogCacheCanvas.height !== this.canvas.height) {
            this.fogCacheCanvas.width = this.canvas.width;
            this.fogCacheCanvas.height = this.canvas.height;
            this.fogCacheKey = null;
            this.fogVisibilityStateKey = null;
        }
    }

    rebuildFogCacheLayer(visibleTiles) {
        const width = this.gameMap.width;
        const height = this.gameMap.height;
        const distanceMap = buildVisibilityDistanceMap(width, height, visibleTiles);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tile = this.gameMap.getTile(x, y);

                // Islands always remain visible through fog.
                if (tile.isIsland()) continue;

                // Friendly ship tiles always remain visible.
                const shipAtTile = this.gameMap.getShipAt(x, y);
                if (shipAtTile && shipAtTile.owner === this.game.currentPlayer) continue;

                const tileKey = `${x},${y}`;
                if (visibleTiles.has(tileKey)) continue;

                const distance = distanceMap[y * width + x];
                const alpha = getFogOpacityForDistance(distance, this.fogVisualConfig);
                if (alpha <= 0) continue;

                const screenX = x * this.tileSize;
                const screenY = y * this.tileSize;
                this.fogCacheCtx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
                this.fogCacheCtx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
            }
        }

        this.applyFogBoundaryFeather(visibleTiles);
    }

    rebuildClassicFogLayer(visibleTiles) {
        this.fogCacheCtx.fillStyle = 'rgba(0, 0, 0, 0.35)';

        for (let y = 0; y < this.gameMap.height; y++) {
            for (let x = 0; x < this.gameMap.width; x++) {
                const tile = this.gameMap.getTile(x, y);

                // Islands stay visible.
                if (tile.isIsland()) continue;

                // Friendly ship tiles stay visible.
                const shipAtTile = this.gameMap.getShipAt(x, y);
                if (shipAtTile && shipAtTile.owner === this.game.currentPlayer) continue;

                if (!visibleTiles.has(`${x},${y}`)) {
                    const screenX = x * this.tileSize;
                    const screenY = y * this.tileSize;
                    this.fogCacheCtx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                }
            }
        }
    }

    applyFogBoundaryFeather(visibleTiles) {
        const width = this.gameMap.width;
        const height = this.gameMap.height;
        const featherAlpha = this.fogVisualConfig.FEATHER_ALPHA;
        if (featherAlpha <= 0) return;

        this.fogCacheCtx.save();
        this.fogCacheCtx.globalCompositeOperation = 'destination-out';

        for (const tileKey of visibleTiles) {
            const [xRaw, yRaw] = tileKey.split(',');
            const x = Number.parseInt(xRaw, 10);
            const y = Number.parseInt(yRaw, 10);
            if (!hasUnseenNeighbor(x, y, visibleTiles, width, height)) continue;

            const centerX = x * this.tileSize + this.tileSize / 2;
            const centerY = y * this.tileSize + this.tileSize / 2;
            const radius = this.tileSize * 1.2;
            const feather = this.fogCacheCtx.createRadialGradient(
                centerX,
                centerY,
                this.tileSize * 0.25,
                centerX,
                centerY,
                radius
            );
            feather.addColorStop(0, `rgba(0, 0, 0, ${featherAlpha})`);
            feather.addColorStop(1, 'rgba(0, 0, 0, 0)');
            this.fogCacheCtx.fillStyle = feather;
            this.fogCacheCtx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
        }

        this.fogCacheCtx.restore();
    }

    hashTileSet(tileSet) {
        let hash = 2166136261;
        for (const key of tileSet) {
            for (let i = 0; i < key.length; i++) {
                hash ^= key.charCodeAt(i);
                hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
            }
        }
        return hash >>> 0;
    }

    buildFogVisibilityStateKey() {
        const friendlyState = this.game
            .getShipsByOwner(this.game.currentPlayer, false)
            .map(ship => `${ship.id}:${ship.x},${ship.y},${ship.orientation},${ship.isDestroyed ? 1 : 0}`)
            .join('|');

        return `${this.game.currentPlayer}|${this.game.turnNumber}|${friendlyState}`;
    }

    buildFogCacheKey(visibilityStateKey, visibleHash, visibleCount, advancedFogEnabled = true) {
        const fogStyleState = [
            advancedFogEnabled ? 1 : 0,
            this.fogVisualConfig.FRONTIER_DISTANCE,
            this.fogVisualConfig.MID_DISTANCE,
            this.fogVisualConfig.FRONTIER_ALPHA,
            this.fogVisualConfig.MID_ALPHA,
            this.fogVisualConfig.DEEP_ALPHA,
            this.fogVisualConfig.FEATHER_ALPHA
        ].join(',');

        return `${visibilityStateKey}|${visibleCount}|${visibleHash}|${fogStyleState}`;
    }

    drawGhostShips() {
        if (!this.game.fogOfWar) return;

        // Get ghost ships for current player
        const ghostShips = this.game.fogOfWar.getGhostShips(this.game.currentPlayer);

        for (const ghostData of ghostShips) {
            // Safety check: never render a ghost when the real ship is visible
            if (this.game.fogOfWar.isShipVisible(ghostData.ship, this.game.currentPlayer)) {
                continue;
            }
            this.drawGhostShip(ghostData.ship, ghostData.lastX, ghostData.lastY, ghostData.orientation);
        }
    }

    drawGhostShip(ship, lastX, lastY, orientation = ship.orientation) {
        const bounds = this.getShipBounds(ship, lastX, lastY, orientation);
        const screenX = bounds.x + bounds.width / 2;
        const screenY = bounds.y + bounds.height / 2;

        this.ctx.save();
        this.ctx.translate(screenX, screenY);

        // Determine ship color (translucent)
        const shipColor = ship.owner === 'player1' ? COLORS.PLAYER1 : COLORS.PLAYER2;
        const ghostColor = shipColor + '66'; // Add alpha for transparency (0.4 opacity)

        let shipWidth = Math.min(bounds.width, bounds.height) * 0.6;
        let shipHeight = Math.max(bounds.width, bounds.height) * 0.8;
        if (ship.type === 2) {
            shipWidth = bounds.width * 0.82;
            shipHeight = bounds.height * 0.68;
        }

        // Set dashed border for ghost ships
        this.ctx.setLineDash([5, 5]);

        // Draw ship shape based on type
        if (ship.type === 1) {
            this.drawSloop(ghostColor, shipWidth, shipHeight);
        } else if (ship.type === 2) {
            this.drawFrigate(ghostColor, shipWidth, shipHeight, orientation);
        } else if (ship.type === 3) {
            this.drawFlagship(ghostColor, shipWidth, shipHeight);
        }

        // Draw dashed border
        this.ctx.strokeStyle = shipColor;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Reset line dash
        this.ctx.setLineDash([]);

        this.ctx.restore();

        // Note: Do NOT draw HP bars, action badges, or DONE overlays for ghost ships
    }
}
