export class CombatResolver {
    static calculateHitChance(attacker, defender, distance) {
        const baseChance = 70;
        const distancePenalty = (distance - 1) * 10; // -0% at range 1, -10% at 2, -20% at 3
        const levelBonus = (attacker.type - defender.type) * 10; // +/-10% per level diff

        let finalChance = baseChance - distancePenalty + levelBonus;

        // Clamp between 10% and 95%
        return Math.max(10, Math.min(95, finalChance));
    }

    static rollDice() {
        return Math.random() * 100;
    }

    static resolveAttack(attacker, defender, distance) {
        const hitChance = this.calculateHitChance(attacker, defender, distance);
        const results = [];

        console.log(`${attacker.name} attacks ${defender.name} at range ${distance}`);
        console.log(`Hit chance: ${hitChance.toFixed(1)}%`);

        // Roll for each cannon
        for (let i = 0; i < attacker.cannons; i++) {
            const roll = this.rollDice();
            const hit = roll < hitChance;

            results.push({
                cannonIndex: i + 1,
                roll: roll.toFixed(1),
                hitChance: hitChance.toFixed(1),
                hit: hit
            });

            if (hit) {
                defender.takeDamage(1);
                console.log(`  Cannon ${i + 1}: HIT (rolled ${roll.toFixed(1)}) - ${defender.name} takes 1 damage`);
            } else {
                console.log(`  Cannon ${i + 1}: MISS (rolled ${roll.toFixed(1)})`);
            }
        }

        const totalHits = results.filter(r => r.hit).length;
        const totalDamage = totalHits;

        console.log(`Total: ${totalHits}/${attacker.cannons} hits, ${totalDamage} damage dealt`);

        if (defender.isDestroyed) {
            console.log(`${defender.name} has been SUNK!`);
        }

        // Mark attacker as having fired
        attacker.hasFired = true;

        return {
            attacker: attacker,
            defender: defender,
            distance: distance,
            hitChance: hitChance,
            rolls: results,
            totalHits: totalHits,
            totalDamage: totalDamage,
            defenderDestroyed: defender.isDestroyed
        };
    }

    static formatCombatLog(result) {
        let log = `${result.attacker.name} fires at ${result.defender.name}!\n`;
        log += `Hit Chance: ${result.hitChance.toFixed(0)}%\n\n`;

        result.rolls.forEach(roll => {
            const icon = roll.hit ? '✓ HIT' : '✗ MISS';
            log += `Cannon ${roll.cannonIndex}: ${icon} (${roll.roll}%)\n`;
        });

        log += `\nResult: ${result.totalHits}/${result.attacker.cannons} hits, ${result.totalDamage} damage\n`;
        log += `${result.defender.name}: ${result.defender.currentHP}/${result.defender.maxHP} HP`;

        if (result.defenderDestroyed) {
            log += '\n\n💥 SHIP SUNK! 💥';
        }

        return log;
    }
}
