export class SettingsMenu {
    constructor(onSettingsConfirmed) {
        this.onSettingsConfirmed = onSettingsConfirmed;
        this.settings = {
            fogEnabled: true,  // Default to enabled
            combatDetailLevel: 'detailed'
        };

        this.menuElement = null;
        this.fogCheckbox = null;
        this.combatDetailSelect = null;

        this.initialize();
    }

    initialize() {
        // Get or create menu elements
        this.menuElement = document.getElementById('settingsModal');
        this.fogCheckbox = document.getElementById('fogOfWarCheckbox');
        this.combatDetailSelect = document.getElementById('combatDetailLevelSelect');

        if (!this.menuElement || !this.fogCheckbox) {
            console.error('Settings menu elements not found in DOM');
            return;
        }

        // Set initial checkbox state
        this.fogCheckbox.checked = this.settings.fogEnabled;
        if (this.combatDetailSelect) {
            this.combatDetailSelect.value = this.settings.combatDetailLevel;
        }

        // Add event listener for checkbox
        this.fogCheckbox.addEventListener('change', (e) => {
            this.settings.fogEnabled = e.target.checked;
            console.log(`Fog of War: ${this.settings.fogEnabled ? 'Enabled' : 'Disabled'}`);
        });

        if (this.combatDetailSelect) {
            this.combatDetailSelect.addEventListener('change', (e) => {
                const nextLevel = e.target.value === 'compact' ? 'compact' : 'detailed';
                this.settings.combatDetailLevel = nextLevel;
                console.log(`Combat Report Detail: ${nextLevel}`);
            });
        }

        // Add event listener for start game button
        const startButton = document.getElementById('startGameBtn');
        if (startButton) {
            startButton.addEventListener('click', () => {
                this.hide();
                if (this.onSettingsConfirmed) {
                    this.onSettingsConfirmed(this.settings);
                }
            });
        }
    }

    show() {
        if (this.menuElement) {
            this.menuElement.classList.remove('hidden');
        }
    }

    hide() {
        if (this.menuElement) {
            this.menuElement.classList.add('hidden');
        }
    }

    getSettings() {
        return this.settings;
    }
}
