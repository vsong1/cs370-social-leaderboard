# Auth0 Setup Guide for Squad Score

## Prerequisites
1. Create a free Auth0 account at [auth0.com](https://auth0.com)
2. Complete the account setup process

## Step 1: Create Auth0 Application

1. **Log into your Auth0 Dashboard**
2. **Navigate to Applications** → **Applications**
3. **Click "Create Application"**
4. **Configure the application:**
   - **Name**: `Squad Score Website`
   - **Application Type**: Select **"Single Page Application"**
   - **Click "Create"**

## Step 2: Configure Application Settings

1. **Go to your application's Settings tab**
2. **Update the following URLs:**
   - **Allowed Callback URLs**: `http://localhost:3000`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`
3. **Click "Save Changes"**

## Step 3: Get Your Credentials

1. **Copy the following values from your application settings:**
   - **Domain** (e.g., `your-tenant.auth0.com`)
   - **Client ID** (e.g., `abc123def456ghi789`)

## Step 4: Update Configuration

1. **Open `auth-config.js` in your project**
2. **Replace the placeholder values:**
   ```javascript
   const auth0Config = {
       domain: 'YOUR_AUTH0_DOMAIN', // Replace with your actual domain
       clientId: 'YOUR_AUTH0_CLIENT_ID', // Replace with your actual client ID
       authorizationParams: {
           redirect_uri: window.location.origin,
           audience: 'YOUR_API_IDENTIFIER', // Optional: leave as is for now
           scope: 'openid profile email'
       }
   };
   ```

## Step 5: Install Dependencies

Run the following command in your project directory:
```bash
npm install
```

## Step 6: Test the Integration

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to `http://localhost:3000`**

3. **Click "My Profile" in the navigation** → This should redirect to the login page

4. **Click "Login"** → This should redirect to Auth0's login page

5. **Create an account or sign in** → You should be redirected back to your app

## Features Implemented

✅ **Login with Auth0** - Users can sign in using Auth0's hosted login page
✅ **Signup with Auth0** - New users can create accounts through Auth0
✅ **Logout functionality** - Users can sign out securely
✅ **Authentication state management** - App remembers if user is logged in
✅ **Protected navigation** - Profile link shows different content based on auth state
✅ **User information display** - Shows user's name in navigation when logged in

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI" error:**
   - Make sure `http://localhost:3000` is added to Allowed Callback URLs in Auth0 dashboard

2. **"Invalid client" error:**
   - Verify your Client ID is correct in `auth-config.js`

3. **CORS errors:**
   - Make sure `http://localhost:3000` is added to Allowed Web Origins

4. **Module import errors:**
   - Make sure you've run `npm install` to install the Auth0 SDK

### Getting Help:
- Check the browser console for error messages
- Verify your Auth0 application settings match the configuration
- Ensure your development server is running on port 3000

## Next Steps

Once basic authentication is working, you can:
- Add user profile pages
- Implement role-based access control
- Add social login providers (Google, Facebook, etc.)
- Create protected API endpoints
- Add user preferences and settings

