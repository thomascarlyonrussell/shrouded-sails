import { ActionMenu } from '../ui/ActionMenu.js';

export class InputHandler {
    constructor(canvas, game, renderer) {
        this.canvas = canvas;
        this.game = game;
        this.renderer = renderer;
        this.actionMenu = new ActionMenu(game);
        this.headerElements = null;
        this.headerStateCache = {
            playerText: null,
            turnText: null,
            windArrow: null,
            windName: null,
            windStrength: null
        };
        this.touchState = {
            active: false,
            startTime: 0,
            startX: 0,
            startY: 0,
            panning: false,
            lastX: 0,
            lastY: 0,
            pinchDistance: null
        };
        this.mouseState = {
            active: false,
            startX: 0,
            startY: 0,
            lastX: 0,
            lastY: 0,
            panning: false,
            suppressNextClick: false
        };

        this.canvasClickHandler = (e) => this.handleCanvasClick(e);
        this.canvasHoverHandler = (e) => this.handleCanvasHover(e);
        this.mouseDownHandler = (e) => this.handleMouseDown(e);
        this.mouseMoveHandler = (e) => this.handleMouseMove(e);
        this.mouseUpHandler = (e) => this.handleMouseUp(e);
        this.touchStartHandler = (e) => this.handleTouchStart(e);
        this.touchMoveHandler = (e) => this.handleTouchMove(e);
        this.touchEndHandler = (e) => this.handleTouchEnd(e);
        this.moveButtonHandler = () => { this.game.enterMoveMode(); this.updateUI(); };
        this.fireButtonHandler = () => { this.game.enterAttackMode(); this.updateUI(); };
        this.boardButtonHandler = () => { this.game.enterBoardMode(); this.updateUI(); };
        this.endTurnButtonHandler = () => { this.game.endTurn(); this.updateUI(); };
        this.zoomInButtonHandler = () => this.zoomIn();
        this.zoomOutButtonHandler = () => this.zoomOut();
        this.zoomResetButtonHandler = () => this.resetZoom();
        this.keydownHandler = (e) => this.handleKeyPress(e);

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', this.canvasClickHandler);
        this.canvas.addEventListener('mousemove', this.canvasHoverHandler);
        this.canvas.addEventListener('mousedown', this.mouseDownHandler);
        this.canvas.addEventListener('touchstart', this.touchStartHandler, { passive: false });
        this.canvas.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
        this.canvas.addEventListener('touchend', this.touchEndHandler);
        this.canvas.addEventListener('touchcancel', this.touchEndHandler);
        document.addEventListener('mousemove', this.mouseMoveHandler);
        document.addEventListener('mouseup', this.mouseUpHandler);

        this.moveBtnEl = document.getElementById('moveBtn');
        this.fireBtnEl = document.getElementById('fireBtn');
        this.boardBtnEl = document.getElementById('boardBtn');
        this.endTurnBtnEl = document.getElementById('endTurnBtn');
        this.zoomInBtnEl = document.getElementById('zoomInBtn');
        this.zoomOutBtnEl = document.getElementById('zoomOutBtn');
        this.zoomResetBtnEl = document.getElementById('zoomResetBtn');

        if (this.moveBtnEl) this.moveBtnEl.addEventListener('click', this.moveButtonHandler);
        if (this.fireBtnEl) this.fireBtnEl.addEventListener('click', this.fireButtonHandler);
        if (this.boardBtnEl) this.boardBtnEl.addEventListener('click', this.boardButtonHandler);
        if (this.endTurnBtnEl) this.endTurnBtnEl.addEventListener('click', this.endTurnButtonHandler);
        if (this.zoomInBtnEl) this.zoomInBtnEl.addEventListener('click', this.zoomInButtonHandler);
        if (this.zoomOutBtnEl) this.zoomOutBtnEl.addEventListener('click', this.zoomOutButtonHandler);
        if (this.zoomResetBtnEl) this.zoomResetBtnEl.addEventListener('click', this.zoomResetButtonHandler);

        document.addEventListener('keydown', this.keydownHandler);
    }

    applyZoomDelta(delta) {
        if (!this.renderer || !this.renderer.camera) return;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        this.renderer.cancelCameraTransition();
        this.renderer.camera.setZoom(this.renderer.camera.zoom + delta, centerX, centerY);
        this.renderer.camera.clampToBounds(
            this.canvas.width,
            this.canvas.height,
            this.game.map.width * this.renderer.tileSize,
            this.game.map.height * this.renderer.tileSize
        );
    }

    zoomIn() {
        this.applyZoomDelta(0.25);
    }

    zoomOut() {
        this.applyZoomDelta(-0.25);
    }

    resetZoom() {
        if (!this.renderer || !this.renderer.camera) return;

        this.renderer.cancelCameraTransition();
        this.renderer.camera.reset();
        this.renderer.camera.clampToBounds(
            this.canvas.width,
            this.canvas.height,
            this.game.map.width * this.renderer.tileSize,
            this.game.map.height * this.renderer.tileSize
        );
    }

    getZoomShortcutAction(event) {
        if (event.code === 'NumpadAdd' || event.key === '+' || event.key === '=') {
            return 'in';
        }

        if (event.code === 'NumpadSubtract' || event.key === '-' || event.key === '_') {
            return 'out';
        }

        return null;
    }

    shouldIgnoreZoomShortcut(event) {
        const target = event.target;
        if (!(target instanceof Element)) return false;
        if (target.isContentEditable) return true;

        return Boolean(target.closest('input, textarea, select, button, [role="slider"], [contenteditable="true"]'));
    }

    getCanvasPoint(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const displayX = clientX - rect.left;
        const displayY = clientY - rect.top;
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return { x: displayX * scaleX, y: displayY * scaleY };
    }

    handleCanvasClick(event) {
        if (this.mouseState.suppressNextClick) {
            this.mouseState.suppressNextClick = false;
            return;
        }

        const point = this.getCanvasPoint(event.clientX, event.clientY);
        const gridPos = this.renderer.screenToGrid(point.x, point.y);
        if (this.game.map.isValidPosition(gridPos.x, gridPos.y)) {
            this.game.handleGridClick(gridPos.x, gridPos.y);
            this.updateUI();
        }
    }

    handleCanvasHover(event) {
        const point = this.getCanvasPoint(event.clientX, event.clientY);
        this.renderer.screenToGrid(point.x, point.y);
    }

    handleMouseDown(event) {
        if (event.button !== 0) return;

        this.mouseState.active = true;
        this.mouseState.startX = event.clientX;
        this.mouseState.startY = event.clientY;
        this.mouseState.lastX = event.clientX;
        this.mouseState.lastY = event.clientY;
        this.mouseState.panning = false;
    }

    handleMouseMove(event) {
        if (!this.mouseState.active) return;

        if ((event.buttons & 1) !== 1) {
            this.mouseState.active = false;
            this.mouseState.panning = false;
            return;
        }

        const dx = event.clientX - this.mouseState.lastX;
        const dy = event.clientY - this.mouseState.lastY;
        const totalDx = event.clientX - this.mouseState.startX;
        const totalDy = event.clientY - this.mouseState.startY;
        const movedEnough = Math.hypot(totalDx, totalDy) > 8;

        if (movedEnough && this.renderer.camera.zoom > 1) {
            this.mouseState.panning = true;
            this.mouseState.suppressNextClick = true;
            this.renderer.cancelCameraTransition();
            this.renderer.camera.pan(dx, dy);
            this.renderer.camera.clampToBounds(
                this.canvas.width,
                this.canvas.height,
                this.game.map.width * this.renderer.tileSize,
                this.game.map.height * this.renderer.tileSize
            );
            event.preventDefault();
        }

        this.mouseState.lastX = event.clientX;
        this.mouseState.lastY = event.clientY;
    }

    handleMouseUp(event) {
        if (event.button !== 0 || !this.mouseState.active) return;

        this.mouseState.active = false;
        this.mouseState.panning = false;
    }

    handleTouchStart(event) {
        event.preventDefault();
        if (event.touches.length === 2) {
            this.renderer.cancelCameraTransition();
            const [a, b] = event.touches;
            this.touchState.pinchDistance = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
            return;
        }

        const touch = event.touches[0];
        if (!touch) return;
        this.touchState.active = true;
        this.touchState.startTime = performance.now();
        this.touchState.startX = touch.clientX;
        this.touchState.startY = touch.clientY;
        this.touchState.lastX = touch.clientX;
        this.touchState.lastY = touch.clientY;
        this.touchState.panning = false;
    }

    handleTouchMove(event) {
        event.preventDefault();
        if (event.touches.length === 2) {
            this.renderer.cancelCameraTransition();
            const [a, b] = event.touches;
            const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
            if (this.touchState.pinchDistance) {
                const delta = dist - this.touchState.pinchDistance;
                const midpoint = this.getCanvasPoint((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
                this.renderer.camera.setZoom(this.renderer.camera.zoom + delta * 0.005, midpoint.x, midpoint.y);
                this.renderer.camera.clampToBounds(this.canvas.width, this.canvas.height, this.game.map.width * this.renderer.tileSize, this.game.map.height * this.renderer.tileSize);
            }
            this.touchState.pinchDistance = dist;
            return;
        }

        const touch = event.touches[0];
        if (!touch || !this.touchState.active) return;

        const dx = touch.clientX - this.touchState.lastX;
        const dy = touch.clientY - this.touchState.lastY;
        const totalDx = touch.clientX - this.touchState.startX;
        const totalDy = touch.clientY - this.touchState.startY;

        if (Math.hypot(totalDx, totalDy) > 10) {
            this.touchState.panning = true;
            if (this.renderer.camera.zoom > 1) {
                this.renderer.cancelCameraTransition();
                this.renderer.camera.pan(dx, dy);
                this.renderer.camera.clampToBounds(this.canvas.width, this.canvas.height, this.game.map.width * this.renderer.tileSize, this.game.map.height * this.renderer.tileSize);
            }
        }

        this.touchState.lastX = touch.clientX;
        this.touchState.lastY = touch.clientY;
    }

    handleTouchEnd(event) {
        if (event.touches.length === 0 && this.touchState.active) {
            const elapsed = performance.now() - this.touchState.startTime;
            const distance = Math.hypot(this.touchState.lastX - this.touchState.startX, this.touchState.lastY - this.touchState.startY);

            if (!this.touchState.panning && elapsed < 200 && distance < 10) {
                const point = this.getCanvasPoint(this.touchState.startX, this.touchState.startY);
                const gridPos = this.renderer.screenToGrid(point.x, point.y);
                if (this.game.map.isValidPosition(gridPos.x, gridPos.y)) {
                    this.game.handleGridClick(gridPos.x, gridPos.y);
                    this.updateUI();
                }
            }
        }

        if (event.touches.length < 2) this.touchState.pinchDistance = null;
        if (event.touches.length === 0) this.touchState.active = false;
    }

    handleKeyPress(event) {
        const zoomAction = this.getZoomShortcutAction(event);
        if (zoomAction && !this.shouldIgnoreZoomShortcut(event)) {
            event.preventDefault();
            if (zoomAction === 'in') {
                this.zoomIn();
            } else {
                this.zoomOut();
            }
            return;
        }

        switch (event.key) {
            case 'Escape': this.game.cancelActionMode(); this.updateUI(); break;
            case 'm': case 'M': if (this.game.selectedShip) { this.game.enterMoveMode(); this.updateUI(); } break;
            case 'f': case 'F': if (this.game.selectedShip) { this.game.enterAttackMode(); this.updateUI(); } break;
            case 'b': case 'B': if (this.game.selectedShip) { this.game.enterBoardMode(); this.updateUI(); } break;
            case 'Enter': this.game.endTurn(); this.updateUI(); break;
        }
    }

    updateUI() {
        const selectedShip = this.game.selectedShip;
        const shipInfo = document.getElementById('selectedShipInfo');
        shipInfo.textContent = selectedShip ? selectedShip.getStatusText() : 'No ship selected';
        this.actionMenu.updateButtonStates(selectedShip);
        this.actionMenu.highlightActiveMode(this.game.actionMode);
        this.updateHeaderStatus();
    }

    getHeaderElements() {
        if (!this.headerElements) {
            this.headerElements = {
                playerInfo: document.getElementById('playerInfo'),
                turnInfo: document.getElementById('turnInfo'),
                windArrow: document.getElementById('windDirectionArrow'),
                windName: document.getElementById('windDirectionName'),
                windStrength: document.getElementById('windStrengthValue')
            };
        }
        return this.headerElements;
    }

    updateHeaderStatus() {
        const elements = this.getHeaderElements();
        if (!elements.playerInfo || !elements.turnInfo || !elements.windArrow || !elements.windName || !elements.windStrength) return;

        const playerNum = this.game.currentPlayer === 'player1' ? '1' : '2';
        const playerColor = this.game.currentPlayer === 'player1' ? 'Red' : 'Blue';
        const playerText = `Player: ${playerNum} (${playerColor})`;
        const turnText = `Turn: ${this.game.turnNumber}`;
        const windArrow = this.game.wind ? this.game.wind.getDirectionArrow() : '-';
        const windName = this.game.wind ? this.game.wind.getDirectionName() : 'Calm';
        const windStrength = this.game.wind ? String(this.game.wind.strength) : '0';

        if (this.headerStateCache.playerText !== playerText) { elements.playerInfo.textContent = playerText; this.headerStateCache.playerText = playerText; }
        if (this.headerStateCache.turnText !== turnText) { elements.turnInfo.textContent = turnText; this.headerStateCache.turnText = turnText; }
        if (this.headerStateCache.windArrow !== windArrow) { elements.windArrow.textContent = windArrow; this.headerStateCache.windArrow = windArrow; }
        if (this.headerStateCache.windName !== windName) { elements.windName.textContent = windName; this.headerStateCache.windName = windName; }
        if (this.headerStateCache.windStrength !== windStrength) { elements.windStrength.textContent = windStrength; this.headerStateCache.windStrength = windStrength; }
    }

    destroy() {
        if (this.canvas) {
            this.canvas.removeEventListener('click', this.canvasClickHandler);
            this.canvas.removeEventListener('mousemove', this.canvasHoverHandler);
            this.canvas.removeEventListener('mousedown', this.mouseDownHandler);
            this.canvas.removeEventListener('touchstart', this.touchStartHandler);
            this.canvas.removeEventListener('touchmove', this.touchMoveHandler);
            this.canvas.removeEventListener('touchend', this.touchEndHandler);
            this.canvas.removeEventListener('touchcancel', this.touchEndHandler);
        }
        document.removeEventListener('mousemove', this.mouseMoveHandler);
        document.removeEventListener('mouseup', this.mouseUpHandler);
        if (this.moveBtnEl) this.moveBtnEl.removeEventListener('click', this.moveButtonHandler);
        if (this.fireBtnEl) this.fireBtnEl.removeEventListener('click', this.fireButtonHandler);
        if (this.boardBtnEl) this.boardBtnEl.removeEventListener('click', this.boardButtonHandler);
        if (this.endTurnBtnEl) this.endTurnBtnEl.removeEventListener('click', this.endTurnButtonHandler);
        if (this.zoomInBtnEl) this.zoomInBtnEl.removeEventListener('click', this.zoomInButtonHandler);
        if (this.zoomOutBtnEl) this.zoomOutBtnEl.removeEventListener('click', this.zoomOutButtonHandler);
        if (this.zoomResetBtnEl) this.zoomResetBtnEl.removeEventListener('click', this.zoomResetButtonHandler);
        document.removeEventListener('keydown', this.keydownHandler);
    }
}
