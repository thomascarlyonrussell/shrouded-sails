export class BoardingSystem {
    static getBoardingChanceBreakdown(attacker, defender) {
        const baseChance = 40;
        const levelModifier = attacker.type * 10;
        const safeDefenderHP = Math.max(1, defender.currentHP);
        const hpRatio = attacker.currentHP / safeDefenderHP;
        const hpRatioModifier = (hpRatio - 1) * 20;

        const unclampedChance = baseChance + levelModifier + hpRatioModifier;
        const finalChance = Math.max(10, Math.min(90, unclampedChance));

        return {
            baseChance,
            levelModifier,
            hpRatioModifier,
            finalChance
        };
    }

    static calculateBoardingChance(attacker, defender) {
        return this.getBoardingChanceBreakdown(attacker, defender).finalChance;
    }

    static rollDice() {
        return Math.random() * 100;
    }

    static attemptBoarding(attacker, defender) {
        console.log(`${attacker.name} attempts to board ${defender.name}`);
        const computedBreakdown = this.getBoardingChanceBreakdown(attacker, defender);
        const defenderOwnerBefore = defender.owner;

        // Check if attacker's level is high enough to capture the defender
        // Ships can only capture vessels of a lower level
        if (attacker.type <= defender.type) {
            console.log(`Cannot capture! ${attacker.name} (Lvl ${attacker.type}) cannot board ships of equal or higher level (${defender.name} Lvl ${defender.type})`);
            console.log(`Boarding assault fails - both ships take 1 damage from the skirmish.`);

            // Failed boarding attempt - both ships take damage
            const attackerDamage = 1;
            const defenderDamage = 1;
            attacker.takeDamage(attackerDamage);
            defender.takeDamage(defenderDamage);

            console.log(`Both ships take 1 damage from the failed boarding attempt`);
            console.log(`  ${attacker.name}: ${attacker.currentHP}/${attacker.maxHP} HP`);
            console.log(`  ${defender.name}: ${defender.currentHP}/${defender.maxHP} HP`);

            // Mark attacker as having used their action
            attacker.hasFired = true;

            return {
                attacker: attacker,
                defender: defender,
                defenderOwnerBefore: defenderOwnerBefore,
                defenderOwnerAfter: defender.owner,
                boardingChance: 0,
                roll: 0,
                success: false,
                chanceBreakdown: {
                    baseChance: computedBreakdown.baseChance,
                    levelModifier: computedBreakdown.levelModifier,
                    hpRatioModifier: computedBreakdown.hpRatioModifier,
                    finalChance: 0,
                    reason: 'attacker-level-too-low'
                },
                resolution: {
                    roll: 0,
                    success: false,
                    attackerDamage: attackerDamage,
                    defenderDamage: defenderDamage,
                    resultType: 'repelled-insufficient-level'
                },
                attackerDestroyed: attacker.isDestroyed,
                defenderDestroyed: defender.isDestroyed,
                defenderCaptured: false,
                insufficientLevel: true
            };
        }

        const boardingChance = computedBreakdown.finalChance;
        const roll = this.rollDice();

        console.log(`Boarding chance: ${boardingChance.toFixed(1)}%`);
        console.log(`Roll: ${roll.toFixed(1)}`);

        // Check if defender is a flagship (Ship of the Line) - they cannot be captured
        if (defender.isFlagship || defender.type === 3) {
            // Flagships cannot be captured, boarding just damages both ships
            console.log(`Cannot capture flagship! ${defender.name} is too heavily defended.`);
            console.log(`Boarding assault deals damage to both ships instead.`);

            // Both ships take damage (more damage than a failed normal boarding)
            const attackerDamage = 2; // Increased damage for flagship boarding attempts
            const defenderDamage = 2;
            attacker.takeDamage(attackerDamage);
            defender.takeDamage(defenderDamage);

            console.log(`Both ships take ${attackerDamage} damage from the fierce boarding battle`);
            console.log(`  ${attacker.name}: ${attacker.currentHP}/${attacker.maxHP} HP`);
            console.log(`  ${defender.name}: ${defender.currentHP}/${defender.maxHP} HP`);

            // Mark attacker as having used their action
            attacker.hasFired = true;

            return {
                attacker: attacker,
                defender: defender,
                defenderOwnerBefore: defenderOwnerBefore,
                defenderOwnerAfter: defender.owner,
                boardingChance: 0, // N/A for flagships
                roll: 0,
                success: false,
                chanceBreakdown: {
                    baseChance: computedBreakdown.baseChance,
                    levelModifier: computedBreakdown.levelModifier,
                    hpRatioModifier: computedBreakdown.hpRatioModifier,
                    finalChance: 0,
                    reason: 'flagship-immune'
                },
                resolution: {
                    roll: 0,
                    success: false,
                    attackerDamage: attackerDamage,
                    defenderDamage: defenderDamage,
                    resultType: 'flagship-immune'
                },
                attackerDestroyed: attacker.isDestroyed,
                defenderDestroyed: defender.isDestroyed,
                defenderCaptured: false,
                isFlagship: true
            };
        }

        const success = roll < boardingChance;
        let attackerDamage = 0;
        let defenderDamage = 0;
        let resultType = 'captured';

        if (success) {
            // Successful boarding - capture the ship
            defender.transferOwnership(attacker.owner);

            // Captured ships cannot act on the turn they are captured
            defender.remainingMovement = 0;
            defender.hasMoved = true;
            defender.hasFired = true;

            console.log(`SUCCESS! ${defender.name} has been captured by ${attacker.owner}!`);
        } else {
            // Failed boarding - both ships take damage
            attackerDamage = 1;
            defenderDamage = 1;
            resultType = 'failed';
            attacker.takeDamage(attackerDamage);
            defender.takeDamage(defenderDamage);

            console.log(`FAILED! Both ships take 1 damage`);
            console.log(`  ${attacker.name}: ${attacker.currentHP}/${attacker.maxHP} HP`);
            console.log(`  ${defender.name}: ${defender.currentHP}/${defender.maxHP} HP`);
        }

        // Mark attacker as having used their action
        attacker.hasFired = true;

        return {
            attacker: attacker,
            defender: defender,
            defenderOwnerBefore: defenderOwnerBefore,
            defenderOwnerAfter: defender.owner,
            boardingChance: boardingChance,
            roll: roll,
            success: success,
            chanceBreakdown: {
                baseChance: computedBreakdown.baseChance,
                levelModifier: computedBreakdown.levelModifier,
                hpRatioModifier: computedBreakdown.hpRatioModifier,
                finalChance: computedBreakdown.finalChance
            },
            resolution: {
                roll: roll,
                success: success,
                attackerDamage: attackerDamage,
                defenderDamage: defenderDamage,
                resultType: resultType
            },
            attackerDestroyed: attacker.isDestroyed,
            defenderDestroyed: defender.isDestroyed,
            defenderCaptured: success
        };
    }
}
