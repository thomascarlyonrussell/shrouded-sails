import { ActionMenu } from '../ui/ActionMenu.js';
import { ACTION_MODES } from '../../../shared/constants.js';

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
        this.canvasClickHandler = (e) => this.handleCanvasClick(e);
        this.canvasHoverHandler = (e) => this.handleCanvasHover(e);
        this.moveButtonHandler = () => {
            this.game.enterMoveMode();
            this.updateUI();
        };
        this.fireButtonHandler = () => {
            this.game.enterAttackMode();
            this.updateUI();
        };
        this.boardButtonHandler = () => {
            this.game.enterBoardMode();
            this.updateUI();
        };
        this.endTurnButtonHandler = () => {
            this.game.endTurn();
            this.updateUI();
        };
        this.keydownHandler = (e) => this.handleKeyPress(e);

        this.moveBtnEl = null;
        this.fireBtnEl = null;
        this.boardBtnEl = null;
        this.endTurnBtnEl = null;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Canvas click
        this.canvas.addEventListener('click', this.canvasClickHandler);

        // Canvas hover (for future tooltips)
        this.canvas.addEventListener('mousemove', this.canvasHoverHandler);

        // Action buttons
        this.moveBtnEl = document.getElementById('moveBtn');
        this.fireBtnEl = document.getElementById('fireBtn');
        this.boardBtnEl = document.getElementById('boardBtn');
        this.endTurnBtnEl = document.getElementById('endTurnBtn');

        if (this.moveBtnEl) {
            this.moveBtnEl.addEventListener('click', this.moveButtonHandler);
        }
        if (this.fireBtnEl) {
            this.fireBtnEl.addEventListener('click', this.fireButtonHandler);
        }
        if (this.boardBtnEl) {
            this.boardBtnEl.addEventListener('click', this.boardButtonHandler);
        }
        if (this.endTurnBtnEl) {
            this.endTurnBtnEl.addEventListener('click', this.endTurnButtonHandler);
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', this.keydownHandler);
    }

    handleCanvasClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const displayX = event.clientX - rect.left;
        const displayY = event.clientY - rect.top;

        // Scale from display coordinates to canvas coordinates
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const canvasX = displayX * scaleX;
        const canvasY = displayY * scaleY;

        const gridPos = this.renderer.screenToGrid(canvasX, canvasY);

        if (this.game.map.isValidPosition(gridPos.x, gridPos.y)) {
            this.game.handleGridClick(gridPos.x, gridPos.y);
            this.updateUI();
        }
    }

    handleCanvasHover(event) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = event.clientX - rect.left;
        const screenY = event.clientY - rect.top;

        const gridPos = this.renderer.screenToGrid(screenX, screenY);

        // Could add hover effects here in the future
    }

    handleKeyPress(event) {
        switch (event.key) {
            case 'Escape':
                // Escape should only cancel the current action mode, never consume or clear ship selection.
                this.game.cancelActionMode();
                this.updateUI();
                break;
            case 'm':
            case 'M':
                if (this.game.selectedShip) {
                    this.game.enterMoveMode();
                    this.updateUI();
                }
                break;
            case 'f':
            case 'F':
                if (this.game.selectedShip) {
                    this.game.enterAttackMode();
                    this.updateUI();
                }
                break;
            case 'b':
            case 'B':
                if (this.game.selectedShip) {
                    this.game.enterBoardMode();
                    this.updateUI();
                }
                break;
            case 'Enter':
                this.game.endTurn();
                this.updateUI();
                break;
        }
    }

    updateUI() {
        const selectedShip = this.game.selectedShip;

        // Update ship info
        const shipInfo = document.getElementById('selectedShipInfo');
        if (selectedShip) {
            shipInfo.textContent = selectedShip.getStatusText();
        } else {
            shipInfo.textContent = 'No ship selected';
        }

        // Update action buttons
        this.actionMenu.updateButtonStates(selectedShip);
        this.actionMenu.highlightActiveMode(this.game.actionMode);

        // Update header info
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
        if (!elements.playerInfo || !elements.turnInfo || !elements.windArrow || !elements.windName || !elements.windStrength) {
            return;
        }

        const playerNum = this.game.currentPlayer === 'player1' ? '1' : '2';
        const playerColor = this.game.currentPlayer === 'player1' ? 'Red' : 'Blue';
        const playerText = `Player: ${playerNum} (${playerColor})`;
        const turnText = `Turn: ${this.game.turnNumber}`;

        const windArrow = this.game.wind ? this.game.wind.getDirectionArrow() : '-';
        const windName = this.game.wind ? this.game.wind.getDirectionName() : 'Calm';
        const windStrength = this.game.wind ? String(this.game.wind.strength) : '0';

        if (this.headerStateCache.playerText !== playerText) {
            elements.playerInfo.textContent = playerText;
            this.headerStateCache.playerText = playerText;
        }

        if (this.headerStateCache.turnText !== turnText) {
            elements.turnInfo.textContent = turnText;
            this.headerStateCache.turnText = turnText;
        }

        if (this.headerStateCache.windArrow !== windArrow) {
            elements.windArrow.textContent = windArrow;
            this.headerStateCache.windArrow = windArrow;
        }

        if (this.headerStateCache.windName !== windName) {
            elements.windName.textContent = windName;
            this.headerStateCache.windName = windName;
        }

        if (this.headerStateCache.windStrength !== windStrength) {
            elements.windStrength.textContent = windStrength;
            this.headerStateCache.windStrength = windStrength;
        }
    }

    destroy() {
        if (this.canvas) {
            this.canvas.removeEventListener('click', this.canvasClickHandler);
            this.canvas.removeEventListener('mousemove', this.canvasHoverHandler);
        }

        if (this.moveBtnEl) {
            this.moveBtnEl.removeEventListener('click', this.moveButtonHandler);
        }
        if (this.fireBtnEl) {
            this.fireBtnEl.removeEventListener('click', this.fireButtonHandler);
        }
        if (this.boardBtnEl) {
            this.boardBtnEl.removeEventListener('click', this.boardButtonHandler);
        }
        if (this.endTurnBtnEl) {
            this.endTurnBtnEl.removeEventListener('click', this.endTurnButtonHandler);
        }

        document.removeEventListener('keydown', this.keydownHandler);
    }
}
