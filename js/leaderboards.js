// CTA Button functionality
function viewLeaderboards() {
    console.log('View Leaderboards clicked');

    // Add click animation
    const button = document.querySelector('.cta-button');
    if (button) {
        button.style.transform = 'scale(0.95)';

        setTimeout(() => {
            button.style.transform = '';
            // Navigate to all leaderboards page
            window.location.href = 'all-leaderboards.html';
        }, 150);
    }
}

// Leaderboard page functionality
function goBackToLeaderboards() {
    console.log('Back to Leaderboards clicked');
    // Navigate to all leaderboards page
    window.location.href = 'all-leaderboards.html';
}

function openSquadChat() {
    console.log('Open Squad Chat clicked');
    // Navigate to chat page
    window.location.href = 'chat.html';
}

// Search functionality for leaderboard
function initializeLeaderboardSearch() {
    const searchInput = document.getElementById('leaderboard-search');
    const leaderboardsList = document.getElementById('leaderboards-list');

    if (!searchInput || !leaderboardsList) {
        console.log('Leaderboard search elements not found');
        return;
    }

    // Add event listener for search input
    searchInput.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase().trim();
        const cards = leaderboardsList.querySelectorAll('.leaderboard-card');

        cards.forEach(card => {
            const leaderboardName = card.querySelector('.leaderboard-name').textContent.toLowerCase();
            const leaderboardGame = card.querySelector('.leaderboard-game').textContent.toLowerCase();

            if (searchTerm === '') {
                // Show all cards
                card.classList.remove('hidden', 'highlighted');
            } else if (leaderboardName.includes(searchTerm) || leaderboardGame.includes(searchTerm)) {
                // Show and highlight matching cards
                card.classList.remove('hidden');
                card.classList.add('highlighted');
            } else {
                // Hide non-matching cards
                card.classList.add('hidden');
                card.classList.remove('highlighted');
            }
        });

        // Update search button visibility
        const searchButton = document.querySelector('.search-button');
        if (searchButton) {
            searchButton.style.display = searchTerm ? 'flex' : 'none';
        }
    });

    // Add keyboard shortcuts
    searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            this.value = '';
            this.dispatchEvent(new Event('input'));
            this.blur();
        }
    });
    // Mobile-friendly: Add touch events for better mobile experience
    searchInput.addEventListener('touchstart', function () {
        this.focus();
    });

    // Prevent zoom on double-tap for mobile
    searchInput.addEventListener('touchend', function (e) {
        e.preventDefault();
    });
}

function clearLeaderboardSearch() {
    const searchInput = document.getElementById('leaderboard-search');
    if (searchInput) {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
        searchInput.focus();
    }
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Check if we're on the all-leaderboards page
    if (document.getElementById('leaderboard-search')) {
        initializeLeaderboardSearch();
    }
});

// Leaderboard view, adding scores functionality
(function initAddScorePanel() {
    const trigger = document.querySelector('[data-add-score-trigger]');
    const panel = document.querySelector('[data-add-score-panel]');
    const form = document.getElementById('leaderboard-add-score-form');
    const cancel = document.querySelector('[data-add-score-cancel]');
    const errorField = document.querySelector('[data-add-score-error]');
    const list = document.querySelector('.leaderboard-list');
    const userPalette = ['rank-1', 'rank-2', 'rank-3', 'rank-default'];



    if (!trigger || !panel || !form || !list) {
        return;
    }

    const togglePanel = (shouldShow) => {
        if (shouldShow) {
            panel.hidden = false;
            panel.style.opacity = '1';
            panel.style.transform = 'translateY(0)';
            form.querySelector('input')?.focus();
        } else {
            panel.hidden = true;
            panel.style.opacity = '';
            panel.style.transform = '';
            form.reset();
            hideError();
        }
        trigger.setAttribute('aria-expanded', String(shouldShow));
    };

    const showError = (message) => {
        if (!errorField) return;
        errorField.textContent = message;
        errorField.hidden = false;
    };

    const hideError = () => {
        if (!errorField) return;
        errorField.textContent = '';
        errorField.hidden = true;
    };

    trigger.addEventListener('click', () => {
        const isHidden = panel.hidden;
        togglePanel(isHidden);
    });

    cancel?.addEventListener('click', () => togglePanel(false));

    const collectLeaderboardEntries = (listElement) => {
        return Array.from(listElement.querySelectorAll('.leaderboard-entry')).map((entry) => {
            const rankEl = entry.querySelector('.rank');
            const pointsEl = entry.querySelector('.points');

            const match = pointsEl?.textContent.match(/(-?\d+)/);
            const score = match ? Number(match[1]) : 0;

            return { element: entry, score, rankEl, pointsEl };
        });
    };

    const buildLeaderboardEntry = ({ name, score, isNew = false }) => {
        const entry = document.createElement('div');
        entry.className = 'leaderboard-entry';
        if (isNew) {
            entry.classList.add('leaderboard-entry--user');
            const randomClass = userPalette[Math.floor(Math.random() * userPalette.length)];
            entry.dataset.userPalette = randomClass;
            entry.classList.add(randomClass);
        }

        entry.innerHTML = `
            <span class="rank">#?</span>
            <span class="player-name">${name}</span>
            <span class="points">${score} points</span>
        `;

        return {
            element: entry,
            score,
            rankEl: entry.querySelector('.rank'),
            pointsEl: entry.querySelector('.points')
        };
    };

    const rankClassFor = (rank) => {
        if (rank <= 1) return 'rank-1';
        if (rank === 2) return 'rank-2';
        if (rank === 3) return 'rank-3';
        return 'rank-default';
    };

    const rebuildLeaderboard = (listElement, entries) => {
        const sorted = entries.sort((a, b) => b.score - a.score);

        let currentRank = 1;
        let lastScore = null;
        const fragment = document.createDocumentFragment();

        sorted.forEach((entryObj, index) => {
            if (entryObj.score !== lastScore) {
                currentRank = index + 1;
                lastScore = entryObj.score;
            }

            entryObj.rankEl.textContent = `#${currentRank}`;
            entryObj.pointsEl.textContent = `${entryObj.score} points`;

            // update colors for all entries
            entryObj.element.classList.remove('rank-1', 'rank-2', 'rank-3', 'rank-default');
            entryObj.element.classList.add(rankClassFor(currentRank));

            fragment.appendChild(entryObj.element);
        });

        listElement.innerHTML = '';
        listElement.appendChild(fragment);
    };


    form.addEventListener('submit', (event) => {
        event.preventDefault();
        hideError();

        const formData = new FormData(form);
        const name = (formData.get('player_name') || '').trim();
        const scoreValue = (formData.get('score') || '').trim();

        if (!name || !scoreValue) {
            showError('Please enter both player name and score.');
            return;
        }

        const score = Number(scoreValue);

        const existingEntries = collectLeaderboardEntries(list);

        const newEntry = buildLeaderboardEntry({
            name,
            score,
            isNew: true
        });

        existingEntries.push(newEntry);

        rebuildLeaderboard(list, existingEntries);

        togglePanel(false);
    });
})();


// Leaderboard view, placeholder data
function tempLeaderboard() {
    const leaderboardData = [
        { rank: 1, name: 'Player123', points: 10 },
        { rank: 2, name: 'Georgia', points: 9 },
        { rank: 3, name: 'De', points: 7 },
        { rank: 3, name: 'Kevin', points: 7 },
        { rank: 5, name: 'Triangle', points: 3 },
        { rank: 6, name: 'Jim', points: 1 }
    ];

    const list = document.querySelector('.leaderboard-list');
    if (!list) return;

    leaderboardData.forEach((entry) => {
        const div = document.createElement('div');
        let rankClass = 'rank-default';
        if (entry.rank === 1) rankClass = 'rank-1';
        else if (entry.rank === 2) rankClass = 'rank-2';
        else if (entry.rank === 3) rankClass = 'rank-3';

        div.className = `leaderboard-entry ${rankClass}`;
        div.innerHTML = `
            <span class="rank">#${entry.rank}</span>
            <span class="player-name">${entry.name}</span>
            <span class="points">${entry.points} points</span>
        `;
        list.appendChild(div);
    });
}

window.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.leaderboard-list')) {
        tempLeaderboard();
        initAddScorePanel();
    }
});