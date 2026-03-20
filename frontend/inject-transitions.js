const fs = require('fs');
const path = require('path');

const cssFileName = 'transitions.css';
const jsFileName = 'page-transitions.js';
const frontendRoot = __dirname;

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    const fileDir = path.dirname(filePath);
    const relativePath = path.relative(frontendRoot, fileDir);
    const depth = relativePath ? relativePath.split(path.sep).length : 0;
    const prefix = depth === 0 ? 'assets/' : '../'.repeat(depth) + 'assets/';

    const cssTag = `<link rel="stylesheet" href="${prefix}css/${cssFileName}">`;
    const jsTag = `<script src="${prefix}js/${jsFileName}"></script>`;

    if (!content.includes(cssFileName)) {
        content = content.replace('</head>', `    ${cssTag}\n</head>`);
        changed = true;
    }

    if (!content.includes(jsFileName)) {
        content = content.replace('</body>', `    ${jsTag}\n</body>`);
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== 'assets' && file !== 'components' && file !== 'src') {
                scanDir(fullPath);
            }
        } else if (file.endsWith('.html')) {
            processFile(fullPath);
        }
    }
}

scanDir(frontendRoot);
console.log('Recursive injection complete!');
