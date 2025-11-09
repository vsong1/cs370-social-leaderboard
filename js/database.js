/**
 * Database.js - Supabase Database Helper Functions
 * This file provides easy-to-use functions for interacting with your Supabase database
 */

// Get the Supabase client from the auth system
function getSupabaseClient() {
    // Wait for Supabase to be initialized
    if (window._supabase) {
        return window._supabase;
    }
    
    // If not initialized yet, try to get it from the auth system
    if (window.SquadScoreAuth && window.SquadScoreAuth.getClient) {
        return window.SquadScoreAuth.getClient();
    }
    
    console.error('❌ Supabase client not available. Make sure supabase-auth.js is loaded first.');
    return null;
}

// Get the current user ID
async function getCurrentUserId() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
}

/**
 * LEADERBOARD FUNCTIONS
 */

// Get a leaderboard by ID
async function getLeaderboard(leaderboardId) {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: null, error: 'Supabase not initialized' };
    
    const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('id', leaderboardId)
        .single();
    
    return { data, error };
}

// Find a leaderboard by name (useful when you don't have the ID)
async function findLeaderboardByName(leaderboardName) {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: null, error: 'Supabase not initialized' };
    
    const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .ilike('name', `%${leaderboardName}%`)
        .limit(1)
        .single();
    
    return { data, error };
}

// Get all leaderboards for the current user (as member or admin)
async function getUserLeaderboards() {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: null, error: 'Supabase not initialized' };
    
    const userId = await getCurrentUserId();
    if (!userId) return { data: null, error: 'User not logged in' };
    
    // Get leaderboards where user is a member
    const { data: memberLeaderboards, error: memberError } = await supabase
        .from('leaderboard_membership')
        .select(`
            leaderboard_id,
            leaderboard:leaderboard_id (
                id,
                name,
                game_name,
                status,
                squad_id,
                created_at
            )
        `)
        .eq('user_id', userId);
    
    if (memberError) return { data: null, error: memberError };
    
    // Get leaderboards where user is an admin
    const { data: adminLeaderboards, error: adminError } = await supabase
        .from('leaderboard')
        .select('id, name, game_name, status, squad_id, created_at')
        .eq('admin_user_id', userId);
    
    if (adminError) return { data: null, error: adminError };
    
    // Combine and deduplicate leaderboards
    const allLeaderboards = new Map();
    
    // Add member leaderboards
    if (memberLeaderboards) {
        memberLeaderboards.forEach(item => {
            if (item.leaderboard) {
                allLeaderboards.set(item.leaderboard.id, item.leaderboard);
            }
        });
    }
    
    // Add admin leaderboards (will overwrite if duplicate, which is fine)
    if (adminLeaderboards) {
        adminLeaderboards.forEach(lb => {
            allLeaderboards.set(lb.id, lb);
        });
    }
    
    // Convert map to array
    const result = Array.from(allLeaderboards.values());
    
    return { data: result, error: null };
}

// Get member count for a leaderboard
async function getLeaderboardMemberCount(leaderboardId) {
    const supabase = getSupabaseClient();
    if (!supabase) return 0;
    
    const { count, error } = await supabase
        .from('leaderboard_membership')
        .select('*', { count: 'exact', head: true })
        .eq('leaderboard_id', leaderboardId);
    
    if (error) return 0;
    return count || 0;
}

// Get leaderboard entries (scores) for a specific leaderboard
// This uses the match_result and result_line tables to calculate scores
async function getLeaderboardEntries(leaderboardId) {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: null, error: 'Supabase not initialized' };
    
    // Get all approved match results for this leaderboard
    const { data: matchResults, error: matchError } = await supabase
        .from('match_result')
        .select(`
            id,
            status,
            result_line:result_line (
                user_id,
                score,
                outcome
            )
        `)
        .eq('leaderboard_id', leaderboardId)
        .eq('status', 'approved');
    
    if (matchError) return { data: null, error: matchError };
    
    // Calculate total scores per user
    const userScores = {};
    
    matchResults.forEach(match => {
        match.result_line.forEach(line => {
            const userId = line.user_id;
            if (!userScores[userId]) {
                userScores[userId] = { userId, totalScore: 0, wins: 0, losses: 0, draws: 0 };
            }
            
            if (line.score !== null) {
                userScores[userId].totalScore += line.score;
            }
            
            if (line.outcome === 'win') userScores[userId].wins++;
            else if (line.outcome === 'loss') userScores[userId].losses++;
            else if (line.outcome === 'draw') userScores[userId].draws++;
        });
    });
    
    // Get user details for each user
    const userIds = Object.keys(userScores);
    if (userIds.length === 0) {
        return { data: [], error: null };
    }
    
    const { data: users, error: usersError } = await supabase
        .from('user')
        .select('id, username, email')
        .in('id', userIds);
    
    if (usersError) return { data: null, error: usersError };
    
    // Combine user info with scores
    const entries = users.map(user => ({
        userId: user.id,
        name: user.username || user.email.split('@')[0],
        score: userScores[user.id]?.totalScore || 0,
        wins: userScores[user.id]?.wins || 0,
        losses: userScores[user.id]?.losses || 0,
        draws: userScores[user.id]?.draws || 0
    })).sort((a, b) => b.score - a.score);
    
    return { data: entries, error: null };
}

// Add a score entry to a leaderboard
// This creates a match_result with result_lines
async function addLeaderboardEntry(leaderboardId, playerName, score) {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: null, error: 'Supabase not initialized' };
    
    const userId = await getCurrentUserId();
    if (!userId) return { data: null, error: 'User not logged in' };
    
    // First, find the user by username or email
    const { data: users, error: userError } = await supabase
        .from('user')
        .select('id')
        .or(`username.eq.${playerName},email.ilike.%${playerName}%`)
        .limit(1);
    
    if (userError) return { data: null, error: userError };
    
    let targetUserId = userId; // Default to current user
    
    if (users && users.length > 0) {
        targetUserId = users[0].id;
    } else {
        // If user doesn't exist, we'll use the current user
        // In a real app, you might want to create the user or show an error
        console.warn(`User "${playerName}" not found, using current user`);
    }
    
    // Create a match result
    const { data: matchResult, error: matchError } = await supabase
        .from('match_result')
        .insert({
            leaderboard_id: leaderboardId,
            status: 'approved', // Auto-approve for now (you can change this to 'pending' if you want admin review)
            submitted_by: userId
        })
        .select()
        .single();
    
    if (matchError) return { data: null, error: matchError };
    
    // Create result line with the score
    const { data: resultLine, error: lineError } = await supabase
        .from('result_line')
        .insert({
            match_result_id: matchResult.id,
            user_id: targetUserId,
            score: score,
            outcome: 'win' // Default outcome, you can adjust this logic
        })
        .select()
        .single();
    
    if (lineError) {
        // Clean up the match_result if result_line creation fails
        await supabase.from('match_result').delete().eq('id', matchResult.id);
        return { data: null, error: lineError };
    }
    
    return { data: { matchResult, resultLine }, error: null };
}

// Update a player's score in a leaderboard
async function updateLeaderboardEntry(leaderboardId, playerName, newScore) {
    // For now, we'll add a new entry (since the schema tracks history)
    // In the future, you might want to update the latest entry instead
    return addLeaderboardEntry(leaderboardId, playerName, newScore);
}

/**
 * SIMPLIFIED LEADERBOARD FUNCTIONS
 * These are simpler functions that work more like the localStorage version
 * They store entries in a simpler format (for development/testing)
 */

// Simple function to get leaderboard entries as name/score pairs
async function getSimpleLeaderboardEntries(leaderboardId) {
    const { data, error } = await getLeaderboardEntries(leaderboardId);
    
    if (error) return { data: null, error };
    
    // Convert to simple format
    const simpleEntries = data.map(entry => ({
        name: entry.name,
        points: entry.score
    }));
    
    return { data: simpleEntries, error: null };
}

// Export functions to window for use in other scripts
window.Database = {
    getSupabaseClient,
    getCurrentUserId,
    getLeaderboard,
    findLeaderboardByName,
    getUserLeaderboards,
    getLeaderboardMemberCount,
    getLeaderboardEntries,
    addLeaderboardEntry,
    updateLeaderboardEntry,
    getSimpleLeaderboardEntries
};

console.log('📦 Database.js loaded');

