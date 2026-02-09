const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const www = path.join(root, 'www');

if (!fs.existsSync(www)) fs.mkdirSync(www, { recursive: true });

fs.copyFileSync(path.join(root, 'walk-growth.html'), path.join(www, 'index.html'));
fs.copyFileSync(path.join(root, 'icon.svg'), path.join(www, 'icon.svg'));
// walkstory-logo.png 복사
const logoPath = path.join(root, 'walkstory-logo.png');
if (fs.existsSync(logoPath)) {
  fs.copyFileSync(logoPath, path.join(www, 'walkstory-logo.png'));
  console.log('walkstory-logo.png 복사 완료');
}
let sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
sw = sw.replace("'./walk-growth.html'", "'./index.html'");
fs.writeFileSync(path.join(www, 'sw.js'), sw);

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
manifest.start_url = './';
fs.writeFileSync(path.join(www, 'manifest.json'), JSON.stringify(manifest, null, 2));

console.log('www 폴더 준비 완료 (index.html, manifest.json, icon.svg, sw.js, walkstory-logo.png)');
