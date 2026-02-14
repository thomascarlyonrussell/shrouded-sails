export class HUD {
    constructor() {
        this.combatLog = [];
        this.maxLogEntries = 20;
        this.combatLogListEl = document.getElementById('combatLogList');
        this.combatLogEmptyEl = document.getElementById('combatLogEmpty');
        this.combatFeedPanelEl = document.getElementById('combatFeedPanel');
        this.combatFeedButtonEl = document.getElementById('combatFeedButton');
        this.combatFeedCloseEl = document.getElementById('combatFeedClose');
        this.combatFeedBackdropEl = document.getElementById('combatFeedBackdrop');
        this.combatFeedUnreadEl = document.getElementById('combatFeedUnread');
        this.combatFeedStatusIconEl = document.getElementById('combatFeedStatusIcon');
        this.combatFeedStatusTextEl = document.getElementById('combatFeedStatusText');
        this.isFeedOpen = false;
        this.unreadCount = 0;
        this.lastSignal = {
            icon: '🧭',
            text: 'Quiet seas',
            tone: 'info'
        };
        this.combatDetailLevel = 'detailed';
        this.audioManager = null;

        this.setupFeedControls();
        this.updateFeedSignal();
    }

    setAudioManager(audioManager) {
        this.audioManager = audioManager;
    }

    setupFeedControls() {
        if (this.combatFeedButtonEl) {
            this.combatFeedButtonEl.onclick = () => this.toggleCombatFeed();
        }
        if (this.combatFeedCloseEl) {
            this.combatFeedCloseEl.onclick = () => this.closeCombatFeed();
        }
        if (this.combatFeedBackdropEl) {
            this.combatFeedBackdropEl.onclick = () => this.closeCombatFeed();
        }
    }

    toggleCombatFeed() {
        if (this.isFeedOpen) {
            this.closeCombatFeed();
        } else {
            this.openCombatFeed();
        }
    }

    openCombatFeed() {
        this.isFeedOpen = true;
        if (this.combatFeedPanelEl) {
            this.combatFeedPanelEl.classList.remove('hidden');
        }
        if (this.combatFeedBackdropEl) {
            this.combatFeedBackdropEl.classList.remove('hidden');
        }
        if (this.combatFeedButtonEl) {
            this.combatFeedButtonEl.setAttribute('aria-expanded', 'true');
        }
        this.unreadCount = 0;
        this.updateUnreadBadge();
        if (this.audioManager) {
            this.audioManager.play('menu_open');
        }
    }

    closeCombatFeed() {
        this.isFeedOpen = false;
        if (this.combatFeedPanelEl) {
            this.combatFeedPanelEl.classList.add('hidden');
        }
        if (this.combatFeedBackdropEl) {
            this.combatFeedBackdropEl.classList.add('hidden');
        }
        if (this.combatFeedButtonEl) {
            this.combatFeedButtonEl.setAttribute('aria-expanded', 'false');
        }
        if (this.audioManager) {
            this.audioManager.play('menu_close');
        }
    }

    addCombatLogEntry(entry) {
        const normalizedEntry = {
            timestamp: entry.timestamp || Date.now(),
            type: entry.type || 'info',
            attackerOwner: entry.attackerOwner || null,
            summary: entry.summary || '',
            details: entry.details || [],
            outcome: entry.outcome || null,
            signal: entry.signal || this.lastSignal,
            message: entry.message || ''
        };

        this.combatLog.unshift({
            ...normalizedEntry
        });

        // Keep only last N entries
        if (this.combatLog.length > this.maxLogEntries) {
            this.combatLog = this.combatLog.slice(0, this.maxLogEntries);
        }

        this.updateFeedSignal(normalizedEntry);

        if (!this.isFeedOpen) {
            this.unreadCount++;
            this.updateUnreadBadge();
        }

        this.renderCombatLog();
    }

    updateUnreadBadge() {
        if (!this.combatFeedUnreadEl) return;

        if (this.unreadCount > 0) {
            this.combatFeedUnreadEl.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount.toString();
            this.combatFeedUnreadEl.classList.remove('hidden');
        } else {
            this.combatFeedUnreadEl.classList.add('hidden');
        }
    }

    updateFeedSignal(entry = null) {
        if (entry && entry.signal) {
            this.lastSignal = entry.signal;
        }

        if (this.combatFeedStatusIconEl) {
            this.combatFeedStatusIconEl.textContent = this.lastSignal.icon;
        }
        if (this.combatFeedStatusTextEl) {
            this.combatFeedStatusTextEl.textContent = this.lastSignal.text;
        }

        if (this.combatFeedButtonEl) {
            this.combatFeedButtonEl.classList.remove('tone-good', 'tone-warn', 'tone-danger');
            if (this.lastSignal.tone === 'good') {
                this.combatFeedButtonEl.classList.add('tone-good');
            } else if (this.lastSignal.tone === 'warn') {
                this.combatFeedButtonEl.classList.add('tone-warn');
            } else if (this.lastSignal.tone === 'danger') {
                this.combatFeedButtonEl.classList.add('tone-danger');
            }
        }
    }

    setCombatDetailLevel(level) {
        this.combatDetailLevel = level === 'compact' ? 'compact' : 'detailed';
    }

    formatSignedPercent(value) {
        const numeric = Number.isFinite(value) ? value : 0;
        if (numeric > 0) return `+${numeric.toFixed(0)}%`;
        if (numeric < 0) return `${numeric.toFixed(0)}%`;
        return '0%';
    }

    getCombatAccuracyPercent(totalHits, totalShots) {
        if (!totalShots) return 0;
        return (totalHits / totalShots) * 100;
    }

    showCombatResult(result) {
        const entry = this.formatCombatResult(result);
        this.addCombatLogEntry(entry);
    }

    formatCombatResult(result) {
        const attackerColor = result.attacker.owner === 'player1' ? 'Red' : 'Blue';
        const defenderColor = result.defender.owner === 'player1' ? 'Red' : 'Blue';
        const cannonResults = Array.isArray(result.cannonResults) && result.cannonResults.length > 0
            ? result.cannonResults
            : (result.rolls || []).map((roll, index) => ({
                cannonIndex: roll.cannonIndex || index + 1,
                roll: Number.parseFloat(roll.roll),
                threshold: Number.parseFloat(roll.hitChance) || result.hitChance || 0,
                hit: Boolean(roll.hit),
                damage: roll.hit ? 1 : 0
            }));

        const totalCannons = result.attacker.cannons || cannonResults.length;
        const totalHits = Number.isFinite(result.totalHits) ? result.totalHits : cannonResults.filter(cannon => cannon.hit).length;
        const totalDamage = Number.isFinite(result.totalDamage) ? result.totalDamage : cannonResults.reduce((sum, cannon) => sum + cannon.damage, 0);
        const accuracyPercent = Number.isFinite(result.accuracyPercent)
            ? result.accuracyPercent
            : this.getCombatAccuracyPercent(totalHits, totalCannons);
        const baseHitChance = Number.isFinite(result.baseHitChance) ? result.baseHitChance : 70;
        const fallbackHitChance = Number.parseFloat(result.hitChance);
        const finalHitChance = Number.isFinite(result.finalHitChance)
            ? result.finalHitChance
            : (Number.isFinite(fallbackHitChance) ? fallbackHitChance : 0);
        const modifiers = result.modifiers || {};
        const rangeModifier = Number.isFinite(modifiers.rangeModifier) ? modifiers.rangeModifier : 0;
        const levelModifier = Number.isFinite(modifiers.levelModifier) ? modifiers.levelModifier : 0;
        const windModifier = Number.isFinite(modifiers.windModifier) ? modifiers.windModifier : 0;
        const defenderStatus = result.defenderStatus || {
            currentHP: result.defender.currentHP,
            maxHP: result.defender.maxHP,
            hpDelta: totalDamage,
            hullIntegrityPercent: result.defender.maxHP > 0 ? (result.defender.currentHP / result.defender.maxHP) * 100 : 0,
            destroyed: Boolean(result.defenderDestroyed)
        };
        const outcome = totalHits > 0 ? 'hit' : 'miss';

        const rollSummary = cannonResults
            .map(cannon => `${Math.round(cannon.roll)}${cannon.hit ? '✓' : '✗'}`)
            .join(', ');

        let msg = '';
        if (this.combatDetailLevel === 'compact') {
            msg += `🔥 ${attackerColor} ${result.attacker.name} fires at ${defenderColor} ${result.defender.name}\n`;
            msg += `Chance: ${finalHitChance.toFixed(0)}% | Hits: ${totalHits}/${totalCannons} (${accuracyPercent.toFixed(0)}%) | Damage: ${totalDamage}\n`;
            msg += `Rolls: [${rollSummary}]\n`;
            msg += `${defenderColor} ${result.defender.name}: ${defenderStatus.currentHP}/${defenderStatus.maxHP} HP (${defenderStatus.hullIntegrityPercent.toFixed(0)}% hull)`;
        } else {
            const cannonLines = cannonResults.map(cannon => {
                const rollValue = Number.isFinite(cannon.roll) ? cannon.roll.toFixed(1) : cannon.roll;
                const threshold = Number.isFinite(cannon.threshold) ? cannon.threshold.toFixed(0) : finalHitChance.toFixed(0);
                if (cannon.hit) {
                    return `Cannon ${cannon.cannonIndex}: Roll ${rollValue} vs ${threshold} -> ✓ HIT! (${cannon.damage} damage)`;
                }
                return `Cannon ${cannon.cannonIndex}: Roll ${rollValue} vs ${threshold} -> ✗ MISS`;
            }).join('\n');

            msg += '🔥 COMBAT REPORT 🔥\n\n';
            msg += `Attacker: ${attackerColor} ${result.attacker.name} (${result.attacker.owner})\n`;
            msg += `Defender: ${defenderColor} ${result.defender.name} (${result.defender.owner})\n`;
            msg += `Range: ${result.distance} tile${result.distance === 1 ? '' : 's'}\n\n`;

            msg += '━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
            msg += 'HIT CHANCE CALCULATION\n';
            msg += '━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
            msg += `Base Chance: ${baseHitChance.toFixed(0)}%\n`;
            msg += `Range Modifier: ${this.formatSignedPercent(rangeModifier)}\n`;
            msg += `Level Modifier: ${this.formatSignedPercent(levelModifier)}\n`;
            msg += `Wind Modifier: ${this.formatSignedPercent(windModifier)}\n`;
            msg += `Final Hit Chance: ${finalHitChance.toFixed(0)}% per cannon\n\n`;

            msg += '━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
            msg += `CANNONS FIRED: ${totalCannons}\n`;
            msg += '━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
            msg += `${cannonLines}\n\n`;

            msg += '━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
            msg += 'RESULTS\n';
            msg += '━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
            msg += `Total Hits: ${totalHits}/${totalCannons} (${accuracyPercent.toFixed(0)}% accuracy)\n`;
            msg += `Total Damage: ${totalDamage} HP\n\n`;
            msg += `${defenderColor} ${result.defender.name} Status:\n`;
            msg += `├─ HP: ${defenderStatus.currentHP}/${defenderStatus.maxHP} (${defenderStatus.hpDelta} damage taken)\n`;
            msg += `├─ Status: ${defenderStatus.destroyed ? 'Sunk' : 'Still operational'}\n`;
            msg += `└─ Hull Integrity: ${defenderStatus.hullIntegrityPercent.toFixed(0)}%`;
        }

        if (defenderStatus.destroyed) {
            msg += '\n\n💥 SHIP SUNK! 💥';
        }

        let signal = {
            icon: '🌊',
            text: 'Broadside missed',
            tone: 'warn'
        };
        if (defenderStatus.destroyed) {
            signal = {
                icon: '💥',
                text: 'Enemy ship sunk',
                tone: 'danger'
            };
        } else if (totalHits > 0) {
            signal = {
                icon: '🎯',
                text: `${totalHits} hit${totalHits === 1 ? '' : 's'} for ${totalDamage} damage`,
                tone: 'good'
            };
        }

        const detailLines = this.combatDetailLevel === 'compact'
            ? [
                `Chance ${finalHitChance.toFixed(0)}% | Rolls [${rollSummary}]`,
                `Damage ${totalDamage} | ${defenderColor} ${result.defender.name} ${defenderStatus.currentHP}/${defenderStatus.maxHP} HP`
            ]
            : [
                `Base ${baseHitChance.toFixed(0)}% | Range ${this.formatSignedPercent(rangeModifier)} | Level ${this.formatSignedPercent(levelModifier)} | Wind ${this.formatSignedPercent(windModifier)}`,
                `Hits ${totalHits}/${totalCannons} (${accuracyPercent.toFixed(0)}%) | Rolls [${rollSummary}]`,
                `Damage ${totalDamage} | ${defenderColor} ${result.defender.name} ${defenderStatus.currentHP}/${defenderStatus.maxHP} HP (${defenderStatus.hullIntegrityPercent.toFixed(0)}% hull)`
            ];

        return {
            type: 'attack',
            attackerOwner: result.attacker.owner,
            outcome: defenderStatus.destroyed ? 'destroyed' : outcome,
            summary: `${attackerColor} ${result.attacker.name} -> ${defenderColor} ${result.defender.name}: ${totalHits}/${totalCannons} hits, ${totalDamage} damage`,
            details: detailLines,
            signal: signal,
            message: msg
        };
    }

    showBoardingResult(result) {
        const entry = this.formatBoardingResult(result);
        this.addCombatLogEntry(entry);
    }

    formatBoardingResult(result) {
        const attackerOwner = result.attacker.owner;
        const defenderOwnerBefore = result.defenderOwnerBefore || result.defender.owner;
        const defenderOwnerAfter = result.defenderOwnerAfter || result.defender.owner;
        const attackerColor = attackerOwner === 'player1' ? 'Red' : 'Blue';
        const defenderColor = defenderOwnerBefore === 'player1' ? 'Red' : 'Blue';
        const defenderAfterColor = defenderOwnerAfter === 'player1' ? 'Red' : 'Blue';
        const fallbackReason = result.insufficientLevel
            ? 'attacker-level-too-low'
            : (result.isFlagship ? 'flagship-immune' : undefined);
        const chanceBreakdown = result.chanceBreakdown || {
            baseChance: 40,
            levelModifier: result.attacker.type * 10,
            hpRatioModifier: 0,
            finalChance: result.boardingChance || 0,
            reason: fallbackReason
        };
        const baseChance = Number.isFinite(chanceBreakdown.baseChance) ? chanceBreakdown.baseChance : 0;
        const levelModifier = Number.isFinite(chanceBreakdown.levelModifier) ? chanceBreakdown.levelModifier : 0;
        const hpRatioModifier = Number.isFinite(chanceBreakdown.hpRatioModifier) ? chanceBreakdown.hpRatioModifier : 0;
        const finalChance = Number.isFinite(chanceBreakdown.finalChance) ? chanceBreakdown.finalChance : 0;
        const resultType = result.resolution?.resultType
            || (result.success ? 'captured' : (result.insufficientLevel ? 'repelled-insufficient-level' : (result.isFlagship ? 'flagship-immune' : 'failed')));
        const resolution = result.resolution || {
            roll: result.roll || 0,
            success: result.success,
            attackerDamage: result.success ? 0 : (result.isFlagship ? 2 : 1),
            defenderDamage: result.success ? 0 : (result.isFlagship ? 2 : 1),
            resultType: resultType
        };
        const numericRoll = Number.isFinite(resolution.roll) ? resolution.roll : Number.parseFloat(resolution.roll);
        const resolutionRoll = Number.isFinite(numericRoll) ? numericRoll : 0;
        const canRoll = !chanceBreakdown.reason;

        let msg = '';
        if (this.combatDetailLevel === 'compact') {
            msg += `⚔️ ${attackerColor} ${result.attacker.name} boards ${defenderColor} ${result.defender.name}\n`;
            if (result.success) {
                msg += `Result: ✓ CAPTURED (${resultType})\n`;
                msg += `${defenderColor} ${result.defender.name} now belongs to ${defenderAfterColor}`;
            } else {
                const chanceText = canRoll ? `${finalChance.toFixed(0)}%` : 'N/A';
                const rollText = canRoll ? resolutionRoll.toFixed(1) : 'N/A';
                msg += `Chance: ${chanceText} | Roll: ${rollText} | Result: ✗ FAILED (${resultType})\n`;
                msg += `${attackerColor} ${result.attacker.name}: ${result.attacker.currentHP}/${result.attacker.maxHP} HP | ${defenderColor} ${result.defender.name}: ${result.defender.currentHP}/${result.defender.maxHP} HP`;
            }
        } else {
            msg += '⚔️ BOARDING REPORT ⚔️\n\n';
            msg += `Attacker: ${attackerColor} ${result.attacker.name} (${attackerOwner})\n`;
            msg += `Defender: ${defenderColor} ${result.defender.name} (${defenderOwnerBefore})\n\n`;

            msg += '━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
            msg += 'BOARDING CHANCE CALCULATION\n';
            msg += '━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
            msg += `Base Chance: ${baseChance.toFixed(0)}%\n`;
            msg += `Level Modifier: ${this.formatSignedPercent(levelModifier)}\n`;
            msg += `HP Ratio Modifier: ${this.formatSignedPercent(hpRatioModifier)}\n`;
            if (chanceBreakdown.reason) {
                msg += `Final Boarding Chance: N/A (${chanceBreakdown.reason})\n\n`;
            } else {
                msg += `Final Boarding Chance: ${finalChance.toFixed(0)}%\n\n`;
            }

            msg += '━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
            msg += 'RESOLUTION\n';
            msg += '━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
            msg += `Result Type: ${resultType}\n`;
            msg += `Roll: ${canRoll ? resolutionRoll.toFixed(1) : 'N/A'}\n`;
            msg += `Attacker Damage: ${resolution.attackerDamage}\n`;
            msg += `Defender Damage: ${resolution.defenderDamage}\n\n`;

            if (result.success) {
                msg += `✓ SUCCESS! ${defenderColor} ${result.defender.name} has been CAPTURED.\n\n`;
                msg += `Ownership Transfer: ${defenderOwnerBefore} → ${defenderOwnerAfter}\n\n`;
            } else {
                msg += `✗ BOARDING FAILED.\n\n`;
            }

            msg += `${attackerColor} ${result.attacker.name}: ${result.attacker.currentHP}/${result.attacker.maxHP} HP\n`;
            msg += `${defenderColor} ${result.defender.name}: ${result.defender.currentHP}/${result.defender.maxHP} HP`;
        }

        let summary = `${attackerColor} ${result.attacker.name} boarding ${result.success ? 'succeeded' : 'failed'} vs ${defenderColor} ${result.defender.name}`;
        if (resultType === 'repelled-insufficient-level') {
            summary = `${attackerColor} ${result.attacker.name} failed boarding due to insufficient level`;
        } else if (resultType === 'flagship-immune') {
            summary = `${attackerColor} ${result.attacker.name} failed boarding: flagship immunity`;
        }

        const details = result.success
            ? [`Result ${resultType} | Target captured by ${attackerColor}`]
            : [
                `Chance ${canRoll ? finalChance.toFixed(0) : 'N/A'} | Roll ${canRoll ? resolutionRoll.toFixed(1) : 'N/A'} | Type ${resultType}`,
                `Damage A:${resolution.attackerDamage} D:${resolution.defenderDamage} | ${attackerColor} ${result.attacker.name} ${result.attacker.currentHP}/${result.attacker.maxHP} HP | ${defenderColor} ${result.defender.name} ${result.defender.currentHP}/${result.defender.maxHP} HP`
            ];

        let signal;
        if (result.success) {
            signal = {
                icon: '🏴‍☠️',
                text: 'Boarding succeeded',
                tone: 'good'
            };
        } else if (resultType === 'repelled-insufficient-level') {
            signal = {
                icon: '🛡️',
                text: 'Boarding repelled',
                tone: 'warn'
            };
        } else if (resultType === 'flagship-immune') {
            signal = {
                icon: '👑',
                text: 'Flagship resisted boarding',
                tone: 'warn'
            };
        } else {
            signal = {
                icon: '⚔️',
                text: 'Boarding failed',
                tone: 'warn'
            };
        }

        return {
            type: 'board',
            attackerOwner: result.attacker.owner,
            outcome: result.success ? 'success' : 'failed',
            summary: summary,
            details: details,
            signal: signal,
            message: msg
        };
    }

    renderCombatLog() {
        if (!this.combatLogListEl) return;

        this.combatLogListEl.innerHTML = '';

        if (this.combatLogEmptyEl) {
            this.combatLogEmptyEl.style.display = this.combatLog.length === 0 ? 'block' : 'none';
        }

        for (const entry of this.combatLog) {
            const item = document.createElement('article');
            item.className = `combat-log-entry ${entry.type} ${entry.attackerOwner || ''} ${entry.outcome || ''}`;
            item.setAttribute('role', 'button');
            item.setAttribute('tabindex', '0');

            const time = new Date(entry.timestamp);
            const timeLabel = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            const icon = entry.type === 'attack' ? '🔥' : entry.type === 'board' ? '⚔️' : 'ℹ️';
            const headline = document.createElement('div');
            headline.className = 'combat-log-headline';

            const title = document.createElement('div');
            title.className = 'combat-log-title';
            const iconEl = document.createElement('span');
            iconEl.className = 'icon';
            iconEl.textContent = icon;
            const summaryEl = document.createElement('span');
            summaryEl.className = 'summary';
            summaryEl.textContent = entry.summary;
            title.appendChild(iconEl);
            title.appendChild(summaryEl);

            const timeEl = document.createElement('div');
            timeEl.className = 'combat-log-time';
            timeEl.textContent = timeLabel;

            const tags = document.createElement('div');
            tags.className = 'combat-log-tags';
            const typeTag = document.createElement('span');
            typeTag.className = 'combat-log-tag';
            typeTag.textContent = entry.type;
            tags.appendChild(typeTag);
            if (entry.outcome) {
                const outcomeTag = document.createElement('span');
                outcomeTag.className = `combat-log-tag ${entry.outcome}`;
                outcomeTag.textContent = entry.outcome;
                tags.appendChild(outcomeTag);
            }

            const details = document.createElement('div');
            details.className = 'combat-log-details';
            entry.details.forEach(line => {
                const lineEl = document.createElement('div');
                lineEl.className = 'combat-log-detail-line';
                lineEl.textContent = line;
                details.appendChild(lineEl);
            });

            headline.appendChild(title);
            headline.appendChild(timeEl);
            item.appendChild(headline);
            item.appendChild(tags);
            if (entry.details.length > 0) {
                item.appendChild(details);
                item.addEventListener('click', () => {
                    item.classList.toggle('expanded');
                });
                item.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        item.classList.toggle('expanded');
                    }
                });
            }
            this.combatLogListEl.appendChild(item);
        }
    }

    getCombatLog() {
        return this.combatLog.map(entry => entry.message || entry.summary);
    }

    clearCombatLog() {
        this.combatLog = [];
        this.unreadCount = 0;
        this.lastSignal = {
            icon: '🧭',
            text: 'Quiet seas',
            tone: 'info'
        };
        this.updateFeedSignal();
        this.updateUnreadBadge();
        this.renderCombatLog();
    }
}
