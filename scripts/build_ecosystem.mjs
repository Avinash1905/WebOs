import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Starting WebOS Production Architecture Construction...');
console.log('Target: 500,000+ Meaningful Production Lines of Code');

// Helper to write files ensuring parent directories exist
function writeFileSafe(relPath, content) {
  const fullPath = path.join(rootDir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
}

// Generate complete subsystem suites
export { writeFileSafe, rootDir };
