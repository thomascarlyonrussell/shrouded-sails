export class TutorialTour {
    constructor({ audioManager = null, onComplete = null, onSkip = null } = {}) {
        this.audioManager = audioManager;
        this.onComplete = onComplete;
        this.onSkip = onSkip;

        this.overlayEl = null;
        this.cardEl = null;
        this.titleEl = null;
        this.bodyEl = null;
        this.progressEl = null;
        this.backBtnEl = null;
        this.nextBtnEl = null;
        this.skipBtnEl = null;

        this.activeSteps = [];
        this.currentStepIndex = 0;
        this.highlightedEls = [];
        this.started = false;

        this.baseSteps = [
            {
                id: 'status',
                title: 'Read Turn and Wind Status',
                body: 'Use Turn, Player, and Wind indicators to confirm who acts now and how wind may affect future turns.',
                selectors: ['#turnInfo', '#playerInfo', '.wind-widget']
            },
            {
                id: 'fleets',
                title: 'Use Fleet Panels',
                body: 'Left and right fleet panels summarize ship health and status so you can decide where to focus actions.',
                selectors: ['#player1Ships', '#player2Ships']
            },
            {
                id: 'battlefield',
                title: 'Interact with the Battlefield',
                body: 'Click ships and tiles on the battlefield to select units and execute actions.',
                selectors: ['#gameCanvas']
            },
            {
                id: 'movement-preview',
                title: 'Move Ships with Full Preview',
                body: 'Desktop: Select a ship, press Move, then hover tiles to preview every occupied cell (with orientation) before committing; blue preview is valid and red preview is invalid. Mobile: Long-press a selected ship for ~500ms to auto-enter drag move mode, drag the ghost footprint in real time, and release to place; invalid release snaps back and stays in move mode.',
                selectors: ['#gameCanvas', '#moveBtn']
            },
            {
                id: 'actions',
                title: 'Use Action Buttons',
                body: 'Move, Fire Cannons, Board Enemy, and End Turn are your primary controls each turn.',
                selectors: ['.action-buttons']
            },
            {
                id: 'combat-feed',
                title: 'Review Combat Feed',
                body: 'Open Combat Feed to inspect battle summaries and detailed combat outcomes.',
                selectors: ['#combatFeedButton']
            },
            {
                id: 'audio-settings',
                title: 'Adjust Audio In-Game',
                body: 'Use the gear button to quickly tweak audio without leaving the match.',
                selectors: ['#inGameSettingsButton']
            },
            {
                id: 'summary',
                title: 'Tutorial Complete',
                body: 'You can keep playing this match, or start a fresh standard match now using the same settings.',
                selectors: []
            }
        ];

        this.boundBack = () => this.goBack();
        this.boundNext = () => this.goForward();
        this.boundSkip = () => this.skip();
        this.boundResize = () => this.handleViewportChange();
        this.boundKeydown = (event) => this.handleKeydown(event);
    }

    start() {
        if (this.started) return;
        this.started = true;

        this.buildDom();
        this.refreshSteps();
        this.currentStepIndex = 0;
        this.renderStep();

        window.addEventListener('resize', this.boundResize);
        window.addEventListener('orientationchange', this.boundResize);
        document.addEventListener('keydown', this.boundKeydown);

        if (this.audioManager) {
            this.audioManager.play('menu_open');
        }
    }

    destroy() {
        this.clearHighlights();

        if (this.backBtnEl) this.backBtnEl.removeEventListener('click', this.boundBack);
        if (this.nextBtnEl) this.nextBtnEl.removeEventListener('click', this.boundNext);
        if (this.skipBtnEl) this.skipBtnEl.removeEventListener('click', this.boundSkip);

        window.removeEventListener('resize', this.boundResize);
        window.removeEventListener('orientationchange', this.boundResize);
        document.removeEventListener('keydown', this.boundKeydown);

        if (this.overlayEl && this.overlayEl.parentNode) {
            this.overlayEl.parentNode.removeChild(this.overlayEl);
        }

        this.overlayEl = null;
        this.cardEl = null;
        this.titleEl = null;
        this.bodyEl = null;
        this.progressEl = null;
        this.backBtnEl = null;
        this.nextBtnEl = null;
        this.skipBtnEl = null;
        this.activeSteps = [];
        this.currentStepIndex = 0;
        this.started = false;
    }

    buildDom() {
        this.overlayEl = document.createElement('div');
        this.overlayEl.className = 'tutorial-overlay';

        this.cardEl = document.createElement('section');
        this.cardEl.className = 'tutorial-card';
        this.cardEl.setAttribute('role', 'dialog');
        this.cardEl.setAttribute('aria-live', 'polite');
        this.cardEl.innerHTML = `
            <div class="tutorial-progress"></div>
            <h3 class="tutorial-title"></h3>
            <p class="tutorial-body"></p>
            <div class="tutorial-actions">
                <button type="button" class="action-btn tutorial-back">Back</button>
                <button type="button" class="action-btn tutorial-skip">Skip Tutorial</button>
                <button type="button" class="action-btn primary tutorial-next">Next</button>
            </div>
        `;

        this.overlayEl.appendChild(this.cardEl);
        document.body.appendChild(this.overlayEl);

        this.progressEl = this.cardEl.querySelector('.tutorial-progress');
        this.titleEl = this.cardEl.querySelector('.tutorial-title');
        this.bodyEl = this.cardEl.querySelector('.tutorial-body');
        this.backBtnEl = this.cardEl.querySelector('.tutorial-back');
        this.skipBtnEl = this.cardEl.querySelector('.tutorial-skip');
        this.nextBtnEl = this.cardEl.querySelector('.tutorial-next');

        if (this.backBtnEl) this.backBtnEl.addEventListener('click', this.boundBack);
        if (this.nextBtnEl) this.nextBtnEl.addEventListener('click', this.boundNext);
        if (this.skipBtnEl) this.skipBtnEl.addEventListener('click', this.boundSkip);
    }

    handleKeydown(event) {
        if (!this.started) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            this.skip();
            return;
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            this.goForward();
            return;
        }

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            this.goBack();
        }
    }

    handleViewportChange() {
        const currentStep = this.getCurrentStep();
        const currentStepId = currentStep ? currentStep.id : null;
        this.refreshSteps(currentStepId);
        this.renderStep();
    }

    refreshSteps(preferredStepId = null) {
        const previousStepId = preferredStepId || (this.getCurrentStep() ? this.getCurrentStep().id : null);

        this.activeSteps = this.baseSteps
            .map((step) => ({
                ...step,
                targets: this.resolveVisibleTargets(step.selectors || [])
            }))
            .filter((step) => step.id === 'summary' || step.targets.length > 0);

        if (this.activeSteps.length === 0) {
            this.activeSteps = [{
                id: 'summary',
                title: 'Tutorial Complete',
                body: 'You can keep playing this match, or start a fresh standard match now using the same settings.',
                selectors: [],
                targets: []
            }];
        }

        if (previousStepId) {
            const nextIndex = this.activeSteps.findIndex((step) => step.id === previousStepId);
            if (nextIndex >= 0) {
                this.currentStepIndex = nextIndex;
                return;
            }
        }

        this.currentStepIndex = Math.min(this.currentStepIndex, this.activeSteps.length - 1);
        this.currentStepIndex = Math.max(this.currentStepIndex, 0);
    }

    getCurrentStep() {
        if (!this.activeSteps.length) return null;
        return this.activeSteps[this.currentStepIndex] || null;
    }

    resolveVisibleTargets(selectors) {
        const targets = [];
        const seen = new Set();

        selectors.forEach((selector) => {
            const target = document.querySelector(selector);
            if (!target || seen.has(target)) return;
            if (!this.isElementVisible(target)) return;
            seen.add(target);
            targets.push(target);
        });

        return targets;
    }

    isElementVisible(element) {
        if (!element || !element.isConnected) return false;

        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') return false;

        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }

    goBack() {
        if (this.currentStepIndex <= 0) return;
        this.currentStepIndex--;
        this.renderStep();
    }

    goForward() {
        if (this.currentStepIndex >= this.activeSteps.length - 1) {
            this.complete();
            return;
        }

        this.currentStepIndex++;
        this.renderStep();
    }

    skip() {
        if (this.audioManager) {
            this.audioManager.play('menu_close');
        }

        const onSkip = this.onSkip;
        this.destroy();
        if (typeof onSkip === 'function') {
            onSkip();
        }
    }

    complete() {
        if (this.audioManager) {
            this.audioManager.play('menu_close');
        }

        const onComplete = this.onComplete;
        this.destroy();
        if (typeof onComplete === 'function') {
            onComplete();
        }
    }

    renderStep() {
        if (!this.cardEl || !this.titleEl || !this.bodyEl || !this.progressEl) return;

        const step = this.getCurrentStep();
        if (!step) return;

        this.clearHighlights();
        this.applyHighlights(step.targets || []);

        const stepNumber = this.currentStepIndex + 1;
        this.progressEl.textContent = `Step ${stepNumber} of ${this.activeSteps.length}`;
        this.titleEl.textContent = step.title;
        this.bodyEl.textContent = step.body;

        if (this.backBtnEl) {
            this.backBtnEl.disabled = this.currentStepIndex === 0;
        }

        if (this.nextBtnEl) {
            this.nextBtnEl.textContent = this.currentStepIndex === this.activeSteps.length - 1
                ? 'Start Fresh Match'
                : 'Next';
        }

        this.positionCard(step.targets || []);
    }

    applyHighlights(targets) {
        targets.forEach((target) => {
            target.classList.add('tutorial-highlight');
            this.highlightedEls.push(target);
        });
    }

    clearHighlights() {
        this.highlightedEls.forEach((target) => {
            target.classList.remove('tutorial-highlight');
        });
        this.highlightedEls = [];
    }

    positionCard(targets) {
        if (!this.cardEl) return;

        this.cardEl.style.top = '';
        this.cardEl.style.left = '';

        if (!targets.length) {
            this.cardEl.style.left = '50%';
            this.cardEl.style.top = '20px';
            this.cardEl.style.transform = 'translateX(-50%)';
            return;
        }

        const anchorRect = this.getCombinedRect(targets);
        const cardRect = this.cardEl.getBoundingClientRect();
        const gutter = 12;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let top = anchorRect.bottom + gutter;
        if (top + cardRect.height > viewportHeight - gutter) {
            top = anchorRect.top - cardRect.height - gutter;
        }
        if (top < gutter) {
            top = gutter;
        }

        let left = anchorRect.left + (anchorRect.width / 2) - (cardRect.width / 2);
        if (left + cardRect.width > viewportWidth - gutter) {
            left = viewportWidth - cardRect.width - gutter;
        }
        if (left < gutter) {
            left = gutter;
        }

        this.cardEl.style.left = `${Math.round(left)}px`;
        this.cardEl.style.top = `${Math.round(top)}px`;
        this.cardEl.style.transform = 'none';
    }

    getCombinedRect(targets) {
        const firstRect = targets[0].getBoundingClientRect();
        const bounds = {
            left: firstRect.left,
            top: firstRect.top,
            right: firstRect.right,
            bottom: firstRect.bottom
        };

        for (let i = 1; i < targets.length; i++) {
            const rect = targets[i].getBoundingClientRect();
            bounds.left = Math.min(bounds.left, rect.left);
            bounds.top = Math.min(bounds.top, rect.top);
            bounds.right = Math.max(bounds.right, rect.right);
            bounds.bottom = Math.max(bounds.bottom, rect.bottom);
        }

        return {
            left: bounds.left,
            top: bounds.top,
            right: bounds.right,
            bottom: bounds.bottom,
            width: bounds.right - bounds.left,
            height: bounds.bottom - bounds.top
        };
    }
}
