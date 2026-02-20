export class ShipPanel {
    constructor(game, renderer, inputHandler = null) {
        this.game = game;
        this.renderer = renderer;
        this.inputHandler = inputHandler;
        this.player1Panel = document.getElementById('player1Ships');
        this.player2Panel = document.getElementById('player2Ships');
        this.hoveredShip = null;
        this.initialized = false;

        this.setupEventListeners();
    }

    setInputHandler(inputHandler) {
        this.inputHandler = inputHandler;
    }

    update() {
        const player1Ships = this.game.getShipsByOwner('player1', true);
        const player2Ships = this.game.getShipsByOwner('player2', true);

        if (!this.initialized || this.panelNeedsRebuild(this.player1Panel, player1Ships)) {
            this.initializePanel(this.player1Panel, 'player1', player1Ships);
        } else {
            this.updatePanelState(this.player1Panel, player1Ships);
        }

        if (!this.initialized || this.panelNeedsRebuild(this.player2Panel, player2Ships)) {
            this.initializePanel(this.player2Panel, 'player2', player2Ships);
        } else {
            this.updatePanelState(this.player2Panel, player2Ships);
        }

        this.initialized = true;
    }

    panelNeedsRebuild(panelElement, ships) {
        if (!panelElement) return false;
        const cards = panelElement.querySelectorAll('.ship-card');
        if (cards.length !== ships.length) return true;

        for (let i = 0; i < ships.length; i++) {
            if (cards[i].dataset.shipId !== ships[i].id) {
                return true;
            }
        }

        return false;
    }

    initializePanel(panelElement, playerKey, ships = null) {
        if (!panelElement) return;
        const panelShips = ships || this.game.getShipsByOwner(playerKey, true);

        // Clear existing cards
        panelElement.innerHTML = '';

        // Create a card for each ship
        for (const ship of panelShips) {
            const card = this.createShipCard(ship, playerKey);
            panelElement.appendChild(card);
        }
    }

    updatePanelState(panelElement, ships) {
        if (!panelElement || !ships) return;

        const cards = panelElement.querySelectorAll('.ship-card');

        for (let i = 0; i < Math.min(cards.length, ships.length); i++) {
            const card = cards[i];
            const ship = ships[i];
            const visibilityState = this.getEnemyVisibilityState(ship);
            const isVisibleFull = visibilityState === 'VISIBLE_FULL';

            // Update selected state
            const isSelected = this.game.selectedShip && this.game.selectedShip.id === ship.id;
            card.classList.toggle('selected', isSelected);

            // Never leak destroyed state when enemy is hidden by fog.
            card.classList.toggle('destroyed', isVisibleFull && ship.isDestroyed);

            this.applyCardVisibilityState(card, ship, visibilityState);

            // Clear stale hover if this ship is no longer allowed to reveal position.
            if (this.hoveredShip && this.hoveredShip.id === ship.id && !this.isShipInteractableInPanel(ship)) {
                this.hoveredShip = null;
            }
        }
    }

    applyCardVisibilityState(card, ship, visibilityState) {
        const isVisibleFull = visibilityState === 'VISIBLE_FULL';
        card.classList.toggle('ship-card--captured', ship.isCaptured);
        card.classList.toggle('is-visible-full', isVisibleFull);
        card.classList.toggle('is-hidden-unknown', visibilityState === 'HIDDEN_UNKNOWN');
        card.classList.toggle('is-hidden-ghost', visibilityState === 'HIDDEN_GHOST');
        card.classList.toggle('is-obscured', !isVisibleFull);

        const nameElement = card.querySelector('.ship-card-name');
        const typeElement = card.querySelector('.ship-card-type');
        const healthContainer = card.querySelector('.ship-card-health');
        const healthFill = card.querySelector('.ship-card-health-fill');
        const healthText = card.querySelector('.ship-card-health-text');
        const statusContainer = this.getOrCreateStatusContainer(card);

        if (isVisibleFull) {
            if (nameElement) {
                nameElement.textContent = ship.name;
            }

            if (typeElement) {
                typeElement.textContent = `Lvl ${ship.type}`;
            }

            if (healthContainer) {
                healthContainer.style.display = 'flex';
            }

            if (healthFill) {
                const healthPercent = (ship.currentHP / ship.maxHP) * 100;
                healthFill.style.width = `${healthPercent}%`;
                healthFill.classList.remove('low', 'medium');
                if (healthPercent <= 25) {
                    healthFill.classList.add('low');
                } else if (healthPercent <= 50) {
                    healthFill.classList.add('medium');
                }
            }

            if (healthText) {
                healthText.textContent = `HP: ${ship.currentHP}/${ship.maxHP}`;
            }

            card.title = this.getShipTooltipText(ship);
            this.renderStatusBadges(statusContainer, ship);
            return;
        }

        if (nameElement) {
            nameElement.textContent = 'Unknown Contact';
        }

        if (typeElement) {
            typeElement.textContent = '--';
        }

        if (healthContainer) {
            healthContainer.style.display = 'none';
        }

        card.title = '';
        this.renderVisibilityBadge(statusContainer, visibilityState);
    }

    createShipCard(ship, playerKey) {
        const card = document.createElement('div');
        card.className = `ship-card ${playerKey}`;
        card.dataset.shipId = ship.id;
        card.classList.toggle('ship-card--captured', ship.isCaptured);

        if (ship.isDestroyed) {
            card.classList.add('destroyed');
        }

        if (this.game.selectedShip && this.game.selectedShip.id === ship.id) {
            card.classList.add('selected');
        }

        // Header with ship name and type
        const header = document.createElement('div');
        header.className = 'ship-card-header';

        const name = document.createElement('div');
        name.className = 'ship-card-name';
        name.textContent = ship.name;

        const type = document.createElement('div');
        type.className = 'ship-card-type';
        type.textContent = `Lvl ${ship.type}`;

        header.appendChild(name);
        header.appendChild(type);

        // Health bar
        const health = document.createElement('div');
        health.className = 'ship-card-health';

        const healthText = document.createElement('div');
        healthText.className = 'ship-card-health-text';
        healthText.textContent = `HP: ${ship.currentHP}/${ship.maxHP}`;

        const healthBar = document.createElement('div');
        healthBar.className = 'ship-card-health-bar';

        const healthFill = document.createElement('div');
        healthFill.className = 'ship-card-health-fill';
        const healthPercent = (ship.currentHP / ship.maxHP) * 100;
        healthFill.style.width = `${healthPercent}%`;

        // Color based on health percentage
        if (healthPercent <= 25) {
            healthFill.classList.add('low');
        } else if (healthPercent <= 50) {
            healthFill.classList.add('medium');
        }

        healthBar.appendChild(healthFill);
        health.appendChild(healthText);
        health.appendChild(healthBar);

        // Status badges
        const status = document.createElement('div');
        status.className = 'ship-card-status';

        this.renderStatusBadges(status, ship);

        // Assemble the card
        card.appendChild(header);
        card.appendChild(health);
        card.appendChild(status);

        // Add event listeners
        card.addEventListener('mouseenter', () => this.handleCardHover(ship));
        card.addEventListener('mouseleave', () => this.handleCardLeave());
        card.addEventListener('click', () => this.handleCardClick(ship));

        this.applyCardVisibilityState(card, ship, this.getEnemyVisibilityState(ship));

        return card;
    }

    getShipTooltipText(ship) {
        if (ship.isCaptured) {
            return `${ship.name} (Captured from ${ship.originalOwner}, now ${ship.owner})`;
        }
        return `${ship.name} (${ship.owner})`;
    }

    handleCardHover(ship) {
        this.hoveredShip = this.isShipInteractableInPanel(ship) ? ship : null;
    }

    handleCardLeave() {
        this.hoveredShip = null;
    }

    handleCardClick(ship) {
        // Only allow selecting own ships during your turn
        if (ship.owner === this.game.currentPlayer && !ship.isDestroyed) {
            this.game.selectShip(ship);

            // Update the UI footer and buttons
            if (this.inputHandler) {
                this.inputHandler.updateUI();
            }

            // The visual update will happen automatically in the next frame via update()
        }
    }

    getHoveredShip() {
        return this.hoveredShip;
    }

    setupEventListeners() {
        // The event listeners are added dynamically in createShipCard
    }

    getViewingPlayer() {
        return this.game.getViewingPlayer ? this.game.getViewingPlayer() : this.game.currentPlayer;
    }

    getOrCreateStatusContainer(card) {
        let statusContainer = card.querySelector('.ship-card-status');
        if (!statusContainer) {
            statusContainer = document.createElement('div');
            statusContainer.className = 'ship-card-status';
            card.appendChild(statusContainer);
        }
        return statusContainer;
    }

    isEnemyShipForViewer(ship) {
        return ship.owner !== this.getViewingPlayer();
    }

    hasGhostRecord(ship, viewingPlayer) {
        if (!this.game.fogOfWar) return false;
        const ghostMap = this.game.fogOfWar.getPlayerGhostMap(viewingPlayer);
        return ghostMap.has(ship.id);
    }

    getEnemyVisibilityState(ship) {
        if (!this.isEnemyShipForViewer(ship)) {
            return 'VISIBLE_FULL';
        }

        if (!this.game.fogOfWar) {
            return 'VISIBLE_FULL';
        }

        const viewingPlayer = this.getViewingPlayer();
        if (this.game.fogOfWar.isShipVisible(ship, viewingPlayer)) {
            return 'VISIBLE_FULL';
        }

        return this.hasGhostRecord(ship, viewingPlayer)
            ? 'HIDDEN_GHOST'
            : 'HIDDEN_UNKNOWN';
    }

    isShipInteractableInPanel(ship) {
        if (ship.isDestroyed) return false;
        return this.getEnemyVisibilityState(ship) === 'VISIBLE_FULL';
    }

    renderVisibilityBadge(statusContainer, visibilityState) {
        statusContainer.innerHTML = '';
        const badge = document.createElement('span');
        badge.className = 'ship-card-visibility-badge';

        if (visibilityState === 'HIDDEN_GHOST') {
            badge.classList.add('ghost');
            badge.textContent = 'Last Known';
        } else {
            badge.classList.add('fog-hidden');
            badge.textContent = 'Hidden';
        }

        statusContainer.appendChild(badge);
        statusContainer.style.display = 'flex';
    }

    renderStatusBadges(statusContainer, ship) {
        statusContainer.innerHTML = '';

        // Flagship badge
        if (ship.isFlagship) {
            const badge = document.createElement('span');
            badge.className = 'ship-card-badge flagship';
            badge.textContent = '⭐ FLAG';
            statusContainer.appendChild(badge);
        }

        // Captured badge
        if (ship.isCaptured) {
            const badge = document.createElement('span');
            badge.className = 'ship-card-badge captured';
            badge.textContent = 'CAPTURED';
            statusContainer.appendChild(badge);
        }

        // Action badges (only for current player)
        if (ship.owner === this.getViewingPlayer() && !ship.isDestroyed) {
            if (ship.isMovementExhausted()) {
                const badge = document.createElement('span');
                badge.className = 'ship-card-badge moved';
                badge.textContent = 'M';
                statusContainer.appendChild(badge);
            }

            if (ship.hasFired) {
                const badge = document.createElement('span');
                badge.className = 'ship-card-badge fired';
                badge.textContent = 'A';
                statusContainer.appendChild(badge);
            }
        }

        statusContainer.style.display = statusContainer.children.length > 0 ? 'flex' : 'none';
    }
}
