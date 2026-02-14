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

        this.setupFeedControls();
        this.updateFeedSignal();
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

    showCombatResult(result) {
        const entry = this.formatCombatResult(result);
        this.addCombatLogEntry(entry);
    }

    formatCombatResult(result) {
        const attackerColor = result.attacker.owner === 'player1' ? 'Red' : 'Blue';
        const defenderColor = result.defender.owner === 'player1' ? 'Red' : 'Blue';
        const hpPercent = Math.max(0, (result.defender.currentHP / result.defender.maxHP) * 100);
        const damagePercent = (result.totalDamage / result.defender.maxHP) * 100;
        const rollSummary = result.rolls
            .map(roll => `${Math.round(parseFloat(roll.roll))}${roll.hit ? '✓' : '✗'}`)
            .join(', ');
        const rollDetail = result.rolls
            .map(roll => `Cannon ${roll.cannonIndex}: ${roll.hit ? 'HIT' : 'MISS'} (${roll.roll})`)
            .join('\n');
        const outcome = result.totalHits > 0 ? 'hit' : 'miss';

        let msg = `🔥 ${attackerColor} ${result.attacker.name} fires ${result.attacker.cannons} cannon${result.attacker.cannons === 1 ? '' : 's'} at ${defenderColor} ${result.defender.name}!\n\n`;
        msg += `Hit Chance: ${result.hitChance.toFixed(0)}% per cannon\n`;
        msg += `Roll Results: [${rollSummary}]\n`;
        msg += `${rollDetail}\n\n`;
        msg += `→ ${result.totalHits} hit${result.totalHits === 1 ? '' : 's'}! ${result.totalDamage} damage dealt\n`;
        msg += `→ ${defenderColor} ${result.defender.name}: ${result.defender.currentHP}/${result.defender.maxHP} HP remaining (-${damagePercent.toFixed(0)}%)`;

        if (result.defenderDestroyed) {
            msg += '\n\n💥 SHIP SUNK! 💥';
        }

        let signal = {
            icon: '🌊',
            text: 'Broadside missed',
            tone: 'warn'
        };
        if (result.defenderDestroyed) {
            signal = {
                icon: '💥',
                text: 'Enemy ship sunk',
                tone: 'danger'
            };
        } else if (result.totalHits > 0) {
            signal = {
                icon: '🎯',
                text: `${result.totalHits} hit${result.totalHits === 1 ? '' : 's'} for ${result.totalDamage} damage`,
                tone: 'good'
            };
        }

        return {
            type: 'attack',
            attackerOwner: result.attacker.owner,
            outcome: result.defenderDestroyed ? 'destroyed' : outcome,
            summary: `${attackerColor} ${result.attacker.name} -> ${defenderColor} ${result.defender.name}: ${result.totalHits}/${result.attacker.cannons} hits, ${result.totalDamage} damage`,
            details: [
                `Chance ${result.hitChance.toFixed(0)}% | Rolls [${rollSummary}]`,
                `Damage ${result.totalDamage} | ${defenderColor} ${result.defender.name} ${result.defender.currentHP}/${result.defender.maxHP} HP (${hpPercent.toFixed(0)}%)`
            ],
            signal: signal,
            message: msg
        };
    }

    showBoardingResult(result) {
        const entry = this.formatBoardingResult(result);
        this.addCombatLogEntry(entry);
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
            return {
                type: 'board',
                attackerOwner: result.attacker.owner,
                outcome: 'failed',
                summary: `${attackerColor} ${result.attacker.name} failed boarding due to insufficient level`,
                details: [
                    `${attackerColor} ${result.attacker.name} ${result.attacker.currentHP}/${result.attacker.maxHP} HP | ${defenderColor} ${result.defender.name} ${result.defender.currentHP}/${result.defender.maxHP} HP`
                ],
                signal: {
                    icon: '🛡️',
                    text: 'Boarding repelled',
                    tone: 'warn'
                },
                message: msg
            };
        }

        // Check if target is a flagship
        if (result.isFlagship) {
            msg += `⚠️ FLAGSHIP CANNOT BE CAPTURED!\n\n`;
            msg += `The flagship's crew fights fiercely!\n`;
            msg += `Both ships take 2 damage in the brutal melee.\n\n`;
            msg += `${attackerColor} ${result.attacker.name}: ${result.attacker.currentHP}/${result.attacker.maxHP} HP\n`;
            msg += `${defenderColor} ${result.defender.name}: ${result.defender.currentHP}/${result.defender.maxHP} HP`;
            return {
                type: 'board',
                attackerOwner: result.attacker.owner,
                outcome: 'failed',
                summary: `${attackerColor} ${result.attacker.name} failed boarding: flagship immunity`,
                details: [
                    `${attackerColor} ${result.attacker.name} ${result.attacker.currentHP}/${result.attacker.maxHP} HP | ${defenderColor} ${result.defender.name} ${result.defender.currentHP}/${result.defender.maxHP} HP`
                ],
                signal: {
                    icon: '👑',
                    text: 'Flagship resisted boarding',
                    tone: 'warn'
                },
                message: msg
            };
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

        return {
            type: 'board',
            attackerOwner: result.attacker.owner,
            outcome: result.success ? 'success' : 'failed',
            summary: `${attackerColor} ${result.attacker.name} boarding ${result.success ? 'succeeded' : 'failed'} vs ${defenderColor} ${result.defender.name}`,
            details: result.success
                ? [`Target captured by ${attackerColor}`]
                : [
                    `${attackerColor} ${result.attacker.name} ${result.attacker.currentHP}/${result.attacker.maxHP} HP | ${defenderColor} ${result.defender.name} ${result.defender.currentHP}/${result.defender.maxHP} HP`
                ],
            signal: result.success
                ? {
                    icon: '🏴‍☠️',
                    text: 'Boarding succeeded',
                    tone: 'good'
                }
                : {
                    icon: '⚔️',
                    text: 'Boarding failed',
                    tone: 'warn'
                },
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
