# How to Use the Database Functions

## Available Functions in `db.js`:

### User Profile:
- `getUserProfile()` - Get current user's profile from database
- `updateUserProfile(updates)` - Update user profile

### Squads:
- `getMySquads()` - Get all squads user is a member of
- `createSquad(name, description)` - Create a new squad
- `getSquadMessages(squadId, limit)` - Get chat messages for a squad
- `sendSquadMessage(squadId, messageBody)` - Send a message to squad chat

### Leaderboards:
- `getMyLeaderboards()` - Get all leaderboards user is in
- `getPinnedLeaderboards()` - Get user's pinned leaderboards
- `getLeaderboardStandings(leaderboardId)` - Calculate standings for a leaderboard

## Example 1: Load User's Squads on Chat Page

Add to `chat.html` before closing `</body>`:

```html
<script type="module">
    import { getMySquads } from './db.js';
    
    async function loadSquads() {
        const squads = await getMySquads();
        const squadList = document.querySelector('.chat-squad-list');
        
        if (!squadList) return;
        
        // Clear existing placeholder squads
        squadList.innerHTML = '';
        
        // Populate with real squads
        squads.forEach((membership, index) => {
            const squad = membership.squad;
            const isActive = index === 0 ? 'active' : '';
            
            const card = document.createElement('button');
            card.className = `chat-squad-card ${isActive}`;
            card.setAttribute('role', 'tab');
            card.setAttribute('data-squad', squad.name);
            card.setAttribute('aria-selected', index === 0);
            
            card.innerHTML = `
                <div class="chat-squad-info">
                    <span class="chat-squad-name">${squad.name}</span>
                    <span class="chat-squad-meta">Role: ${membership.role}</span>
                </div>
                <span class="chat-badge">${membership.role}</span>
            `;
            
            squadList.appendChild(card);
        });
    }
    
    loadSquads();
</script>
```

## Example 2: Display User Profile Data

Add to `profile.html`:

```html
<script type="module">
    import { getUserProfile, updateUserProfile } from './db.js';
    
    async function loadProfile() {
        const profile = await getUserProfile();
        
        if (profile) {
            // Update form fields with real data
            document.getElementById('profile-first-name').value = profile.first_name || '';
            document.getElementById('profile-last-name').value = profile.last_name || '';
            document.getElementById('profile-username').value = profile.username || '';
            document.getElementById('profile-email').value = profile.email || '';
            
            // Update display
            document.querySelector('[data-profile-field="fullName"]').textContent = 
                `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username;
        }
    }
    
    // Save profile changes
    const profileForm = document.getElementById('profile-form');
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const updates = {
            first_name: document.getElementById('profile-first-name').value,
            last_name: document.getElementById('profile-last-name').value,
            username: document.getElementById('profile-username').value,
            phone: document.getElementById('profile-phone')?.value
        };
        
        const { data, error } = await updateUserProfile(updates);
        
        if (error) {
            alert('Error updating profile: ' + error.message);
        } else {
            alert('Profile updated successfully!');
            loadProfile(); // Reload
        }
    });
    
    loadProfile();
</script>
```

## Example 3: Display Leaderboards

Create a new file or add to `all-leaderboards.html`:

```html
<script type="module">
    import { getMyLeaderboards } from './db.js';
    
    async function loadLeaderboards() {
        const leaderboards = await getMyLeaderboards();
        const container = document.querySelector('.lblist-content');
        
        if (!container) return;
        
        if (leaderboards.length === 0) {
            container.innerHTML = '<p>No leaderboards yet. Join a squad to participate!</p>';
            return;
        }
        
        container.innerHTML = '<h2>My Leaderboards</h2>';
        
        leaderboards.forEach(membership => {
            const lb = membership.leaderboard;
            const card = document.createElement('div');
            card.className = 'leaderboard-card';
            card.innerHTML = `
                <h3>${lb.name}</h3>
                <p>Game: ${lb.game_name}</p>
                <p>Role: ${membership.role}</p>
                <p>Status: ${lb.status}</p>
                <a href="leaderboard.html?id=${lb.id}">View Standings</a>
            `;
            container.appendChild(card);
        });
    }
    
    loadLeaderboards();
</script>
```

## Example 4: Squad Chat with Real Messages

Add to `chat.html`:

```html
<script type="module">
    import { getSquadMessages, sendSquadMessage } from './db.js';
    
    let currentSquadId = 1; // Or get from URL/selection
    
    async function loadMessages() {
        const messages = await getSquadMessages(currentSquadId);
        const messageList = document.getElementById('chat-message-list');
        
        messageList.innerHTML = '<div class="chat-day-separator">Today</div>';
        
        messages.forEach(msg => {
            const article = document.createElement('article');
            article.className = 'chat-message';
            article.innerHTML = `
                <div class="chat-message-header">
                    <span>${msg.user.username}</span>
                    <time>${new Date(msg.created_at).toLocaleTimeString()}</time>
                </div>
                <p class="chat-message-body">${msg.body}</p>
            `;
            messageList.appendChild(article);
        });
    }
    
    // Send message
    const composerForm = document.getElementById('chat-composer');
    const messageField = document.getElementById('chat-message');
    
    composerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = messageField.value.trim();
        
        if (!message) return;
        
        await sendSquadMessage(currentSquadId, message);
        messageField.value = '';
        loadMessages(); // Reload messages
    });
    
    loadMessages();
</script>
```

## Example 5: Create New Squad

```html
<script type="module">
    import { createSquad } from './db.js';
    
    async function createNewSquad() {
        const name = prompt('Squad name:');
        const description = prompt('Description:');
        
        if (name) {
            const { data, error } = await createSquad(name, description);
            
            if (error) {
                alert('Error: ' + error.message);
            } else {
                alert('Squad created!');
                window.location.reload();
            }
        }
    }
    
    // Add button somewhere:
    // <button onclick="createNewSquad()">Create Squad</button>
</script>
```

## Quick Start

All these functions are in `db.js` - just import what you need:

```javascript
import { getMySquads, getMyLeaderboards, getUserProfile } from './db.js';
```

Then call them on your pages to populate with real data from your Supabase database!


