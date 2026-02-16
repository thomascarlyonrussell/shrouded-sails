const TITLE_MIN_LENGTH = 5;
const TITLE_MAX_LENGTH = 120;
const DESCRIPTION_MIN_LENGTH = 20;
const DESCRIPTION_MAX_LENGTH = 5000;

export class BugReportModal {
    constructor({ audioManager = null, getContext = null } = {}) {
        this.audioManager = audioManager;
        this.getContext = typeof getContext === 'function' ? getContext : () => ({});
        this.isOpen = false;
        this.isSubmitting = false;

        this.modalEl = document.getElementById('bugReportModal');
        this.formEl = document.getElementById('bugReportForm');
        this.titleInputEl = document.getElementById('bugReportTitleInput');
        this.descriptionInputEl = document.getElementById('bugReportDescriptionInput');
        this.statusEl = document.getElementById('bugReportStatus');
        this.submitBtnEl = document.getElementById('bugReportSubmitBtn');
        this.cancelBtnEl = document.getElementById('bugReportCancelBtn');

        this.boundOnSubmit = (event) => this.handleSubmit(event);
        this.boundOnCancel = () => this.close();
        this.boundOnKeyDown = (event) => {
            if (event.key === 'Escape' && this.isOpen) {
                this.close();
            }
        };
        this.boundOnBackdropClick = (event) => {
            if (event.target === this.modalEl && this.isOpen) {
                this.close();
            }
        };

        this.initialize();
    }

    initialize() {
        if (!this.modalEl || !this.formEl) return;

        this.formEl.addEventListener('submit', this.boundOnSubmit);
        if (this.cancelBtnEl) {
            this.cancelBtnEl.addEventListener('click', this.boundOnCancel);
        }
        this.modalEl.addEventListener('click', this.boundOnBackdropClick);
    }

    setStatus(text, tone = 'neutral') {
        if (!this.statusEl) return;
        this.statusEl.textContent = text || '';
        this.statusEl.dataset.tone = tone;
    }

    validateForm(title, description) {
        if (!title || title.length < TITLE_MIN_LENGTH || title.length > TITLE_MAX_LENGTH) {
            return `Title must be ${TITLE_MIN_LENGTH}-${TITLE_MAX_LENGTH} characters.`;
        }
        if (!description || description.length < DESCRIPTION_MIN_LENGTH || description.length > DESCRIPTION_MAX_LENGTH) {
            return `Description must be ${DESCRIPTION_MIN_LENGTH}-${DESCRIPTION_MAX_LENGTH} characters.`;
        }
        return null;
    }

    setSubmittingState(isSubmitting) {
        this.isSubmitting = isSubmitting;
        if (this.submitBtnEl) {
            this.submitBtnEl.disabled = isSubmitting;
            this.submitBtnEl.textContent = isSubmitting ? 'Submitting...' : 'Submit Report';
        }
    }

    async handleSubmit(event) {
        event.preventDefault();
        if (this.isSubmitting) return;

        const title = (this.titleInputEl?.value || '').trim();
        const description = (this.descriptionInputEl?.value || '').trim();
        const validationError = this.validateForm(title, description);
        if (validationError) {
            this.setStatus(validationError, 'error');
            return;
        }

        this.setSubmittingState(true);
        this.setStatus('Submitting report...', 'neutral');

        try {
            const response = await fetch('/api/submit-issue', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    description,
                    context: this.getContext()
                })
            });
            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                const message = typeof payload?.error === 'string'
                    ? payload.error
                    : 'Unable to submit your report.';
                this.setStatus(message, 'error');
                return;
            }

            this.setStatus('Report submitted. Thank you.', 'success');
            if (this.audioManager) {
                this.audioManager.play('menu_close');
            }

            if (this.formEl) {
                this.formEl.reset();
            }
            window.setTimeout(() => this.close(), 900);
        } catch {
            this.setStatus('Network error while submitting report.', 'error');
        } finally {
            this.setSubmittingState(false);
        }
    }

    open() {
        if (!this.modalEl || this.isOpen) return;
        this.isOpen = true;
        this.setStatus('', 'neutral');
        this.setSubmittingState(false);
        this.modalEl.classList.remove('hidden');
        document.addEventListener('keydown', this.boundOnKeyDown);
        if (this.audioManager) {
            this.audioManager.play('menu_open');
        }
        if (this.titleInputEl) {
            this.titleInputEl.focus();
        }
    }

    close() {
        if (!this.modalEl || !this.isOpen) return;
        this.isOpen = false;
        this.modalEl.classList.add('hidden');
        document.removeEventListener('keydown', this.boundOnKeyDown);
        this.setSubmittingState(false);
        this.setStatus('', 'neutral');
        if (this.audioManager) {
            this.audioManager.play('menu_close');
        }
    }

    destroy() {
        if (this.isOpen) {
            this.close();
        }
        document.removeEventListener('keydown', this.boundOnKeyDown);
        if (this.formEl) {
            this.formEl.removeEventListener('submit', this.boundOnSubmit);
        }
        if (this.cancelBtnEl) {
            this.cancelBtnEl.removeEventListener('click', this.boundOnCancel);
        }
        if (this.modalEl) {
            this.modalEl.removeEventListener('click', this.boundOnBackdropClick);
        }
    }
}
