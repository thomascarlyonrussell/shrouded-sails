export class AboutModal {
    constructor(audioManager = null) {
        this.audioManager = audioManager;
        this.isOpen = false;

        this.modalEl = null;
        this.closeBtnEl = null;

        this.boundOnClose = () => this.hide();
        this.boundOnKeyDown = (event) => {
            if (event.key === 'Escape' && this.isOpen) {
                this.hide();
            }
        };
        this.boundOnBackdropClick = (event) => {
            if (event.target === this.modalEl && this.isOpen) {
                this.hide();
            }
        };

        this.initialize();
    }

    initialize() {
        this.modalEl = document.getElementById('aboutModal');
        this.closeBtnEl = document.getElementById('aboutCloseBtn');

        if (!this.modalEl) {
            console.error('[AboutModal] aboutModal element not found in DOM');
            return;
        }

        if (this.closeBtnEl) {
            this.closeBtnEl.addEventListener('click', this.boundOnClose);
        }

        this.modalEl.addEventListener('click', this.boundOnBackdropClick);
    }

    show() {
        if (!this.modalEl || this.isOpen) return;

        this.isOpen = true;
        this.modalEl.classList.remove('hidden');
        document.addEventListener('keydown', this.boundOnKeyDown);

        if (this.audioManager) {
            this.audioManager.play('menu_open');
        }

        // Focus the close button for accessibility
        if (this.closeBtnEl) {
            requestAnimationFrame(() => {
                this.closeBtnEl.focus();
            });
        }
    }

    hide() {
        if (!this.modalEl || !this.isOpen) return;

        this.isOpen = false;
        this.modalEl.classList.add('hidden');
        document.removeEventListener('keydown', this.boundOnKeyDown);

        if (this.audioManager) {
            this.audioManager.play('menu_close');
        }
    }

    destroy() {
        if (this.closeBtnEl) {
            this.closeBtnEl.removeEventListener('click', this.boundOnClose);
        }
        if (this.modalEl) {
            this.modalEl.removeEventListener('click', this.boundOnBackdropClick);
        }
        document.removeEventListener('keydown', this.boundOnKeyDown);
    }
}
