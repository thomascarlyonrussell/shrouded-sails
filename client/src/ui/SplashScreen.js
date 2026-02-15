export class SplashScreen {
    constructor(onContinue, audioManager = null) {
        this.onContinue = onContinue;
        this.audioManager = audioManager;
        this.hasContinued = false;

        this.modalElement = document.getElementById('splashModal');
        this.continueButton = document.getElementById('continueFromSplashBtn');

        this.boundContinue = (event) => this.handleContinue(event);
        this.boundKeyDown = (event) => this.handleKeyDown(event);

        this.initialize();
    }

    initialize() {
        if (!this.modalElement) {
            console.error('Splash screen elements not found in DOM');
            return;
        }

        this.modalElement.addEventListener('click', this.boundContinue);
        if (this.continueButton) {
            this.continueButton.addEventListener('click', this.boundContinue);
        }
    }

    handleContinue(event) {
        if (event) {
            event.preventDefault();
        }

        if (this.hasContinued) return;
        this.hasContinued = true;

        this.hide();
        if (typeof this.onContinue === 'function') {
            this.onContinue();
        }
    }

    handleKeyDown(event) {
        if (!this.modalElement || this.modalElement.classList.contains('hidden')) {
            return;
        }

        const continueKeys = ['Enter', ' ', 'Spacebar', 'Escape'];
        if (!continueKeys.includes(event.key)) return;
        this.handleContinue(event);
    }

    show() {
        if (!this.modalElement) return;
        this.hasContinued = false;
        this.modalElement.classList.remove('hidden');
        document.addEventListener('keydown', this.boundKeyDown);

        if (this.continueButton) {
            requestAnimationFrame(() => {
                this.continueButton.focus();
            });
        }

        if (this.audioManager) {
            this.audioManager.play('menu_open');
        }
    }

    hide() {
        if (!this.modalElement) return;
        this.modalElement.classList.add('hidden');
        document.removeEventListener('keydown', this.boundKeyDown);

        if (this.audioManager) {
            this.audioManager.play('menu_close');
        }
    }
}
