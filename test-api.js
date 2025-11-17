/**
 * Simple test script to verify the backend APIs are working
 * 
 * Usage:
 *   1. Make sure server is running: npm run server
 *   2. Get your user UUID from Supabase Dashboard → Authentication → Users
 *   3. Run: node test-api.js YOUR_USER_UUID
 */

const BASE_URL = 'http://localhost:3000';
const userId = process.argv[2];

if (!userId) {
    console.log('❌ Please provide your user UUID as an argument');
    console.log('   Example: node test-api.js YOUR_USER_UUID');
    console.log('   Get your UUID from: Supabase Dashboard → Authentication → Users');
    process.exit(1);
}

console.log('🧪 Testing Backend APIs...\n');
console.log(`Using User ID: ${userId}\n`);

// Test 1: Create a Squad
async function testCreateSquad() {
    console.log('1️⃣ Testing: Create Squad');
    try {
        const response = await fetch(`${BASE_URL}/api/squads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': userId
            },
            body: JSON.stringify({
                name: 'Test Squad ' + Date.now(),
                description: 'This is a test squad created by the API',
                gameTitle: 'Valorant',
                skillTier: 'Immortal',
                inviteCode: 'TEST-' + Math.floor(Math.random() * 10000),
                visibility: 'private'
            })
        });
        
        const data = await response.json();
        if (response.ok) {
            console.log('   ✅ SUCCESS! Squad created:', data.squad.id);
            return data.squad.id;
        } else {
            console.log('   ❌ FAILED:', data.error);
            return null;
        }
    } catch (error) {
        console.log('   ❌ ERROR:', error.message);
        return null;
    }
}

// Test 2: Get My Squads
async function testGetMySquads() {
    console.log('\n2️⃣ Testing: Get My Squads');
    try {
        const response = await fetch(`${BASE_URL}/api/squads/my-squads`, {
            headers: {
                'x-user-id': userId
            }
        });
        
        const data = await response.json();
        if (response.ok) {
            console.log(`   ✅ SUCCESS! Found ${data.data.length} squads`);
            if (data.data.length > 0) {
                console.log(`   📋 Squad names: ${data.data.map(s => s.name).join(', ')}`);
            }
            return data.data;
        } else {
            console.log('   ❌ FAILED:', data.error);
            return [];
        }
    } catch (error) {
        console.log('   ❌ ERROR:', error.message);
        return [];
    }
}

// Test 3: Get Squad Members
async function testGetSquadMembers(squadId) {
    if (!squadId) {
        console.log('\n3️⃣ Testing: Get Squad Members (skipped - no squad ID)');
        return;
    }
    
    console.log(`\n3️⃣ Testing: Get Squad Members (squad ${squadId})`);
    try {
        const response = await fetch(`${BASE_URL}/api/squads/${squadId}/members`, {
            headers: {
                'x-user-id': userId
            }
        });
        
        const data = await response.json();
        if (response.ok) {
            console.log(`   ✅ SUCCESS! Found ${data.data.length} members`);
            return data.data;
        } else {
            console.log('   ❌ FAILED:', data.error);
            return [];
        }
    } catch (error) {
        console.log('   ❌ ERROR:', error.message);
        return [];
    }
}

// Test 4: Submit Match Result
async function testSubmitMatchResult(leaderboardId = 1) {
    console.log(`\n4️⃣ Testing: Submit Match Result (leaderboard ${leaderboardId})`);
    try {
        const response = await fetch(`${BASE_URL}/api/match-results`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': userId
            },
            body: JSON.stringify({
                leaderboardId: leaderboardId,
                resultLines: [
                    { userId: userId, score: 100, outcome: 'win' }
                ]
            })
        });
        
        const data = await response.json();
        if (response.ok) {
            console.log('   ✅ SUCCESS! Match result submitted:', data.matchResult.id);
            console.log('   📊 Status:', data.matchResult.status);
            return data.matchResult.id;
        } else {
            console.log('   ❌ FAILED:', data.error);
            if (data.details) console.log('   Details:', data.details);
            return null;
        }
    } catch (error) {
        console.log('   ❌ ERROR:', error.message);
        return null;
    }
}

// Test 5: Get Pending Match Results
async function testGetPendingResults() {
    console.log('\n5️⃣ Testing: Get Pending Match Results (Admin Only)');
    try {
        const response = await fetch(`${BASE_URL}/api/match-results/pending`, {
            headers: {
                'x-user-id': userId
            }
        });
        
        const data = await response.json();
        if (response.ok) {
            console.log(`   ✅ SUCCESS! Found ${data.data.length} pending results`);
            return data.data;
        } else {
            console.log('   ❌ FAILED:', data.error);
            return [];
        }
    } catch (error) {
        console.log('   ❌ ERROR:', error.message);
        return [];
    }
}

// Run all tests
async function runTests() {
    console.log('='.repeat(50));
    
    const squadId = await testCreateSquad();
    await testGetMySquads();
    await testGetSquadMembers(squadId);
    const matchResultId = await testSubmitMatchResult();
    await testGetPendingResults();
    
    console.log('\n' + '='.repeat(50));
    console.log('✨ Testing complete!');
    console.log('\n💡 Tips for your demo:');
    console.log('   - Show the server running in terminal');
    console.log('   - Show these API calls working');
    console.log('   - Show data appearing in Supabase database');
    console.log('   - Explain the workflow (submit → pending → approve)');
}

// Check if server is running first
fetch(`${BASE_URL}/`)
    .then(() => runTests())
    .catch(() => {
        console.log('❌ Server is not running!');
        console.log('   Please start it with: npm run server');
        process.exit(1);
    });

