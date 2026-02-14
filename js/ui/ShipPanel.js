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
        // Only create cards once, then update their state
        if (!this.initialized) {
            this.initializePanel(this.player1Panel, this.game.fleets['player1'], 'player1');
            this.initializePanel(this.player2Panel, this.game.fleets['player2'], 'player2');
            this.initialized = true;
        } else {
            this.updatePanelState(this.player1Panel, this.game.fleets['player1']);
            this.updatePanelState(this.player2Panel, this.game.fleets['player2']);
        }
    }

    initializePanel(panelElement, fleet, playerKey) {
        if (!fleet) return;

        const ships = fleet.ships;

        // Clear existing cards
        panelElement.innerHTML = '';

        // Create a card for each ship
        for (const ship of ships) {
            const card = this.createShipCard(ship, playerKey);
            panelElement.appendChild(card);
        }
    }

    updatePanelState(panelElement, fleet) {
        if (!fleet) return;

        const cards = panelElement.querySelectorAll('.ship-card');
        const ships = fleet.ships;

        for (let i = 0; i < Math.min(cards.length, ships.length); i++) {
            const card = cards[i];
            const ship = ships[i];

            // Update selected state
            if (this.game.selectedShip && this.game.selectedShip.id === ship.id) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }

            // Update destroyed state
            if (ship.isDestroyed) {
                card.classList.add('destroyed');
            }

            // Update health bar
            const healthFill = card.querySelector('.ship-card-health-fill');
            if (healthFill) {
                const healthPercent = (ship.currentHP / ship.maxHP) * 100;
                healthFill.style.width = `${healthPercent}%`;

                // Update health bar color
                healthFill.classList.remove('low', 'medium');
                if (healthPercent <= 25) {
                    healthFill.classList.add('low');
                } else if (healthPercent <= 50) {
                    healthFill.classList.add('medium');
                }
            }

            // Update health text
            const healthText = card.querySelector('.ship-card-health-text');
            if (healthText) {
                healthText.textContent = `HP: ${ship.currentHP}/${ship.maxHP}`;
            }

            // Update status badges
            const statusContainer = this.getOrCreateStatusContainer(card);
            this.renderStatusBadges(statusContainer, ship);
        }
    }

    createShipCard(ship, playerKey) {
        const card = document.createElement('div');
        card.className = `ship-card ${playerKey}`;
        card.dataset.shipId = ship.id;

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
        if (!ship.isDestroyed) {
            card.addEventListener('mouseenter', () => this.handleCardHover(ship));
            card.addEventListener('mouseleave', () => this.handleCardLeave());
            card.addEventListener('click', () => this.handleCardClick(ship));
        }

        return card;
    }

    handleCardHover(ship) {
        this.hoveredShip = ship;
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

    getOrCreateStatusContainer(card) {
        let statusContainer = card.querySelector('.ship-card-status');
        if (!statusContainer) {
            statusContainer = document.createElement('div');
            statusContainer.className = 'ship-card-status';
            card.appendChild(statusContainer);
        }
        return statusContainer;
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
        if (ship.owner === this.game.currentPlayer && !ship.isDestroyed) {
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
