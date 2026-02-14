export class BoardingSystem {
    static calculateBoardingChance(attacker, defender) {
        const baseChance = 40;
        const levelBonus = attacker.type * 10;

        // HP ratio bonus
        const hpRatio = attacker.currentHP / defender.currentHP;
        const hpBonus = (hpRatio - 1) * 20;

        let boardingChance = baseChance + levelBonus + hpBonus;

        // Clamp between 10% and 90%
        return Math.max(10, Math.min(90, boardingChance));
    }

    static rollDice() {
        return Math.random() * 100;
    }

    static attemptBoarding(attacker, defender) {
        console.log(`${attacker.name} attempts to board ${defender.name}`);

        // Check if attacker's level is high enough to capture the defender
        // Ships can only capture vessels of a lower level
        if (attacker.type <= defender.type) {
            console.log(`Cannot capture! ${attacker.name} (Lvl ${attacker.type}) cannot board ships of equal or higher level (${defender.name} Lvl ${defender.type})`);
            console.log(`Boarding assault fails - both ships take 1 damage from the skirmish.`);

            // Failed boarding attempt - both ships take damage
            attacker.takeDamage(1);
            defender.takeDamage(1);

            console.log(`Both ships take 1 damage from the failed boarding attempt`);
            console.log(`  ${attacker.name}: ${attacker.currentHP}/${attacker.maxHP} HP`);
            console.log(`  ${defender.name}: ${defender.currentHP}/${defender.maxHP} HP`);

            // Mark attacker as having used their action
            attacker.hasFired = true;

            return {
                attacker: attacker,
                defender: defender,
                boardingChance: 0,
                roll: 0,
                success: false,
                attackerDestroyed: attacker.isDestroyed,
                defenderDestroyed: defender.isDestroyed,
                defenderCaptured: false,
                insufficientLevel: true
            };
        }

        const boardingChance = this.calculateBoardingChance(attacker, defender);
        const roll = this.rollDice();

        console.log(`Boarding chance: ${boardingChance.toFixed(1)}%`);
        console.log(`Roll: ${roll.toFixed(1)}`);

        // Check if defender is a flagship (Ship of the Line) - they cannot be captured
        if (defender.isFlagship || defender.type === 3) {
            // Flagships cannot be captured, boarding just damages both ships
            console.log(`Cannot capture flagship! ${defender.name} is too heavily defended.`);
            console.log(`Boarding assault deals damage to both ships instead.`);

            // Both ships take damage (more damage than a failed normal boarding)
            const damage = 2; // Increased damage for flagship boarding attempts
            attacker.takeDamage(damage);
            defender.takeDamage(damage);

            console.log(`Both ships take ${damage} damage from the fierce boarding battle`);
            console.log(`  ${attacker.name}: ${attacker.currentHP}/${attacker.maxHP} HP`);
            console.log(`  ${defender.name}: ${defender.currentHP}/${defender.maxHP} HP`);

            // Mark attacker as having used their action
            attacker.hasFired = true;

            return {
                attacker: attacker,
                defender: defender,
                boardingChance: 0, // N/A for flagships
                roll: 0,
                success: false,
                attackerDestroyed: attacker.isDestroyed,
                defenderDestroyed: defender.isDestroyed,
                defenderCaptured: false,
                isFlagship: true
            };
        }

        const success = roll < boardingChance;

        if (success) {
            // Successful boarding - capture the ship
            defender.isCaptured = true;
            defender.owner = attacker.owner;

            // Captured ships cannot act on the turn they are captured
            defender.remainingMovement = 0;
            defender.hasMoved = true;
            defender.hasFired = true;

            console.log(`SUCCESS! ${defender.name} has been captured by ${attacker.owner}!`);
        } else {
            // Failed boarding - both ships take damage
            attacker.takeDamage(1);
            defender.takeDamage(1);

            console.log(`FAILED! Both ships take 1 damage`);
            console.log(`  ${attacker.name}: ${attacker.currentHP}/${attacker.maxHP} HP`);
            console.log(`  ${defender.name}: ${defender.currentHP}/${defender.maxHP} HP`);
        }

        // Mark attacker as having used their action
        attacker.hasFired = true;

        return {
            attacker: attacker,
            defender: defender,
            boardingChance: boardingChance,
            roll: roll,
            success: success,
            attackerDestroyed: attacker.isDestroyed,
            defenderDestroyed: defender.isDestroyed,
            defenderCaptured: success
        };
    }
}
