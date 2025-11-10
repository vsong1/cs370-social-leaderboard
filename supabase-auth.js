/**
 * Squad Score - Complete Supabase Authentication System
 * Self-contained, works in browser without build tools
 */

const SUPABASE_URL = 'https://iwxlemgotkpesbkzhuve.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3eGxlbWdvdGtwZXNia3podXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzAxMDcsImV4cCI6MjA3NTAwNjEwN30.KqjRR6fTtrHxTvwpCvRfOBziG99X1AZUNTTlElJEXpg';

// Global state
let supabase = null;
let currentUser = null;
let currentProfile = null;
let profileFetchPromise = null;
let isInitialized = false;

function clearProfileCache() {
    currentProfile = null;
    profileFetchPromise = null;
}

async function fetchUserProfile() {
    if (!supabase || !currentUser) {
        return null;
    }

    if (currentProfile && currentProfile.id === currentUser.id) {
        return currentProfile;
    }

    if (profileFetchPromise) {
        return profileFetchPromise;
    }

    profileFetchPromise = supabase
        .from('user')
        .select('id, first_name, last_name, username, email')
        .eq('id', currentUser.id)
        .single()
        .then(({ data, error }) => {
            profileFetchPromise = null;
            if (error) {
                console.warn('⚠️ Unable to fetch user profile for greeting:', error.message);
                return null;
            }
            currentProfile = data;
            return data;
        })
        .catch((error) => {
            profileFetchPromise = null;
            console.error('❌ Unexpected profile fetch error:', error);
            return null;
        });

    return profileFetchPromise;
}

// Initialize Supabase client
async function init() {
    if (isInitialized) return;
    
    // Wait for Supabase CDN to load
    let attempts = 0;
    while (!window.supabase && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.supabase) {
        console.error('❌ Supabase CDN failed to load');
        return;
    }
    
    // Create client
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window._supabase = supabase; // Make globally accessible
    
    // Check current session
    const { data: { session } } = await supabase.auth.getSession();
    currentUser = session?.user || null;
    
    console.log('✅ Supabase initialized. User:', currentUser ? currentUser.email : 'Not logged in');
    
    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔄 Auth event:', event);
        currentUser = session?.user || null;
        clearProfileCache();
        updatePageUI();
    });
    
    isInitialized = true;
    updatePageUI();
}

// Update UI based on auth state
async function updatePageUI() {
    const greeting = document.querySelector('.nav-greeting span');
    const navLinks = document.querySelector('.nav-links');
    const navAnchors = navLinks ? Array.from(navLinks.querySelectorAll('a')) : [];
    const homeLinks = navAnchors.filter(link => link.getAttribute('href') === 'index.html');
    const hamburger = document.querySelector('.hamburger');
    const body = document.body;

    if (!body) {
        return;
    }
    if (currentUser) {
        // User is logged in
        const profile = await fetchUserProfile();

        const firstName = profile?.first_name?.trim() ||
                          currentUser.user_metadata?.first_name?.trim();

        const greetingName = firstName ||
                             currentUser.user_metadata?.username ||
                             profile?.username ||
                             currentUser.email?.split('@')[0] ||
                             'Player';

        body.setAttribute('data-auth-state', 'signed-in');
        
        if (greeting) {
            greeting.textContent = `Ready to compete, ${greetingName}!`;
        }
        if (navLinks) {
            navLinks.setAttribute('aria-hidden', 'false');
        }

        navAnchors.forEach(link => {
            link.setAttribute('aria-hidden', 'false');
            link.removeAttribute('tabindex');
        });

        homeLinks.forEach(link => {
            link.setAttribute('aria-hidden', 'true');
            link.setAttribute('tabindex', '-1');
        });

        if (hamburger) {
            hamburger.disabled = false;
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-hidden', 'false');
            hamburger.setAttribute('aria-expanded', 'false');
        }
        
        console.log('✅ UI updated for logged in user:', greetingName);
    } else {
        // User is logged out
        body.removeAttribute('data-auth-state');
        if (greeting) {
            greeting.textContent = 'Welcome to Squad Score!';
        }

        if (navLinks) {
            navLinks.classList.remove('active');
            navLinks.setAttribute('aria-hidden', 'true');
        }

        navAnchors.forEach(link => {
            link.setAttribute('aria-hidden', 'true');
            link.setAttribute('tabindex', '-1');
        });

        if (hamburger) {
            hamburger.classList.remove('active');
            hamburger.disabled = true;
            hamburger.setAttribute('aria-hidden', 'true');
            hamburger.setAttribute('aria-expanded', 'false');
        }
        
        console.log('ℹ️ UI updated for logged out state');
    }
}

// Auth API
window.SquadScoreAuth = {
    // Sign up
    async signUp(email, password, username) {
        if (!supabase) await init();
        
        console.log('📝 Signing up:', email, 'Username:', username);
        
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username }
            }
        });
        
        if (error) {
            console.error('❌ Signup error:', error.message);
        } else {
            console.log('✅ Signup successful!');
        }
        
        return { data, error };
    },
    
    // Sign in
    async signIn(email, password) {
        if (!supabase) await init();
        
        console.log('🔐 Signing in:', email);
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            console.error('❌ Sign in error:', error.message);
        } else {
            console.log('✅ Sign in successful!');
            currentUser = data.user;
            clearProfileCache();
            updatePageUI();
        }
        
        return { data, error };
    },
    
    // Sign out
    async signOut() {
        if (!supabase) await init();
        
        console.log('👋 Signing out...');
        
        const { error } = await supabase.auth.signOut();
        
        // Force clear everything
        localStorage.clear();
        sessionStorage.clear();
        currentUser = null;
        clearProfileCache();
        
        if (error) {
            console.error('❌ Sign out error:', error.message);
        } else {
            console.log('✅ Sign out successful!');
        }
        
        updatePageUI();
        return { error };
    },
    
    // Get current user
    async getUser() {
        if (!supabase) await init();
        
        const { data: { user } } = await supabase.auth.getUser();
        const previousProfileId = currentProfile?.id;
        currentUser = user;

        if (!user) {
            clearProfileCache();
        } else if (previousProfileId && previousProfileId !== user.id) {
            clearProfileCache();
        }

        return user;
    },
    
    // Check if logged in
    isLoggedIn() {
        return !!currentUser;
    },
    
    // Get supabase client for queries
    getClient() {
        return supabase;
    },

    // Allow other scripts to refresh or clear the cached profile
    invalidateProfileCache() {
        clearProfileCache();
    },

    async getCachedProfile() {
        if (!supabase) await init();
        return fetchUserProfile();
    }
};

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

console.log('📦 Squad Score Auth loaded');


