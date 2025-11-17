import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..'); // Go up one level from js/ to project root

app.use(express.static(projectRoot)); // Serve all HTML/CSS/JS files from project root
app.use(express.json()); // Enable JSON parsing for API requests

// Initialize Supabase client with service role key (bypasses RLS)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase credentials in .env file");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey); // For verifying user tokens

console.log("✅ Supabase client initialized");

// ==================== AUTHENTICATION MIDDLEWARE ====================
/**
 * Middleware to verify user authentication
 * Expects: Authorization: Bearer <jwt_token> header
 * Or: x-user-id header (for simpler testing, less secure)
 */
async function authenticateUser(req, res, next) {
    // Try to get token from Authorization header
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        
        // Verify token with Supabase
        const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ error: "Invalid or expired token" });
        }
        
        userId = user.id;
    } else if (req.headers["x-user-id"]) {
        // Fallback: allow x-user-id header for development (less secure)
        userId = req.headers["x-user-id"];
    } else {
        return res.status(401).json({ error: "Authentication required. Provide Authorization header or x-user-id header." });
    }

    // Attach user info to request
    req.userId = userId;
    next();
}

// ==================== STATIC ROUTES ====================
app.get("/", (req, res) => {
    res.sendFile(path.join(projectRoot, "index.html"));
});

app.get("/leaderboards", (req, res) => {
    res.sendFile(path.join(projectRoot, "all-leaderboards.html"));
});

app.get("/squads", (req, res) => {
    res.sendFile(path.join(projectRoot, "chat.html"));
});

app.get("/profile", (req, res) => {
    res.sendFile(path.join(projectRoot, "profile.html"));
});

// ==================== TASK 1: MATCH RESULT APPROVAL API ====================

/**
 * POST /api/match-results
 * Submit a new match result (status: 'pending')
 * Body: { leaderboardId, resultLines: [{ userId, score, outcome }] }
 */
app.post("/api/match-results", authenticateUser, async (req, res) => {
    try {
        const { leaderboardId, resultLines } = req.body;
        const submittedBy = req.userId;

        // Validation
        if (!leaderboardId) {
            return res.status(400).json({ error: "leaderboardId is required" });
        }

        if (!resultLines || !Array.isArray(resultLines) || resultLines.length === 0) {
            return res.status(400).json({ error: "resultLines array with at least one entry is required" });
        }

        // Verify leaderboard exists and user has access
        const { data: leaderboard, error: lbError } = await supabase
            .from("leaderboard")
            .select("id, admin_user_id")
            .eq("id", leaderboardId)
            .single();

        if (lbError || !leaderboard) {
            return res.status(404).json({ error: "Leaderboard not found" });
        }

        // Create match_result with 'pending' status
        const { data: matchResult, error: matchError } = await supabase
            .from("match_result")
            .insert({
                leaderboard_id: leaderboardId,
                status: "pending",
                submitted_by: submittedBy
            })
            .select()
            .single();

        if (matchError) {
            console.error("❌ Error creating match_result:", matchError);
            return res.status(500).json({ error: "Failed to create match result", details: matchError.message });
        }

        // Create result_lines
        const linesToInsert = resultLines.map(line => ({
            match_result_id: matchResult.id,
            user_id: line.userId,
            score: line.score || null,
            outcome: line.outcome || null
        }));

        const { data: resultLinesData, error: linesError } = await supabase
            .from("result_line")
            .insert(linesToInsert)
            .select();

        if (linesError) {
            // Clean up match_result if result_lines fail
            await supabase.from("match_result").delete().eq("id", matchResult.id);
            console.error("❌ Error creating result_lines:", linesError);
            return res.status(500).json({ error: "Failed to create result lines", details: linesError.message });
        }

        // Fetch complete match result with lines
        const { data: completeMatch, error: fetchError } = await supabase
            .from("match_result")
            .select(`
                *,
                result_line:result_line (*)
            `)
            .eq("id", matchResult.id)
            .single();

        console.log(`✅ Match result submitted: ${matchResult.id} by user ${submittedBy}`);

        res.status(201).json({
            success: true,
            matchResult: completeMatch
        });

    } catch (error) {
        console.error("❌ Unexpected error in POST /api/match-results:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
});

/**
 * GET /api/match-results/pending
 * Get all pending match results for leaderboards where user is admin
 */
app.get("/api/match-results/pending", authenticateUser, async (req, res) => {
    try {
        const userId = req.userId;
        const { leaderboardId } = req.query; // Optional filter by leaderboard

        // Get leaderboards where user is admin
        const { data: adminLeaderboards, error: adminError } = await supabase
            .from("leaderboard")
            .select("id")
            .eq("admin_user_id", userId);

        if (adminError) {
            console.error("❌ Error fetching admin leaderboards:", adminError);
            return res.status(500).json({ error: "Failed to fetch leaderboards" });
        }

        const adminLeaderboardIds = adminLeaderboards.map(lb => lb.id);

        if (adminLeaderboardIds.length === 0) {
            return res.json({ data: [] });
        }

        // Build query
        let query = supabase
            .from("match_result")
            .select(`
                *,
                result_line:result_line (
                    *,
                    user:user_id (
                        id,
                        username,
                        email
                    )
                ),
                leaderboard:leaderboard_id (
                    id,
                    name,
                    game_name
                ),
                submitted_by_user:submitted_by (
                    id,
                    username,
                    email
                )
            `)
            .eq("status", "pending")
            .in("leaderboard_id", adminLeaderboardIds)
            .order("created_at", { ascending: false });

        // Filter by leaderboard if provided
        if (leaderboardId) {
            query = query.eq("leaderboard_id", leaderboardId);
        }

        const { data: pendingResults, error: resultsError } = await query;

        if (resultsError) {
            console.error("❌ Error fetching pending results:", resultsError);
            return res.status(500).json({ error: "Failed to fetch pending results" });
        }

        res.json({ data: pendingResults || [] });

    } catch (error) {
        console.error("❌ Unexpected error in GET /api/match-results/pending:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
});

/**
 * PATCH /api/match-results/:id/approve
 * Approve a pending match result (admin only)
 */
app.patch("/api/match-results/:id/approve", authenticateUser, async (req, res) => {
    try {
        const matchResultId = req.params.id;
        const reviewerId = req.userId;

        // Get match result and verify user is admin of the leaderboard
        const { data: matchResult, error: fetchError } = await supabase
            .from("match_result")
            .select(`
                *,
                leaderboard:leaderboard_id (
                    id,
                    admin_user_id
                )
            `)
            .eq("id", matchResultId)
            .single();

        if (fetchError || !matchResult) {
            return res.status(404).json({ error: "Match result not found" });
        }

        if (matchResult.status !== "pending") {
            return res.status(400).json({ error: `Match result is already ${matchResult.status}` });
        }

        // Verify user is admin
        if (matchResult.leaderboard.admin_user_id !== reviewerId) {
            return res.status(403).json({ error: "Only the leaderboard admin can approve match results" });
        }

        // Update status to approved
        const { data: updatedResult, error: updateError } = await supabase
            .from("match_result")
            .update({
                status: "approved",
                reviewed_by: reviewerId
            })
            .eq("id", matchResultId)
            .select()
            .single();

        if (updateError) {
            console.error("❌ Error approving match result:", updateError);
            return res.status(500).json({ error: "Failed to approve match result" });
        }

        console.log(`✅ Match result ${matchResultId} approved by ${reviewerId}`);

        res.json({
            success: true,
            matchResult: updatedResult
        });

    } catch (error) {
        console.error("❌ Unexpected error in PATCH /api/match-results/:id/approve:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
});

/**
 * PATCH /api/match-results/:id/reject
 * Reject a pending match result (admin only)
 */
app.patch("/api/match-results/:id/reject", authenticateUser, async (req, res) => {
    try {
        const matchResultId = req.params.id;
        const reviewerId = req.userId;

        // Get match result and verify user is admin of the leaderboard
        const { data: matchResult, error: fetchError } = await supabase
            .from("match_result")
            .select(`
                *,
                leaderboard:leaderboard_id (
                    id,
                    admin_user_id
                )
            `)
            .eq("id", matchResultId)
            .single();

        if (fetchError || !matchResult) {
            return res.status(404).json({ error: "Match result not found" });
        }

        if (matchResult.status !== "pending") {
            return res.status(400).json({ error: `Match result is already ${matchResult.status}` });
        }

        // Verify user is admin
        if (matchResult.leaderboard.admin_user_id !== reviewerId) {
            return res.status(403).json({ error: "Only the leaderboard admin can reject match results" });
        }

        // Update status to rejected
        const { data: updatedResult, error: updateError } = await supabase
            .from("match_result")
            .update({
                status: "rejected",
                reviewed_by: reviewerId
            })
            .eq("id", matchResultId)
            .select()
            .single();

        if (updateError) {
            console.error("❌ Error rejecting match result:", updateError);
            return res.status(500).json({ error: "Failed to reject match result" });
        }

        console.log(`✅ Match result ${matchResultId} rejected by ${reviewerId}`);

        res.json({
            success: true,
            matchResult: updatedResult
        });

    } catch (error) {
        console.error("❌ Unexpected error in PATCH /api/match-results/:id/reject:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
});

// ==================== TASK 2: SQUAD MANAGEMENT API ====================

/**
 * POST /api/squads
 * Create a new squad
 * Body: { name, description, gameTitle, skillTier, inviteCode, visibility }
 */
app.post("/api/squads", authenticateUser, async (req, res) => {
    try {
        const { name, description, gameTitle, skillTier, inviteCode, visibility } = req.body;
        const createdBy = req.userId;

        // Validation
        if (!name || !name.trim()) {
            return res.status(400).json({ error: "Squad name is required" });
        }

        // Check if invite code is already in use (if provided)
        if (inviteCode) {
            const { data: existingSquad, error: checkError } = await supabase
                .from("squad")
                .select("id")
                .eq("invite_code", inviteCode.trim().toUpperCase())
                .single();

            if (existingSquad) {
                return res.status(400).json({ error: "Invite code already in use" });
            }
        }

        // Create squad
        const { data: squad, error: squadError } = await supabase
            .from("squad")
            .insert({
                name: name.trim(),
                description: description?.trim() || null,
                game_title: gameTitle?.trim() || null,
                skill_tier: skillTier?.trim() || null,
                invite_code: inviteCode ? inviteCode.trim().toUpperCase() : null,
                visibility: visibility || "private",
                created_by: createdBy
            })
            .select()
            .single();

        if (squadError) {
            console.error("❌ Error creating squad:", squadError);
            return res.status(500).json({ error: "Failed to create squad", details: squadError.message });
        }

        // Create squad_membership for the creator (owner role)
        const { error: membershipError } = await supabase
            .from("squad_membership")
            .insert({
                squad_id: squad.id,
                user_id: createdBy,
                role: "owner"
            });

        if (membershipError) {
            // Clean up squad if membership creation fails
            await supabase.from("squad").delete().eq("id", squad.id);
            console.error("❌ Error creating squad membership:", membershipError);
            return res.status(500).json({ error: "Failed to create squad membership", details: membershipError.message });
        }

        console.log(`✅ Squad created: ${squad.id} by user ${createdBy}`);

        res.status(201).json({
            success: true,
            squad
        });

    } catch (error) {
        console.error("❌ Unexpected error in POST /api/squads:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
});

/**
 * POST /api/squads/join
 * Join a squad using an invite code
 * Body: { inviteCode }
 */
app.post("/api/squads/join", authenticateUser, async (req, res) => {
    try {
        const { inviteCode } = req.body;
        const userId = req.userId;

        if (!inviteCode || !inviteCode.trim()) {
            return res.status(400).json({ error: "Invite code is required" });
        }

        // Find squad by invite code
        const { data: squad, error: squadError } = await supabase
            .from("squad")
            .select("id, name, visibility")
            .eq("invite_code", inviteCode.trim().toUpperCase())
            .single();

        if (squadError || !squad) {
            return res.status(404).json({ error: "Squad not found with that invite code" });
        }

        // Check if user is already a member
        const { data: existingMembership, error: checkError } = await supabase
            .from("squad_membership")
            .select("id")
            .eq("squad_id", squad.id)
            .eq("user_id", userId)
            .single();

        if (existingMembership) {
            return res.status(400).json({ error: "You are already a member of this squad" });
        }

        // Create membership
        const { data: membership, error: membershipError } = await supabase
            .from("squad_membership")
            .insert({
                squad_id: squad.id,
                user_id: userId,
                role: "member"
            })
            .select()
            .single();

        if (membershipError) {
            console.error("❌ Error joining squad:", membershipError);
            return res.status(500).json({ error: "Failed to join squad", details: membershipError.message });
        }

        console.log(`✅ User ${userId} joined squad ${squad.id}`);

        res.status(201).json({
            success: true,
            squad: {
                id: squad.id,
                name: squad.name
            },
            membership
        });

    } catch (error) {
        console.error("❌ Unexpected error in POST /api/squads/join:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
});

/**
 * GET /api/squads/my-squads
 * Get all squads the current user is a member of
 */
app.get("/api/squads/my-squads", authenticateUser, async (req, res) => {
    try {
        const userId = req.userId;

        // Get all squad memberships for the user
        const { data: memberships, error: membershipError } = await supabase
            .from("squad_membership")
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
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (membershipError) {
            console.error("❌ Error fetching squads:", membershipError);
            return res.status(500).json({ error: "Failed to fetch squads" });
        }

        // Format response
        const squads = memberships.map(m => ({
            ...m.squad,
            membershipRole: m.role,
            joinedAt: m.created_at
        }));

        res.json({ data: squads });

    } catch (error) {
        console.error("❌ Unexpected error in GET /api/squads/my-squads:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
});

/**
 * GET /api/squads/:id/members
 * Get all members of a squad
 */
app.get("/api/squads/:id/members", authenticateUser, async (req, res) => {
    try {
        const squadId = req.params.id;
        const userId = req.userId;

        // Verify user is a member of the squad
        const { data: membership, error: checkError } = await supabase
            .from("squad_membership")
            .select("role")
            .eq("squad_id", squadId)
            .eq("user_id", userId)
            .single();

        if (checkError || !membership) {
            return res.status(403).json({ error: "You are not a member of this squad" });
        }

        // Get all members
        const { data: members, error: membersError } = await supabase
            .from("squad_membership")
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
            .eq("squad_id", squadId)
            .order("created_at", { ascending: true });

        if (membersError) {
            console.error("❌ Error fetching squad members:", membersError);
            return res.status(500).json({ error: "Failed to fetch squad members" });
        }

        res.json({ data: members });

    } catch (error) {
        console.error("❌ Unexpected error in GET /api/squads/:id/members:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
});

// ==================== OLD LEADERBOARD ENDPOINTS (keeping for backward compatibility) ====================

const dataFile = path.join(projectRoot, "leaderboards.json");

if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "[]", "utf8");
}

app.get("/api/leaderboards", (req, res) => {
    fs.readFile(dataFile, "utf8", (err, data) => {
        if (err) {
            console.error(" Failed to read data:", err);
            return res.status(500).json({ error: "Failed to read leaderboard data" });
        }

        try {
            const leaderboards = JSON.parse(data || "[]");
            res.json(leaderboards);
        } catch (parseErr) {
            console.error("❌ JSON parse error:", parseErr);
            res.status(500).json({ error: "Corrupted leaderboard data" });
        }
    });
});

app.post("/api/leaderboards", (req, res) => {
    const { name, game, members } = req.body;

    if (!name || !game) {
        return res.status(400).json({ error: "Name and game fields are required" });
    }

    fs.readFile(dataFile, "utf8", (err, data) => {
        if (err) {
            console.error("Read error:", err);
            return res.status(500).json({ error: "Failed to read leaderboard file" });
        }

        let leaderboards = [];
        try {
            leaderboards = JSON.parse(data || "[]");
        } catch {
            leaderboards = [];
        }

        const newLeaderboard = {
            id: Date.now(),
            name,
            game,
            members: members || [],
            createdAt: new Date().toISOString(),
        };

        leaderboards.push(newLeaderboard);

        fs.writeFile(dataFile, JSON.stringify(leaderboards, null, 2), (err) => {
            if (err) {
                console.error("Write error:", err);
                return res.status(500).json({ error: "Failed to save leaderboard" });
            }

            console.log(` Added leaderboard: ${name}`);
            res.status(201).json(newLeaderboard);
        });
    });
});

// ==================== SERVER START ====================

app.listen(PORT, () => {
    console.log(`✅ Squad Score server running at: http://localhost:${PORT}`);
    console.log("📝 Visit http://localhost:3000 to open your homepage");
    console.log("🔐 Using Supabase service role key for backend operations");
});
