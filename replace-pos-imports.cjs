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

    content = content.replace(/['"]@\/api\/vendas\.api['"]/g, "'@/features/pos'");
    content = content.replace(/['"]@\/store\/posStore['"]/g, "'@/features/pos'");
    content = content.replace(/['"]@\/pages\/vendas\/POSPage['"]/g, "'@/features/pos'");
    content = content.replace(/['"]@\/pages\/vendas\/components\/ReceiptModal['"]/g, "'@/features/pos'");

    if (content !== oldContent) {
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated:', file);
    }
});
