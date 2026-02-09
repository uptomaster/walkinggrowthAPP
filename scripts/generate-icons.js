const fs = require('fs');
const path = require('path');

// walkstory-logo.png를 Android 아이콘으로 변환하는 스크립트
// sharp 패키지 사용 (npm install sharp 필요)

const root = path.join(__dirname, '..');
const logoPath = path.join(root, 'walkstory-logo.png');
const androidRes = path.join(root, 'android', 'app', 'src', 'main', 'res');

// Android 아이콘 크기 정의
const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

if (!fs.existsSync(logoPath)) {
  console.error('❌ walkstory-logo.png를 찾을 수 없습니다:', logoPath);
  console.log('프로젝트 루트에 walkstory-logo.png 파일이 있는지 확인하세요.');
  process.exit(1);
}

// sharp 패키지 사용 시도
let sharp;
try {
  sharp = require('sharp');
} catch (err) {
  console.log('⚠ sharp 패키지가 설치되지 않았습니다.');
  console.log('다음 명령어로 설치하세요: npm install sharp');
  console.log('\n또는 수동으로 아이콘을 생성할 수 있습니다:');
  console.log('1. walkstory-logo.png를 이미지 편집 프로그램으로 열기');
  console.log('2. 다음 크기로 저장:');
  Object.keys(iconSizes).forEach(function(folder) {
    const size = iconSizes[folder];
    console.log(`   - android/app/src/main/res/${folder}/ic_launcher.png (${size}x${size})`);
    console.log(`   - android/app/src/main/res/${folder}/ic_launcher_round.png (${size}x${size})`);
    console.log(`   - android/app/src/main/res/${folder}/ic_launcher_foreground.png (${size}x${size})`);
  });
  process.exit(1);
}

console.log('🔄 Android 아이콘 생성 중...');

// sharp를 사용하여 아이콘 생성
(async function() {
  try {
    for (const folder of Object.keys(iconSizes)) {
      const size = iconSizes[folder];
      const folderPath = path.join(androidRes, folder);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      
      const outputPath = path.join(folderPath, 'ic_launcher.png');
      const roundOutputPath = path.join(folderPath, 'ic_launcher_round.png');
      const foregroundPath = path.join(folderPath, 'ic_launcher_foreground.png');
      
      // 원본 로고를 아이콘 크기로 리사이즈
      await sharp(logoPath)
        .resize(size, size, { fit: 'contain', background: { r: 15, g: 20, b: 25, alpha: 1 } })
        .png()
        .toFile(outputPath);
      
      await sharp(logoPath)
        .resize(size, size, { fit: 'contain', background: { r: 15, g: 20, b: 25, alpha: 1 } })
        .png()
        .toFile(roundOutputPath);
      
      await sharp(logoPath)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(foregroundPath);
      
      console.log(`✓ ${folder}/ic_launcher.png 생성 완료 (${size}x${size})`);
    }
    
    console.log('\n✅ 아이콘 생성 완료!');
    console.log('\n다음 단계:');
    console.log('1. npm run cap:sync');
    console.log('2. npx cap open android');
    console.log('3. Android Studio에서 앱을 다시 빌드하세요');
  } catch (err) {
    console.error('❌ 아이콘 생성 중 오류:', err.message);
    process.exit(1);
  }
})();
