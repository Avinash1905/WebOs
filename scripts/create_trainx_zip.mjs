import fs from 'fs';
import path from 'path';
import cp from 'child_process';

console.log('=== WebOS TrainX Submission Packager ===');

const projectRoot = process.cwd();
const zipFileName = 'WebOS-TrainX-Submission.zip';
const zipFilePath = path.join(projectRoot, zipFileName);

// Remove existing zip if present
if (fs.existsSync(zipFilePath)) {
  fs.unlinkSync(zipFilePath);
}

// Ensure .git exists
const gitDir = path.join(projectRoot, '.git');
if (!fs.existsSync(gitDir)) {
  console.error('ERROR: .git directory not found in project root!');
  process.exit(1);
}

// Temporary staging directory for clean packaging
const stageDir = path.join(projectRoot, '.trainx_staging', 'WebOs');
if (fs.existsSync(path.join(projectRoot, '.trainx_staging'))) {
  fs.rmSync(path.join(projectRoot, '.trainx_staging'), { recursive: true, force: true });
}
fs.mkdirSync(stageDir, { recursive: true });

console.log('Staging files for packaging...');

const EXCLUDE_NAMES = new Set([
  'node_modules',
  'dist',
  'coverage',
  'build',
  '.cache',
  '__pycache__',
  '.trainx_staging',
  '.tempmediaStorage',
  '.system_generated',
  'scratch',
  zipFileName,
]);

function copyDirRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDE_NAMES.has(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDirRecursive(projectRoot, stageDir);

console.log('Creating ZIP archive containing WebOs/ root and .git/...');

const stagingParent = path.join(projectRoot, '.trainx_staging');

// Use tar or powershell Compress-Archive to create the zip
try {
  // Using tar -a -cf WebOS-TrainX-Submission.zip WebOs
  cp.execSync('tar -a -cf "' + zipFilePath + '" WebOs', {
    cwd: stagingParent,
    stdio: 'inherit',
  });
  console.log('Archive created successfully via tar.');
} catch (e) {
  console.log('Falling back to PowerShell Compress-Archive...');
  cp.execSync('powershell -Command "Compress-Archive -Path \'' + stageDir + '\' -DestinationPath \'' + zipFilePath + '\' -Force"', {
    stdio: 'inherit',
  });
}

// Cleanup staging
fs.rmSync(stagingParent, { recursive: true, force: true });

console.log('Verifying ZIP package...');
const stats = fs.statSync(zipFilePath);
console.log('ZIP Created: ' + zipFilePath + ' (' + (stats.size / (1024 * 1024)).toFixed(2) + ' MB)');

// Also copy to Desktop root for easy user access if desired
const desktopZip = path.resolve(projectRoot, '..', zipFileName);
try {
  fs.copyFileSync(zipFilePath, desktopZip);
  console.log('Copied ZIP to Desktop: ' + desktopZip);
} catch (e) {
  // Ignored if permissions restrict
}

console.log('TrainX Packaging complete!');
