/**
 * Squad Score - Complete Supabase Authentication System
 * Self-contained, works in browser without build tools
 */

const SUPABASE_URL = 'https://iwxlemgotkpesbkzhuve.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3eGxlbWdvdGtwZXNia3podXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzAxMDcsImV4cCI6MjA3NTAwNjEwN30.KqjRR6fTtrHxTvwpCvRfOBziG99X1AZUNTTlElJEXpg';

// Global state
let supabase = null;
let currentUser = null;
let isInitialized = false;

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
        updatePageUI();
    });
    
    isInitialized = true;
    updatePageUI();
}

// Update UI based on auth state
function updatePageUI() {
    const greeting = document.querySelector('.nav-greeting span');
    
    if (currentUser) {
        // User is logged in
        const username = currentUser.user_metadata?.username || 
                        currentUser.email?.split('@')[0] || 
                        'User';
        
        if (greeting) {
            greeting.textContent = `Hi, ${username}!`;
        }
        
        console.log('✅ UI updated for logged in user:', username);
    } else {
        // User is logged out
        if (greeting) {
            greeting.textContent = 'Welcome to Squad Score!';
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
        currentUser = user;
        return user;
    },
    
    // Check if logged in
    isLoggedIn() {
        return !!currentUser;
    },
    
    // Get supabase client for queries
    getClient() {
        return supabase;
    }
};

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

console.log('📦 Squad Score Auth loaded');


