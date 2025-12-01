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

// Store current leaderboard data globally
let currentLeaderboardData = null;

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
                <button class="view-leaderboard-btn" onclick="window.location.href='leaderboard.html?leaderboard_id=${leaderboard.id}'">View</button>
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
    // Get leaderboard ID from URL
    const getLeaderboardId = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        // Check for both 'id' and 'leaderboard_id' parameters
        const idFromUrl = urlParams.get('leaderboard_id') || urlParams.get('id');
        if (idFromUrl) {
            return idFromUrl; // Keep as string, Supabase uses UUIDs
        }
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
    const writeSavedEntry = async (name, score, evidenceFile = null) => {
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
            const { data, error } = await window.Database.addLeaderboardEntry(leaderboardId, name, score, evidenceFile);
            
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
    const evidenceInput = document.getElementById('add-score-evidence');
    const evidenceAttachButton = document.querySelector('[data-add-score-attach]');
    const evidenceFilename = document.querySelector('[data-add-score-filename]');
    const evidenceClearButton = document.querySelector('[data-add-score-clear]');
    let selectedEvidenceFile = null;
    const EVIDENCE_MAX_BYTES = 5 * 1024 * 1024; // 5MB limit



    if (!trigger || !panel || !form || !list) {
        return;
    }

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
    
    const resetEvidenceSelection = () => {
        selectedEvidenceFile = null;
        if (evidenceInput) {
            evidenceInput.value = '';
        }
        if (evidenceFilename) {
            evidenceFilename.textContent = 'No file selected';
        }
        if (evidenceClearButton) {
            evidenceClearButton.hidden = true;
        }
    };
    
    const handleEvidenceSelection = (file) => {
        if (!file) {
            resetEvidenceSelection();
            return;
        }
        
        if (!file.type?.startsWith('image/')) {
            showError('Evidence must be an image file.');
            resetEvidenceSelection();
            return;
        }
        
        if (file.size > EVIDENCE_MAX_BYTES) {
            showError('Evidence must be 5MB or smaller.');
            resetEvidenceSelection();
            return;
        }
        
        hideError();
        selectedEvidenceFile = file;
        if (evidenceFilename) {
            evidenceFilename.textContent = file.name;
        }
        if (evidenceClearButton) {
            evidenceClearButton.hidden = false;
        }
    };

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
            resetEvidenceSelection();
        }
        trigger.setAttribute('aria-expanded', String(shouldShow));
    };

    trigger.addEventListener('click', () => {
        const isHidden = panel.hidden;
        togglePanel(isHidden);
    });

    cancel?.addEventListener('click', () => togglePanel(false));
    
    evidenceAttachButton?.addEventListener('click', () => {
        evidenceInput?.click();
    });
    
    evidenceInput?.addEventListener('change', (event) => {
        const file = event.target?.files?.[0];
        handleEvidenceSelection(file);
    });
    
    evidenceClearButton?.addEventListener('click', () => {
        resetEvidenceSelection();
    });

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
            showError('Please select a player and enter a score.');
            return;
        }

        const score = Number(scoreValue);
        const evidenceFile = selectedEvidenceFile;

        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton?.textContent;
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = evidenceFile ? 'Uploading evidence...' : 'Saving...';
        }

        // Save to Supabase
        const result = await window._leaderboardStore?.writeSavedEntry(name, score, evidenceFile);
        
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
        resetEvidenceSelection();

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
        
        togglePanel(false);
    });
})();


// Populate player dropdown with squad members
async function populatePlayerDropdown(squadId) {
    const playerSelect = document.getElementById('add-score-name');
    if (!playerSelect || !squadId) return;
    
    // Clear existing options except the first one
    playerSelect.innerHTML = '<option value="">Select a player...</option>';
    
    if (!window.Database) {
        console.error('Database not available');
        return;
    }
    
    try {
        const { data: members, error } = await window.Database.getSquadMembers(squadId);
        
        if (error) {
            console.error('Error loading squad members:', error);
            return;
        }
        
        if (!members || members.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No members found';
            option.disabled = true;
            playerSelect.appendChild(option);
            return;
        }
        
        // Add each member as an option
        members.forEach(member => {
            const option = document.createElement('option');
            option.value = member.username; // Use username as value
            option.textContent = member.username;
            playerSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error populating player dropdown:', error);
    }
}

// Leaderboard view, load data from Supabase
async function loadLeaderboard() {
    const list = document.querySelector('.leaderboard-list');
    const titleEl = document.getElementById('leaderboard-title');
    const chatButton = document.getElementById('squad-chat-button');
    
    if (!list) return;

    // Show loading state
    list.innerHTML = '<div style="text-align: center; padding: 2rem; color: #888;">Loading leaderboard...</div>';
    if (titleEl) titleEl.textContent = 'Loading...';

    // Wait for Supabase to initialize
    let attempts = 0;
    while (!window.Database && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }

    if (!window.Database) {
        list.innerHTML = '<div style="text-align: center; padding: 2rem; color: #ff6b6b;">Error: Database not loaded</div>';
        return;
    }

    // Get leaderboard ID
    const leaderboardId = await window._leaderboardStore?.getLeaderboardId();
    
    if (!leaderboardId) {
        list.innerHTML = '<div style="text-align: center; padding: 2rem; color: #ff6b6b;">No leaderboard specified</div>';
        if (titleEl) titleEl.textContent = 'Leaderboard Not Found';
        return;
    }

    // Load leaderboard details
    try {
        const { data: leaderboard, error: lbError } = await window.Database.getLeaderboard(leaderboardId);
        
        if (lbError || !leaderboard) {
            list.innerHTML = '<div style="text-align: center; padding: 2rem; color: #ff6b6b;">Leaderboard not found</div>';
            if (titleEl) titleEl.textContent = 'Leaderboard Not Found';
            return;
        }
        
        currentLeaderboardData = leaderboard;
        
        // Update title
        if (titleEl) {
            titleEl.textContent = leaderboard.name || 'Unnamed Leaderboard';
        }
        
        // Show squad chat button if leaderboard has a squad
        if (leaderboard.squad_id && chatButton) {
            chatButton.style.display = 'block';
            chatButton.onclick = () => {
                window.location.href = `chat.html`;
            };
        }
        
        // Populate player dropdown with squad members if leaderboard has a squad
        const playerSelect = document.getElementById('add-score-name');
        if (leaderboard.squad_id) {
            await populatePlayerDropdown(leaderboard.squad_id);
        } else if (playerSelect) {
            // If no squad, disable the dropdown and show a message
            playerSelect.innerHTML = '<option value="" disabled>No squad associated with this leaderboard</option>';
            playerSelect.disabled = true;
        }
        
    } catch (error) {
        console.error('Error loading leaderboard details:', error);
    }

    // Load entries from Supabase
    const saved = await window._leaderboardStore?.readSavedEntries() || [];
    
    // Clear loading message
    list.innerHTML = '';

    if (saved.length === 0) {
        list.innerHTML = '<div style="text-align: center; padding: 2rem; color: #888;">No scores yet. Be the first to add one!</div>';
        return;
    }

    // Sort by score (descending) and assign ranks
    const sorted = saved
        .map(entry => ({
            name: entry.name,
            points: Number(entry.points || 0)
        }))
        .sort((a, b) => b.points - a.points);

    let currentRank = 1;
    let lastScore = null;

    sorted.forEach((entry, index) => {
        // Handle ties - same rank for same score
        if (entry.points !== lastScore) {
            currentRank = index + 1;
            lastScore = entry.points;
        }

        const div = document.createElement('div');
        let rankClass = 'rank-default';
        if (currentRank === 1) rankClass = 'rank-1';
        else if (currentRank === 2) rankClass = 'rank-2';
        else if (currentRank === 3) rankClass = 'rank-3';

        div.className = `leaderboard-entry ${rankClass}`;
        div.innerHTML = `
            <span class="rank">#${currentRank}</span>
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
