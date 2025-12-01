// Create Leaderboard functionality
let currentSquadId = null;
let currentSquad = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Wait for scripts to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get squad_id from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentSquadId = urlParams.get('squad_id');
    
    // Check auth
    const user = await window.SquadScoreAuth?.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Load squad data if squad_id is provided
    if (currentSquadId) {
        await loadSquadData(currentSquadId);
        await loadSquadMembers(currentSquadId);
    }
    
    // Setup form
    setupForm();
});

// Load squad data
async function loadSquadData(squadId) {
    try {
        const { data: squad, error } = await window.Database.getSquadById(squadId);
        
        if (error) {
            console.error('Error loading squad:', error);
            return;
        }
        
        currentSquad = squad;
        
        // Update title
        const titleEl = document.getElementById('squad-title');
        if (titleEl && squad.name) {
            titleEl.textContent = `${squad.name} > New Leaderboard`;
        }
        
    } catch (error) {
        console.error('Error loading squad:', error);
    }
}

// Load squad members
async function loadSquadMembers(squadId) {
    const membersList = document.getElementById('squad-members-list');
    if (!membersList) return;
    
    try {
        const { data: members, error } = await window.Database.getSquadMembers(squadId);
        
        if (error) {
            console.error('Error loading members:', error);
            return;
        }
        
        // Clear placeholder members
        membersList.innerHTML = '';
        
        if (!members || members.length === 0) {
            membersList.innerHTML = '<div class="member-item">No members in this squad</div>';
            return;
        }
        
        // Display real members
        members.forEach(member => {
            const memberItem = document.createElement('div');
            memberItem.className = 'member-item';
            
            // Determine display name
            let displayName = member.username || member.email?.split('@')[0] || 'Unknown';
            if (member.firstName || member.lastName) {
                displayName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || displayName;
            }
            
            memberItem.textContent = displayName;
            memberItem.dataset.userId = member.userId;
            
            // Add double-click to remove
            memberItem.addEventListener('dblclick', function() {
                this.remove();
            });
            
            membersList.appendChild(memberItem);
        });
        
    } catch (error) {
        console.error('Error loading members:', error);
    }
}

// Setup form
function setupForm() {
    const form = document.getElementById('create-leaderboard-form');
    if (!form) return;
    
    const gameSelection = document.getElementById('game-selection');
    const leaderboardName = document.getElementById('leaderboard-name');
    const createButton = document.querySelector('.create-button');
    
    // Game selection with custom option
    if (gameSelection) {
        gameSelection.addEventListener('change', function() {
            if (this.value === 'custom') {
                const customInput = document.createElement('input');
                customInput.type = 'text';
                customInput.placeholder = 'Enter custom game name';
                customInput.className = 'custom-game-input';
                customInput.style.cssText = `
                    margin-top: 0.5rem;
                    padding: 0.75rem 1rem;
                    border: 1px solid #F5F1ED;
                    border-radius: 8px;
                    background: transparent;
                    color: #F5F1ED;
                    font-size: 1rem;
                    font-family: 'Inter', sans-serif;
                    width: 100%;
                `;
                
                this.parentNode.insertBefore(customInput, this.nextSibling);
                customInput.focus();
                
                customInput.addEventListener('blur', function() {
                    if (this.value.trim()) {
                        const customOption = document.createElement('option');
                        customOption.value = this.value.trim();
                        customOption.textContent = this.value.trim();
                        gameSelection.appendChild(customOption);
                        gameSelection.value = this.value.trim();
                    }
                    this.remove();
                });
            }
        });
    }
    
    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        // Check if squad_id is required
        if (!currentSquadId) {
            showError('No squad specified. Please create a leaderboard from a squad page.');
            return;
        }
        
        // Get form data
        const name = leaderboardName.value.trim();
        const game = gameSelection.value.trim();
        const selectedMembers = Array.from(document.querySelectorAll('#squad-members-list .member-item'))
            .map(item => item.dataset.userId)
            .filter(id => id);
        
        const settings = {
            allowJoinWithoutInvite: document.querySelector('input[name="allow_join_without_invite"]')?.checked || false,
            requireAdminApproval: document.querySelector('input[name="require_admin_approval"]')?.checked || false,
            requireEvidence: document.querySelector('input[name="require_evidence"]')?.checked || false
        };
        
        // Disable button
        if (createButton) {
            createButton.disabled = true;
            createButton.textContent = 'CREATING...';
            createButton.style.opacity = '0.7';
        }
        
        try {
            // Create leaderboard in database
            const supabase = window.Database.getSupabaseClient();
            if (!supabase) {
                throw new Error('Database not available');
            }
            
            const userId = await window.Database.getCurrentUserId();
            if (!userId) {
                throw new Error('User not logged in');
            }
            
            // Create the leaderboard
            const { data: leaderboard, error: lbError } = await supabase
                .from('leaderboard')
                .insert({
                    name: name,
                    game_name: game,
                    squad_id: currentSquadId,
                    admin_user_id: userId,
                    status: 'active'
                })
                .select()
                .single();
            
            if (lbError) {
                throw lbError;
            }
            
            // Add members to leaderboard_membership
            if (selectedMembers.length > 0) {
                const memberships = selectedMembers.map(memberId => ({
                    leaderboard_id: leaderboard.id,
                    user_id: memberId
                }));
                
                const { error: memError } = await supabase
                    .from('leaderboard_membership')
                    .insert(memberships);
                
                if (memError) {
                    console.warn('Error adding members:', memError);
                    // Continue anyway - leaderboard was created
                }
            }
            
            // Show success
            showSuccess('Leaderboard created successfully!');
            
            // Reset form
            form.reset();
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = `leaderboard.html?leaderboard_id=${leaderboard.id}`;
            }, 1500);
            
        } catch (error) {
            console.error('Error creating leaderboard:', error);
            showError(error.message || 'Failed to create leaderboard. Please try again.');
            
            // Re-enable button
            if (createButton) {
                createButton.disabled = false;
                createButton.textContent = 'CREATE';
                createButton.style.opacity = '1';
            }
        }
    });
    
    
    // Add hover effects
    const formInputs = form.querySelectorAll('input, select');
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.borderColor = '#A7F2B6';
            this.style.boxShadow = '0 0 0 3px rgba(167, 242, 182, 0.3)';
        });
        
        input.addEventListener('blur', function() {
            this.style.borderColor = '#F5F1ED';
            this.style.boxShadow = 'none';
        });
    });
    
    // Button animations
    if (createButton) {
        createButton.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 8px 25px rgba(255, 91, 206, 0.3)';
        });
        
        createButton.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    }
}


// Form validation
function validateForm() {
    const leaderboardName = document.getElementById('leaderboard-name');
    const gameSelection = document.getElementById('game-selection');
    
    if (!leaderboardName || !leaderboardName.value.trim()) {
        showError('Please enter a leaderboard name');
        if (leaderboardName) leaderboardName.focus();
        return false;
    }
    
    if (!gameSelection || !gameSelection.value.trim()) {
        showError('Please select or enter a game');
        if (gameSelection) gameSelection.focus();
        return false;
    }
    
    return true;
}

// Show error message
function showError(message) {
    const form = document.getElementById('create-leaderboard-form');
    if (!form) return;
    
    const existingError = document.querySelector('.form-error');
    if (existingError) {
        existingError.remove();
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        color: #FF5BCE;
        font-size: 0.9rem;
        margin-top: 0.5rem;
        padding: 0.5rem;
        background: rgba(255, 91, 206, 0.1);
        border: 1px solid rgba(255, 91, 206, 0.3);
        border-radius: 6px;
    `;
    
    const formActions = form.querySelector('.form-actions');
    if (formActions) {
        form.insertBefore(errorDiv, formActions);
    } else {
        form.appendChild(errorDiv);
    }
    
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

// Show success message
function showSuccess(message) {
    const form = document.getElementById('create-leaderboard-form');
    if (!form) return;
    
    const existingSuccess = document.querySelector('.form-success');
    if (existingSuccess) {
        existingSuccess.remove();
    }
    
    const successDiv = document.createElement('div');
    successDiv.className = 'form-success';
    successDiv.textContent = message;
    successDiv.style.cssText = `
        color: #68D391;
        font-size: 0.9rem;
        margin-top: 0.5rem;
        padding: 0.5rem;
        background: rgba(104, 211, 145, 0.1);
        border: 1px solid rgba(104, 211, 145, 0.3);
        border-radius: 6px;
    `;
    
    const formActions = form.querySelector('.form-actions');
    if (formActions) {
        form.insertBefore(successDiv, formActions);
    } else {
        form.appendChild(successDiv);
    }
    
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.remove();
        }
    }, 3000);
}
