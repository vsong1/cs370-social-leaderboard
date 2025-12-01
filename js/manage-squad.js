// Manage Squad page - Simple approach
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for scripts to load
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Get squad_id from URL
    const urlParams = new URLSearchParams(window.location.search);
    const squadId = urlParams.get('squad_id');
    
    if (!squadId) {
        alert('No squad specified');
        window.location.href = 'all-squads.html';
        return;
    }
    
    // Check auth
    const user = await window.SquadScoreAuth?.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Load and display squad data
    await loadSquad(squadId);
    
    // Get squad to check if user is owner
    const { data: squad } = await window.Database.getSquadById(squadId);
    const isOwner = squad?.userRole === 'owner';
    
    // Load and display members
    await loadMembers(squadId, user.id, isOwner);
    
    // Setup form and delete handlers
    setupHandlers(squadId);
});

// Load squad data
async function loadSquad(squadId) {
    try {
        const { data: squad, error } = await window.Database.getSquadById(squadId);
        
        if (error) {
            alert('Error: ' + error.message);
            window.location.href = 'all-squads.html';
            return;
        }
        
        // Display squad name
        const nameEl = document.getElementById('squad-name');
        if (nameEl) nameEl.textContent = squad.name || 'Unnamed Squad';
        
        // Set form values
        const visibilityEl = document.getElementById('visibility');
        if (visibilityEl) visibilityEl.value = squad.visibility || 'public';
        
        const descEl = document.getElementById('squad-description');
        if (descEl) descEl.value = squad.description || '';
        
    } catch (error) {
        console.error('Error loading squad:', error);
        alert('Failed to load squad');
    }
}

// Load and display members
async function loadMembers(squadId, currentUserId, isOwner = false) {
    const memberList = document.getElementById('member-list');
    if (!memberList) return;
    
    try {
        const { data: members, error } = await window.Database.getSquadMembers(squadId);
        
        if (error) {
            memberList.innerHTML = '<li class="member-item"><span class="member-name">Error loading members</span></li>';
            return;
        }
        
        if (!members || members.length === 0) {
            memberList.innerHTML = '<li class="member-item"><span class="member-name">No members</span></li>';
            return;
        }
        
        // Clear and render
        memberList.innerHTML = '';
        
        members.forEach(member => {
            const li = document.createElement('li');
            li.className = 'member-item';
            
            const isOwner = member.role === 'owner';
            const isYou = member.userId === currentUserId;
            
            // Display name
            let name = member.username || member.email?.split('@')[0] || 'Unknown';
            if (member.firstName || member.lastName) {
                name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || name;
            }
            if (isYou) {
                name += ' (You)';
            }
            
            // Buttons - only show if current user is owner
            let buttonsHTML = '';
            if (isOwner) {
                if (member.role === 'owner') {
                    // Owner member: show disabled buttons
                    buttonsHTML = `
                        <button type="button" class="demote-owner-btn" disabled title="This member is an owner and cannot be demoted.">Demote</button>
                        <button type="button" class="remove-member-btn" disabled title="This member is an owner and cannot be removed.">Remove</button>
                    `;
                } else {
                    // Regular member: show action buttons
                    buttonsHTML = `
                        <button type="button" class="promote-owner-btn" data-user-id="${member.userId}">Promote to Owner</button>
                        <button type="button" class="remove-member-btn" data-user-id="${member.userId}">Remove</button>
                    `;
                }
            }
            
            li.innerHTML = `
                <span class="member-name">${name}</span>
                <div class="member-buttons">${buttonsHTML}</div>
            `;
            
            memberList.appendChild(li);
            
            // Add click handlers for non-disabled buttons
            const promoteBtn = li.querySelector('.promote-owner-btn');
            if (promoteBtn) {
                promoteBtn.addEventListener('click', () => promoteMember(squadId, member.userId));
            }
            
            const removeBtn = li.querySelector('.remove-member-btn:not([disabled])');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => removeMember(squadId, member.userId));
            }
        });
        
    } catch (error) {
        console.error('Error loading members:', error);
        memberList.innerHTML = '<li class="member-item"><span class="member-name">Error loading members</span></li>';
    }
}

// Promote member to owner
async function promoteMember(squadId, userId) {
    if (!confirm('Promote this member to owner?')) return;
    
    const supabase = window.Database.getSupabaseClient();
    if (!supabase) return;
    
    const { error } = await supabase
        .from('squad_membership')
        .update({ role: 'owner' })
        .eq('squad_id', squadId)
        .eq('user_id', userId);
    
    if (error) {
        alert('Error: ' + error.message);
    } else {
        location.reload();
    }
}

// Remove member
async function removeMember(squadId, userId) {
    if (!confirm('Remove this member from the squad?')) return;
    
    const supabase = window.Database.getSupabaseClient();
    if (!supabase) return;
    
    const { error } = await supabase
        .from('squad_membership')
        .delete()
        .eq('squad_id', squadId)
        .eq('user_id', userId);
    
    if (error) {
        alert('Error: ' + error.message);
    } else {
        location.reload();
    }
}

// Setup form and delete handlers
function setupHandlers(squadId) {
    const form = document.getElementById('manage-squad-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const visibility = document.getElementById('visibility')?.value || 'public';
            const description = document.getElementById('squad-description')?.value.trim() || null;
            
            const { error } = await window.Database.updateSquad(squadId, { visibility, description });
            
            if (error) {
                alert('Error: ' + error.message);
            } else {
                alert('Squad updated!');
            }
        });
    }
    
    const deleteBtn = document.getElementById('deletesquad-btn');
    const modal = document.getElementById('delete-modal');
    const cancelBtn = document.getElementById('cancel-delete');
    const confirmBtn = document.getElementById('confirm-delete');
    
    if (deleteBtn && modal) {
        deleteBtn.addEventListener('click', () => modal.classList.add('active'));
        if (cancelBtn) cancelBtn.addEventListener('click', () => modal.classList.remove('active'));
        if (confirmBtn) {
            confirmBtn.addEventListener('click', async () => {
                modal.classList.remove('active');
                const { error } = await window.Database.deleteSquad(squadId);
                if (error) {
                    alert('Error: ' + error.message);
                } else {
                    alert('Squad deleted');
                    window.location.href = 'all-squads.html';
                }
            });
        }
    }
}
