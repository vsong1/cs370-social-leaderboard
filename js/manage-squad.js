// Manage Squad page functionality
// Loads and displays real squad data and members from the database

let currentSquadId = null;
let currentSquad = null;
let currentUser = null;
let isLoading = false;

// Wait for auth and database to be ready
async function initializeManageSquad() {
    // Wait for auth to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if user is logged in
    currentUser = await window.SquadScoreAuth?.getUser();
    if (!currentUser) {
        console.log('User not logged in, redirecting to login...');
        window.location.href = 'login.html';
        return;
    }
    
    // Get squad_id from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentSquadId = urlParams.get('squad_id');
    
    if (!currentSquadId) {
        alert('No squad specified. Redirecting to My Squads...');
        window.location.href = 'all-squads.html';
        return;
    }
    
    // Load squad data
    await loadSquadData();
    await loadMembers();
    
    // Setup form handlers
    setupFormHandlers();
    setupDeleteHandler();
}

// Load squad data from database
async function loadSquadData() {
    if (isLoading) return;
    isLoading = true;
    
    try {
        const { data: squad, error } = await window.Database.getSquadById(currentSquadId);
        
        if (error) {
            console.error('Error loading squad:', error);
            alert(error.message || 'Failed to load squad. Redirecting...');
            window.location.href = 'all-squads.html';
            return;
        }
        
        currentSquad = squad;
        
        // Populate form with squad data
        const nameDisplay = document.getElementById('squad-name');
        const visibilitySelect = document.getElementById('visibility');
        const descriptionTextarea = document.getElementById('squad-description');
        
        if (nameDisplay) nameDisplay.textContent = squad.name || 'Unnamed Squad';
        if (visibilitySelect) visibilitySelect.value = squad.visibility || 'public';
        if (descriptionTextarea) descriptionTextarea.value = squad.description || '';
        
    } catch (error) {
        console.error('Unexpected error loading squad:', error);
        alert('An unexpected error occurred. Please try again.');
    } finally {
        isLoading = false;
    }
}

// Load members from database
async function loadMembers() {
    if (isLoading) return;
    
    try {
        const { data: members, error } = await window.Database.getSquadMembers(currentSquadId);
        
        if (error) {
            console.error('Error loading members:', error);
            return;
        }
        
        renderMembers(members || []);
        
    } catch (error) {
        console.error('Unexpected error loading members:', error);
    }
}

// Render members list
function renderMembers(members) {
    const memberList = document.getElementById('member-list');
    if (!memberList) return;
    
    // Clear existing members
    memberList.innerHTML = '';
    
    if (members.length === 0) {
        memberList.innerHTML = '<li class="member-item"><span class="member-name">No members found</span></li>';
        return;
    }
    
    const currentUserId = currentUser?.id;
    const isOwner = currentSquad?.userRole === 'owner';
    
    members.forEach((member) => {
        const li = document.createElement('li');
        li.classList.add('member-item');
        
        const isMemberOwner = member.role === 'owner';
        const isCurrentUser = member.userId === currentUserId;
        const canModify = isOwner && !isCurrentUser; // Owners can modify others, but not themselves
        const canPromote = isOwner && !isMemberOwner; // Can promote members to owner
        const canDemote = isOwner && isMemberOwner && !isCurrentUser; // Can demote other owners (but not yourself)
        const canRemove = isOwner && !isMemberOwner; // Can remove members (but not owners)
        
        // Determine display name
        let displayName = member.username;
        if (member.firstName || member.lastName) {
            displayName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.username;
        }
        if (isCurrentUser) {
            displayName += ' (You)';
        }
        if (isMemberOwner) {
            displayName += ' [Owner]';
        }
        
        const ownerBtnHTML = canPromote
            ? `<button type="button" class="promote-owner-btn" data-user-id="${member.userId}">Promote to Owner</button>`
            : canDemote
            ? `<button type="button" class="demote-owner-btn" data-user-id="${member.userId}">Demote</button>`
            : '';
        
        const removeBtnHTML = canRemove
            ? `<button type="button" class="remove-member-btn" data-user-id="${member.userId}">Remove</button>`
            : isMemberOwner
            ? `<button type="button" class="remove-member-btn" disabled title="Owners cannot be removed.">Remove</button>`
            : '';
        
        li.innerHTML = `
            <span class="member-name">${displayName}</span>
            <div class="member-buttons">
                ${ownerBtnHTML}
                ${removeBtnHTML}
            </div>
        `;
        
        memberList.appendChild(li);
        
        // Add event listeners
        const promoteBtn = li.querySelector('.promote-owner-btn');
        if (promoteBtn) {
            promoteBtn.addEventListener('click', () => updateMemberRole(member.userId, 'owner'));
        }
        
        const demoteBtn = li.querySelector('.demote-owner-btn');
        if (demoteBtn) {
            demoteBtn.addEventListener('click', () => updateMemberRole(member.userId, 'member'));
        }
        
        const removeBtn = li.querySelector('.remove-member-btn:not([disabled])');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => removeMember(member.userId));
        }
    });
}

// Update member role
async function updateMemberRole(userId, newRole) {
    if (!confirm(`Are you sure you want to ${newRole === 'owner' ? 'promote' : 'demote'} this member?`)) {
        return;
    }
    
    const supabase = window.Database.getSupabaseClient();
    if (!supabase) {
        alert('Database connection error');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('squad_membership')
            .update({ role: newRole })
            .eq('squad_id', currentSquadId)
            .eq('user_id', userId);
        
        if (error) {
            throw error;
        }
        
        // Reload members
        await loadMembers();
        alert(`Member ${newRole === 'owner' ? 'promoted' : 'demoted'} successfully.`);
        
    } catch (error) {
        console.error('Error updating member role:', error);
        alert('Failed to update member role. Please try again.');
    }
}

// Remove member from squad
async function removeMember(userId) {
    if (!confirm('Are you sure you want to remove this member from the squad?')) {
        return;
    }
    
    const supabase = window.Database.getSupabaseClient();
    if (!supabase) {
        alert('Database connection error');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('squad_membership')
            .delete()
            .eq('squad_id', currentSquadId)
            .eq('user_id', userId);
        
        if (error) {
            throw error;
        }
        
        // Reload members
        await loadMembers();
        alert('Member removed successfully.');
        
    } catch (error) {
        console.error('Error removing member:', error);
        alert('Failed to remove member. Please try again.');
    }
}

// Setup form submission handler
function setupFormHandlers() {
    const form = document.getElementById('manage-squad-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (isLoading) return;
        isLoading = true;
        
        const visibilitySelect = document.getElementById('visibility');
        const descriptionTextarea = document.getElementById('squad-description');
        
        const updates = {
            visibility: visibilitySelect?.value || 'public',
            description: descriptionTextarea?.value.trim() || null
        };
        
        try {
            const { data, error } = await window.Database.updateSquad(currentSquadId, updates);
            
            if (error) {
                throw error;
            }
            
            alert('Squad updated successfully!');
            // Reload squad data to reflect changes
            await loadSquadData();
            
        } catch (error) {
            console.error('Error updating squad:', error);
            alert(error.message || 'Failed to update squad. Please try again.');
        } finally {
            isLoading = false;
        }
    });
    
    // Add member handler
    const addMemberBtn = document.getElementById('add-member-btn');
    const newMemberInput = document.getElementById('new-member');
    
    if (addMemberBtn && newMemberInput) {
        addMemberBtn.addEventListener('click', async () => {
            const email = newMemberInput.value.trim();
            if (!email) {
                alert('Please enter an email address');
                return;
            }
            
            // TODO: Implement invite functionality
            // For now, show a message
            alert('Invite functionality coming soon! For now, users can join using the squad invite code.');
            newMemberInput.value = '';
        });
    }
}

// Setup delete handler
function setupDeleteHandler() {
    const deleteBtn = document.getElementById('deletesquad-btn');
    const deleteModal = document.getElementById('delete-modal');
    const cancelDelete = document.getElementById('cancel-delete');
    const confirmDelete = document.getElementById('confirm-delete');
    
    if (!deleteBtn || !deleteModal || !cancelDelete || !confirmDelete) return;
    
    deleteBtn.addEventListener('click', () => {
        deleteModal.classList.add('active');
    });
    
    cancelDelete.addEventListener('click', () => {
        deleteModal.classList.remove('active');
    });
    
    confirmDelete.addEventListener('click', async () => {
        deleteModal.classList.remove('active');
        
        if (isLoading) return;
        isLoading = true;
        
        try {
            const { data, error } = await window.Database.deleteSquad(currentSquadId);
            
            if (error) {
                throw error;
            }
            
            alert('Squad deleted successfully.');
            window.location.href = 'all-squads.html';
            
        } catch (error) {
            console.error('Error deleting squad:', error);
            alert(error.message || 'Failed to delete squad. Please try again.');
            isLoading = false;
        }
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeManageSquad();
});
