// All Squads page functionality
// Loads and displays user's squads from the database

let isLoadingSquads = false;
let eventListenersAttached = false;

// Wait for auth and database to be ready
async function initializeAllSquads() {
    // Wait for auth to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if user is logged in
    const user = await window.SquadScoreAuth?.getUser();
    if (!user) {
        console.log('User not logged in, redirecting to login...');
        window.location.href = 'login.html';
        return;
    }
    
    // Load squads
    await loadSquads();
    
    // Only attach event listeners once
    if (!eventListenersAttached) {
        // Listen for visibility change to reload squads when user returns to the page
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && !isLoadingSquads) {
                loadSquads();
            }
        });
        
        // Also reload when page gains focus
        window.addEventListener('focus', () => {
            if (!isLoadingSquads) {
                loadSquads();
            }
        });
        
        eventListenersAttached = true;
    }
}

// Load squads from database and display them
async function loadSquads() {
    // Prevent multiple simultaneous loads
    if (isLoadingSquads) {
        return;
    }
    
    isLoadingSquads = true;
    const squadsList = document.getElementById('squads-list');
    const emptyState = document.getElementById('empty-state');
    
    if (!squadsList) {
        isLoadingSquads = false;
        return;
    }
    
    try {
        const { data: squads, error } = await window.Database.getUserSquads();
        
        if (error) {
            console.error('Error loading squads:', error);
            if (emptyState) {
                emptyState.style.display = 'block';
                emptyState.innerHTML = '<p>Error loading squads. Please refresh the page.</p>';
            }
            isLoadingSquads = false;
            return;
        }
        
        // Clear existing squad cards more thoroughly
        // Remove all children except the empty state
        while (squadsList.firstChild) {
            const child = squadsList.firstChild;
            if (child.id !== 'empty-state') {
                squadsList.removeChild(child);
            } else {
                break; // Keep empty state
            }
        }
        
        // Also clear by class name as backup
        const existingCards = squadsList.querySelectorAll('.squad-card');
        existingCards.forEach(card => card.remove());
        
        if (!squads || squads.length === 0) {
            // Show empty state
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            isLoadingSquads = false;
            return;
        }
        
        // Hide empty state
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        // Load member counts and leaderboards for each squad
        const squadsWithData = await Promise.all(
            squads.map(async (squad) => {
                const memberCount = await window.Database.getSquadMemberCount(squad.id);
                const { data: leaderboards } = await window.Database.getSquadLeaderboards(squad.id);
                return {
                    ...squad,
                    memberCount,
                    leaderboards: leaderboards || []
                };
            })
        );
        
        // Render squad cards
        squadsWithData.forEach((squad) => {
            const card = createSquadCard(squad);
            squadsList.appendChild(card);
        });
        
    } catch (error) {
        console.error('Unexpected error loading squads:', error);
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = '<p>Error loading squads. Please refresh the page.</p>';
        }
    } finally {
        isLoadingSquads = false;
    }
}

// Create a squad card element
function createSquadCard(squad) {
    const card = document.createElement('div');
    card.className = 'squad-card';
    
    // Squad info section
    const squadInfo = document.createElement('div');
    squadInfo.className = 'squad-info';
    
    // Left side: Title and description
    const squadHeader = document.createElement('div');
    squadHeader.className = 'squad-header';
    
    const squadName = document.createElement('h3');
    squadName.className = 'squad-name';
    squadName.textContent = squad.name || 'Unnamed Squad';
    
    // Member count info (always shown)
    const squadMembers = document.createElement('p');
    squadMembers.className = 'squad-members';
    const memberText = squad.memberCount === 1 ? 'member' : 'members';
    let membersText = `${squad.memberCount || 0} ${memberText}`;
    if (squad.game_title) {
        membersText += ` · ${squad.game_title}`;
    }
    if (squad.skill_tier) {
        membersText += ` · ${squad.skill_tier}`;
    }
    squadMembers.textContent = membersText;
    
    squadHeader.appendChild(squadName);
    squadHeader.appendChild(squadMembers);
    
    // Description (shown if it exists)
    if (squad.description && squad.description.trim()) {
        const squadDescription = document.createElement('p');
        squadDescription.className = 'squad-description';
        squadDescription.textContent = squad.description;
        squadHeader.appendChild(squadDescription);
    }
    
    // Right side: Buttons
    const squadActions = document.createElement('div');
    squadActions.className = 'squad-actions';
    
    const manageBtn = document.createElement('button');
    manageBtn.className = 'manage-btn';
    manageBtn.textContent = 'Manage';
    manageBtn.onclick = () => {
        window.location.href = `managesquad.html?squad_id=${squad.id}`;
    };
    
    const chatBtn = document.createElement('button');
    chatBtn.className = 'chat-btn';
    chatBtn.textContent = 'Open Chat';
    chatBtn.onclick = () => {
        window.location.href = `chat.html`;
    };
    
    squadActions.appendChild(manageBtn);
    squadActions.appendChild(chatBtn);
    
    squadInfo.appendChild(squadHeader);
    squadInfo.appendChild(squadActions);
    
    // Leaderboards section
    const shortlbList = document.createElement('div');
    shortlbList.className = 'shortlb-list';
    
    // Add existing leaderboards
    if (squad.leaderboards && squad.leaderboards.length > 0) {
        squad.leaderboards.forEach((leaderboard) => {
            const tile = document.createElement('div');
            tile.className = 'shortlb-tile';
            // Alternate colors for visual variety
            const colors = [
                'rgb(167,242,182,0.5)',
                'rgb(251,139,36,0.5)',
                'rgb(167,242,182,0.5)'
            ];
            const colorIndex = Math.floor(Math.random() * colors.length);
            tile.style.background = colors[colorIndex];
            tile.onclick = () => {
                window.location.href = `leaderboard.html?leaderboard_id=${leaderboard.id}`;
            };
            
            const p = document.createElement('p');
            p.textContent = leaderboard.name || 'Unnamed Leaderboard';
            tile.appendChild(p);
            
            shortlbList.appendChild(tile);
        });
    }
    
    // Add "New Leaderboard" tile
    const newLbTile = document.createElement('div');
    newLbTile.className = 'shortlb-tile';
    newLbTile.onclick = () => {
        window.location.href = `create-leaderboard.html?squad_id=${squad.id}`;
    };
    
    const newLbText = document.createElement('p');
    newLbText.className = 'shortlb-new';
    newLbText.textContent = '+ New Leaderboard';
    newLbTile.appendChild(newLbText);
    
    shortlbList.appendChild(newLbTile);
    
    // Assemble card
    card.appendChild(squadInfo);
    card.appendChild(shortlbList);
    
    return card;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeAllSquads();
});

