import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const rootDir = process.cwd();
const luminaryDir = path.join(rootDir, 'luminary');
const publicDir = path.join(rootDir, 'public');

// Ensure directories
fs.mkdirSync(path.join(luminaryDir, 'assets', 'css'), { recursive: true });
fs.mkdirSync(path.join(luminaryDir, 'assets', 'js'), { recursive: true });
fs.mkdirSync(path.join(luminaryDir, 'assets', 'images'), { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });
fs.mkdirSync(path.join(publicDir, 'assets', 'images'), { recursive: true });

// Copy screenshot if needed
if (fs.existsSync('/screenshot.png') && !fs.existsSync(path.join(rootDir, 'screenshot.png'))) {
  fs.copyFileSync('/screenshot.png', path.join(rootDir, 'screenshot.png'));
}

const rootFiles = [
  'style.css',
  'functions.php',
  'index.php',
  'header.php',
  'footer.php',
  'front-page.php',
  'page.php',
  'single.php',
  'archive.php',
  '404.php',
  'sidebar.php',
  'comments.php',
  'search.php',
  'screenshot.png'
];

for (const file of rootFiles) {
  const src = path.join(rootDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(luminaryDir, file));
  } else {
    console.warn(`File ${file} not found in root`);
  }
}

// Assets
if (fs.existsSync(path.join(rootDir, 'assets', 'css', 'main.css'))) {
  fs.copyFileSync(
    path.join(rootDir, 'assets', 'css', 'main.css'),
    path.join(luminaryDir, 'assets', 'css', 'main.css')
  );
}

if (fs.existsSync(path.join(rootDir, 'assets', 'js', 'main.js'))) {
  fs.copyFileSync(
    path.join(rootDir, 'assets', 'js', 'main.js'),
    path.join(luminaryDir, 'assets', 'js', 'main.js')
  );
}

const imagesDir = path.join(rootDir, 'assets', 'images');
if (fs.existsSync(imagesDir)) {
  const images = fs.readdirSync(imagesDir);
  for (const img of images) {
    fs.copyFileSync(path.join(imagesDir, img), path.join(luminaryDir, 'assets', 'images', img));
    fs.copyFileSync(path.join(imagesDir, img), path.join(publicDir, 'assets', 'images', img));
  }
}

// Copy screenshot to public
if (fs.existsSync(path.join(rootDir, 'screenshot.png'))) {
  fs.copyFileSync(path.join(rootDir, 'screenshot.png'), path.join(publicDir, 'screenshot.png'));
}

console.log('Copied all theme files to luminary/ directory.');

// Now create public/luminary.zip using JSZip
async function createZip() {
  const zip = new JSZip();
  // Standard WordPress theme zip packaging: the theme root folder 'luminary' inside the zip
  const themeFolder = zip.folder('luminary');

  function addDirToZip(zipFolder, localDirPath) {
    const items = fs.readdirSync(localDirPath);
    for (const item of items) {
      const fullPath = path.join(localDirPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const subFolder = zipFolder.folder(item);
        addDirToZip(subFolder, fullPath);
      } else {
        const content = fs.readFileSync(fullPath);
        zipFolder.file(item, content);
      }
    }
  }

  addDirToZip(themeFolder, luminaryDir);

  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  const zipPath = path.join(publicDir, 'luminary.zip');
  fs.writeFileSync(zipPath, zipBuffer);
  console.log(`Generated public/luminary.zip (${(zipBuffer.length / 1024).toFixed(1)} KB)`);
}

createZip().catch(err => {
  console.error('Error creating zip:', err);
  process.exit(1);
});
