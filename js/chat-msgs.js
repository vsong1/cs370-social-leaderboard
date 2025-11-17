// Chat messages and squad management
let currentSquadId = null;
let squads = [];

// Wait for auth and database to be ready
async function initializeChat() {
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
    
    // Listen for visibility change to reload squads when user returns to the page
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // Page became visible, reload squads in case new ones were created
            loadSquads();
        }
    });
    
    // Also reload when page gains focus (handles tab switching)
    window.addEventListener('focus', () => {
        loadSquads();
    });
}

// Load squads from database
async function loadSquads() {
    const squadList = document.getElementById('chat-squad-list');
    const emptyState = document.getElementById('chat-empty-state');
    const countBadge = document.getElementById('squad-count-badge');
    
    if (!squadList) return;
    
    try {
        const { data, error } = await window.Database.getUserSquads();
        
        if (error) {
            console.error('Error loading squads:', error);
            if (emptyState) {
                emptyState.style.display = 'block';
                emptyState.innerHTML = '<p>Error loading squads. Please refresh the page.</p>';
            }
            return;
        }
        
        squads = data || [];
        
        // Update count badge
        if (countBadge) {
            countBadge.textContent = `${squads.length} ${squads.length === 1 ? 'Squad' : 'Squads'}`;
        }
        
        // Clear existing squad cards (except empty state)
        const existingCards = squadList.querySelectorAll('.chat-squad-card');
        existingCards.forEach(card => card.remove());
        
        if (squads.length === 0) {
            // Show empty state
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            return;
        }
        
        // Hide empty state
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        // Load member counts for each squad
        const squadsWithCounts = await Promise.all(
            squads.map(async (squad) => {
                const memberCount = await window.Database.getSquadMemberCount(squad.id);
                return { ...squad, memberCount };
            })
        );
        
        // Render squad cards
        squadsWithCounts.forEach((squad, index) => {
            const card = createSquadCard(squad, index === 0);
            squadList.appendChild(card);
        });
        
        // Select first squad by default
        if (squadsWithCounts.length > 0) {
            selectSquad(squadsWithCounts[0].id);
        } else {
            // No squads - disable chat composer
            const messageField = document.getElementById('chat-message');
            const sendButton = document.querySelector('.chat-send-button');
            if (messageField) {
                messageField.disabled = true;
                messageField.placeholder = 'Join or create a squad to start chatting';
            }
            if (sendButton) {
                sendButton.disabled = true;
            }
        }
        
    } catch (error) {
        console.error('Unexpected error loading squads:', error);
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = '<p>Error loading squads. Please refresh the page.</p>';
        }
    }
}

// Create a squad card element
function createSquadCard(squad, isActive = false) {
    const card = document.createElement('button');
    card.className = `chat-squad-card ${isActive ? 'active' : ''}`;
    card.setAttribute('role', 'tab');
    card.setAttribute('data-squad-id', squad.id);
    card.setAttribute('aria-selected', isActive ? 'true' : 'false');
    
    const info = document.createElement('div');
    info.className = 'chat-squad-info';
    
    const name = document.createElement('span');
    name.className = 'chat-squad-name';
    name.textContent = squad.name || 'Unnamed Squad';
    
    const meta = document.createElement('span');
    meta.className = 'chat-squad-meta';
    const memberText = squad.memberCount === 1 ? 'member' : 'members';
    meta.textContent = `${squad.memberCount || 0} ${memberText}`;
    if (squad.game_title) {
        meta.textContent += ` · ${squad.game_title}`;
    }
    
    info.appendChild(name);
    info.appendChild(meta);
    
    const badge = document.createElement('span');
    badge.className = 'chat-badge';
    if (squad.skill_tier) {
        badge.textContent = squad.skill_tier;
    } else if (squad.visibility === 'private') {
        badge.textContent = 'Private';
    } else {
        badge.textContent = 'Public';
    }
    
    card.appendChild(info);
    card.appendChild(badge);
    
    // Add click handler
    card.addEventListener('click', () => {
        selectSquad(squad.id);
    });
    
    return card;
}

// Select a squad and update the chat window
async function selectSquad(squadId) {
    currentSquadId = squadId;
    
    // Update active state of squad cards
    const squadCards = document.querySelectorAll('.chat-squad-card');
    squadCards.forEach(card => {
        const isActive = card.getAttribute('data-squad-id') === squadId;
        card.classList.toggle('active', isActive);
        card.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    
    // Find squad data
    const squad = squads.find(s => s.id === squadId);
    if (!squad) {
        console.error('Squad not found:', squadId);
        return;
    }
    
    // Update chat header
    const headerTitle = document.getElementById('chat-header-title');
    const headerStatus = document.getElementById('chat-header-status');
    const headerActions = document.getElementById('chat-header-actions');
    
    if (headerTitle) {
        headerTitle.textContent = squad.name || 'Unnamed Squad';
    }
    
    if (headerStatus) {
        const memberCount = await window.Database.getSquadMemberCount(squadId);
        let statusText = `${memberCount} ${memberCount === 1 ? 'member' : 'members'}`;
        if (squad.game_title) {
            statusText += ` · ${squad.game_title}`;
        }
        if (squad.skill_tier) {
            statusText += ` · ${squad.skill_tier}`;
        }
        headerStatus.textContent = statusText;
    }
    
    if (headerActions) {
        headerActions.style.display = 'flex';
    }
    
    // Update view squad button
    const viewSquadBtn = document.getElementById('view-squad-btn');
    if (viewSquadBtn) {
        viewSquadBtn.onclick = () => {
            window.location.href = `managesquad.html?squad_id=${squadId}`;
        };
    }
    
    // Enable chat composer
    const messageField = document.getElementById('chat-message');
    const sendButton = document.querySelector('.chat-send-button');
    if (messageField) {
        messageField.disabled = false;
        messageField.placeholder = 'Type a message';
    }
    if (sendButton) {
        sendButton.disabled = false;
    }
    
    // Load messages for this squad (placeholder for now)
    loadSquadMessages(squadId);
}

// Load messages for a squad (placeholder - to be implemented with actual message system)
async function loadSquadMessages(squadId) {
    const messageList = document.getElementById('chat-message-list');
    const emptyMessages = document.getElementById('chat-empty-messages');
    
    if (!messageList) return;
    
    // Clear any existing messages
    const existingMessages = messageList.querySelectorAll('.chat-message, .chat-day-separator');
    existingMessages.forEach(msg => {
        if (msg.id !== 'chat-empty-messages') {
            msg.remove();
        }
    });
    
    // For now, show empty state
    // TODO: Implement actual message loading from database
    if (emptyMessages) {
        emptyMessages.style.display = 'block';
        emptyMessages.innerHTML = '<p>No messages yet. Start the conversation!</p>';
    }
}

// Handle message form submission
function setupMessageForm() {
    const composerForm = document.getElementById('chat-composer');
    const messageField = document.getElementById('chat-message');
    const messageList = document.getElementById('chat-message-list');
    const emptyMessages = document.getElementById('chat-empty-messages');
    
    if (!composerForm || !messageField || !messageList) return;
    
    composerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        if (!currentSquadId) {
            alert('Please select a squad first');
            return;
        }
        
        const message = messageField.value.trim();
        if (!message) {
            return;
        }
        
        // Hide empty messages
        if (emptyMessages) {
            emptyMessages.style.display = 'none';
        }
        
        // Create message element (for now, just local display)
        // TODO: Save message to database
        const messageArticle = document.createElement('article');
        messageArticle.className = 'chat-message outgoing';
        messageArticle.dataset.author = 'You';
        
        const header = document.createElement('div');
        header.className = 'chat-message-header';
        
        const author = document.createElement('span');
        author.textContent = 'You';
        
        const timestamp = document.createElement('time');
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        timestamp.setAttribute('datetime', now.toISOString());
        timestamp.textContent = `${hours}:${minutes}`;
        
        header.append(author, timestamp);
        
        const body = document.createElement('p');
        body.className = 'chat-message-body';
        body.textContent = message;
        
        messageArticle.append(header, body);
        messageList.appendChild(messageArticle);
        messageList.scrollTop = messageList.scrollHeight;
        
        composerForm.reset();
        messageField.focus();
        
        console.log('Message sent (local only - database integration pending):', message);
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeChat();
    setupMessageForm();
});
