import { GRID, COLORS } from '../../../shared/constants.js';
import { Camera } from './Camera.js';

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

        this.canvas.width = this.gameMap.width * this.tileSize;
        this.canvas.height = this.gameMap.height * this.tileSize;
    }

    render(hoveredShip = null) {
        this.hoveredShip = hoveredShip;
        const shakeOffset = this.getCurrentShakeOffset();

        this.clear();
        this.ctx.save();
        this.ctx.setTransform(this.camera.zoom, 0, 0, this.camera.zoom, this.camera.offsetX + shakeOffset.x, this.camera.offsetY + shakeOffset.y);
        this.drawMap();
        this.drawFogOverlay();  // Draw fog after terrain but before ships
        this.drawValidMoveHighlights();
        this.drawValidTargetHighlights();
        this.drawShips();
        this.drawGhostShips();  // Draw ghost ships after real ships
        this.drawSelection();
        this.drawSelectedCapturedBadge();
        this.drawHoveredShipHighlight();
        this.drawGrid();
        this.drawCombatEffects();
        this.ctx.restore();
    }

    clear() {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.fillStyle = COLORS.WATER;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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

            // Draw ship level indicator
            this.ctx.fillStyle = '#fff';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 3;
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.strokeText(ship.type.toString(), 0, 0);
            this.ctx.fillText(ship.type.toString(), 0, 0);

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

    drawValidTargetHighlights() {
        if (this.game.actionMode !== 'attack' && this.game.actionMode !== 'board') return;

        for (const target of this.game.validTargets) {
            const bounds = this.getShipBounds(target);
            this.ctx.fillStyle = COLORS.ATTACK_RANGE;
            this.ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
        }
    }

    drawSloop(shipColor, shipSize, shipHeight) {
        // Small, simple triangle - fast and nimble
        this.ctx.fillStyle = shipColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -shipHeight / 2);  // Bow (front)
        this.ctx.lineTo(-shipSize / 2, shipHeight / 2);  // Port stern
        this.ctx.lineTo(shipSize / 2, shipHeight / 2);   // Starboard stern
        this.ctx.closePath();
        this.ctx.fill();

        // Outline
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Small deck
        const deckColor = this.adjustColorBrightness(shipColor, 30);
        this.ctx.fillStyle = deckColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -shipHeight / 4);
        this.ctx.lineTo(-shipSize / 4, shipHeight / 4);
        this.ctx.lineTo(shipSize / 4, shipHeight / 4);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawFrigate(shipColor, shipWidth, shipHeight, orientation = 'horizontal') {
        // Pentagon shape - wider and more substantial
        const width = shipWidth;
        const height = shipHeight;
        const bowDepth = orientation === 'vertical' ? height * 0.5 : height * 0.45;

        this.ctx.fillStyle = shipColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -bowDepth);  // Bow
        this.ctx.lineTo(width / 2, -height / 6);  // Starboard fore
        this.ctx.lineTo(width / 2, height / 2);   // Starboard aft
        this.ctx.lineTo(-width / 2, height / 2);  // Port aft
        this.ctx.lineTo(-width / 2, -height / 6); // Port fore
        this.ctx.closePath();
        this.ctx.fill();

        // Outline
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Deck details
        const deckColor = this.adjustColorBrightness(shipColor, 30);
        this.ctx.fillStyle = deckColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -height / 3);
        this.ctx.lineTo(width / 3, 0);
        this.ctx.lineTo(width / 3, height / 3);
        this.ctx.lineTo(-width / 3, height / 3);
        this.ctx.lineTo(-width / 3, 0);
        this.ctx.closePath();
        this.ctx.fill();

        // Gun ports (small rectangles)
        this.ctx.fillStyle = '#000';
        const portY1 = height / 6;
        const portY2 = height / 3;
        this.ctx.fillRect(-width / 3, portY1, 3, 3);
        this.ctx.fillRect(width / 3 - 3, portY1, 3, 3);
    }

    drawFlagship(shipColor, shipSize, shipHeight) {
        // Large hexagon - imposing and powerful
        const width = shipSize;
        const height = shipHeight * 1.1;

        this.ctx.fillStyle = shipColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -height / 2);  // Bow
        this.ctx.lineTo(width / 2.5, -height / 3);  // Starboard fore
        this.ctx.lineTo(width / 2.5, height / 3);   // Starboard mid
        this.ctx.lineTo(0, height / 2);   // Stern
        this.ctx.lineTo(-width / 2.5, height / 3);  // Port mid
        this.ctx.lineTo(-width / 2.5, -height / 3); // Port fore
        this.ctx.closePath();
        this.ctx.fill();

        // Outline
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2.5;
        this.ctx.stroke();

        // Multiple deck levels
        const deckColor = this.adjustColorBrightness(shipColor, 30);
        this.ctx.fillStyle = deckColor;

        // Main deck
        this.ctx.beginPath();
        this.ctx.moveTo(0, -height / 3);
        this.ctx.lineTo(width / 3.5, -height / 6);
        this.ctx.lineTo(width / 3.5, height / 4);
        this.ctx.lineTo(-width / 3.5, height / 4);
        this.ctx.lineTo(-width / 3.5, -height / 6);
        this.ctx.closePath();
        this.ctx.fill();

        // Upper deck
        const upperDeckColor = this.adjustColorBrightness(shipColor, 50);
        this.ctx.fillStyle = upperDeckColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -height / 4);
        this.ctx.lineTo(width / 5, -height / 8);
        this.ctx.lineTo(width / 5, height / 8);
        this.ctx.lineTo(-width / 5, height / 8);
        this.ctx.lineTo(-width / 5, -height / 8);
        this.ctx.closePath();
        this.ctx.fill();

        // Gun ports (multiple rows)
        this.ctx.fillStyle = '#000';
        const portWidth = 3;
        const portHeight = 3;

        // Upper gun deck
        for (let i = 0; i < 2; i++) {
            const y = -height / 6 + i * height / 6;
            this.ctx.fillRect(-width / 3, y, portWidth, portHeight);
            this.ctx.fillRect(width / 3 - portWidth, y, portWidth, portHeight);
        }

        // Lower gun deck
        for (let i = 0; i < 2; i++) {
            const y = height / 12 + i * height / 6;
            this.ctx.fillRect(-width / 3.5, y, portWidth, portHeight);
            this.ctx.fillRect(width / 3.5 - portWidth, y, portWidth, portHeight);
        }
    }

    drawFogOverlay() {
        if (!this.game.fogOfWar) return;

        this.ensureFogCacheCanvas();

        // Get visible tiles for current player.
        const visibleTiles = this.game.fogOfWar.calculateVisionCoverage(this.game.currentPlayer);
        const fogCacheKey = this.buildFogCacheKey(visibleTiles);

        if (this.fogCacheKey !== fogCacheKey) {
            this.fogCacheCtx.clearRect(0, 0, this.fogCacheCanvas.width, this.fogCacheCanvas.height);
            this.fogCacheCtx.fillStyle = 'rgba(0, 0, 0, 0.35)';

            for (let y = 0; y < this.gameMap.height; y++) {
                for (let x = 0; x < this.gameMap.width; x++) {
                    const tile = this.gameMap.getTile(x, y);

                    // Skip islands - they are always visible.
                    if (tile.isIsland()) continue;

                    // Skip tiles with friendly ships - always visible.
                    const shipAtTile = this.gameMap.getShipAt(x, y);
                    if (shipAtTile && shipAtTile.owner === this.game.currentPlayer) continue;

                    const tileKey = `${x},${y}`;
                    if (!visibleTiles.has(tileKey)) {
                        const screenX = x * this.tileSize;
                        const screenY = y * this.tileSize;
                        this.fogCacheCtx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                    }
                }
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
        }
    }

    buildFogCacheKey(visibleTiles) {
        let hash = 2166136261;
        for (const key of visibleTiles) {
            for (let i = 0; i < key.length; i++) {
                hash ^= key.charCodeAt(i);
                hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
            }
        }

        const friendlyState = this.game
            .getShipsByOwner(this.game.currentPlayer, false)
            .map(ship => `${ship.id}:${ship.x},${ship.y},${ship.orientation},${ship.isDestroyed ? 1 : 0}`)
            .join('|');

        return `${this.game.currentPlayer}|${this.game.turnNumber}|${visibleTiles.size}|${hash >>> 0}|${friendlyState}`;
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
