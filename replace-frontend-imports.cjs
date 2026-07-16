const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(srcDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    const oldContent = content;

    // Replace absolute imports using @ alias
    content = content.replace(/['"]@\/api\/auth\.api['"]/g, "'@/features/auth/api/auth.api'");
    content = content.replace(/['"]@\/store\/useAuthStore['"]/g, "'@/features/auth'");
    content = content.replace(/['"]@\/pages\/auth\/LoginPage['"]/g, "'@/features/auth'");
    content = content.replace(/['"]@\/pages\/auth\/ForgotPasswordPage['"]/g, "'@/features/auth'");
    content = content.replace(/['"]@\/pages\/auth\/ResetPasswordPage['"]/g, "'@/features/auth'");

    // Relative imports could exist. Let's do a basic replace for relative ones.
    // Like '../../api/auth.api' etc. 
    // It's safer to just run the build and see where it fails if there are relative imports,
    // but typically vite/react projects with @ alias use the alias.
    
    // Check if the current file is inside features/auth and has incorrect relative paths for its internal imports
    // e.g. src/features/auth/pages/LoginPage.tsx might have imported @/api/auth.api before, which is now fixed by the above.
    // If it had relative imports to other files in features/auth, it might be broken.
    // e.g. src/features/auth/pages/LoginPage.tsx might have imported useAuthStore relatively like `import { useAuthStore } from '../../store/useAuthStore'`.
    
    if (content !== oldContent) {
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated:', file);
    }
});
