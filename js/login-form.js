// Login form functionality with Auth0
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('.login-form');
    const loginButton = document.querySelector('.login-button');
    const signupButton = document.querySelector('.signup-button');
    
    // Wait for Auth0 to initialize
    setTimeout(() => {
        if (window.authService) {
            // Check if user is already authenticated
            if (window.authService.getIsAuthenticated()) {
                // Redirect to home page if already logged in
                window.location.href = 'index.html';
                return;
            }
            
            // Set up Auth0 login button
            loginButton.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Add click animation
                loginButton.style.transform = 'scale(0.95)';
                
                setTimeout(() => {
                    loginButton.style.transform = '';
                    window.authService.login();
                }, 150);
            });
            
            // Set up Auth0 signup button
            signupButton.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Add click animation
                signupButton.style.transform = 'scale(0.95)';
                
                setTimeout(() => {
                    signupButton.style.transform = '';
                    window.authService.signup();
                }, 150);
            });
        }
    }, 1000);
    
    // Add hover effects
    loginButton.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 0 20px rgba(167, 242, 182, 0.4)';
    });
    
    loginButton.addEventListener('mouseleave', function() {
        this.style.transform = '';
        this.style.boxShadow = '';
    });
    
    signupButton.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 0 20px rgba(251, 139, 36, 0.4)';
    });
    
    signupButton.addEventListener('mouseleave', function() {
        this.style.transform = '';
        this.style.boxShadow = '';
    });
});