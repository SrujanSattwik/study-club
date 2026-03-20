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

    const correctCssTag = `<link rel="stylesheet" href="${prefix}css/${cssFileName}">`;
    const correctJsTag = `<script src="${prefix}js/${jsFileName}"></script>`;

    // Replace any existing transition link/script regardless of path
    const cssRegex = /<link[^>]*href="[^"]*transitions\.css"[^>]*>/g;
    const jsRegex = /<script[^>]*src="[^"]*page-transitions\.js"[^>]*><\/script>/g;

    const currentCssMatch = content.match(cssRegex);
    const currentJsMatch = content.match(jsRegex);

    if (currentCssMatch && currentCssMatch.length > 0) {
        if (currentCssMatch[0] !== correctCssTag) {
            content = content.replace(cssRegex, correctCssTag);
            changed = true;
        }
    } else {
        content = content.replace('</head>', `    ${correctCssTag}\n</head>`);
        changed = true;
    }

    if (currentJsMatch && currentJsMatch.length > 0) {
         if (currentJsMatch[0] !== correctJsTag) {
            content = content.replace(jsRegex, correctJsTag);
            changed = true;
         }
    } else {
        content = content.replace('</body>', `    ${correctJsTag}\n</body>`);
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed paths in: ${path.basename(filePath)}`);
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
console.log('Path fix complete!');
