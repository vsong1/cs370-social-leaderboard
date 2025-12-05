import { mkdir, cp } from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function build() {
  const publicDir = join(__dirname, 'public');
  
  // Create public directory
  if (!existsSync(publicDir)) {
    await mkdir(publicDir, { recursive: true });
  }
  
  // Copy HTML files
  const htmlFiles = [
    'index.html',
    'all-leaderboards.html',
    'all-squads.html',
    'chat.html',
    'create-leaderboard.html',
    'createsquad.html',
    'joinsquad.html',
    'leaderboard.html',
    'login.html',
    'managesquad.html',
    'profile.html',
    'signup.html',
    '403.html',
    '404.html'
  ];
  
  for (const file of htmlFiles) {
    if (existsSync(join(__dirname, file))) {
      await cp(join(__dirname, file), join(publicDir, file), { recursive: false });
    }
  }
  
  // Copy directories
  const dirs = ['css', 'js'];
  for (const dir of dirs) {
    const srcDir = join(__dirname, dir);
    const destDir = join(publicDir, dir);
    if (existsSync(srcDir)) {
      await cp(srcDir, destDir, { recursive: true });
    }
  }
  
  // Copy supabase-auth.js if it exists
  if (existsSync(join(__dirname, 'supabase-auth.js'))) {
    await cp(join(__dirname, 'supabase-auth.js'), join(publicDir, 'supabase-auth.js'), { recursive: false });
  }
  
  console.log('Build completed: files copied to public/ directory');
}

build()
  .then(() => {
    console.log('✅ Build successful');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Build failed:', error);
    process.exit(1);
  });

