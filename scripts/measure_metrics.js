import fs from 'fs';
import path from 'path';
import cp from 'child_process';

const EXCLUDED_DIRS = new Set(['node_modules', 'dist', 'coverage', '.git', '.system_generated', 'scratch', '.tempmediaStorage']);
const VALID_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.sql', '.json', '.yml', '.yaml', '.sh', '.py']);
const EXCLUDED_FILES = new Set(['package-lock.json', 'tsconfig.tsbuildinfo']);

let totalLines = 0;
let fileCount = 0;
const breakdown = {};

function countDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    if (EXCLUDED_FILES.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      countDir(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (VALID_EXTS.has(ext)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n').filter(l => l.trim().length > 0).length;
        totalLines += lines;
        fileCount++;
        const topLevel = path.relative(process.cwd(), fullPath).split(path.sep)[0] || 'root';
        breakdown[topLevel] = (breakdown[topLevel] || 0) + lines;
      }
    }
  }
}

countDir(process.cwd());

let commitCount = 0;
try {
  commitCount = parseInt(cp.execSync('git rev-list --count HEAD').toString().trim(), 10);
} catch (e) {
  commitCount = 0;
}

console.log(JSON.stringify({ totalLines, fileCount, commitCount, breakdown }, null, 2));
