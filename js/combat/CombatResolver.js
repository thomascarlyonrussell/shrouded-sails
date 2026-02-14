export class CombatResolver {
    static getHitChanceBreakdown(attacker, defender, distance) {
        const baseHitChance = 70;
        const rangeModifier = -(Math.max(0, distance - 1) * 10); // -0% at range 1, -10% at 2, -20% at 3
        const levelModifier = (attacker.type - defender.type) * 10; // +/-10% per level diff
        const windModifier = 0; // Reserved for future gameplay tuning

        const unclampedChance = baseHitChance + rangeModifier + levelModifier + windModifier;
        const finalHitChance = Math.max(10, Math.min(95, unclampedChance));

        return {
            baseHitChance,
            modifiers: {
                rangeModifier,
                levelModifier,
                windModifier
            },
            finalHitChance
        };
    }

    static calculateHitChance(attacker, defender, distance) {
        return this.getHitChanceBreakdown(attacker, defender, distance).finalHitChance;
    }

    static rollDice() {
        return Math.random() * 100;
    }

    static resolveAttack(attacker, defender, distance) {
        const hitChanceBreakdown = this.getHitChanceBreakdown(attacker, defender, distance);
        const hitChance = hitChanceBreakdown.finalHitChance;
        const cannonResults = [];
        const defenderStartHP = defender.currentHP;

        console.log(`${attacker.name} attacks ${defender.name} at range ${distance}`);
        console.log(`Hit chance: ${hitChance.toFixed(1)}%`);

        // Roll for each cannon
        for (let i = 0; i < attacker.cannons; i++) {
            const roll = this.rollDice();
            const hit = roll < hitChance;
            const damage = hit ? 1 : 0;
            const roundedRoll = Math.round(roll * 10) / 10;

            cannonResults.push({
                cannonIndex: i + 1,
                roll: roundedRoll,
                threshold: hitChance,
                hit: hit,
                damage: damage
            });

            if (hit) {
                defender.takeDamage(damage);
                console.log(`  Cannon ${i + 1}: HIT (rolled ${roll.toFixed(1)}) - ${defender.name} takes 1 damage`);
            } else {
                console.log(`  Cannon ${i + 1}: MISS (rolled ${roll.toFixed(1)})`);
            }
        }

        const totalHits = cannonResults.filter(cannon => cannon.hit).length;
        const totalDamage = cannonResults.reduce((sum, cannon) => sum + cannon.damage, 0);
        const accuracyPercent = attacker.cannons > 0 ? (totalHits / attacker.cannons) * 100 : 0;
        const defenderStatus = {
            currentHP: defender.currentHP,
            maxHP: defender.maxHP,
            hpDelta: Math.max(0, defenderStartHP - defender.currentHP),
            hullIntegrityPercent: defender.maxHP > 0 ? (defender.currentHP / defender.maxHP) * 100 : 0,
            destroyed: defender.isDestroyed
        };

        // Compatibility alias expected by existing rendering/UI call sites.
        const rolls = cannonResults.map(cannon => ({
            cannonIndex: cannon.cannonIndex,
            roll: cannon.roll.toFixed(1),
            hitChance: hitChance.toFixed(1),
            hit: cannon.hit
        }));

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
            rolls: rolls,
            baseHitChance: hitChanceBreakdown.baseHitChance,
            modifiers: hitChanceBreakdown.modifiers,
            finalHitChance: hitChanceBreakdown.finalHitChance,
            cannonResults: cannonResults,
            totalHits: totalHits,
            totalDamage: totalDamage,
            accuracyPercent: accuracyPercent,
            defenderStatus: defenderStatus,
            defenderDestroyed: defender.isDestroyed
        };
    }

    static formatCombatLog(result) {
        let log = `${result.attacker.name} fires at ${result.defender.name}!\n`;
        const finalChance = typeof result.finalHitChance === 'number' ? result.finalHitChance : result.hitChance;
        log += `Hit Chance: ${finalChance.toFixed(0)}%\n\n`;

        const cannonResults = Array.isArray(result.cannonResults) ? result.cannonResults : (result.rolls || []);
        cannonResults.forEach(roll => {
            const icon = roll.hit ? '✓ HIT' : '✗ MISS';
            const displayRoll = typeof roll.roll === 'number' ? roll.roll.toFixed(1) : roll.roll;
            log += `Cannon ${roll.cannonIndex}: ${icon} (${displayRoll}%)\n`;
        });

        log += `\nResult: ${result.totalHits}/${result.attacker.cannons} hits, ${result.totalDamage} damage\n`;
        log += `${result.defender.name}: ${result.defender.currentHP}/${result.defender.maxHP} HP`;

        if (result.defenderDestroyed) {
            log += '\n\n💥 SHIP SUNK! 💥';
        }

        return log;
    }
}
