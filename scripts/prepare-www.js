const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const www = path.join(root, 'www');

if (!fs.existsSync(www)) fs.mkdirSync(www, { recursive: true });

// HTML 파일 복사
fs.copyFileSync(path.join(root, 'walk-growth.html'), path.join(www, 'index.html'));

// CSS 파일 복사
const cssPath = path.join(root, 'styles.css');
if (fs.existsSync(cssPath)) {
  fs.copyFileSync(cssPath, path.join(www, 'styles.css'));
  console.log('styles.css 복사 완료');
}

// JavaScript 파일 복사
const jsPath = path.join(root, 'app.js');
if (fs.existsSync(jsPath)) {
  fs.copyFileSync(jsPath, path.join(www, 'app.js'));
  console.log('app.js 복사 완료');
}

// 아이콘 파일 복사
fs.copyFileSync(path.join(root, 'icon.svg'), path.join(www, 'icon.svg'));

// walkstory-logo.png 복사
const logoPath = path.join(root, 'walkstory-logo.png');
if (fs.existsSync(logoPath)) {
  fs.copyFileSync(logoPath, path.join(www, 'walkstory-logo.png'));
  console.log('walkstory-logo.png 복사 완료');
}

// Service Worker 복사 및 수정
let sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
sw = sw.replace("'./walk-growth.html'", "'./index.html'");
fs.writeFileSync(path.join(www, 'sw.js'), sw);

// manifest.json 복사 및 수정
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
manifest.start_url = './';
fs.writeFileSync(path.join(www, 'manifest.json'), JSON.stringify(manifest, null, 2));

// config.js 파일이 있으면 복사
const configPath = path.join(root, 'config.js');
if (fs.existsSync(configPath)) {
  fs.copyFileSync(configPath, path.join(www, 'config.js'));
  console.log('config.js 복사 완료');
}

console.log('www 폴더 준비 완료 (index.html, styles.css, app.js, manifest.json, icon.svg, sw.js, walkstory-logo.png)');
