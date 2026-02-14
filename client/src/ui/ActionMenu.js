export class ActionMenu {
    constructor(game) {
        this.game = game;
        this.setupButtons();
    }

    setupButtons() {
        this.moveBtn = document.getElementById('moveBtn');
        this.fireBtn = document.getElementById('fireBtn');
        this.boardBtn = document.getElementById('boardBtn');
        this.endTurnBtn = document.getElementById('endTurnBtn');
    }

    updateButtonStates(selectedShip) {
        if (selectedShip && !selectedShip.isDestroyed) {
            this.moveBtn.disabled = !selectedShip.canMove();
            this.fireBtn.disabled = !selectedShip.canAttack();
            this.boardBtn.disabled = !selectedShip.canBoard();
        } else {
            this.moveBtn.disabled = true;
            this.fireBtn.disabled = true;
            this.boardBtn.disabled = true;
        }

        // End turn is always enabled
        this.endTurnBtn.disabled = false;
    }

    highlightActiveMode(mode) {
        // Remove all highlights
        this.moveBtn.classList.remove('active');
        this.fireBtn.classList.remove('active');
        this.boardBtn.classList.remove('active');

        // Add highlight to active mode
        if (mode === 'move') {
            this.moveBtn.classList.add('active');
        } else if (mode === 'attack') {
            this.fireBtn.classList.add('active');
        } else if (mode === 'board') {
            this.boardBtn.classList.add('active');
        }
    }

    showMessage(message, type = 'info') {
        // Simple console log for now, can be enhanced with toast notifications
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}
