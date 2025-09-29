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
            // Future: Navigate to leaderboards page
            alert('Leaderboards page coming soon!');
            break;
        case 'My Squads':
            // Navigate to chat page for squads
            window.location.href = 'chat.html';
            break;
        case 'My Profile':
            // Navigate to login page
            window.location.href = 'login.html';
            break;
    }
}

// CTA Button functionality
function viewLeaderboards() {
    console.log('View Leaderboards clicked');
    
    // Add click animation
    const button = document.querySelector('.cta-button');
    button.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        button.style.transform = '';
        // Future: Navigate to leaderboards or show modal
        alert('Leaderboards feature coming soon! 🏆');
    }, 150);
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
            this.style.color = '#ffffff';
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
        const homeLink = document.querySelector('.nav-link[href="#"]');
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
