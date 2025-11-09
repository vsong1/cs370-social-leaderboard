import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(__dirname)); // Serve all HTML/CSS/JS files
app.use(express.json()); // Enable JSON parsing for API requests


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Leaderboards page
app.get("/leaderboards", (req, res) => {
    res.sendFile(path.join(__dirname, "all-leaderboards.html"));
});

// Squads page
app.get("/squads", (req, res) => {
    res.sendFile(path.join(__dirname, "chat.html"));
});

// Profile page
app.get("/profile", (req, res) => {
    res.sendFile(path.join(__dirname, "profile.html"));
});

// ---------------- LEADERBOARD BACKEND ----------------

// Path to local leaderboard storage file
const dataFile = path.join(__dirname, "leaderboards.json");

// Ensure leaderboard file exists
if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "[]", "utf8");
}

// Get all leaderboards
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

// Add a new leaderboard
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


app.listen(PORT, () => {
    console.log(` Squad Score server running at: http://localhost:${PORT}`);
    console.log(" Visit http://localhost:3000 to open your homepage");
});