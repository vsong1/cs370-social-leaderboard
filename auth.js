// Auth0 Authentication Module (browser, using CDN global)

class AuthService {
    constructor() {
        this.auth0Client = null;
        this.isAuthenticated = false;
        this.user = null;
        this.init();
    }

    async init() {
        try {
            if (!window.auth0 || !window.auth0.createAuth0Client) {
                throw new Error('Auth0 SDK not loaded. Ensure the CDN script is included before auth.js');
            }
            this.auth0Client = await window.auth0.createAuth0Client({
                domain: window.auth0Config.domain,
                clientId: window.auth0Config.clientId,
                authorizationParams: window.auth0Config.authorizationParams
            });

            // Check if user is returning from Auth0
            if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
                await this.auth0Client.handleRedirectCallback();
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            // Check authentication status
            this.isAuthenticated = await this.auth0Client.isAuthenticated();
            if (this.isAuthenticated) {
                this.user = await this.auth0Client.getUser();
                this.updateUI();
            }

        } catch (error) {
            console.error('Auth0 initialization error:', error);
        }
    }

    async login() {
        try {
            await this.auth0Client.loginWithRedirect();
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    }

    async logout() {
        try {
            await this.auth0Client.logout({
                logoutParams: {
                    returnTo: window.location.origin
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    async signup() {
        try {
            await this.auth0Client.loginWithRedirect({
                authorizationParams: {
                    screen_hint: 'signup'
                }
            });
        } catch (error) {
            console.error('Signup error:', error);
            alert('Signup failed. Please try again.');
        }
    }

    updateUI() {
        const loginButton = document.querySelector('.login-button');
        const signupButton = document.querySelector('.signup-button');
        const navGreeting = document.querySelector('.nav-greeting span');
        const profileLink = document.querySelector('.nav-link[href="login.html"]');

        if (this.isAuthenticated && this.user) {
            // User is logged in
            if (loginButton) {
                loginButton.textContent = 'Logout';
                loginButton.onclick = () => this.logout();
            }
            
            if (signupButton) {
                signupButton.style.display = 'none';
            }

            if (navGreeting) {
                navGreeting.textContent = `Welcome back, ${this.user.name || this.user.email}!`;
            }

            if (profileLink) {
                profileLink.textContent = 'My Profile';
                profileLink.href = '#';
            }

            // Store user info in localStorage for other pages
            localStorage.setItem('user', JSON.stringify(this.user));
            localStorage.setItem('isAuthenticated', 'true');

        } else {
            // User is not logged in
            if (loginButton) {
                loginButton.textContent = 'Login >';
                loginButton.onclick = () => this.login();
            }

            if (signupButton) {
                signupButton.style.display = 'block';
                signupButton.onclick = () => this.signup();
            }

            if (navGreeting) {
                navGreeting.textContent = 'Welcome to Squad Score!';
            }

            if (profileLink) {
                profileLink.textContent = 'Sign In';
                profileLink.href = 'login.html';
            }

            // Clear stored user info
            localStorage.removeItem('user');
            localStorage.removeItem('isAuthenticated');
        }
    }

    getUser() {
        return this.user;
    }

    getIsAuthenticated() {
        return this.isAuthenticated;
    }
}

// Initialize AuthService when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authService = new AuthService();
});

// Export for use in other files
window.AuthService = AuthService;

