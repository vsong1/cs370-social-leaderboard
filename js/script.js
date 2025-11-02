// Interactive functionality for Squad Score website

// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    // Handle navigation link clicks
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Handle navigation based on link text
            const linkText = this.textContent.trim();
            handleNavigation(linkText);
        });
    });
    
    // Add smooth scrolling for better UX
    document.documentElement.style.scrollBehavior = 'smooth';
});

// Handle navigation actions
function handleNavigation(page) {
    console.log(`Navigating to: ${page}`);
    
    switch(page) {
        case 'Home':
            window.location.href = 'index.html';
            break;
        case 'Leaderboards':
            // Navigate to all leaderboards page
            window.location.href = 'all-leaderboards.html';
            break;
        case 'My Squads':
            // Navigate to squad chat hub
            window.location.href = 'chat.html';
            break;
        case 'Profile':
            window.location.href = 'profile.html';
            break;
    }
}

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

// Add some interactive effects
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effect to navigation greeting
    const greeting = document.querySelector('.nav-greeting span');
    if (greeting) {
        greeting.addEventListener('mouseenter', function() {
            this.style.color = '#68D391';
            this.style.transition = 'color 0.3s ease';
        });
        
        greeting.addEventListener('mouseleave', function() {
            this.style.color = 'var(--text-primary)';
        });
    }
    
    // Add typing effect to welcome text (optional enhancement)
    const welcomeText = document.querySelector('.welcome-text');
    if (welcomeText) {
        const originalText = welcomeText.textContent;
        welcomeText.textContent = '';
        
        let i = 0;
        const typeWriter = () => {
            if (i < originalText.length) {
                welcomeText.textContent += originalText.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            }
        };
        
        // Start typing effect after a short delay
        setTimeout(typeWriter, 500);
    }
});

// Add keyboard navigation support
document.addEventListener('keydown', function(e) {
    // Handle Enter key on focused elements
    if (e.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement.classList.contains('nav-link')) {
            activeElement.click();
        } else if (activeElement.classList.contains('cta-button')) {
            viewLeaderboards();
        }
    }
    
    // Handle Escape key to reset navigation
    if (e.key === 'Escape') {
        const homeLink = document.querySelector('.nav-link[href="index.html"]');
        if (homeLink && !homeLink.classList.contains('active')) {
            homeLink.click();
        }
    }
});

// Add intersection observer for scroll effects (future enhancement)
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements when they're added to the DOM
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.welcome-section');
    animatedElements.forEach(el => {
        observer.observe(el);
    });
});

// Profile edit functionality
// Profile edit functionality
(function initProfileEditor() {
    const container = document.querySelector('.profile-container');
    if (!container) {
        return;
    }

    const editButton = container.querySelector('[data-profile-action="edit"]');
    const actionsBar = container.querySelector('[data-profile-actions]');
    const form = container.querySelector('#profile-form');
    const displayName = container.querySelector('[data-profile-field="fullName"]');
    const displayTagline = container.querySelector('[data-profile-field="tagline"]');
    const fieldContainers = Array.from(container.querySelectorAll('[data-profile-field-container]'));
    const greeting = document.querySelector('.nav-greeting span');

    const originalValues = new Map();
    const PASSWORD_MASK = '??????????';

    const setEditingState = (isEditing) => {
        container.classList.toggle('is-editing', isEditing);
        if (actionsBar) {
            actionsBar.hidden = !isEditing;
        }

        if (isEditing) {
            fieldContainers.forEach(container => {
                const input = container.querySelector('.profile-field-input');
                const display = container.querySelector('[data-profile-display]');
                if (!input) {
                    return;
                }
                originalValues.set(input.name, input.value);
                if (display && input.id !== 'profile-password') {
                    input.value = display.textContent.trim();
                }
            });
            const firstInput = form ? form.querySelector('.profile-field-input') : null;
            if (firstInput) {
                firstInput.focus();
                firstInput.select();
            }
        } else {
            fieldContainers.forEach(container => {
                const input = container.querySelector('.profile-field-input');
                if (!input) {
                    return;
                }
                if (originalValues.has(input.name)) {
                    input.value = originalValues.get(input.name);
                }
            });
            originalValues.clear();
        }
    };

    const refreshDisplays = () => {
        fieldContainers.forEach(container => {
            const input = container.querySelector('.profile-field-input');
            const display = container.querySelector('[data-profile-display]');
            if (!input || !display) {
                return;
            }

            const value = input.value.trim();
            if (input.id === 'profile-password') {
                display.textContent = value ? PASSWORD_MASK : '--';
            } else {
                display.textContent = value || '--';
            }
        });

        const firstInput = form ? form.querySelector('#profile-first-name') : null;
        const lastInput = form ? form.querySelector('#profile-last-name') : null;
        const firstValue = firstInput ? firstInput.value.trim() : '';
        const lastValue = lastInput ? lastInput.value.trim() : '';

        if (displayName) {
            const fullName = [firstValue, lastValue].filter(Boolean).join(' ').trim();
            displayName.textContent = fullName || 'Unnamed Player';
        }

        if (greeting) {
            greeting.textContent = firstValue ? `Ready to compete, ${firstValue}!` : 'Ready to compete!';
        }

        if (displayTagline) {
            const squad = 'Firepit Friends';
            displayTagline.textContent = `Captain - ${squad} - Joined March 2024`;
        }
    };

    if (actionsBar) {
        actionsBar.hidden = true;
    }

    if (editButton) {
        editButton.addEventListener('click', () => {
            refreshDisplays();
            setEditingState(true);
        });
    }

    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            refreshDisplays();
            fieldContainers.forEach(container => {
                const input = container.querySelector('.profile-field-input');
                if (!input) {
                    return;
                }
                originalValues.set(input.name, input.value);
            });
            setEditingState(false);
        });
    }

    const cancelButton = container.querySelector('[data-profile-action="cancel"]');
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            setEditingState(false);
            refreshDisplays();
        });
    }

    refreshDisplays();
})();

// Search functionality for leaderboard
function initializeLeaderboardSearch() {
    const searchInput = document.getElementById('leaderboard-search');
    const leaderboardsList = document.getElementById('leaderboards-list');
    
    if (!searchInput || !leaderboardsList) {
        console.log('Leaderboard search elements not found');
        return;
    }
    
    // Add event listener for search input
    searchInput.addEventListener('input', function() {
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
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            this.value = '';
            this.dispatchEvent(new Event('input'));
            this.blur();
        }
    });
    // Mobile-friendly: Add touch events for better mobile experience
    searchInput.addEventListener('touchstart', function() {
        this.focus();
    });
    
    // Prevent zoom on double-tap for mobile
    searchInput.addEventListener('touchend', function(e) {
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

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the all-leaderboards page
    if (document.getElementById('leaderboard-search')) {
        initializeLeaderboardSearch();
    }
});

(function initAddScorePanel() {
    const trigger = document.querySelector('[data-add-score-trigger]');
    const panel = document.querySelector('[data-add-score-panel]');
    const form = document.getElementById('leaderboard-add-score-form');
    const cancel = document.querySelector('[data-add-score-cancel]');
    const errorField = document.querySelector('[data-add-score-error]');
    const list = document.querySelector('.leaderboard-list');
    const userPalette = ['user-style-green', 'user-style-orange', 'user-style-purple', 'user-style-azure', 'user-style-navy'];



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

            const match = pointsEl?.textContent.match(/(-?\d+)/);
            const score = match ? Number(match[1]) : 0;

            return { element: entry, score, rankEl, pointsEl };
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
            pointsEl: entry.querySelector('.points')
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

    let currentRank = 0;
    let lastScore = null;
    const fragment = document.createDocumentFragment();

    sorted.forEach((entryObj, index) => {
        if (entryObj.score !== lastScore) {
            currentRank = index + 1;
            lastScore = entryObj.score;
        }
    
        entryObj.rankEl.textContent = `#${currentRank}`;
        entryObj.pointsEl.textContent = `${entryObj.score} points`;
    
        if (entryObj.element.dataset.userPalette) {
            entryObj.element.classList.remove('user-style-green', 'user-style-orange', 'user-style-purple', 'user-style-azure', 'user-style-navy');
            entryObj.element.classList.add(entryObj.element.dataset.userPalette);
        }
    
        fragment.appendChild(entryObj.element);
    });
    
    

    listElement.innerHTML = '';
    listElement.appendChild(fragment);
};


    form.addEventListener('submit', (event) => {
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
   
        const existingEntries = collectLeaderboardEntries(list);

        const newEntry = buildLeaderboardEntry({
            name,
            score,
            isNew: true
        });

        existingEntries.push(newEntry);

        rebuildLeaderboard(list, existingEntries);

        togglePanel(false);
    });

    

})();



