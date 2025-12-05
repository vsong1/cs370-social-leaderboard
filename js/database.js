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
 * INVITE CODE HELPERS
 */
const INVITE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const INVITE_CODE_LENGTH = 12;
const INVITE_CODE_GROUP = 4;
const INVITE_CODE_ATTEMPTS = 12;

function buildInviteCodeString() {
    let raw = '';
    for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
        const index = Math.floor(Math.random() * INVITE_CODE_ALPHABET.length);
        raw += INVITE_CODE_ALPHABET[index];
    }
    return raw.match(new RegExp(`.{1,${INVITE_CODE_GROUP}}`, 'g')).join('-');
}

async function getUniqueInviteCode(supabase) {
    for (let attempt = 0; attempt < INVITE_CODE_ATTEMPTS; attempt++) {
        const candidate = buildInviteCodeString();
        const { data, error } = await supabase
            .from('squad')
            .select('id')
            .eq('invite_code', candidate)
            .limit(1);

        if (error) {
            console.error('❌ Error checking invite code uniqueness:', error);
            break;
        }

        if (!data || data.length === 0) {
            return candidate;
        }
    }

    throw new Error('Failed to generate unique invite code. Please try again.');
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

const LEADERBOARD_EVIDENCE_BUCKET = 'leaderboard-evidence';
let leaderboardEvidenceBucketReady = false;

async function ensureLeaderboardEvidenceBucket() {
    if (leaderboardEvidenceBucketReady) {
        return { success: true };
    }
    
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: { message: 'Supabase not initialized' } };
    
    // Try listing a file to confirm bucket exists
    const { error: listError } = await supabase.storage
        .from(LEADERBOARD_EVIDENCE_BUCKET)
        .list('', { limit: 1 });
    
    if (!listError) {
        leaderboardEvidenceBucketReady = true;
        return { success: true };
    }
    
    // Check if bucket doesn't exist
    const errorMessage = listError?.message?.toLowerCase() || '';
    if (errorMessage.includes('bucket not found') || errorMessage.includes('not found')) {
        // Try to create the bucket (this may fail due to permissions)
        const { error: createError } = await supabase.storage.createBucket(LEADERBOARD_EVIDENCE_BUCKET, {
            public: true,
            fileSizeLimit: 5 * 1024 * 1024
        });
        
        if (createError) {
            // If creation fails, provide helpful instructions
            const createErrorMessage = createError?.message?.toLowerCase() || '';
            let friendlyMessage = 'Storage bucket "leaderboard-evidence" not found. ';
            
            if (createErrorMessage.includes('permission') || createErrorMessage.includes('unauthorized') || createErrorMessage.includes('forbidden')) {
                friendlyMessage += 'You need to create it manually in the Supabase Dashboard: ';
                friendlyMessage += 'Go to Storage → Create Bucket → Name it "leaderboard-evidence" → Set it to Public.';
            } else {
                friendlyMessage += 'Please create the "leaderboard-evidence" bucket in Supabase Storage (Storage → Create Bucket).';
            }
            
            return { 
                success: false, 
                error: { 
                    message: friendlyMessage,
                    originalError: createError
                } 
            };
        }
        
        leaderboardEvidenceBucketReady = true;
        return { success: true };
    }
    
    // For other errors, return them as-is
    return { 
        success: false, 
        error: listError || { message: 'Unknown error checking storage bucket' } 
    };
}

async function uploadLeaderboardEvidence(leaderboardId, matchResultId, file) {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: null, error: 'Supabase not initialized' };
    if (!file) return { data: null, error: null };
    
    const ensured = await ensureLeaderboardEvidenceBucket();
    if (!ensured.success) {
        return { data: null, error: ensured.error || { message: 'Evidence storage bucket not available.' } };
    }
    
    if (!file.type?.startsWith('image/')) {
        return { data: null, error: { message: 'Evidence must be an image file.' } };
    }
    
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit
    if (file.size > MAX_SIZE_BYTES) {
        return { data: null, error: { message: 'Evidence image must be 5MB or smaller.' } };
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
    const uniqueSuffix = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `leaderboard-${leaderboardId}/match-${matchResultId || 'pending'}-${uniqueSuffix}.${extension}`;
    
    const { data, error } = await supabase.storage
        .from(LEADERBOARD_EVIDENCE_BUCKET)
        .upload(path, file, {
            cacheControl: '3600',
            contentType: file.type || 'image/png',
            upsert: false
        });
    
    if (error) {
        return { data: null, error };
    }
    
    const { data: publicData, error: publicError } = supabase
        .storage
        .from(LEADERBOARD_EVIDENCE_BUCKET)
        .getPublicUrl(path);
    
    if (publicError) {
        return { data: { path, publicUrl: null }, error: publicError };
    }
    
    return {
        data: {
            path,
            publicUrl: publicData?.publicUrl || null
        },
        error: null
    };
}

// Add a score entry to a leaderboard
// This creates a match_result with result_lines
async function addLeaderboardEntry(leaderboardId, playerName, score, evidenceFile = null) {
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
    const { data: initialMatchResult, error: matchError } = await supabase
        .from('match_result')
        .insert({
            leaderboard_id: leaderboardId,
            status: 'approved', // Auto-approve for now (you can change this to 'pending' if you want admin review)
            submitted_by: userId
        })
        .select()
        .single();
    
    if (matchError) return { data: null, error: matchError };
    
    let matchResult = initialMatchResult;
    let uploadedEvidence = null;
    
    if (evidenceFile) {
        const uploadResult = await uploadLeaderboardEvidence(leaderboardId, matchResult.id, evidenceFile);
        if (uploadResult?.error) {
            await supabase.from('match_result').delete().eq('id', matchResult.id);
            return { data: null, error: uploadResult.error };
        }
        
        uploadedEvidence = uploadResult?.data;
        
        if (uploadedEvidence?.publicUrl) {
            const { data: updatedMatch, error: updateError } = await supabase
                .from('match_result')
                .update({ evidence_url: uploadedEvidence.publicUrl })
                .eq('id', matchResult.id)
                .select()
                .single();
            
            if (updateError) {
                if (uploadedEvidence?.path) {
                    await supabase.storage.from(LEADERBOARD_EVIDENCE_BUCKET).remove([uploadedEvidence.path]);
                }
                await supabase.from('match_result').delete().eq('id', matchResult.id);
                return { data: null, error: updateError };
            }
            
            matchResult = updatedMatch;
        }
    }
    
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
        if (uploadedEvidence?.path) {
            await supabase.storage.from(LEADERBOARD_EVIDENCE_BUCKET).remove([uploadedEvidence.path]);
        }
        return { data: null, error: lineError };
    }
    
    return { data: { matchResult, resultLine, evidence: uploadedEvidence }, error: null };
}

// Update a player's score in a leaderboard
async function updateLeaderboardEntry(leaderboardId, playerName, newScore, evidenceFile = null) {
    // For now, we'll add a new entry (since the schema tracks history)
    // In the future, you might want to update the latest entry instead
    return addLeaderboardEntry(leaderboardId, playerName, newScore, evidenceFile);
}

// Get leaderboard members
async function getLeaderboardMembers(leaderboardId) {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: null, error: 'Supabase not initialized' };
    
    const { data, error } = await supabase
        .from('leaderboard_membership')
        .select('user_id')
        .eq('leaderboard_id', leaderboardId);
    
    return { data, error };
}

// Add members to a leaderboard
async function addMembersToLeaderboard(leaderboardId, userIds) {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: null, error: 'Supabase not initialized' };
    
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) return { data: null, error: 'User not logged in' };
    
    // Verify user is the admin of the leaderboard
    const { data: leaderboard, error: fetchError } = await supabase
        .from('leaderboard')
        .select('admin_user_id')
        .eq('id', leaderboardId)
        .single();
    
    if (fetchError) return { data: null, error: fetchError };
    if (!leaderboard) return { data: null, error: 'Leaderboard not found' };
    
    if (leaderboard.admin_user_id !== currentUserId) {
        return { data: null, error: 'Only the leaderboard admin can add members' };
    }
    
    // Check which users are already members
    const { data: existingMembers, error: existingError } = await supabase
        .from('leaderboard_membership')
        .select('user_id')
        .eq('leaderboard_id', leaderboardId)
        .in('user_id', userIds);
    
    if (existingError) return { data: null, error: existingError };
    
    const existingUserIds = new Set((existingMembers || []).map(m => m.user_id));
    const newUserIds = userIds.filter(id => !existingUserIds.has(id));
    
    if (newUserIds.length === 0) {
        return { data: { added: 0, skipped: userIds.length }, error: null };
    }
    
    // Insert new memberships
    const memberships = newUserIds.map(userId => ({
        leaderboard_id: leaderboardId,
        user_id: userId
    }));
    
    const { data: inserted, error: insertError } = await supabase
        .from('leaderboard_membership')
        .insert(memberships)
        .select();
    
    if (insertError) return { data: null, error: insertError };
    
    return { 
        data: { 
            added: inserted?.length || 0, 
            skipped: userIds.length - (inserted?.length || 0) 
        }, 
        error: null 
    };
}

// Remove a user from a leaderboard and delete all their scores
async function removeUserFromLeaderboard(leaderboardId, userId) {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: null, error: 'Supabase not initialized' };
    
    try {
        // Get all match results for this leaderboard
        const { data: matchResults, error: matchError } = await supabase
            .from('match_result')
            .select('id')
            .eq('leaderboard_id', leaderboardId);
        
        if (matchError) {
            console.error('Error fetching match results:', matchError);
            // Continue anyway
        } else if (matchResults && matchResults.length > 0) {
            const matchResultIds = matchResults.map(mr => mr.id);
            
            // Delete all result_lines for this user in these match results
            const { error: deleteLinesError } = await supabase
                .from('result_line')
                .delete()
                .eq('user_id', userId)
                .in('match_result_id', matchResultIds);
            
            if (deleteLinesError) {
                console.error('Error deleting result lines:', deleteLinesError);
                // Continue anyway
            }
            
            // Delete match_results that have no result_lines left
            for (const matchResultId of matchResultIds) {
                const { data: remainingLines } = await supabase
                    .from('result_line')
                    .select('id')
                    .eq('match_result_id', matchResultId)
                    .limit(1);
                
                if (!remainingLines || remainingLines.length === 0) {
                    // No result lines left, delete the match_result
                    await supabase
                        .from('match_result')
                        .delete()
                        .eq('id', matchResultId);
                }
            }
        }
        
        // Remove user from leaderboard membership
        const { error: removeMembershipError } = await supabase
            .from('leaderboard_membership')
            .delete()
            .eq('leaderboard_id', leaderboardId)
            .eq('user_id', userId);
        
        if (removeMembershipError) {
            return { data: null, error: removeMembershipError };
        }
        
        return { data: { success: true }, error: null };
    } catch (error) {
        console.error('Error removing user from leaderboard:', error);
        return { data: null, error };
    }
}

// Delete a leaderboard
async function deleteLeaderboard(leaderboardId) {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: null, error: 'Supabase not initialized' };
    
    const userId = await getCurrentUserId();
    if (!userId) return { data: null, error: 'User not logged in' };
    
    // First, verify the leaderboard exists and user has permission (must be admin)
    const { data: leaderboard, error: fetchError } = await supabase
        .from('leaderboard')
        .select('admin_user_id')
        .eq('id', leaderboardId)
        .single();
    
    if (fetchError) return { data: null, error: fetchError };
    if (!leaderboard) return { data: null, error: 'Leaderboard not found' };
    
    // Check if user is the admin
    if (leaderboard.admin_user_id !== userId) {
        return { data: null, error: 'Only the leaderboard admin can delete this leaderboard' };
    }
    
    // Delete the leaderboard (cascade should handle related records)
    const { error: deleteError } = await supabase
        .from('leaderboard')
        .delete()
        .eq('id', leaderboardId);
    
    if (deleteError) return { data: null, error: deleteError };
    
    return { data: { success: true }, error: null };
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

/**
 * SQUAD FUNCTIONS
 */

// Get all squads the current user is a member of
async function getUserSquads() {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: null, error: 'Supabase not initialized' };
    
    const userId = await getCurrentUserId();
    if (!userId) return { data: null, error: 'User not logged in' };
    
    // Get all squad memberships for the user
    const { data: memberships, error: membershipError } = await supabase
        .from('squad_membership')
        .select(`
            *,
            squad:squad_id (
                id,
                name,
                description,
                game_title,
                skill_tier,
                invite_code,
                visibility,
                created_at,
                created_by
            )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    
    if (membershipError) return { data: null, error: membershipError };
    
    // Format response
    const squads = memberships.map(m => ({
        ...m.squad,
        membershipRole: m.role,
        joinedAt: m.created_at
    }));
    
    return { data: squads, error: null };
}

// Get member count for a squad
async function getSquadMemberCount(squadId) {
    const supabase = getSupabaseClient();
    if (!supabase) return 0;
    
    const { count, error } = await supabase
        .from('squad_membership')
        .select('*', { count: 'exact', head: true })
        .eq('squad_id', squadId);
    
    if (error) return 0;
    return count || 0;
}

// Get all members of a squad
async function getSquadMembers(squadId) {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: null, error: 'Supabase not initialized' };
    
    const userId = await getCurrentUserId();
    if (!userId) return { data: null, error: 'User not logged in' };
    
    // Verify user is a member of the squad
    const { data: userMembership, error: checkError } = await supabase
        .from('squad_membership')
        .select('id')
        .eq('squad_id', squadId)
        .eq('user_id', userId)
        .single();
    
    if (checkError || !userMembership) {
        return { data: null, error: 'You are not a member of this squad' };
    }
    
    // Get all members
    const { data: memberships, error: membersError } = await supabase
        .from('squad_membership')
        .select(`
            *,
            user:user_id (
                id,
                username,
                email,
                first_name,
                last_name
            )
        `)
        .eq('squad_id', squadId);
    
    if (membersError) return { data: null, error: membersError };
    
    // Format response
    const members = memberships.map(m => ({
        userId: m.user_id,
        role: m.role,
        joinedAt: m.created_at,
        username: m.user?.username || m.user?.email?.split('@')[0] || 'Unknown',
        email: m.user?.email,
        firstName: m.user?.first_name,
        lastName: m.user?.last_name
    }));
    
    return { data: members, error: null };
}

// Get a single squad by ID (with membership verification)
async function getSquadById(squadId) {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: null, error: 'Supabase not initialized' };
    
    const userId = await getCurrentUserId();
    if (!userId) return { data: null, error: 'User not logged in' };
    
    // Verify user is a member of the squad
    const { data: userMembership, error: checkError } = await supabase
        .from('squad_membership')
        .select('id, role')
        .eq('squad_id', squadId)
        .eq('user_id', userId)
        .single();
    
    if (checkError || !userMembership) {
        return { data: null, error: 'You are not a member of this squad' };
    }
    
    // Get squad details
    const { data: squad, error: squadError } = await supabase
        .from('squad')
        .select('*')
        .eq('id', squadId)
        .single();
    
    if (squadError) return { data: null, error: squadError };
    
    return { 
        data: { 
            ...squad, 
            userRole: userMembership.role 
        }, 
        error: null 
    };
}

// Update squad information
async function updateSquad(squadId, updates) {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: null, error: 'Supabase not initialized' };
    
    const userId = await getCurrentUserId();
    if (!userId) return { data: null, error: 'User not logged in' };
    
    // Verify user is an owner of the squad
    const { data: userMembership, error: checkError } = await supabase
        .from('squad_membership')
        .select('role')
        .eq('squad_id', squadId)
        .eq('user_id', userId)
        .single();
    
    if (checkError || !userMembership) {
        return { data: null, error: 'You are not a member of this squad' };
    }
    
    if (userMembership.role !== 'owner') {
        return { data: null, error: 'Only squad owners can update squad information' };
    }
    
    // Update the squad
    const { data: squad, error: updateError } = await supabase
        .from('squad')
        .update(updates)
        .eq('id', squadId)
        .select()
        .single();
    
    if (updateError) return { data: null, error: updateError };
    
    return { data: squad, error: null };
}

// Delete a squad
async function deleteSquad(squadId) {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: null, error: 'Supabase not initialized' };
    
    const userId = await getCurrentUserId();
    if (!userId) return { data: null, error: 'User not logged in' };
    
    // Verify user is an owner of the squad
    const { data: userMembership, error: checkError } = await supabase
        .from('squad_membership')
        .select('role')
        .eq('squad_id', squadId)
        .eq('user_id', userId)
        .single();
    
    if (checkError || !userMembership) {
        return { data: null, error: 'You are not a member of this squad' };
    }
    
    if (userMembership.role !== 'owner') {
        return { data: null, error: 'Only squad owners can delete squads' };
    }
    
    // Delete squad (cascade should handle memberships)
    const { error: deleteError } = await supabase
        .from('squad')
        .delete()
        .eq('id', squadId);
    
    if (deleteError) return { data: null, error: deleteError };
    
    return { data: { success: true }, error: null };
}

// Create a new squad
async function createSquad(squadData) {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: null, error: 'Supabase not initialized' };
    
    const userId = await getCurrentUserId();
    if (!userId) return { data: null, error: 'User not logged in' };
    
    const { name, game_title, skill_tier, visibility, description } = squadData;
    
    // Validate required fields
    if (!name || !game_title) {
        return { data: null, error: 'Squad name and game title are required' };
    }
    
    // Check if squad name already exists
    const { data: existingSquad, error: checkError } = await supabase
        .from('squad')
        .select('id')
        .ilike('name', name.trim())
        .limit(1)
        .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is fine
        return { data: null, error: checkError };
    }
    
    if (existingSquad) {
        return { data: null, error: 'A squad with this name already exists' };
    }
    
    let generatedInviteCode;
    try {
        generatedInviteCode = await getUniqueInviteCode(supabase);
    } catch (error) {
        return { data: null, error };
    }
    
    // Create the squad
    const squadInsert = {
        name: name.trim(),
        game_title: game_title.trim(),
        skill_tier: skill_tier?.trim() || null,
        visibility: visibility || 'public',
        invite_code: generatedInviteCode,
        description: description?.trim() || null,
        created_by: userId
    };
    
    const { data: squad, error: squadError } = await supabase
        .from('squad')
        .insert(squadInsert)
        .select()
        .single();
    
    if (squadError) {
        return { data: null, error: squadError };
    }
    
    // Create squad membership for the creator (owner role)
    const { data: membership, error: membershipError } = await supabase
        .from('squad_membership')
        .insert({
            squad_id: squad.id,
            user_id: userId,
            role: 'owner'
        })
        .select()
        .single();
    
    if (membershipError) {
        // Clean up squad if membership creation fails
        await supabase.from('squad').delete().eq('id', squad.id);
        return { data: null, error: membershipError };
    }
    
    // Create chat room for the squad (this might fail due to RLS, but we'll try)
    // If it fails, the chat room will be created lazily when first accessed
    try {
        const { data: chatRoom, error: chatRoomError } = await supabase
            .from('squad_chat_room')
            .insert({ squad_id: squad.id })
            .select()
            .single();
        
        // If chat room creation fails due to RLS, log it but don't fail the squad creation
        // The chat room can be created later when first accessed
        if (chatRoomError) {
            console.warn('⚠️ Could not create chat room automatically:', chatRoomError.message);
            console.warn('Chat room will be created when first accessed.');
        }
    } catch (error) {
        console.warn('⚠️ Error creating chat room:', error);
    }
    
    return { data: { ...squad, membershipRole: 'owner' }, error: null };
}

// Join a squad using an invite code
async function joinSquadByInviteCode(inviteCode) {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: null, error: 'Supabase not initialized' };
    
    const userId = await getCurrentUserId();
    if (!userId) return { data: null, error: 'User not logged in' };
    
    const normalizedCode = inviteCode.trim().toUpperCase();
    
    // Find squad by invite code
    const { data: squad, error: squadError } = await supabase
        .from('squad')
        .select('id, name, visibility')
        .eq('invite_code', normalizedCode)
        .single();
    
    if (squadError || !squad) {
        return { data: null, error: 'No squad found with that invite code' };
    }
    
    // Check if user is already a member
    const { data: existingMembership, error: checkError } = await supabase
        .from('squad_membership')
        .select('id')
        .eq('squad_id', squad.id)
        .eq('user_id', userId)
        .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
        return { data: null, error: checkError };
    }
    
    if (existingMembership) {
        return { data: null, error: 'You are already a member of this squad' };
    }
    
    // Create membership
    const { data: membership, error: membershipError } = await supabase
        .from('squad_membership')
        .insert({
            squad_id: squad.id,
            user_id: userId,
            role: 'member'
        })
        .select()
        .single();
    
    if (membershipError) {
        return { data: null, error: membershipError };
    }
    
    return { data: { squad, membership }, error: null };
}

// Get leaderboards for a specific squad
async function getSquadLeaderboards(squadId) {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: null, error: 'Supabase not initialized' };
    
    const userId = await getCurrentUserId();
    if (!userId) return { data: null, error: 'User not logged in' };
    
    // Verify user is a member of the squad
    const { data: userMembership, error: checkError } = await supabase
        .from('squad_membership')
        .select('id')
        .eq('squad_id', squadId)
        .eq('user_id', userId)
        .single();
    
    if (checkError || !userMembership) {
        return { data: null, error: 'You are not a member of this squad' };
    }
    
    // Get all leaderboards for this squad
    const { data: leaderboards, error: leaderboardsError } = await supabase
        .from('leaderboard')
        .select('id, name, game_name, status, created_at')
        .eq('squad_id', squadId)
        .order('created_at', { ascending: false });
    
    if (leaderboardsError) return { data: null, error: leaderboardsError };
    
    return { data: leaderboards || [], error: null };
}

/**
 * CHAT FUNCTIONS
 */

// Get or create a squad chat room for a squad
async function getOrCreateSquadChatRoom(squadId) {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: null, error: 'Supabase not initialized' };
    
    const userId = await getCurrentUserId();
    if (!userId) return { data: null, error: 'User not logged in' };
    
    // Verify user is a member of the squad
    const { data: userMembership, error: checkError } = await supabase
        .from('squad_membership')
        .select('id')
        .eq('squad_id', squadId)
        .eq('user_id', userId)
        .single();
    
    if (checkError || !userMembership) {
        return { data: null, error: 'You are not a member of this squad' };
    }
    
    // Try to get existing chat room
    const { data: existingRoom, error: fetchError } = await supabase
        .from('squad_chat_room')
        .select('id')
        .eq('squad_id', squadId)
        .single();
    
    if (existingRoom) {
        return { data: existingRoom, error: null };
    }
    
    // If not found and error is "not found", create a new one
    if (fetchError && fetchError.code === 'PGRST116') {
        const { data: newRoom, error: createError } = await supabase
            .from('squad_chat_room')
            .insert({ squad_id: squadId })
            .select()
            .single();
        
        if (createError) {
            // If RLS policy blocks the insert, provide helpful error message
            if (createError.message && createError.message.includes('row-level security')) {
                return { 
                    data: null, 
                    error: {
                        ...createError,
                        message: 'Cannot create chat room: Row-level security policy violation. Please run the migration-fix-squad-chat-room-rls.sql file in your Supabase SQL editor to fix this issue.'
                    }
                };
            }
            return { data: null, error: createError };
        }
        
        return { data: newRoom, error: null };
    }
    
    // Other errors
    return { data: null, error: fetchError };
}

// Send a message to a squad chat
async function sendSquadMessage(squadId, messageBody) {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: null, error: 'Supabase not initialized' };
    
    const userId = await getCurrentUserId();
    if (!userId) return { data: null, error: 'User not logged in' };
    
    if (!messageBody || !messageBody.trim()) {
        return { data: null, error: 'Message body is required' };
    }
    
    // Get or create chat room
    const { data: chatRoom, error: roomError } = await getOrCreateSquadChatRoom(squadId);
    if (roomError || !chatRoom) {
        return { data: null, error: roomError || 'Failed to get chat room' };
    }
    
    // Insert message
    const { data: message, error: messageError } = await supabase
        .from('chat_message')
        .insert({
            user_id: userId,
            squad_chat_id: chatRoom.id,
            body: messageBody.trim()
        })
        .select(`
            id,
            user_id,
            body,
            created_at,
            user:user_id (
                id,
                username,
                email,
                first_name,
                last_name
            )
        `)
        .single();
    
    if (messageError) {
        return { data: null, error: messageError };
    }
    
    return { data: message, error: null };
}

// Get messages for a squad chat
async function getSquadMessages(squadId, limit = 100) {
    const supabase = getSupabaseClient();
    if (!supabase) return { data: null, error: 'Supabase not initialized' };
    
    const userId = await getCurrentUserId();
    if (!userId) return { data: null, error: 'User not logged in' };
    
    // Verify user is a member of the squad
    const { data: userMembership, error: checkError } = await supabase
        .from('squad_membership')
        .select('id')
        .eq('squad_id', squadId)
        .eq('user_id', userId)
        .single();
    
    if (checkError || !userMembership) {
        return { data: null, error: 'You are not a member of this squad' };
    }
    
    // Get chat room
    const { data: chatRoom, error: roomError } = await getOrCreateSquadChatRoom(squadId);
    if (roomError || !chatRoom) {
        return { data: null, error: roomError || 'Failed to get chat room' };
    }
    
    // Get messages
    const { data: messages, error: messagesError } = await supabase
        .from('chat_message')
        .select(`
            id,
            user_id,
            body,
            created_at,
            user:user_id (
                id,
                username,
                email,
                first_name,
                last_name
            )
        `)
        .eq('squad_chat_id', chatRoom.id)
        .order('created_at', { ascending: true })
        .limit(limit);
    
    if (messagesError) {
        return { data: null, error: messagesError };
    }
    
    return { data: messages || [], error: null };
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
    getSimpleLeaderboardEntries,
    deleteLeaderboard,
    removeUserFromLeaderboard,
    getLeaderboardMembers,
    addMembersToLeaderboard,
    getUserSquads,
    getSquadMemberCount,
    getSquadMembers,
    getSquadById,
    updateSquad,
    deleteSquad,
    createSquad,
    joinSquadByInviteCode,
    getSquadLeaderboards,
    getOrCreateSquadChatRoom,
    sendSquadMessage,
    getSquadMessages
};

console.log('📦 Database.js loaded');
