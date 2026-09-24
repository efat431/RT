import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

const files = [
  { name: 'style.css', path: 'style.css', type: 'css', desc: 'Main theme stylesheet with standard WordPress metadata header.' },
  { name: 'functions.php', path: 'functions.php', type: 'php', desc: 'Theme setup, navigation menus, widget areas, scripts/styles enqueue, and Customizer API.' },
  { name: 'front-page.php', path: 'front-page.php', type: 'php', desc: 'Homepage template with hero section, capabilities bento grid, portfolio, and contact inquiry.' },
  { name: 'header.php', path: 'header.php', type: 'php', desc: 'Site header with wp_head(), skip link, branding, wp_nav_menu(), and mobile drawer.' },
  { name: 'footer.php', path: 'footer.php', type: 'php', desc: 'Site footer with dynamic widget columns, copyright notice, back-to-top button, and wp_footer().' },
  { name: 'index.php', path: 'index.php', type: 'php', desc: 'Primary fallback template and main blog post query loop with numbered pagination.' },
  { name: 'single.php', path: 'single.php', type: 'php', desc: 'Single post template with category breadcrumbs, reading time, author bio box, and comments.' },
  { name: 'page.php', path: 'page.php', type: 'php', desc: 'Standard static page template with full content output and multi-page link pagination.' },
  { name: 'archive.php', path: 'archive.php', type: 'php', desc: 'Category, tag, author, and date archive template with archive header and post grid.' },
  { name: '404.php', path: '404.php', type: 'php', desc: 'Helpful 404 error template with search form, recent article shortcuts, and home button.' },
  { name: 'sidebar.php', path: 'sidebar.php', type: 'php', desc: 'Widget area container with dynamic_sidebar() and polished default widgets.' },
  { name: 'comments.php', path: 'comments.php', type: 'php', desc: 'Accessible comments template with threaded discussion and standard comment form.' },
  { name: 'search.php', path: 'search.php', type: 'php', desc: 'Search query results template displaying matching articles with search keyword highlight.' },
  { name: 'assets/css/main.css', path: 'assets/css/main.css', type: 'css', desc: 'Comprehensive production CSS with design tokens, responsive typography, and layout.' },
  { name: 'assets/js/main.js', path: 'assets/js/main.js', type: 'javascript', desc: 'Lightweight vanilla JS for mobile menu, scroll effects, and keyboard accessibility.' },
];

const fileData = files.map(f => {
  const fullPath = path.join(rootDir, f.path);
  const content = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
  const lines = content.split('\n').length;
  const size = (Buffer.byteLength(content, 'utf8') / 1024).toFixed(1) + ' KB';
  return {
    ...f,
    lines,
    size,
    content
  };
});

const output = `// Auto-generated theme file definitions
export interface ThemeFile {
  name: string;
  path: string;
  type: string;
  desc: string;
  lines: number;
  size: string;
  content: string;
}

export const THEME_FILES: ThemeFile[] = ${JSON.stringify(fileData, null, 2)};
`;

fs.writeFileSync(path.join(rootDir, 'src', 'themeFilesData.ts'), output);
console.log('Successfully generated src/themeFilesData.ts with', fileData.length, 'theme files');
