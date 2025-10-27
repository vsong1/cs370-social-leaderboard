# Supabase Authentication - Squad Score

## ✅ Setup Complete

### Files:
- **`supabaseClient.js`** - Supabase client with your credentials
- **`auth.js`** - Auth functions (signUp, signIn, getCurrentUser, signOut)
- **`authUI.js`** - Auto-updates greeting with username

### How to Use:

#### **Create Account:**
1. Go to `signup.html`
2. Enter username, email, password
3. Click "Register Now"
4. Account created → redirects to login

#### **Log In:**
1. Go to `login.html`  
2. Enter email, password
3. Click "Login"
4. Logged in → redirects to home

#### **Log Out:**
1. Go to Profile page
2. Click the red "Logout" button at the bottom
3. Logged out → redirects to home

### Navigation:
- **Home | Leaderboards | My Squads | Profile**
- No Sign In link needed - users click Profile to access login
- Logout button is on the Profile page only

### Greeting Updates Automatically:
- **Logged out**: "Welcome to Squad Score!"
- **Logged in**: "Hi, [username]!"

## 🚀 Run the Server:

```bash
npm run dev
```

Or use VS Code Live Server extension.

## 📊 Database Setup

Your Supabase needs a `user` table. Run this SQL in Supabase SQL Editor:

```sql
-- Create user table
CREATE TABLE public.user (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.user FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.user FOR UPDATE
    USING (auth.uid() = id);

-- Auto-create user row when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user (id, email, username)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'username');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

## ✨ Done!

Your authentication is fully integrated with Supabase!
