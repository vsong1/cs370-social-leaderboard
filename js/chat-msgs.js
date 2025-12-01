// Chat messages and squad management
let currentSquadId = null;
let squads = [];
let chatRoomId = null;
let messageSubscription = null;
let searchTerm = '';
let searchDebounce = null;
let defaultEmptyStateHTML = '';
let isLoadingSquads = false;

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

function setupSquadSearch() {
    const searchInput = document.querySelector('.chat-search input');
    if (!searchInput) return;

    // Clear any persisted value so we don't start filtered to nothing
    searchInput.value = '';
    searchTerm = '';
    
    // Re-render the list to ensure it shows all squads after clearing search
    renderSquadList();

    searchInput.addEventListener('input', () => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
            searchTerm = searchInput.value.trim().toLowerCase();
            renderSquadList();
        }, 250);
    });
}

// Load squads from database
async function loadSquads() {
    if (isLoadingSquads) return;
    isLoadingSquads = true;

    const squadList = document.getElementById('chat-squad-list');
    const emptyState = document.getElementById('chat-empty-state');
    const countBadge = document.getElementById('squad-count-badge');
    
    if (!squadList) return;
    
    if (emptyState && !defaultEmptyStateHTML) {
        defaultEmptyStateHTML = emptyState.innerHTML;
    }
    
    try {
        const { data, error } = await window.Database.getUserSquads();
        
        if (error) {
            console.error('Error loading squads:', error);
            if (emptyState) {
                emptyState.style.display = 'block';
                emptyState.innerHTML = '<p>Error loading squads. Please refresh the page.</p>';
            }
            squads = [];
            clearActiveChatForNoResults('Error loading squads');
            return;
        }
        
        const baseSquads = data || [];
        
        const squadsWithCounts = await Promise.all(
            baseSquads.map(async (squad) => {
                const memberCount = await window.Database.getSquadMemberCount(squad.id);
                return { ...squad, memberCount };
            })
        );
        
        squads = squadsWithCounts;
        
        if (countBadge) {
            countBadge.textContent = `${squads.length} ${squads.length === 1 ? 'Squad' : 'Squads'}`;
        }
        
        renderSquadList();
        
    } catch (error) {
        console.error('Unexpected error loading squads:', error);
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = '<p>Error loading squads. Please refresh the page.</p>';
        }
        squads = [];
        clearActiveChatForNoResults('Error loading squads');
    } finally {
        isLoadingSquads = false;
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

function clearActiveChatForNoResults(message) {
    if (messageSubscription) {
        messageSubscription.unsubscribe();
        messageSubscription = null;
    }
    
    chatRoomId = null;
    currentSquadId = null;
    
    const headerTitle = document.getElementById('chat-header-title');
    const headerStatus = document.getElementById('chat-header-status');
    const headerActions = document.getElementById('chat-header-actions');
    if (headerTitle) {
        headerTitle.textContent = 'Select a squad';
    }
    if (headerStatus) {
        headerStatus.textContent = message || 'Choose a squad from the sidebar to start chatting';
    }
    if (headerActions) {
        headerActions.style.display = 'none';
    }
    
    const messageField = document.getElementById('chat-message');
    const sendButton = document.querySelector('.chat-send-button');
    if (messageField) {
        messageField.disabled = true;
        messageField.placeholder = message || 'Select a squad to start chatting';
    }
    if (sendButton) {
        sendButton.disabled = true;
    }
    
    const messageList = document.getElementById('chat-message-list');
    const emptyMessages = document.getElementById('chat-empty-messages');
    if (messageList) {
        const existingMessages = messageList.querySelectorAll('.chat-message, .chat-day-separator');
        existingMessages.forEach(msg => {
            if (msg.id !== 'chat-empty-messages') {
                msg.remove();
            }
        });
    }
    if (emptyMessages) {
        emptyMessages.style.display = 'block';
        emptyMessages.innerHTML = `<p>${message || 'Select a squad to view messages'}</p>`;
    }
}

function renderSquadList() {
    const squadList = document.getElementById('chat-squad-list');
    const emptyState = document.getElementById('chat-empty-state');
    const searchInput = document.querySelector('.chat-search input');
    
    if (!squadList) return;
    
    if (emptyState && !defaultEmptyStateHTML) {
        defaultEmptyStateHTML = emptyState.innerHTML;
    }
    
    // Get search term from input or use the stored searchTerm variable
    // Only use input value if searchInput exists and has a value
    let inputValue = '';
    if (searchInput) {
        inputValue = searchInput.value || '';
    }
    
    const normalizedSearch = (inputValue || searchTerm || '').trim().toLowerCase();
    
    // Only update searchTerm if we have a valid search input element
    // This prevents issues during initial load
    if (searchInput) {
        searchTerm = normalizedSearch;
    }
    
    // Only filter if there's an actual search term
    const filteredSquads = normalizedSearch
        ? squads.filter((squad) => (squad.name || '').toLowerCase().includes(normalizedSearch))
        : [...squads];
    
    const existingCards = squadList.querySelectorAll('.chat-squad-card');
    existingCards.forEach(card => card.remove());
    
    if (filteredSquads.length === 0) {
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = squads.length === 0
                ? (defaultEmptyStateHTML || '<p>You\'re not part of any squads yet.</p><p>Create or join a squad to get started!</p>')
                : '<p>No squads match that name.</p><p>Try a different search.</p>';
        }
        const statusMessage = squads.length === 0
            ? 'Join or create a squad to start chatting'
            : 'No squads match your search';
        clearActiveChatForNoResults(statusMessage);
        return;
    }
    
    if (emptyState) {
        emptyState.style.display = 'none';
        emptyState.innerHTML = defaultEmptyStateHTML || emptyState.innerHTML;
    }
    
    filteredSquads.forEach((squad) => {
        const card = createSquadCard(squad, squad.id === currentSquadId);
        squadList.appendChild(card);
    });
    
    const hasCurrent = filteredSquads.some(squad => squad.id === currentSquadId);
    if (!hasCurrent) {
        selectSquad(filteredSquads[0].id);
    }
}

// Select a squad and update the chat window
async function selectSquad(squadId) {
    // Unsubscribe from previous squad's messages
    if (messageSubscription) {
        messageSubscription.unsubscribe();
        messageSubscription = null;
    }
    
    currentSquadId = squadId;
    chatRoomId = null;
    
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

// Load messages for a squad
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
    
    // Unsubscribe from previous realtime subscription
    if (messageSubscription) {
        messageSubscription.unsubscribe();
        messageSubscription = null;
    }
    
    // Get chat room ID
    const { data: chatRoom, error: roomError } = await window.Database.getOrCreateSquadChatRoom(squadId);
    if (roomError || !chatRoom) {
        console.error('Error getting chat room:', roomError);
        if (emptyMessages) {
            emptyMessages.style.display = 'block';
            emptyMessages.innerHTML = '<p>Error loading chat. Please refresh the page.</p>';
        }
        return;
    }
    
    chatRoomId = chatRoom.id;
    
    // Load messages from database
    const { data: messages, error: messagesError } = await window.Database.getSquadMessages(squadId);
    
    if (messagesError) {
        console.error('Error loading messages:', messagesError);
        if (emptyMessages) {
            emptyMessages.style.display = 'block';
            emptyMessages.innerHTML = '<p>Error loading messages. Please refresh the page.</p>';
        }
        return;
    }
    
    // Display messages
    if (!messages || messages.length === 0) {
        if (emptyMessages) {
            emptyMessages.style.display = 'block';
            emptyMessages.innerHTML = '<p>No messages yet. Start the conversation!</p>';
        }
    } else {
        if (emptyMessages) {
            emptyMessages.style.display = 'none';
        }
        
        for (const message of messages) {
            await renderMessage(message);
        }
        
        // Scroll to bottom
        messageList.scrollTop = messageList.scrollHeight;
    }
    
    // Subscribe to new messages
    setupRealtimeSubscription(chatRoomId);
}

// Render a single message
async function renderMessage(message) {
    const messageList = document.getElementById('chat-message-list');
    if (!messageList) return;
    
    const userId = await window.Database.getCurrentUserId();
    const isOutgoing = message.user_id === userId;
    
    const messageArticle = document.createElement('article');
    messageArticle.className = `chat-message ${isOutgoing ? 'outgoing' : ''}`;
    messageArticle.dataset.messageId = message.id;
    messageArticle.dataset.author = message.user?.username || message.user?.email || 'Unknown';
    
    const header = document.createElement('div');
    header.className = 'chat-message-header';
    
    const author = document.createElement('span');
    const userName = message.user?.first_name 
        ? `${message.user.first_name}${message.user.last_name ? ' ' + message.user.last_name : ''}`
        : message.user?.username 
        ? message.user.username
        : message.user?.email?.split('@')[0] || 'Unknown';
    author.textContent = isOutgoing ? 'You' : userName;
    
    const timestamp = document.createElement('time');
    const messageDate = new Date(message.created_at);
    const hours = messageDate.getHours().toString().padStart(2, '0');
    const minutes = messageDate.getMinutes().toString().padStart(2, '0');
    timestamp.setAttribute('datetime', messageDate.toISOString());
    timestamp.textContent = `${hours}:${minutes}`;
    
    header.append(author, timestamp);
    
    const body = document.createElement('p');
    body.className = 'chat-message-body';
    body.textContent = message.body;
    
    messageArticle.append(header, body);
    messageList.appendChild(messageArticle);
}

// Setup realtime subscription for new messages
function setupRealtimeSubscription(roomId) {
    const supabase = window.Database.getSupabaseClient();
    if (!supabase || !roomId) return;
    
    messageSubscription = supabase
        .channel(`squad-chat-${roomId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_message',
                filter: `squad_chat_id=eq.${roomId}`
            },
            async (payload) => {
                // New message received
                const newMessage = payload.new;
                
                // Check if message is already displayed (avoid duplicates)
                const existingMessage = document.querySelector(`[data-message-id="${newMessage.id}"]`);
                if (existingMessage) {
                    return;
                }
                
                // Fetch full message with user data
                const { data: fullMessage, error } = await supabase
                    .from('chat_message')
                    .select(`
                        id,
                        user_id,
                        body,
                        created_at,
                        user:user_id (
                            id,
                            username,
                            email,
                            first_name,
                            last_name
                        )
                    `)
                    .eq('id', newMessage.id)
                    .single();
                
                if (error) {
                    console.error('Error fetching full message:', error);
                    return;
                }
                
                // Hide empty state if visible
                const emptyMessages = document.getElementById('chat-empty-messages');
                if (emptyMessages) {
                    emptyMessages.style.display = 'none';
                }
                
                // Render the message
                await renderMessage(fullMessage);
                
                // Scroll to bottom
                const messageList = document.getElementById('chat-message-list');
                if (messageList) {
                    messageList.scrollTop = messageList.scrollHeight;
                }
            }
        )
        .subscribe();
}

// Handle message form submission
function setupMessageForm() {
    const composerForm = document.getElementById('chat-composer');
    const messageField = document.getElementById('chat-message');
    const messageList = document.getElementById('chat-message-list');
    const emptyMessages = document.getElementById('chat-empty-messages');
    const sendButton = document.querySelector('.chat-send-button');
    
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
        
        // Disable form while sending
        if (sendButton) sendButton.disabled = true;
        messageField.disabled = true;
        
        // Hide empty messages
        if (emptyMessages) {
            emptyMessages.style.display = 'none';
        }
        
        // Save message to database
        const { data: savedMessage, error: sendError } = await window.Database.sendSquadMessage(currentSquadId, message);
        
        if (sendError) {
            console.error('Error sending message:', sendError);
            alert('Failed to send message. Please try again.');
            // Re-enable form
            if (sendButton) sendButton.disabled = false;
            messageField.disabled = false;
            return;
        }
        
        // Message will be displayed via realtime subscription
        // But we can also render it immediately for better UX
        if (savedMessage) {
            // Check if already rendered by subscription
            const existingMessage = document.querySelector(`[data-message-id="${savedMessage.id}"]`);
            if (!existingMessage) {
                await renderMessage(savedMessage);
                messageList.scrollTop = messageList.scrollHeight;
            }
        }
        
        // Reset form
        composerForm.reset();
        messageField.focus();
        
        // Re-enable form
        if (sendButton) sendButton.disabled = false;
        messageField.disabled = false;
    });
}

// Cleanup subscriptions on page unload
window.addEventListener('beforeunload', () => {
    if (messageSubscription) {
        messageSubscription.unsubscribe();
        messageSubscription = null;
    }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeChat();
    setupMessageForm();
    setupSquadSearch();
});
