// Auth0 Configuration
// Replace these values with your actual Auth0 application settings

const auth0Config = {
    domain: 'dev-3i1161emszpkllba.us.auth0.com', // e.g., 'your-tenant.auth0.com'
    clientId: 'aeIZe7RJqC1SnbjwlLQ3wXUDEGZ28qUo', // Your Auth0 application client ID
    authorizationParams: {
        redirect_uri: window.location.origin,
        // audience is optional; leave undefined unless you configured an API in Auth0
        scope: 'openid profile email'
    }
};

// Export for use in other files
window.auth0Config = auth0Config;
