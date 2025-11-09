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

// Load and display leaderboards from database
async function loadAllLeaderboards() {
    const leaderboardsList = document.getElementById('leaderboards-list');
    if (!leaderboardsList) return;
    
    // Show loading state
    leaderboardsList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #888;">Loading leaderboards...</div>';
    
    // Wait for Supabase to initialize
    let attempts = 0;
    while (!window.Database && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.Database) {
        leaderboardsList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #ff6b6b;">Error: Database not loaded</div>';
        return;
    }
    
    // Get leaderboards from database
    const { data: leaderboards, error } = await window.Database.getUserLeaderboards();
    
    if (error) {
        console.error('❌ Error loading leaderboards:', error);
        leaderboardsList.innerHTML = `<div style="text-align: center; padding: 2rem; color: #ff6b6b;">Error loading leaderboards: ${error.message}</div>`;
        return;
    }
    
    // Clear loading message
    leaderboardsList.innerHTML = '';
    
    if (!leaderboards || leaderboards.length === 0) {
        leaderboardsList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #888;">No leaderboards found. Create one to get started!</div>';
        return;
    }
    
    // Load member counts for each leaderboard (in parallel)
    const leaderboardsWithCounts = await Promise.all(
        leaderboards.map(async (lb) => {
            const memberCount = await window.Database.getLeaderboardMemberCount(lb.id);
            return { ...lb, memberCount };
        })
    );
    
    // Create cards for each leaderboard
    leaderboardsWithCounts.forEach((leaderboard) => {
        const card = document.createElement('div');
        card.className = 'leaderboard-card';
        
        const memberText = leaderboard.memberCount === 1 
            ? '1 member' 
            : `${leaderboard.memberCount} members`;
        
        card.innerHTML = `
            <div class="leaderboard-info">
                <h3 class="leaderboard-name">${leaderboard.name || 'Unnamed Leaderboard'}</h3>
                <p class="leaderboard-game">${leaderboard.game_name || 'Game'}</p>
                <p class="leaderboard-members">${memberText}</p>
            </div>
            <div class="leaderboard-actions">
                <button class="view-leaderboard-btn" onclick="window.location.href='leaderboard.html?id=${leaderboard.id}'">View</button>
            </div>
        `;
        
        leaderboardsList.appendChild(card);
    });
    
    // Re-initialize search after loading (since we added new cards)
    if (document.getElementById('leaderboard-search')) {
        initializeLeaderboardSearch();
    }
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Check if we're on the all-leaderboards page
    if (document.getElementById('leaderboard-search')) {
        initializeLeaderboardSearch();
        // Load leaderboards from database
        loadAllLeaderboards();
    }
});

// Leaderboard view, adding scores functionality - NOW USING SUPABASE!
(function leaderboardPersistence() {
    // Get leaderboard ID from URL, data attribute, or by name
    const getLeaderboardId = async () => {
        // Try to get from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const idFromUrl = urlParams.get('id');
        if (idFromUrl) return parseInt(idFromUrl);
        
        // Try to get from data attribute on the page
        const leaderboardElement = document.querySelector('[data-leaderboard-id]');
        if (leaderboardElement) {
            return parseInt(leaderboardElement.getAttribute('data-leaderboard-id'));
        }
        
        // Try to find by name from the page title
        const titleElement = document.querySelector('.leaderboard-title');
        if (titleElement && window.Database) {
            const leaderboardName = titleElement.textContent?.trim();
            if (leaderboardName) {
                try {
                    const { data, error } = await window.Database.findLeaderboardByName(leaderboardName);
                    if (!error && data) {
                        console.log('✅ Found leaderboard by name:', data.id);
                        return data.id;
                    }
                } catch (err) {
                    console.warn('⚠️ Could not find leaderboard by name:', err);
                }
            }
        }
        
        // For now, return null - we'll need to create or find the leaderboard
        // This is a temporary solution until we have proper leaderboard routing
        return null;
    };

    // Read entries from Supabase
    const readSavedEntries = async () => {
        const leaderboardId = await getLeaderboardId();
        
        if (!leaderboardId) {
            console.log('⚠️ No leaderboard ID found, returning empty array');
            return [];
        }
        
        if (!window.Database) {
            console.error('❌ Database.js not loaded');
            return [];
        }
        
        try {
            const { data, error } = await window.Database.getSimpleLeaderboardEntries(leaderboardId);
            
            if (error) {
                console.error('❌ Error loading leaderboard entries:', error);
                return [];
            }
            
            return data || [];
        } catch (err) {
            console.error('❌ Exception loading entries:', err);
            return [];
        }
    };

    // Write entries to Supabase (this will add a new entry)
    const writeSavedEntry = async (name, score) => {
        const leaderboardId = await getLeaderboardId();
        
        if (!leaderboardId) {
            console.error('❌ Cannot save: No leaderboard ID found');
            return { success: false, error: 'No leaderboard ID. Please make sure the leaderboard exists in the database.' };
        }
        
        if (!window.Database) {
            console.error('❌ Database.js not loaded');
            return { success: false, error: 'Database not loaded' };
        }
        
        try {
            const { data, error } = await window.Database.addLeaderboardEntry(leaderboardId, name, score);
            
            if (error) {
                console.error('❌ Error saving entry:', error);
                return { success: false, error };
            }
            
            return { success: true, data };
        } catch (err) {
            console.error('❌ Exception saving entry:', err);
            return { success: false, error: err.message };
        }
    };

    // Expose helpers for this module scope
    window._leaderboardStore = {
        readSavedEntries,
        writeSavedEntry,
        getLeaderboardId
    };
})();

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
            const nameEl = entry.querySelector('.player-name');

            const match = pointsEl?.textContent.match(/(-?\d+)/);
            const score = match ? Number(match[1]) : 0;
            const name = nameEl?.textContent?.trim() || '';

            return { element: entry, score, rankEl, pointsEl, nameEl, name };
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
            pointsEl: entry.querySelector('.points'),
            nameEl: entry.querySelector('.player-name'),
            name
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

        // Note: We no longer persist to localStorage here
        // Entries are saved individually when added via the form
    };


    form.addEventListener('submit', async (event) => {
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

        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton?.textContent;
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Saving...';
        }

        // Save to Supabase
        const result = await window._leaderboardStore?.writeSavedEntry(name, score);
        
        if (!result || !result.success) {
            showError(result?.error?.message || 'Failed to save score. Please try again.');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
            return;
        }

        // Reload entries from database to get updated scores
        const updatedEntries = await window._leaderboardStore?.readSavedEntries() || [];
        
        // Convert to format expected by rebuildLeaderboard
        const existingEntries = collectLeaderboardEntries(list);
        
        // Update or add the entry
        const targetNameLower = name.toLowerCase();
        const existing = existingEntries.find(e => (e.name || '').toLowerCase() === targetNameLower);
        
        if (existing) {
            existing.score = score;
            if (existing.pointsEl) {
                existing.pointsEl.textContent = `${score} points`;
            }
            if (existing.nameEl) {
                existing.nameEl.textContent = name;
                existing.name = name;
            }
        } else {
            const newEntry = buildLeaderboardEntry({
                name,
                score,
                isNew: true
            });
            existingEntries.push(newEntry);
        }
        
        rebuildLeaderboard(list, existingEntries);

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
        
        togglePanel(false);
    });
})();


// Leaderboard view, load data from Supabase
async function loadLeaderboard() {
    const list = document.querySelector('.leaderboard-list');
    if (!list) return;

    // Show loading state
    list.innerHTML = '<div style="text-align: center; padding: 2rem; color: #888;">Loading leaderboard...</div>';

    // Wait a bit for Supabase to initialize
    let attempts = 0;
    while (!window.Database && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }

    // Load entries from Supabase
    const saved = await window._leaderboardStore?.readSavedEntries() || [];
    
    // If no entries found, show placeholder data (but don't save it)
    const leaderboardData = saved.length > 0 ? saved.map((s, idx) => ({
        rank: idx + 1,
        name: s.name,
        points: Number(s.points || 0)
    })) : [
        { rank: 1, name: 'Player123', points: 10 },
        { rank: 2, name: 'Georgia', points: 9 },
        { rank: 3, name: 'De', points: 7 },
        { rank: 4, name: 'Kevin', points: 7 },
        { rank: 5, name: 'Triangle', points: 3 },
        { rank: 6, name: 'Jim', points: 1 }
    ];

    // Clear loading message
    list.innerHTML = '';

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

window.addEventListener('DOMContentLoaded', async () => {
    if (document.querySelector('.leaderboard-list')) {
        await loadLeaderboard();
        initAddScorePanel();
    }
});