// Create Leaderboard functionality
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('create-leaderboard-form');
    // const iconOptions = document.querySelectorAll('.icon-option');
    const gameSelection = document.getElementById('game-selection');
    const leaderboardName = document.getElementById('leaderboard-name');
    const createButton = document.querySelector('.create-button');
    
    let selectedIcon = null;
    
    // // Icon selection functionality
    // iconOptions.forEach(option => {
    //     option.addEventListener('click', function() {
    //         // Remove selected class from all options
    //         iconOptions.forEach(opt => opt.classList.remove('selected'));
            
    //         // Add selected class to clicked option
    //         this.classList.add('selected');
    //         selectedIcon = this.dataset.icon;
            
    //         // Handle custom icon upload
    //         if (selectedIcon === 'add') {
    //             handleCustomIconUpload();
    //         }
    //     });
    // });
    
    // // Custom icon upload handler
    // function handleCustomIconUpload() {
    //     const input = document.createElement('input');
    //     input.type = 'file';
    //     input.accept = 'image/*';
    //     input.style.display = 'none';
        
    //     input.addEventListener('change', function(e) {
    //         const file = e.target.files[0];
    //         if (file) {
    //             const reader = new FileReader();
    //             reader.onload = function(e) {
    //                 const addIcon = document.querySelector('.add-icon');
    //                 addIcon.innerHTML = `<img src="${e.target.result}" alt="Custom Icon" style="width: 30px; height: 30px; object-fit: cover; border-radius: 50%;">`;
    //             };
    //             reader.readAsDataURL(file);
    //         }
    //     });
        
    //     document.body.appendChild(input);
    //     input.click();
    //     document.body.removeChild(input);
    // }
    
    // Game selection with custom option
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
            
            // Insert after the select element
            this.parentNode.insertBefore(customInput, this.nextSibling);
            customInput.focus();
            
            customInput.addEventListener('blur', function() {
                if (this.value.trim()) {
                    // Update the select with custom value
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
    
    // Form validation
    function validateForm() {
        const name = leaderboardName.value.trim();
        const game = gameSelection.value.trim();
        
        if (!name) {
            showError('Please enter a leaderboard name');
            leaderboardName.focus();
            return false;
        }
        
        if (!game) {
            showError('Please select or enter a game');
            gameSelection.focus();
            return false;
        }
        
        // if (!selectedIcon) {
        //     showError('Please select an icon');
        //     return false;
        // }
        
        return true;
    }
    
    // Show error message
    function showError(message) {
        // Remove existing error
        const existingError = document.querySelector('.form-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Create new error
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
        
        form.insertBefore(errorDiv, form.querySelector('.form-actions'));
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
    
    // Show success message
    function showSuccess(message) {
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
        
        form.insertBefore(successDiv, form.querySelector('.form-actions'));
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 3000);
    }
    
    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        // Get form data
        const formData = {
            name: leaderboardName.value.trim(),
            // icon: selectedIcon,
            game: gameSelection.value.trim(),
            members: Array.from(document.querySelectorAll('.member-item')).map(item => item.textContent.trim()),
            settings: {
                allowJoinWithoutInvite: document.querySelector('input[name="allow_join_without_invite"]').checked,
                requireAdminApproval: document.querySelector('input[name="require_admin_approval"]').checked,
                requireEvidence: document.querySelector('input[name="require_evidence"]').checked
            }
        };
        
        // Disable button and show loading state
        createButton.disabled = true;
        createButton.textContent = 'CREATING...';
        createButton.style.opacity = '0.7';
        
        // Simulate API call
        setTimeout(() => {
            console.log('Creating leaderboard:', formData);
            
            // Show success message
            showSuccess('Leaderboard created successfully!');
            
            // Reset form
            form.reset();
            // iconOptions.forEach(opt => opt.classList.remove('selected'));
            // selectedIcon = null;
            
            // Reset button
            createButton.disabled = false;
            createButton.textContent = 'CREATE';
            createButton.style.opacity = '1';
            
            // Redirect to leaderboard page after a short delay
            setTimeout(() => {
                window.location.href = 'leaderboard.html';
            }, 2000);
            
        }, 1500);
    });
    
    // Add member functionality
    function addMember(name) {
        const membersList = document.querySelector('.squad-members-list');
        const memberItem = document.createElement('div');
        memberItem.className = 'member-item';
        memberItem.textContent = name;
        
        // Add remove functionality
        memberItem.addEventListener('dblclick', function() {
            this.remove();
        });
        
        membersList.appendChild(memberItem);
    }
    
    // Add member input (for future enhancement)
    const addMemberInput = document.createElement('input');
    addMemberInput.type = 'text';
    addMemberInput.placeholder = 'Add new member...';
    addMemberInput.style.cssText = `
        margin-top: 0.5rem;
        padding: 0.5rem;
        border: 1px solid rgba(167, 242, 182, 0.3);
        border-radius: 6px;
        background: rgba(23, 42, 58, 0.6);
        color: #F5F1ED;
        font-size: 0.9rem;
        width: 100%;
    `;
    
    addMemberInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.trim()) {
            addMember(this.value.trim());
            this.value = '';
        }
    });
    
    // Insert add member input
    const membersList = document.querySelector('.squad-members-list');
    membersList.parentNode.insertBefore(addMemberInput, membersList.nextSibling);
    
    // Add hover effects to form elements
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
    
    // Add animation to create button
    createButton.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 8px 25px rgba(255, 91, 206, 0.3)';
    });
    
    createButton.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
    });
    
    // Add keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
            e.preventDefault();
            const nextInput = e.target.parentNode.querySelector('input, select');
            if (nextInput) {
                nextInput.focus();
            }
        }
    });
});
