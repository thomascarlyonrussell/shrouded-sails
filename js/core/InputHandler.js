import { ActionMenu } from '../ui/ActionMenu.js';

export class InputHandler {
    constructor(canvas, game, renderer) {
        this.canvas = canvas;
        this.game = game;
        this.renderer = renderer;
        this.actionMenu = new ActionMenu(game);

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Canvas click
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

        // Canvas hover (for future tooltips)
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasHover(e));

        // Action buttons
        document.getElementById('moveBtn').addEventListener('click', () => {
            this.game.enterMoveMode();
        });

        document.getElementById('fireBtn').addEventListener('click', () => {
            this.game.enterAttackMode();
        });

        document.getElementById('boardBtn').addEventListener('click', () => {
            this.game.enterBoardMode();
        });

        document.getElementById('endTurnBtn').addEventListener('click', () => {
            this.game.endTurn();
            this.updateUI();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
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
                this.game.deselectShip();
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
        const playerInfo = document.getElementById('playerInfo');
        const playerNum = this.game.currentPlayer === 'player1' ? '1' : '2';
        const playerColor = this.game.currentPlayer === 'player1' ? 'Red' : 'Blue';
        playerInfo.textContent = `Player: ${playerNum} (${playerColor})`;

        const turnInfo = document.getElementById('turnInfo');
        turnInfo.textContent = `Turn: ${this.game.turnNumber}`;

        // Update wind info
        if (this.game.wind) {
            const windInfo = document.getElementById('windInfo');
            windInfo.textContent = `Wind: ${this.game.wind.getDirectionName()} (${this.game.wind.getDirectionArrow()}) Str: ${this.game.wind.strength}`;
        }
    }
}
