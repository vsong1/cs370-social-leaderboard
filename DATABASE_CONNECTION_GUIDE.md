# Database Connection Guide - Baby Steps! 🎯

## What I Just Did For You

I've connected your frontend to Supabase! Here's what changed:

### ✅ Created `js/database.js`
This is your new database helper file. It provides easy-to-use functions for:
- Getting leaderboard data from Supabase
- Adding scores to leaderboards
- Finding leaderboards by name or ID

### ✅ Updated `js/leaderboards.js`
- **Removed** all `localStorage` code (no more local storage!)
- **Added** Supabase database calls
- Now loads leaderboard entries from your Supabase database
- Saves new scores directly to Supabase

### ✅ Updated `leaderboard.html`
- Added the `database.js` script so it loads on the leaderboard page

## How It Works Now

1. **Loading Leaderboards**: When you visit a leaderboard page, it tries to find the leaderboard in your database by:
   - URL parameter (`?id=123`)
   - Data attribute on the page (`data-leaderboard-id="123"`)
   - Leaderboard name (from the page title like "Foosball Friends")

2. **Adding Scores**: When you add a score, it:
   - Saves it to Supabase using the `match_result` and `result_line` tables
   - Reloads the leaderboard to show updated scores

## What You Need To Do Next

### ⚠️ Important Note About "Foosball Friends"
Yes, "Foosball Friends" is currently **hardcoded** in your `leaderboard.html` file (line 41). This is fine for now! We'll make it dynamic later. For now, just make sure the leaderboard name in your database matches "Foosball Friends" exactly.

### Step 1: Create a User Account First (If You Haven't Already)

Before creating anything else, you need a user account:
1. Go to your website and sign up/login at `login.html` or `signup.html`
2. This will automatically create a user record in the `user` table in Supabase

### Step 2: Get Your User ID

You'll need your user ID to create a squad and leaderboard:

**Method 1: From Supabase Dashboard**
1. Go to https://iwxlemgotkpesbkzhuve.supabase.co
2. Click **"Table Editor"** in the left sidebar
3. Click on the **`user`** table
4. You should see your user record (created when you signed up)
5. **Copy the `id` field** - it looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
6. Keep this handy - you'll need it!

**Method 2: From Browser Console (After Logging In)**
1. Open your website and log in
2. Press F12 to open browser console
3. Type: `window.SquadScoreAuth.getUser().then(u => console.log(u.id))`
4. Copy the ID that appears

### Step 3: Create a Squad (Required First!)

**Why?** Every leaderboard must belong to a squad. You can't create a leaderboard without a squad.

**Step-by-Step:**
1. In Supabase Dashboard, go to **"Table Editor"**
2. Click on the **`squad`** table
3. Click the **"Insert row"** button (or the ➕ icon)
4. Fill in these fields:
   - **`name`**: Type `"My First Squad"` (or any name you want)
   - **`description`**: Type `"A test squad for Foosball"` (optional, can be empty)
   - **`created_by`**: Paste your **user ID** from Step 2
   - **`created_at`** and **`updated_at`**: Leave these empty (they auto-fill)
5. Click **"Save"** or **"Insert"**
6. **IMPORTANT:** After saving, look at the `id` column for the row you just created
7. **Copy that squad ID** (it's a number like `1` or `2`) - you'll need it next!

### Step 4: Create the Leaderboard

Now you can create the leaderboard:

1. Still in Supabase Dashboard, click on the **`leaderboard`** table
2. Click **"Insert row"**
3. Fill in these fields:
   - **`name`**: Type `"Foosball Friends"` (must match exactly - it's hardcoded in your HTML!)
   - **`game_name`**: Type `"Foosball"`
   - **`squad_id`**: Paste the **squad ID** from Step 3 (the number)
   - **`admin_user_id`**: Paste your **user ID** from Step 2 (the UUID)
   - **`status`**: Leave as `"active"` (default)
   - **`current_champion_user_id`**: Leave empty (optional)
   - **`created_at`** and **`updated_at`**: Leave empty (auto-fill)
4. Click **"Save"** or **"Insert"**
5. **Done!** Your leaderboard is created

### Visual Guide to Supabase Navigation

```
Supabase Dashboard
├── Table Editor (left sidebar) ← Click here first!
│   ├── user (table) ← Get your user ID here
│   ├── squad (table) ← Create squad here (Step 3)
│   └── leaderboard (table) ← Create leaderboard here (Step 4)
├── SQL Editor (for advanced users)
└── Authentication (for user management)
```

### Quick Checklist

Before testing, make sure you have:
- ✅ A user account (created when you signed up)
- ✅ Your user ID copied
- ✅ A squad created with your user ID as `created_by`
- ✅ The squad ID copied
- ✅ A leaderboard created with:
  - Name: **"Foosball Friends"** (exact match!)
  - `squad_id`: Your squad ID
  - `admin_user_id`: Your user ID

### Step 5: Test It Out!

1. **Make sure you're logged in** on your website (the code needs a user to work)
2. Go to `leaderboard.html` in your browser
3. **Open the browser console** (Press F12, then click "Console" tab)
4. You should see messages like:
   - `✅ Supabase initialized`
   - `✅ Found leaderboard by name: [some number]`
   - If you see `⚠️ No leaderboard ID found`, check that the name matches exactly!
5. Try **adding a score** using the "Add Score to Leaderboard" button
6. Check the console - you should see success messages
7. **Refresh the page** - your score should still be there! (That's the database working!)

### About the Hardcoded Name

**Yes, "Foosball Friends" is hardcoded** in `leaderboard.html` line 41. Here's what to know:

- **For now:** Just make sure your database leaderboard name matches "Foosball Friends" exactly
- **Later:** We'll make this dynamic so:
  - The page can show any leaderboard
  - You can pass a leaderboard ID in the URL (`leaderboard.html?id=123`)
  - The page will load the correct leaderboard from the database
- **This is fine for testing!** Once we connect the "All Leaderboards" page, we'll make it dynamic

## Troubleshooting

### "No leaderboard ID found" or "Cannot save: No leaderboard ID"
**Most common issue!** This means the code can't find your leaderboard. Check:
1. ✅ Did you create the leaderboard in Supabase? (Check the `leaderboard` table)
2. ✅ Does the name match **exactly**? "Foosball Friends" (case-sensitive, no extra spaces)
3. ✅ Are you logged in? The code needs a user session
4. ✅ Check browser console - it will tell you what it's looking for

**Quick fix:** You can also add the ID to the URL:
- Go to: `leaderboard.html?id=1` (replace `1` with your actual leaderboard ID from Supabase)

### "User not logged in"
- Make sure you're signed in using the login page
- Check that `supabase-auth.js` is loaded before `database.js`
- Try logging out and logging back in

### "Database.js not loaded"
- Make sure `database.js` is included in your HTML before `leaderboards.js`
- Check the browser console for any script loading errors
- Make sure the file path is correct: `js/database.js`

### "Error saving entry" or Database Errors
- Check that you have a `user` record in Supabase (created when you sign up)
- Make sure the `leaderboard_id` exists in your database
- Check browser console for the exact error message
- Common issue: User doesn't exist - make sure you've signed up first!

### Can't Find Tables in Supabase
- Make sure you're in the correct project: https://iwxlemgotkpesbkzhuve.supabase.co
- Click "Table Editor" in the left sidebar
- If tables are empty, that's fine - you're creating the first records!
- If tables don't exist, you may need to run the SQL from `SUPABASE_SETUP.md` first

## Next Steps (For Later)

Once this basic connection works, you can:
1. **Make leaderboard names dynamic** - Load the name from the database instead of hardcoding
2. **Connect the "Create Leaderboard" page** - Make it actually create leaderboards in the database
3. **Connect the "All Leaderboards" page** - Show real leaderboards from the database instead of hardcoded cards
4. **Add URL parameters** - Use `leaderboard.html?id=123` to show different leaderboards
5. **Add better error messages** - Show user-friendly messages instead of console errors
6. **Add loading states** - Show spinners while data loads

## Understanding the Database Structure

Here's how everything connects:
```
user (you) 
  ↓ creates
squad (group of people)
  ↓ contains
leaderboard (game leaderboard)
  ↓ tracks
match_result (a game/match that was played)
  ↓ contains
result_line (individual player scores in that match)
```

So when you add a score:
1. It creates a `match_result` record
2. It creates a `result_line` record with the player's score
3. The leaderboard page calculates totals from all `result_line` records

## Files Changed

- ✅ `js/database.js` (NEW)
- ✅ `js/leaderboards.js` (UPDATED - removed localStorage)
- ✅ `leaderboard.html` (UPDATED - added database.js script)

## Questions?

Check the browser console (F12) - it will show you helpful messages about what's happening!

