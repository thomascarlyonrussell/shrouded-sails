export class HUD {
    constructor() {
        this.combatLog = [];
        this.maxLogEntries = 10;
    }

    addCombatLogEntry(message) {
        this.combatLog.unshift({
            timestamp: Date.now(),
            message: message
        });

        // Keep only last N entries
        if (this.combatLog.length > this.maxLogEntries) {
            this.combatLog = this.combatLog.slice(0, this.maxLogEntries);
        }
    }

    showCombatResult(result) {
        const message = this.formatCombatResult(result);
        this.addCombatLogEntry(message);

        // Show alert for now (can be replaced with better UI later)
        alert(message);
    }

    formatCombatResult(result) {
        const attackerColor = result.attacker.owner === 'player1' ? 'Red' : 'Blue';
        const defenderColor = result.defender.owner === 'player1' ? 'Red' : 'Blue';

        let msg = `${attackerColor} ${result.attacker.name} fires at ${defenderColor} ${result.defender.name}!\n\n`;
        msg += `Hit Chance: ${result.hitChance.toFixed(0)}%\n`;
        msg += `Results: ${result.totalHits}/${result.attacker.cannons} hits\n`;
        msg += `Damage: ${result.totalDamage} HP\n\n`;
        msg += `${defenderColor} ${result.defender.name}: ${result.defender.currentHP}/${result.defender.maxHP} HP`;

        if (result.defenderDestroyed) {
            msg += '\n\n💥 SHIP SUNK! 💥';
        }

        return msg;
    }

    showBoardingResult(result) {
        const message = this.formatBoardingResult(result);
        this.addCombatLogEntry(message);
        alert(message);
    }

    formatBoardingResult(result) {
        const attackerColor = result.attacker.owner === 'player1' ? 'Red' : 'Blue';
        const defenderColor = result.defender.owner === 'player1' ? 'Red' : 'Blue';

        let msg = `${attackerColor} ${result.attacker.name} attempts to board ${defenderColor} ${result.defender.name}!\n\n`;

        // Check if attacker's level is too low
        if (result.insufficientLevel) {
            msg += `⚠️ INSUFFICIENT LEVEL!\n\n`;
            msg += `${attackerColor} ${result.attacker.name} (Lvl ${result.attacker.type}) cannot capture ships of equal or higher level!\n`;
            msg += `${defenderColor} ${result.defender.name} (Lvl ${result.defender.type}) repels the boarding party!\n\n`;
            msg += `Both ships take 1 damage in the skirmish.\n\n`;
            msg += `${attackerColor} ${result.attacker.name}: ${result.attacker.currentHP}/${result.attacker.maxHP} HP\n`;
            msg += `${defenderColor} ${result.defender.name}: ${result.defender.currentHP}/${result.defender.maxHP} HP`;
            return msg;
        }

        // Check if target is a flagship
        if (result.isFlagship) {
            msg += `⚠️ FLAGSHIP CANNOT BE CAPTURED!\n\n`;
            msg += `The flagship's crew fights fiercely!\n`;
            msg += `Both ships take 2 damage in the brutal melee.\n\n`;
            msg += `${attackerColor} ${result.attacker.name}: ${result.attacker.currentHP}/${result.attacker.maxHP} HP\n`;
            msg += `${defenderColor} ${result.defender.name}: ${result.defender.currentHP}/${result.defender.maxHP} HP`;
            return msg;
        }

        msg += `Boarding Chance: ${result.boardingChance.toFixed(0)}%\n`;
        msg += `Roll: ${result.roll.toFixed(1)}\n\n`;

        if (result.success) {
            msg += `✓ SUCCESS! ${defenderColor} ${result.defender.name} has been CAPTURED!\n`;
            msg += `It now belongs to ${attackerColor}!`;
        } else {
            msg += `✗ FAILED! Both ships take 1 damage.\n`;
            msg += `${attackerColor} ${result.attacker.name}: ${result.attacker.currentHP}/${result.attacker.maxHP} HP\n`;
            msg += `${defenderColor} ${result.defender.name}: ${result.defender.currentHP}/${result.defender.maxHP} HP`;
        }

        return msg;
    }

    getCombatLog() {
        return this.combatLog.map(entry => entry.message);
    }

    clearCombatLog() {
        this.combatLog = [];
    }
}
