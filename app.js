(function () {
  const GOAL = 10000;
  // API_BASE 설정: 모바일 앱 감지 우선순위로 처리
  var API_BASE = '';
  var isCapacitorApp = typeof window !== 'undefined' && window.isCapacitorApp;
  
  // 모바일 앱 감지: 여러 방법으로 확인
  var isMobileApp = isCapacitorApp || 
    (typeof location !== 'undefined' && location.protocol === 'capacitor:') ||
    (typeof location !== 'undefined' && location.hostname === 'localhost' && navigator.userAgent && navigator.userAgent.includes('Android') && !navigator.userAgent.includes('Chrome/')) ||
    (navigator.userAgent && navigator.userAgent.includes('Capacitor'));
  
  if (isMobileApp) {
    // 모바일 앱에서는 항상 Vercel URL 사용
    API_BASE = 'https://walkinggrowth-app.vercel.app';
    console.log('모바일 앱 감지됨 - Vercel URL 사용');
  } else if (typeof location !== 'undefined') {
    if (location.protocol === 'file:') {
      API_BASE = 'http://localhost:3000';
    } else if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      // localhost 접속 시: 추가로 모바일 앱인지 확인
      // Android WebView는 Chrome이 아닌 경우가 많음
      var isAndroidApp = navigator.userAgent && 
        navigator.userAgent.includes('Android') && 
        !navigator.userAgent.includes('Chrome/') &&
        !navigator.userAgent.includes('Version/');
      
      if (isAndroidApp || isCapacitorApp) {
        // 모바일 앱에서는 Vercel URL 사용
        API_BASE = 'https://walkinggrowth-app.vercel.app';
        console.log('localhost 접속이지만 모바일 앱으로 감지됨 - Vercel URL 사용');
      } else {
        // 웹 브라우저에서 localhost 접속 시에만 로컬 서버 사용
        API_BASE = 'http://localhost:3000';
      }
    } else {
      // 웹 브라우저에서는 현재 도메인 사용
      API_BASE = location.origin;
    }
  } else {
    // location이 없는 경우 - 모바일 앱일 가능성이 높음
    API_BASE = 'https://walkinggrowth-app.vercel.app';
  }
  
  console.log('API_BASE 설정 완료:', {
    API_BASE: API_BASE,
    location: typeof location !== 'undefined' ? location.href : 'N/A',
    protocol: typeof location !== 'undefined' ? location.protocol : 'N/A',
    hostname: typeof location !== 'undefined' ? location.hostname : 'N/A',
    isCapacitorApp: isCapacitorApp,
    isMobileApp: isMobileApp,
    Capacitor: typeof window !== 'undefined' && window.Capacitor !== undefined,
    userAgent: navigator.userAgent
  });
  const TOKEN_KEY = 'walk_token';
  function getAuthToken() { try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return null; } }
  function setAuthToken(t) { try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch (e) {} }
  function clearAuthToken() { setAuthToken(null); }
  const STORAGE_KEYS = {
    pet: 'walk_pet',
    steps: 'pedometer_steps',
    date: 'pedometer_date',
    lifetime: 'walk_lifetime_steps',
    avatar: 'walk_avatar',
    inventory: 'walk_inventory',
    equipped: 'walk_equipped',
    claimed: 'walk_claimed_routes',
    courseGoal: 'walk_course_goal_km',
    totalXp: 'walk_total_xp',
    supplyDate: 'walk_supply_date',
    supplyCount: 'walk_supply_count',
    userRoutes: 'walk_user_routes',
    gold: 'walk_gold',
    theme: 'walk_theme',
    totalWalkKm: 'walk_total_km',
    currentTitle: 'walk_current_title',
    storage: 'walk_storage',
    questProgress: 'walk_quest_progress',
    questDate: 'walk_quest_date',
    sharedDate: 'walk_shared_date',
    user: 'walk_user',
    loggedIn: 'walk_logged_in',
    attendanceDate: 'walk_attendance_date',
    attendanceStreak: 'walk_attendance_streak',
    tutorialCompleted: 'walk_tutorial_completed',
    wildAnimals: 'walk_wild_animals',
    capturedAnimals: 'walk_captured_animals',
    partnerPoints: 'walk_partner_points',
    equipmentCodexOwned: 'walk_equipment_codex_owned'
  };
  var ATTENDANCE_DAILY_GOLD = [10, 15, 20, 25, 30, 40];
  var ATTENDANCE_7DAY_BOX_NAME = '위클리 마스터 선물상자';
  var ATTENDANCE_7DAY_GOLD = 100;
  const XP_PER_KM = 100;
  const GACHA_COST = 30;
  const GACHA_PREMIUM_COST = 60;
  const STARTING_GOLD = 500;
  const ENHANCE_MAX = 7;
  var ENHANCE_RATES = [95, 90, 85, 75, 60, 45, 30];
  var ENHANCE_ATTEMPT_GOLD = [0, 0, 0, 20, 35, 50, 50];
  var DAILY_QUESTS = [
    { id: 'q_steps', name: '걸음 걸기', desc: '오늘 3,000걸음', goal: 3000, reward: 25, getProgress: function() { return steps; } },
    { id: 'q_walk', name: '산책 완주', desc: '코스 1회 완주', goal: 1, reward: 60, getProgress: function() { return userRoutes.filter(function(r){ return r.completedAt && new Date(r.completedAt).toISOString().slice(0,10) === todayStr(); }).length; } },
    { id: 'q_gacha', name: '보급 뽑기', desc: '보급 1회 뽑기', goal: 1, reward: 15, getProgress: function() { return questGachaCount; } },
    { id: 'q_share', name: '링크 공유', desc: '카카오톡 등으로 공유', goal: 1, reward: 40, getProgress: function() { return sharedToday ? 1 : 0; } }
  ];
  var questGachaCount = 0;
  var questClaimed = {};
  var sharedToday = false;
  var TITLES = [
    { id: 'walker', name: '산책러', minKm: 0 },
    { id: 'short', name: '단거리 선수', minKm: 1 },
    { id: 'long', name: '장거리 선수', minKm: 10 },
    { id: 'marathon', name: '마라토너', minKm: 42.195 },
    { id: 'master', name: '마스터 러너', minKm: 100 }
  ];
  function getTitleForKm(km) {
    var t = TITLES[0];
    for (var i = TITLES.length - 1; i >= 0; i--) {
      if (km >= TITLES[i].minKm) { t = TITLES[i]; break; }
    }
    return t;
  }
  function xpToLevel(xp) {
    if (xp <= 0) return { level: 1, current: 0, need: 100 };
    var level = 1 + Math.floor(Math.sqrt(xp / 50));
    var prevXp = 50 * (level - 1) * (level - 1);
    var nextXp = 50 * level * level;
    return { level: level, current: xp - prevXp, need: nextXp - prevXp };
  }
  // 야생 동물 데이터
  var WILD_ANIMALS = [
    // 커먼 (60%)
    { id: 'rabbit', name: '토끼', emoji: '🐰', rarity: 'common', spawnChance: 0.3, description: '귀여운 토끼예요!' },
    { id: 'squirrel', name: '다람쥐', emoji: '🐿️', rarity: 'common', spawnChance: 0.3, description: '재빠른 다람쥐예요!' },
    { id: 'bird', name: '새', emoji: '🐦', rarity: 'common', spawnChance: 0.25, description: '자유로운 새예요!' },
    { id: 'duck', name: '오리', emoji: '🦆', rarity: 'common', spawnChance: 0.15, description: '물가의 오리예요!' },
    // 레어 (25%)
    { id: 'deer', name: '사슴', emoji: '🦌', rarity: 'rare', spawnChance: 0.15, description: '우아한 사슴이에요!' },
    { id: 'fox', name: '여우', emoji: '🦊', rarity: 'rare', spawnChance: 0.12, description: '영리한 여우예요!' },
    { id: 'hedgehog', name: '고슴도치', emoji: '🦔', rarity: 'rare', spawnChance: 0.1, description: '뾰족한 고슴도치예요!' },
    { id: 'owl', name: '부엉이', emoji: '🦉', rarity: 'rare', spawnChance: 0.08, description: '지혜로운 부엉이예요!' },
    // 에픽 (12%)
    { id: 'wolf', name: '늑대', emoji: '🐺', rarity: 'epic', spawnChance: 0.05, description: '강인한 늑대예요!' },
    { id: 'bear', name: '곰', emoji: '🐻', rarity: 'epic', spawnChance: 0.04, description: '힘센 곰이에요!' },
    { id: 'eagle', name: '독수리', emoji: '🦅', rarity: 'epic', spawnChance: 0.03, description: '위엄 있는 독수리예요!' },
    // 레전드 (3%)
    { id: 'phoenix', name: '불사조', emoji: '🔥', rarity: 'legend', spawnChance: 0.01, description: '전설의 불사조예요!' },
    { id: 'dragon', name: '용', emoji: '🐉', rarity: 'legend', spawnChance: 0.008, description: '신화 속 용이에요!' },
    { id: 'unicorn', name: '유니콘', emoji: '🦄', rarity: 'legend', spawnChance: 0.007, description: '마법의 유니콘이에요!' },
    { id: 'pegasus', name: '페가수스', emoji: '🦋', rarity: 'legend', spawnChance: 0.005, description: '하늘을 나는 페가수스예요!' }
  ];
  
  var ACHIEVEMENTS = [
    { id: 'first_walk', name: '첫 걸음', desc: '첫 산책 시작', icon: '👣', check: function() { return totalXp >= 10; } },
    { id: 'km1', name: '1km 달성', desc: '총 1km 산책', icon: '🛤️', check: function() { return totalXp >= 100; } },
    { id: 'km5', name: '5km 달성', desc: '총 5km 산책', icon: '🏃', check: function() { return totalXp >= 500; } },
    { id: 'course1', name: '코스 완주', desc: '첫 코스 완주', icon: '🏁', check: function() { return (userRoutes.filter(function(r){ return r.completedAt; }).length) >= 1; } },
    { id: 'steps10k', name: '만보 달인', desc: '하루 10,000걸음', icon: '🎯', check: function() { return steps >= 10000 || lifetimeSteps >= 10000; } },
    { id: 'rare', name: '레어 수집가', desc: '레어 이상 장비 획득', icon: '✨', check: function() { return inventory.some(function(i){ return i.rarity === 'rare' || i.rarity === 'epic' || i.rarity === 'legend'; }); } },
    { id: 'legend', name: '레전드', desc: '레전드 장비 획득', icon: '🌟', check: function() { return inventory.some(function(i){ return i.rarity === 'legend'; }); } },
    { id: 'level5', name: '레벨 5', desc: 'Lv.5 달성', icon: '⬆️', check: function() { return xpToLevel(totalXp).level >= 5; } }
  ];
  var RARITY_WEIGHTS = [60, 25, 12, 3];
  var RARITY_NAMES = ['common', 'rare', 'epic', 'legend'];
  var TIER_LABELS = { standard: '스탠다드', pro: '프로', prime: '프라임', signature: '시그니처' };
  var SUPPLY_POOL = [
    { id: 'shoe_1', name: '레볼루션', type: 'shoes', emoji: '👟', tier: 'standard' },
    { id: 'shoe_2', name: '다운시프터', type: 'shoes', emoji: '👟', tier: 'standard' },
    { id: 'shoe_3', name: '윈플로', type: 'shoes', emoji: '👟', tier: 'standard' },
    { id: 'shoe_4', name: '갤럭시 러닝화', type: 'shoes', emoji: '👟', tier: 'standard' },
    { id: 'shoe_5', name: '페가수스', type: 'shoes', emoji: '👟', tier: 'pro' },
    { id: 'shoe_6', name: '리액트', type: 'shoes', emoji: '👟', tier: 'pro' },
    { id: 'shoe_7', name: '노바블라스트', type: 'shoes', emoji: '👟', tier: 'pro' },
    { id: 'shoe_8', name: '클라우드', type: 'shoes', emoji: '👟', tier: 'pro' },
    { id: 'shoe_9', name: '프라임', type: 'shoes', emoji: '👟', tier: 'prime' },
    { id: 'shoe_10', name: '울트라부스트', type: 'shoes', emoji: '👟', tier: 'prime' },
    { id: 'shoe_11', name: '호카 클리프톤', type: 'shoes', emoji: '👟', tier: 'prime' },
    { id: 'shoe_12', name: '젤 카야노', type: 'shoes', emoji: '👟', tier: 'prime' },
    { id: 'shoe_13', name: '엔돌핀 스피드', type: 'shoes', emoji: '👟', tier: 'prime' },
    { id: 'shoe_14', name: '알파플라이', type: 'shoes', emoji: '👟', tier: 'signature' },
    { id: 'shoe_15', name: '베이퍼플라이', type: 'shoes', emoji: '👟', tier: 'signature' },
    { id: 'shoe_16', name: '아디제로 아디오스 프로', type: 'shoes', emoji: '👟', tier: 'signature' },
    { id: 'shoe_17', name: '메타스피드 스카이', type: 'shoes', emoji: '👟', tier: 'signature' },
    { id: 'watch_1', name: '샤오미 밴드', type: 'accessory', emoji: '⌚', tier: 'standard' },
    { id: 'watch_2', name: '갤럭시 핏', type: 'accessory', emoji: '⌚', tier: 'standard' },
    { id: 'watch_3', name: '미밴드', type: 'accessory', emoji: '⌚', tier: 'standard' },
    { id: 'watch_4', name: '핏빗 차지', type: 'accessory', emoji: '⌚', tier: 'pro' },
    { id: 'watch_5', name: '갤럭시 워치', type: 'accessory', emoji: '⌚', tier: 'pro' },
    { id: 'watch_6', name: '애플워치 SE', type: 'accessory', emoji: '⌚', tier: 'pro' },
    { id: 'watch_7', name: '가민 포러너', type: 'accessory', emoji: '⌚', tier: 'prime' },
    { id: 'watch_8', name: '가민 베뉴', type: 'accessory', emoji: '⌚', tier: 'prime' },
    { id: 'watch_9', name: '애플워치 울트라', type: 'accessory', emoji: '⌚', tier: 'prime' },
    { id: 'watch_10', name: '가민 피닉스', type: 'accessory', emoji: '⌚', tier: 'signature' },
    { id: 'watch_11', name: '코로스 버텍스', type: 'accessory', emoji: '⌚', tier: 'signature' },
    { id: 'watch_12', name: '순토 버티컬', type: 'accessory', emoji: '⌚', tier: 'signature' },
    { id: 'ear_1', name: 'QCY', type: 'accessory', emoji: '🎧', tier: 'standard' },
    { id: 'ear_2', name: '샤오미 버즈', type: 'accessory', emoji: '🎧', tier: 'standard' },
    { id: 'ear_3', name: '유선 스포츠 이어폰', type: 'accessory', emoji: '🎧', tier: 'standard' },
    { id: 'ear_4', name: '에어팟', type: 'accessory', emoji: '🎧', tier: 'pro' },
    { id: 'ear_5', name: '갤럭시 버즈', type: 'accessory', emoji: '🎧', tier: 'pro' },
    { id: 'ear_6', name: '제이버드', type: 'accessory', emoji: '🎧', tier: 'pro' },
    { id: 'ear_7', name: '보스 스포츠', type: 'accessory', emoji: '🎧', tier: 'prime' },
    { id: 'ear_8', name: '샥즈 오픈런', type: 'accessory', emoji: '🎧', tier: 'prime' },
    { id: 'ear_9', name: '젠하이저 스포츠', type: 'accessory', emoji: '🎧', tier: 'prime' },
    { id: 'ear_10', name: '샥즈 오픈런 프로', type: 'accessory', emoji: '🎧', tier: 'signature' },
    { id: 'ear_11', name: '보스 울트라', type: 'accessory', emoji: '🎧', tier: 'signature' },
    { id: 'ear_12', name: '소니 XM', type: 'accessory', emoji: '🎧', tier: 'signature' },
    { id: 'bag_1', name: '나이키 슬링백', type: 'accessory', emoji: '🎒', tier: 'standard' },
    { id: 'bag_2', name: '데카트론 백', type: 'accessory', emoji: '🎒', tier: 'standard' },
    { id: 'bag_3', name: '미니 웨이스트백', type: 'accessory', emoji: '🎒', tier: 'standard' },
    { id: 'bag_4', name: '나이키 러닝 베스트', type: 'accessory', emoji: '🎒', tier: 'pro' },
    { id: 'bag_5', name: '살로몬 액티브', type: 'accessory', emoji: '🎒', tier: 'pro' },
    { id: 'bag_6', name: '언더아머 러닝백', type: 'accessory', emoji: '🎒', tier: 'pro' },
    { id: 'bag_7', name: '오스프리 탤런', type: 'accessory', emoji: '🎒', tier: 'prime' },
    { id: 'bag_8', name: '살로몬 ADV 스킨', type: 'accessory', emoji: '🎒', tier: 'prime' },
    { id: 'bag_9', name: '노스페이스 러닝팩', type: 'accessory', emoji: '🎒', tier: 'prime' },
    { id: 'bag_10', name: '아크테릭스 백팩', type: 'accessory', emoji: '🎒', tier: 'signature' },
    { id: 'bag_11', name: '살로몬 S/LAB', type: 'accessory', emoji: '🎒', tier: 'signature' },
    { id: 'bag_12', name: '파타고니아 테크팩', type: 'accessory', emoji: '🎒', tier: 'signature' },
    { id: 'top_1', name: '드라이핏 티', type: 'top', emoji: '👕', tier: 'standard' },
    { id: 'top_2', name: '쿨론 티', type: 'top', emoji: '👕', tier: 'standard' },
    { id: 'top_3', name: '에어리즘', type: 'top', emoji: '👕', tier: 'standard' },
    { id: 'top_4', name: '언더아머 테크핏', type: 'top', emoji: '👕', tier: 'pro' },
    { id: 'top_5', name: '나이키 러닝 탑', type: 'top', emoji: '👕', tier: 'pro' },
    { id: 'top_6', name: '아디다스 에어로레디', type: 'top', emoji: '👕', tier: 'pro' },
    { id: 'top_7', name: '나이키 드라이핏 ADV', type: 'top', emoji: '👕', tier: 'prime' },
    { id: 'top_8', name: '룰루레몬 러닝탑', type: 'top', emoji: '👕', tier: 'prime' },
    { id: 'top_9', name: '파타고니아 러닝탑', type: 'top', emoji: '👕', tier: 'prime' },
    { id: 'top_10', name: '아크테릭스 프로톤', type: 'top', emoji: '👕', tier: 'signature' },
    { id: 'top_11', name: '아크테릭스 코어로프트', type: 'top', emoji: '👕', tier: 'signature' },
    { id: 'top_12', name: '노스페이스 서밋', type: 'top', emoji: '👕', tier: 'signature' },
    { id: 'bottom_1', name: '러닝 쇼츠', type: 'bottom', emoji: '👖', tier: 'standard' },
    { id: 'bottom_2', name: '쿨론 팬츠', type: 'bottom', emoji: '👖', tier: 'standard' },
    { id: 'bottom_3', name: '트레이닝 팬츠', type: 'bottom', emoji: '👖', tier: 'standard' },
    { id: 'bottom_4', name: '나이키 플렉스', type: 'bottom', emoji: '👖', tier: 'pro' },
    { id: 'bottom_5', name: '언더아머 러닝 쇼츠', type: 'bottom', emoji: '👖', tier: 'pro' },
    { id: 'bottom_6', name: '아디다스 러닝 타이츠', type: 'bottom', emoji: '👖', tier: 'pro' },
    { id: 'bottom_7', name: '룰루 서지', type: 'bottom', emoji: '👖', tier: 'prime' },
    { id: 'bottom_8', name: '나이키 ADV 팬츠', type: 'bottom', emoji: '👖', tier: 'prime' },
    { id: 'bottom_9', name: '2XU 컴프레션', type: 'bottom', emoji: '👖', tier: 'prime' },
    { id: 'bottom_10', name: '아크테릭스 감마', type: 'bottom', emoji: '👖', tier: 'signature' },
    { id: 'bottom_11', name: '아크테릭스 러닝 타이츠', type: 'bottom', emoji: '👖', tier: 'signature' },
    { id: 'bottom_12', name: 'CEP 프로라인', type: 'bottom', emoji: '👖', tier: 'signature' },
    { id: 'guard_1', name: '일반 무릎 보호대', type: 'guard', emoji: '🛡', tier: 'standard' },
    { id: 'guard_2', name: '기본 압박 슬리브', type: 'guard', emoji: '🛡', tier: 'standard' },
    { id: 'guard_3', name: '맥데이비드', type: 'guard', emoji: '🛡', tier: 'pro' },
    { id: 'guard_4', name: '나이키 프로', type: 'guard', emoji: '🛡', tier: 'pro' },
    { id: 'guard_5', name: '2XU', type: 'guard', emoji: '🛡', tier: 'prime' },
    { id: 'guard_6', name: '스킨스', type: 'guard', emoji: '🛡', tier: 'prime' },
    { id: 'guard_7', name: 'CEP', type: 'guard', emoji: '🛡', tier: 'signature' },
    { id: 'guard_8', name: 'BV SPORT', type: 'guard', emoji: '🛡', tier: 'signature' },
    { id: 'glove_1', name: '기본 러닝 장갑', type: 'accessory', emoji: '🧤', tier: 'standard' },
    { id: 'glove_2', name: '터치 장갑', type: 'accessory', emoji: '🧤', tier: 'standard' },
    { id: 'glove_3', name: '나이키 러닝글러브', type: 'accessory', emoji: '🧤', tier: 'pro' },
    { id: 'glove_4', name: '언더아머 장갑', type: 'accessory', emoji: '🧤', tier: 'pro' },
    { id: 'glove_5', name: '블랙다이아몬드', type: 'accessory', emoji: '🧤', tier: 'prime' },
    { id: 'glove_6', name: '노스페이스 러닝글러브', type: 'accessory', emoji: '🧤', tier: 'prime' },
    { id: 'glove_7', name: '헤스트라', type: 'accessory', emoji: '🧤', tier: 'signature' },
    { id: 'glove_8', name: '아크테릭스 글러브', type: 'accessory', emoji: '🧤', tier: 'signature' },
    { id: 'outer_1', name: '바람막이', type: 'top', emoji: '🧥', tier: 'standard' },
    { id: 'outer_2', name: '경량 자켓', type: 'top', emoji: '🧥', tier: 'standard' },
    { id: 'outer_3', name: '나이키 러닝 자켓', type: 'top', emoji: '🧥', tier: 'pro' },
    { id: 'outer_4', name: '아디다스 윈드자켓', type: 'top', emoji: '🧥', tier: 'pro' },
    { id: 'outer_5', name: '파타고니아 후디니', type: 'top', emoji: '🧥', tier: 'prime' },
    { id: 'outer_6', name: '노스페이스 플라이트', type: 'top', emoji: '🧥', tier: 'prime' },
    { id: 'outer_7', name: '아크테릭스 알파', type: 'top', emoji: '🧥', tier: 'signature' },
    { id: 'outer_8', name: '아크테릭스 베타', type: 'top', emoji: '🧥', tier: 'signature' },
    { id: 'outer_9', name: '노스페이스 서밋 시리즈', type: 'top', emoji: '🧥', tier: 'signature' }
  ];

  const ROUTES = [
    { id: 'r1', name: '동네 골목', steps: 500, icon: '🏘️', reward: { id: 'shoe_1', name: '레볼루션', type: 'shoes', emoji: '👟', tier: 'standard' } },
    { id: 'r2', name: '작은 공원', steps: 1000, icon: '🌳', reward: { id: 'top_1', name: '드라이핏 티', type: 'top', emoji: '👕', tier: 'standard' } },
    { id: 'r3', name: '시내 산책로', steps: 2000, icon: '🛤️', reward: { id: 'shoe_5', name: '페가수스', type: 'shoes', emoji: '👟', tier: 'pro' } },
    { id: 'r4', name: '강둑 길', steps: 3500, icon: '🌊', reward: { id: 'top_4', name: '언더아머 테크핏', type: 'top', emoji: '👕', tier: 'pro' } },
    { id: 'r5', name: '숲 입구', steps: 5000, icon: '🌲', reward: { id: 'watch_4', name: '핏빗 차지', type: 'accessory', emoji: '⌚', tier: 'pro' } },
    { id: 'r6', name: '호수 둘레길', steps: 7500, icon: '🏞️', reward: { id: 'ear_4', name: '에어팟', type: 'accessory', emoji: '🎧', tier: 'pro' } },
    { id: 'r7', name: '등산로 정상', steps: 10000, icon: '⛰️', reward: { id: 'shoe_14', name: '알파플라이', type: 'shoes', emoji: '👟', tier: 'signature' } }
  ];

  const SLOT_ORDER = ['shoes', 'watch', 'earphones', 'bag', 'top', 'bottom', 'guard', 'glove', 'outer'];
  const SLOT_LABELS = { shoes: '👟 신발', watch: '⌚ 시계/디바이스', earphones: '🎧 이어폰', bag: '🎒 가방/러닝베스트', top: '👕 상의', bottom: '👖 하의', guard: '🛡 보호대/컴프레션', glove: '🧤 장갑', outer: '🧥 아우터' };
  var TIER_WEIGHTS = { standard: 50, pro: 30, prime: 15, signature: 5 };
  /* 걸음 보너스 제거: 목표 걸음/거리 정확도 유지를 위해 step 보너스 없음 */
  var SLOT_BONUS_TYPE = { shoes: 'distance', watch: 'gold', earphones: 'gold', bag: 'xp', top: 'xp', bottom: 'xp', guard: 'xp', glove: 'xp', outer: 'xp' };
  var TIER_PERCENT = { standard: 1, pro: 2, prime: 3, signature: 5 };
  var SLOT_BONUS_LABEL = { xp: 'XP 보너스', distance: '이동 거리', gold: '골드 보너스' };
  function itemSlot(item) {
    if (!item || !item.id) return 'top';
    var id = item.id.replace(/_\d+$/, '');
    if (id.indexOf('shoe') === 0) return 'shoes';
    if (id.indexOf('watch') === 0) return 'watch';
    if (id.indexOf('ear') === 0) return 'earphones';
    if (id.indexOf('bag') === 0) return 'bag';
    if (id.indexOf('outer') === 0) return 'outer';
    if (id.indexOf('top') === 0) return 'top';
    if (id.indexOf('bottom') === 0) return 'bottom';
    if (id.indexOf('guard') === 0) return 'guard';
    if (id.indexOf('glove') === 0) return 'glove';
    var t = item.type;
    if (t === 'shoes') return 'shoes';
    if (t === 'bottom') return 'bottom';
    if (t === 'guard') return 'guard';
    if (t === 'accessory') return 'watch';
    return 'top';
  }
  function getItemIcon(item) {
    if (!item || item.type === 'supply_kit') return '📦';
    var slot = itemSlot(item);
    var icons = { shoes: ['👟','🥾','🏃','⚡','🔥','💨','✨','🌟','⭐','💫','🎯','🏁','👟','🥾','🏃','⚡','🔥'], watch: ['⌚','⌚','⌚','⌚','⌚','⌚','⌚','⌚','⌚','⌚','⌚','⌚'], earphones: ['🎧','🎧','🎧','🎧','🎧','🎧','🎧','🎧','🎧','🎧','🎧','🎧'], bag: ['🎒','🎒','🎒','🎒','🎒','🎒','🎒','🎒','🎒','🎒','🎒','🎒'], top: ['👕','👕','👕','👕','👕','👕','👕','👕','👕','👕','👕','👕'], bottom: ['👖','🩳','👖','🩳','👖','🩳','👖','🩳','👖','🩳','👖','🩳'], guard: ['🛡','🛡','🛡','🛡','🛡','🛡','🛡','🛡'], glove: ['🧤','🧤','🧤','🧤','🧤','🧤','🧤','🧤'], outer: ['🧥','🧥','🧥','🧥','🧥','🧥','🧥','🧥','🧥'] };
    var arr = icons[slot] || ['📦'];
    var baseId = (item.id || '').replace(/_\d+$/, '');
    var h = 0; for (var i = 0; i < baseId.length; i++) h = (h * 31 + baseId.charCodeAt(i)) | 0;
    return arr[Math.abs(h) % arr.length];
  }
  function getEquipmentBonus() {
    var b = { xp: 0, distance: 0, gold: 0, step: 0 };
    SLOT_ORDER.forEach(function(slot) {
      var itemId = equipped[slot];
      var item = itemId ? inventory.find(function(i){ return i.id === itemId; }) : null;
      if (!item) return;
      var pct = TIER_PERCENT[item.tier] || 1;
      var typ = SLOT_BONUS_TYPE[slot];
      if (typ && b[typ] !== undefined) b[typ] += pct;
    });
    return b;
  }
  function pickItemByTierWeight(premium) {
    var w = premium ? { standard: 35, pro: 30, prime: 22, signature: 13 } : TIER_WEIGHTS;
    var r = Math.random() * 100;
    var tier = 'standard';
    if (r < w.standard) tier = 'standard';
    else if (r < w.standard + w.pro) tier = 'pro';
    else if (r < w.standard + w.pro + w.prime) tier = 'prime';
    else tier = 'signature';
    var pool = SUPPLY_POOL.filter(function(i){ return (i.tier || 'standard') === tier; });
    if (pool.length === 0) pool = SUPPLY_POOL;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function rollRarityPremium() {
    var r = Math.random() * 100;
    if (r < 40) return 'common';
    if (r < 72) return 'rare';
    if (r < 92) return 'epic';
    return 'legend';
  }

  let steps = 0, lastDate = '', lifetimeSteps = 0;
  // 동물 데이터 (스타팅 펫 + 고유 능력)
  // NOTE: 스타팅 펫은 한 번만 선택 가능 (포켓몬 스타팅처럼)
  // 능력은 걸음 수/거리에는 영향을 주지 않고, 보상·경험·이벤트 쪽에만 영향을 준다.
  const PET_TYPES = [
    // 강아지: 경험치 파트너 - 걷기 관련 XP 보너스
    { id: 'dog', name: '강아지', emoji: '🐕', description: '충실한 경험치 파트너 (걷기 XP 보너스)', color: '#fbbf24', ability: 'xp_bonus' },
    // 고양이: 골드 헌터 - 골드 관련 보상 보너스
    { id: 'cat', name: '고양이', emoji: '🐱', description: '영리한 골드 헌터 (골드 보상 보너스)', color: '#f97316', ability: 'gold_bonus' },
    // 사자: 도전가 - 루트 경쟁/도전 관련 추가 리워드
    { id: 'lion', name: '사자', emoji: '🦁', description: '용맹한 도전가 (루트 도전 성공 시 추가 보상)', color: '#eab308', ability: 'route_challenge_bonus' },
    // 토끼: 퀘스트 러너 - 데일리 퀘스트 진행/완료 보너스
    { id: 'rabbit', name: '토끼', emoji: '🐰', description: '민첩한 퀘스트 러너 (퀘스트 보상 보너스)', color: '#fda4af', ability: 'quest_bonus' },
    // 곰: 수호자 - 출석/연속 출석 쪽 보너스
    { id: 'bear', name: '곰', emoji: '🐻', description: '든든한 수호자 (출석 보너스)', color: '#92400e', ability: 'attendance_bonus' },
    // 판다: 평온한 동료 - 튜토리얼·초보자 보호, 걷기 포인트 추가 획득
    { id: 'panda', name: '판다', emoji: '🐼', description: '평화로운 동료 (산책 포인트 추가 획득)', color: '#ffffff', ability: 'extra_partner_points' },
    // 여우: 수집가 - 도감/아이템 관련 추가 포인트
    { id: 'fox', name: '여우', emoji: '🦊', description: '영리한 수집가 (도감/아이템 수집 보너스)', color: '#f97316', ability: 'codex_bonus' },
    // 호랑이: 사냥꾼 - 야생 동물/유니크 동물 관련 보너스
    { id: 'tiger', name: '호랑이', emoji: '🐯', description: '강인한 사냥꾼 (야생 동물 보상 보너스)', color: '#fbbf24', ability: 'wild_bonus' }
  ];
  
  let pet = { type: null, level: 1, exp: 0, name: '' }; // 선택한 동물 정보
  // 파트너 포인트: 동물과 함께 걷고 플레이하며 쌓이는 특별 포인트 (리워드 교환용)
  var partnerPoints = 0;
  // 장비 도감에 영구 등록된 장비 (파괴 후에도 남도록)
  var equipmentCodexOwned = {};
  
  let avatar = { name: '산책러', skin: '#f5d0b0', hair: 'short', hairColor: '#4a3728' };
  let inventory = [];
  var storage = [];
  let equipped = { shoes: null, watch: null, earphones: null, bag: null, top: null, bottom: null, guard: null, glove: null, outer: null };
  let claimedRoutes = [];
  var userRoutes = [];
  var activeRouteId = null;
  var activeRouteGoalKm = 0;
  var walkState = 'idle';
  var courseGoalKm = 1;
  var totalXp = 0;
  var pathCoords = [];
  var sessionDistanceKm = 0;
  var sessionXp = 0;
  var watchId = null;
  var lastPositionTime = 0;
  var sessionStartTimeMs = 0;
  var lastSpeedKmh = 0; // 마지막 구간 속도 (km/h)
  var MIN_SEGMENT_KM = 0.005;
  var MAX_SPEED_KMH = 12;
  var tutorialCompleted = false;
  var wildAnimals = []; // 현재 주변에 스폰된 야생 동물들
  var capturedAnimals = []; // 포획한 동물 컬렉션
  var nearbyAnimalsCheckInterval = null;
  var supplyDateToday = '';
  var supplyCountToday = 0;
  var walkMapEl = null;
  var walkMapPathEl = null;
  var walkMapCharEl = null;
  var DEFAULT_BOUNDS = { minLat: 37.4, maxLat: 37.6, minLon: 126.9, maxLon: 127.2 };
  function ourMapBounds(coords) {
    if (!coords || coords.length === 0) return null;
    var minLat = coords[0].lat, maxLat = coords[0].lat, minLon = coords[0].lon, maxLon = coords[0].lon;
    coords.forEach(function(c) {
      if (c.lat < minLat) minLat = c.lat;
      if (c.lat > maxLat) maxLat = c.lat;
      if (c.lon < minLon) minLon = c.lon;
      if (c.lon > maxLon) maxLon = c.lon;
    });
    var padLat = Math.max(0.002, (maxLat - minLat) * 0.15);
    var padLon = Math.max(0.003, (maxLon - minLon) * 0.15);
    return { minLat: minLat - padLat, maxLat: maxLat + padLat, minLon: minLon - padLon, maxLon: maxLon + padLon };
  }
  function ourMapLatLonToXY(lat, lon, bounds, w, h) {
    var x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * w;
    var y = (1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * h;
    return { x: x, y: y };
  }
  var gold = STARTING_GOLD;
  var totalWalkDistanceKm = 0;
  var currentTitleId = 'walker';
  var userProfile = null;
  var isLoggedIn = false;
  var lastAttendanceDate = '';
  var attendanceStreak = 0;

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function loadAll() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.steps);
      const savedDate = localStorage.getItem(STORAGE_KEYS.date);
      const today = todayStr();
      if (saved != null && savedDate === today) {
        steps = parseInt(saved, 10) || 0;
      } else {
        if (saved != null && savedDate) lifetimeSteps += parseInt(localStorage.getItem(STORAGE_KEYS.steps) || '0', 10);
        steps = 0;
        localStorage.setItem(STORAGE_KEYS.date, today);
      }
      lifetimeSteps = parseInt(localStorage.getItem(STORAGE_KEYS.lifetime) || '0', 10) + steps;
    } catch (e) {}
    try {
      const a = localStorage.getItem(STORAGE_KEYS.avatar);
      if (a) avatar = { ...avatar, ...JSON.parse(a) };
    } catch (e) {}
    try {
      const inv = localStorage.getItem(STORAGE_KEYS.inventory);
      if (inv) inventory = JSON.parse(inv);
    } catch (e) {}
    try {
      const eq = localStorage.getItem(STORAGE_KEYS.equipped);
      if (eq) {
        var parsed = JSON.parse(eq);
        SLOT_ORDER.forEach(function(s) { if (parsed[s] != null) equipped[s] = parsed[s]; });
        if (parsed.accessory != null && equipped.watch == null) equipped.watch = parsed.accessory;
        if (parsed.armor != null && equipped.top == null) equipped.top = parsed.armor;
        if (parsed.weapon != null && equipped.watch == null) equipped.watch = parsed.weapon;
      }
    } catch (e) {}
    try {
      var sd = localStorage.getItem(STORAGE_KEYS.supplyDate);
      var sc = localStorage.getItem(STORAGE_KEYS.supplyCount);
      var today = todayStr();
      if (sd === today && sc != null) {
        supplyDateToday = sd;
        supplyCountToday = parseInt(sc, 10) || 0;
      } else {
        supplyDateToday = today;
        supplyCountToday = 0;
      }
    } catch (e) {}
    try {
      const cr = localStorage.getItem(STORAGE_KEYS.claimed);
      if (cr) claimedRoutes = JSON.parse(cr);
    } catch (e) {}
    try {
      var cg = localStorage.getItem(STORAGE_KEYS.courseGoal);
      if (cg) courseGoalKm = parseFloat(cg) || 1;
      var tx = localStorage.getItem(STORAGE_KEYS.totalXp);
      if (tx) totalXp = parseInt(tx, 10) || 0;
    } catch (e) {}
    try {
      var ur = localStorage.getItem(STORAGE_KEYS.userRoutes);
      if (ur) userRoutes = JSON.parse(ur);
    } catch (e) {}
    try {
      var g = localStorage.getItem(STORAGE_KEYS.gold);
      if (g != null) { gold = parseInt(g, 10); if (gold === 0) gold = 500; }
      else gold = STARTING_GOLD;
    } catch (e) {}
    try {
      var tw = localStorage.getItem(STORAGE_KEYS.totalWalkKm);
      if (tw != null) totalWalkDistanceKm = parseFloat(tw);
    } catch (e) {}
    try {
      var tc = localStorage.getItem(STORAGE_KEYS.tutorialCompleted);
      if (tc === 'true') tutorialCompleted = true;
    } catch (e) {}
    try {
      var wa = localStorage.getItem(STORAGE_KEYS.wildAnimals);
      if (wa) wildAnimals = JSON.parse(wa);
    } catch (e) {}
    try {
      var ca = localStorage.getItem(STORAGE_KEYS.capturedAnimals);
      if (ca) capturedAnimals = JSON.parse(ca);
    } catch (e) {}
    try {
      var ct = localStorage.getItem(STORAGE_KEYS.currentTitle);
      if (ct) currentTitleId = ct;
    } catch (e) {}
    try {
      var st = localStorage.getItem(STORAGE_KEYS.storage);
      if (st) storage = JSON.parse(st);
    } catch (e) {}
    try {
      var qd = localStorage.getItem(STORAGE_KEYS.questDate);
      var today = todayStr();
      if (qd === today) {
        var qc = localStorage.getItem(STORAGE_KEYS.questProgress);
        if (qc) questGachaCount = parseInt(qc, 10) || 0;
        var qcl = localStorage.getItem('walk_quest_claimed');
        if (qcl) questClaimed = JSON.parse(qcl);
      } else {
        questGachaCount = 0;
        questClaimed = {};
      }
    } catch (e) {}
    try {
      var sd = localStorage.getItem(STORAGE_KEYS.sharedDate);
      sharedToday = sd === todayStr();
    } catch (e) {}
    try {
      var ad = localStorage.getItem(STORAGE_KEYS.attendanceDate);
      var as = localStorage.getItem(STORAGE_KEYS.attendanceStreak);
      if (ad) lastAttendanceDate = ad;
      if (as != null) attendanceStreak = parseInt(as, 10) || 0;
    } catch (e) {}
    try {
      var p = localStorage.getItem(STORAGE_KEYS.pet);
      if (p) pet = { ...pet, ...JSON.parse(p) };
    } catch (e) {}
    try {
      var eo = localStorage.getItem(STORAGE_KEYS.equipmentCodexOwned);
      if (eo) equipmentCodexOwned = JSON.parse(eo) || {};
    } catch (e) {}
    try {
      var pp = localStorage.getItem(STORAGE_KEYS.partnerPoints);
      if (pp != null) partnerPoints = parseInt(pp, 10) || 0;
    } catch (e) {}
    var th = localStorage.getItem(STORAGE_KEYS.theme);
    if (th === 'morning' || th === 'night') document.body.setAttribute('data-theme', th);
    lastDate = todayStr();
  }

  function saveAll() {
    try {
      localStorage.setItem(STORAGE_KEYS.steps, String(steps));
      localStorage.setItem(STORAGE_KEYS.date, todayStr());
      localStorage.setItem(STORAGE_KEYS.lifetime, String(lifetimeSteps));
      localStorage.setItem(STORAGE_KEYS.tutorialCompleted, tutorialCompleted ? 'true' : 'false');
      localStorage.setItem(STORAGE_KEYS.wildAnimals, JSON.stringify(wildAnimals));
      localStorage.setItem(STORAGE_KEYS.capturedAnimals, JSON.stringify(capturedAnimals));
      localStorage.setItem(STORAGE_KEYS.avatar, JSON.stringify(avatar));
      localStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(inventory));
      localStorage.setItem(STORAGE_KEYS.equipped, JSON.stringify(equipped));
      localStorage.setItem(STORAGE_KEYS.storage, JSON.stringify(storage));
      localStorage.setItem(STORAGE_KEYS.claimed, JSON.stringify(claimedRoutes));
      localStorage.setItem(STORAGE_KEYS.courseGoal, String(courseGoalKm));
      localStorage.setItem(STORAGE_KEYS.totalXp, String(totalXp));
      if (supplyDateToday) localStorage.setItem(STORAGE_KEYS.supplyDate, supplyDateToday);
      localStorage.setItem(STORAGE_KEYS.supplyCount, String(supplyCountToday));
      localStorage.setItem(STORAGE_KEYS.userRoutes, JSON.stringify(userRoutes));
      localStorage.setItem(STORAGE_KEYS.gold, String(gold));
      localStorage.setItem(STORAGE_KEYS.totalWalkKm, String(totalWalkDistanceKm));
      localStorage.setItem(STORAGE_KEYS.currentTitle, currentTitleId);
      localStorage.setItem(STORAGE_KEYS.tutorialCompleted, tutorialCompleted ? 'true' : 'false');
      localStorage.setItem(STORAGE_KEYS.wildAnimals, JSON.stringify(wildAnimals));
      localStorage.setItem(STORAGE_KEYS.capturedAnimals, JSON.stringify(capturedAnimals));
      localStorage.setItem(STORAGE_KEYS.questDate, todayStr());
      localStorage.setItem(STORAGE_KEYS.questProgress, String(questGachaCount));
      localStorage.setItem('walk_quest_claimed', JSON.stringify(questClaimed));
      if (sharedToday) localStorage.setItem(STORAGE_KEYS.sharedDate, todayStr());
      localStorage.setItem(STORAGE_KEYS.attendanceDate, lastAttendanceDate);
      localStorage.setItem(STORAGE_KEYS.attendanceStreak, String(attendanceStreak));
      localStorage.setItem(STORAGE_KEYS.pet, JSON.stringify(pet));
      localStorage.setItem(STORAGE_KEYS.partnerPoints, String(partnerPoints));
      localStorage.setItem(STORAGE_KEYS.equipmentCodexOwned, JSON.stringify(equipmentCodexOwned));
    } catch (e) {}
    if (isLoggedIn && getAuthToken()) syncGameStateToServer();
  }
  function getGameStatePayload() {
    return {
      steps: steps,
      date: todayStr(),
      lifetimeSteps: lifetimeSteps,
      avatar: avatar,
      pet: pet,
      inventory: inventory,
      equipped: equipped,
      storage: storage,
      claimedRoutes: claimedRoutes,
      courseGoalKm: courseGoalKm,
      totalXp: totalXp,
      supplyDateToday: supplyDateToday,
      supplyCountToday: supplyCountToday,
      userRoutes: userRoutes,
      gold: gold,
      totalWalkDistanceKm: totalWalkDistanceKm,
      currentTitleId: currentTitleId,
      questDate: todayStr(),
      questProgress: questGachaCount,
      questClaimed: questClaimed,
      sharedDate: sharedToday ? todayStr() : '',
      lastAttendanceDate: lastAttendanceDate,
      attendanceStreak: attendanceStreak,
      // 도감을 위한 추가 정보 (향후 확장용)
      userRoutes: userRoutes
    };
  }
  function applyGameState(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (obj.steps != null) steps = obj.steps;
    if (obj.date != null) lastDate = obj.date;
    if (obj.lifetimeSteps != null) lifetimeSteps = obj.lifetimeSteps;
    if (obj.avatar && typeof obj.avatar === 'object') avatar = { ...avatar, ...obj.avatar };
    if (obj.pet && typeof obj.pet === 'object') pet = { ...pet, ...obj.pet };
    if (Array.isArray(obj.inventory)) inventory = obj.inventory;
    if (obj.equipped && typeof obj.equipped === 'object') { Object.keys(obj.equipped).forEach(function (k) { if (obj.equipped[k] != null) equipped[k] = obj.equipped[k]; }); }
    if (Array.isArray(obj.storage)) storage = obj.storage;
    if (Array.isArray(obj.claimedRoutes)) claimedRoutes = obj.claimedRoutes;
    if (obj.courseGoalKm != null) courseGoalKm = obj.courseGoalKm;
    if (obj.totalXp != null) totalXp = obj.totalXp;
    if (obj.supplyDateToday != null) supplyDateToday = obj.supplyDateToday;
    if (obj.supplyCountToday != null) supplyCountToday = obj.supplyCountToday;
    if (Array.isArray(obj.userRoutes)) userRoutes = obj.userRoutes;
    if (obj.gold != null) gold = obj.gold;
    if (obj.totalWalkDistanceKm != null) totalWalkDistanceKm = obj.totalWalkDistanceKm;
    if (obj.currentTitleId != null) currentTitleId = obj.currentTitleId;
    if (obj.questProgress != null) questGachaCount = obj.questProgress;
    if (obj.questClaimed && typeof obj.questClaimed === 'object') questClaimed = obj.questClaimed;
    if (obj.sharedDate != null) sharedToday = obj.sharedDate === todayStr();
    if (obj.lastAttendanceDate != null) lastAttendanceDate = obj.lastAttendanceDate;
    if (obj.attendanceStreak != null) attendanceStreak = obj.attendanceStreak;
    if (obj.pet && typeof obj.pet === 'object') {
      pet = { ...pet, ...obj.pet };
      renderPet();
    }
  }
  function syncGameStateToServer() {
    var token = getAuthToken();
    if (!token) return;
    var payload = getGameStatePayload();
    fetch(API_BASE + '/api/user/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(payload)
    }).catch(function () {});
  }
  function initAuth() {
    var token = getAuthToken();
    if (!token) return Promise.resolve();
    return fetch(API_BASE + '/api/user/me', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(function (r) {
        if (!r.ok) { clearAuthToken(); return null; }
        return r.json();
      })
      .then(function (me) {
        if (!me) return null;
        userProfile = { id: me.id, nickname: me.nickname };
        isLoggedIn = true;
        return fetch(API_BASE + '/api/user/data', { headers: { 'Authorization': 'Bearer ' + token } });
      })
      .then(function (r) {
        if (!r) return null;
        return r.json();
      })
      .then(function (body) {
        if (body && body.data) {
          try {
            var data = typeof body.data === 'string' ? JSON.parse(body.data) : body.data;
            applyGameState(data);
            renderPet();
          } catch (e) {}
        }
      })
      .catch(function () { clearAuthToken(); });
  }

  function addStep() {
    steps++;
    lifetimeSteps++;
    // 동물 경험치 획득 (10걸음당 1 경험치)
    if (steps % 10 === 0 && pet.type) {
      addPetExp(1);
    }
    saveAll();
    renderSteps();
    checkRouteRewards();
    var pw = document.getElementById('page-walk');
    var ps = document.getElementById('page-story');
    if (pw && pw.classList.contains('active')) { renderRoutes(); renderQuests(); }
    if (ps && ps.classList.contains('active')) renderStory();
  }

  function checkRouteRewards() {
    ROUTES.forEach(function (r) {
      if (claimedRoutes.indexOf(r.id) !== -1) return;
      if (lifetimeSteps < r.steps) return;
      claimedRoutes.push(r.id);
      var newItem = { id: r.reward.id + '_' + Date.now(), name: r.reward.name, type: r.reward.type, emoji: r.reward.emoji, rarity: 'common', enhance: 0, tier: r.reward.tier || 'standard' };
      inventory.push(newItem);
      // 장비 도감 영구 등록 + 파트너 포인트 (장비 수집 보너스)
      markEquipmentOwnedByItem(newItem);
      addPartnerPointsForSource(1, 'codex');
      saveAll();
      showToast('🎁 ' + r.name + '에서 ' + r.reward.name + ' 획득!');
      renderRoutes();
      renderInventory();
      renderStory();
    });
  }

  function showToast(msg) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 2500);
  }

  function haversineKm(lat1, lon1, lat2, lon2) {
    var R = 6371;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  function formatDuration(ms) {
    if (!ms || ms <= 0) return '';
    var totalSec = Math.round(ms / 1000);
    var m = Math.floor(totalSec / 60);
    var s = totalSec % 60;
    return m + '분 ' + (s < 10 ? '0' : '') + s + '초';
  }

  function formatPace(minPerKm) {
    if (!minPerKm || !isFinite(minPerKm) || minPerKm <= 0) return '0:00';
    var totalSec = Math.round(minPerKm * 60);
    var m = Math.floor(totalSec / 60);
    var s = totalSec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function getDailyKitChance() {
    var n = supplyCountToday + 1;
    if (n <= 3) return 1;
    if (n === 4) return 0.5;
    if (n === 5) return 0.25;
    return 0.1;
  }

  function checkRouteComplete() {
    if (!activeRouteId || sessionDistanceKm < activeRouteGoalKm) return;
    var route = userRoutes.find(function(r) { return r.id === activeRouteId; });
    if (!route || route.completedAt) return;
    var today = todayStr();
    if (today !== supplyDateToday) {
      supplyDateToday = today;
      supplyCountToday = 0;
    }
    var chance = getDailyKitChance();
    var finishTime = Date.now();
    var durationMs = sessionStartTimeMs ? (finishTime - sessionStartTimeMs) : 0;
    if (durationMs > 0) {
      route.lastTimeMs = durationMs;
      if (!route.bestTimeMs || durationMs < route.bestTimeMs) {
        route.bestTimeMs = durationMs;
      }
    }

    if (Math.random() > chance) {
      route.completedAt = finishTime;
      route.path = pathCoords.slice();
      activeRouteId = null;
      activeRouteGoalKm = 0;
      // 코스 완주 기본 파트너 포인트
      addPartnerPointsForSource(2, 'route_complete');
      saveAll();
      renderWalk();
      renderRouteSelect();
      showToast('🏁 코스 완주! (보급 키트는 일일 한도에 따라 지급돼요)');
      return;
    }
    supplyCountToday += 1;
    route.completedAt = finishTime;
    route.path = pathCoords.slice();
    activeRouteId = null;
    activeRouteGoalKm = 0;
    storage.push({ id: 'kit_' + Date.now(), type: 'supply_kit', name: '트레이닝 보급 키트', receivedAt: Date.now() });
    // 코스 완주 + 키트 획득 보너스
    addPartnerPointsForSource(3, 'route_complete');
    saveAll();
    showToast('📦 보급 키트가 보관함에 도착했어요');
    renderWalk();
    renderRouteSelect();
    renderStorage();
    renderQuests();
  }

  function rollRarity() {
    var r = Math.random() * 100;
    if (r < 60) return 'common';
    if (r < 85) return 'rare';
    if (r < 97) return 'epic';
    return 'legend';
  }

  function openSupplyKit() {
    var idx = inventory.findIndex(function (i) { return i.type === 'supply_kit'; });
    if (idx === -1) { showToast('트레이닝 보급 키트가 없어요'); return; }
    inventory.splice(idx, 1);
    openOneSupplyKit();
  }
  function openOneSupplyKit() {
    var item = pickItemByTierWeight();
    var rarity = rollRarity();
    var newItem = { id: item.id + '_' + Date.now(), name: item.name, type: item.type, emoji: item.emoji, rarity: rarity, enhance: 0, tier: item.tier || 'standard' };
    inventory.push(newItem);
    // 장비 도감 영구 등록 + 파트너 포인트 (장비 수집 보너스)
    markEquipmentOwnedByItem(newItem);
    addPartnerPointsForSource(1, 'codex');
    saveAll();
    var rarityLabel = { common: '커먼', rare: '레어', epic: '에픽', legend: '레전드' }[rarity];
    var tierLabel = TIER_LABELS[item.tier] || '스탠다드';
    showToast(getItemIcon(newItem) + ' ' + item.name + ' (' + tierLabel + ' · ' + rarityLabel + ') 획득!');
    renderEquipped();
    renderInventory();
    renderAvatar();
  }
  function moveKitToInventory() {
    if (storage.length === 0) { showToast('보관함에 키트가 없어요'); return; }
    var one = storage.pop();
    inventory.push({ id: 'supply_kit_' + Date.now(), name: '트레이닝 보급 키트', type: 'supply_kit', emoji: '📦' });
    saveAll();
    renderStorage();
    renderInventory();
    showToast('보급 키트를 인벤토리로 가져왔어요');
  }
  function openKitFromStorage() {
    if (storage.length === 0) { showToast('보관함에 키트가 없어요'); return; }
    storage.pop();
    saveAll();
    openOneSupplyKit();
    renderStorage();
  }
  function renderStorage() {
    var wrap = document.getElementById('storageList');
    if (!wrap) return;
    wrap.innerHTML = '';
    if (storage.length === 0) {
      wrap.innerHTML = '<p class="story-text" style="color:var(--text-muted);">보관함이 비어 있어요.<br>산책 코스를 완주하면 보급 키트가 여기로 도착해요.</p>';
      return;
    }
    storage.forEach(function(k, i) {
      var card = document.createElement('div');
      card.className = 'inv-item inv-item-kit';
      card.innerHTML = '<span>📦</span><span class="inv-name">트레이닝 보급 키트</span><div class="storage-actions"><button type="button" class="btn-storage-inv">인벤으로</button><button type="button" class="btn-storage-open">열기</button></div>';
      card.querySelector('.btn-storage-inv').onclick = function() { moveKitToInventory(); };
      card.querySelector('.btn-storage-open').onclick = function() { openKitFromStorage(); };
      wrap.appendChild(card);
    });
  }

  function onPosition(pos) {
    if (walkState !== 'walking') return;
    var lat = pos.coords.latitude;
    var lon = pos.coords.longitude;
    var nowMs = pos.timestamp != null ? pos.timestamp : Date.now();
    if (pathCoords.length > 0) {
      var last = pathCoords[pathCoords.length - 1];
      var seg = haversineKm(last.lat, last.lon, lat, lon);
      if (seg < MIN_SEGMENT_KM) return;
      var timeDeltaH = (nowMs - lastPositionTime) / 3600000;
      if (timeDeltaH > 0) {
        var speedKmh = seg / timeDeltaH;
        if (speedKmh > MAX_SPEED_KMH) return;
        lastSpeedKmh = speedKmh;
      }
      var bonus = getEquipmentBonus();
      var distMult = 1 + (bonus.distance / 100);
      var xpMult = 1 + (bonus.xp / 100);
      sessionDistanceKm += seg * distMult;
      sessionXp = Math.floor(sessionDistanceKm * XP_PER_KM);
      totalXp += Math.floor(seg * XP_PER_KM * xpMult);
      totalWalkDistanceKm += seg * distMult;
      checkRouteComplete();
      saveAll();
      pathCoords.push({ lat: lat, lon: lon });
      lastPositionTime = nowMs;
    } else {
      pathCoords.push({ lat: lat, lon: lon });
      lastPositionTime = nowMs;
      sessionStartTimeMs = nowMs;
    }
    // 야생 동물 스폰 체크 (50m마다)
    checkWildAnimalSpawn(lat, lon);
    renderWalk();
  }
  
  function checkWildAnimalSpawn(lat, lon) {
    // 기존 동물과 너무 가까우면 스킵
    var tooClose = wildAnimals.some(function(animal) {
      return haversineKm(animal.lat, animal.lon, lat, lon) < 0.05; // 50m 이내
    });
    if (tooClose) return;
    
    // 랜덤 스폰 (5% 확률)
    if (Math.random() > 0.05) return;
    
    // 희귀도에 따라 동물 선택
    var rarityRoll = Math.random() * 100;
    var targetRarity = 'common';
    if (rarityRoll < 3) targetRarity = 'legend';
    else if (rarityRoll < 15) targetRarity = 'epic';
    else if (rarityRoll < 40) targetRarity = 'rare';
    
    var availableAnimals = WILD_ANIMALS.filter(function(a) { return a.rarity === targetRarity; });
    if (availableAnimals.length === 0) return;
    
    var animal = availableAnimals[Math.floor(Math.random() * availableAnimals.length)];
    var spawnAnimal = {
      id: 'wild_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      animalId: animal.id,
      name: animal.name,
      emoji: animal.emoji,
      rarity: animal.rarity,
      description: animal.description,
      lat: lat,
      lon: lon,
      spawnTime: Date.now(),
      expiresAt: Date.now() + (5 * 60 * 1000) // 5분 후 사라짐
    };
    
    wildAnimals.push(spawnAnimal);
    saveAll();
    showWildAnimalNearby(spawnAnimal);
  }
  
  function showWildAnimalNearby(animal) {
    var rarityLabel = { common: '커먼', rare: '레어', epic: '에픽', legend: '레전드' }[animal.rarity];
    var rarityColor = { 
      common: 'var(--rarity-common)', 
      rare: 'var(--rarity-rare)', 
      epic: 'var(--rarity-epic)', 
      legend: 'var(--rarity-legend)' 
    }[animal.rarity];
    
    showToast(animal.emoji + ' ' + animal.name + ' (' + rarityLabel + ') 주변에 나타났어요!', 5000);
    
    // 동물 포획 알림 표시
    var notification = document.createElement('div');
    notification.className = 'wild-animal-notification';
    notification.style.cssText = 'position: fixed; top: 80px; left: 50%; transform: translateX(-50%); background: var(--card); border: 2px solid ' + rarityColor + '; border-radius: var(--radius-lg); padding: 1rem; z-index: 250; box-shadow: var(--shadow-glow); animation: slideDown 0.3s ease; max-width: 90%;';
    notification.innerHTML = '<div style="text-align: center;"><div style="font-size: 3rem; margin-bottom: 0.5rem;">' + animal.emoji + '</div><div style="font-weight: 600; color: ' + rarityColor + '; margin-bottom: 0.25rem;">' + animal.name + '</div><div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">' + rarityLabel + ' · ' + animal.description + '</div><button type="button" class="btn-capture-animal" data-animal-id="' + animal.id + '" style="background: ' + rarityColor + '; color: var(--bg); border: none; border-radius: var(--radius); padding: 0.75rem 1.5rem; font-weight: 600; cursor: pointer; width: 100%;">포획하기</button></div>';
    
    document.body.appendChild(notification);
    
    var captureBtn = notification.querySelector('.btn-capture-animal');
    captureBtn.addEventListener('click', function() {
      captureWildAnimal(animal.id);
      document.body.removeChild(notification);
    });
    
    // 5초 후 자동 제거
    setTimeout(function() {
      if (notification.parentNode) {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(function() {
          if (notification.parentNode) document.body.removeChild(notification);
        }, 300);
      }
    }, 5000);
  }
  
  function captureWildAnimal(animalId) {
    var animal = wildAnimals.find(function(a) { return a.id === animalId; });
    if (!animal) {
      showToast('동물을 찾을 수 없어요.');
      return;
    }
    
    // 포획 확률 (희귀도에 따라)
    var captureRate = { common: 0.9, rare: 0.7, epic: 0.5, legend: 0.3 }[animal.rarity];
    if (Math.random() > captureRate) {
      showToast('포획에 실패했어요. 동물이 도망갔어요!');
      wildAnimals = wildAnimals.filter(function(a) { return a.id !== animalId; });
      saveAll();
      return;
    }
    
    // 포획 성공
    var captured = {
      id: 'captured_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      animalId: animal.animalId,
      name: animal.name,
      emoji: animal.emoji,
      rarity: animal.rarity,
      description: animal.description,
      capturedAt: Date.now()
    };
    
    capturedAnimals.push(captured);
    wildAnimals = wildAnimals.filter(function(a) { return a.id !== animalId; });
    
    var rarityLabel = { common: '커먼', rare: '레어', epic: '에픽', legend: '레전드' }[animal.rarity];
    showToast('🎉 ' + animal.emoji + ' ' + animal.name + ' (' + rarityLabel + ') 포획 성공!');
    
    // 골드 보상
    var goldReward = { common: 10, rare: 30, epic: 100, legend: 500 }[animal.rarity];
    gold += goldReward;
    showToast('💰 +' + goldReward + 'G 획득!');
    // 야생 동물 관련 파트너 포인트
    var basePP = { common: 1, rare: 2, epic: 4, legend: 8 }[animal.rarity] || 1;
    addPartnerPointsForSource(basePP, 'wild');

    saveAll();
    renderAnimalCollection();
  }

  function startWalk() {
    var sel = document.getElementById('selectActiveRoute');
    var val = sel ? sel.value : '';
    if (val) {
      var r = userRoutes.find(function(x) { return x.id === val; });
      if (r && !r.completedAt) {
        activeRouteId = r.id;
        activeRouteGoalKm = r.goalKm;
      }
    }
    if (!activeRouteId) {
      showToast('진행할 코스를 선택해 주세요.');
      return;
    }
    if (!navigator.geolocation) { showToast('이 기기는 GPS를 지원하지 않아요'); return; }
    walkState = 'walking';
    pathCoords = [];
    sessionDistanceKm = 0;
    sessionXp = 0;
    sessionStartTimeMs = 0;
    lastSpeedKmh = 0;
    var statusEl = document.getElementById('walkStatus');
    if (statusEl) statusEl.textContent = '위치 확인 중...';
    var opts = { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 };
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        pathCoords.push({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        lastPositionTime = pos.timestamp != null ? pos.timestamp : Date.now();
        watchId = navigator.geolocation.watchPosition(onPosition, function () {}, opts);
        if (statusEl) statusEl.textContent = '산책 중! 걸으면 거리가 누적돼요.';
        var startBtn = document.getElementById('btnWalkStart');
        var stopBtn = document.getElementById('btnWalkStop');
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;
        renderWalk();
      },
      function (err) {
        if (err.code === 1) {
          if (statusEl) statusEl.textContent = '위치 권한을 허용해 주세요.';
          showToast('위치 권한이 필요해요');
          walkState = 'idle';
        } else if (err.code === 3) {
          if (statusEl) statusEl.textContent = '위치 확인 중이에요. 야외에서 시도하거나 잠시 후 다시 눌러 주세요.';
          showToast('시간 초과. 다시 시도해 주세요.');
          walkState = 'idle';
        } else {
          if (statusEl) statusEl.textContent = '위치를 켜고 다시 시도해 주세요.';
          showToast('위치를 켜 주세요.');
          walkState = 'idle';
        }
      },
      opts
    );
  }

  function stopWalk() {
    walkState = 'idle';
    if (watchId != null && navigator.geolocation) navigator.geolocation.clearWatch(watchId);
    watchId = null;
    var startBtn = document.getElementById('btnWalkStart');
    var stopBtn = document.getElementById('btnWalkStop');
    if (startBtn) startBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
    var statusEl = document.getElementById('walkStatus');
    if (statusEl) statusEl.textContent = '이번 산책 ' + sessionDistanceKm.toFixed(2) + ' km, XP +' + sessionXp + ' (총 XP ' + totalXp + ')';
    saveAll();
    renderWalk();
  }

  function renderWalk() {
    var distEl = document.getElementById('walkDistance');
    var xpEl = document.getElementById('walkXp');
    var nextEl = document.getElementById('walkNext');
    var speedEl = document.getElementById('walkSpeed');
    var raceEl = document.getElementById('walkRace');
    if (distEl) distEl.textContent = sessionDistanceKm.toFixed(2);
    if (xpEl) xpEl.textContent = totalXp + (sessionXp > 0 ? ' (+' + sessionXp + ')' : '');
    if (speedEl) speedEl.textContent = lastSpeedKmh.toFixed(1);
    if (nextEl) {
      if (activeRouteId && activeRouteGoalKm > 0) {
        var remain = activeRouteGoalKm - sessionDistanceKm;
        nextEl.textContent = remain <= 0 ? '코스 완주!' : '완주까지 ' + remain.toFixed(2) + ' km';
      } else {
        nextEl.textContent = '코스를 완주하면 보급 키트가 보관함에 도착해요!';
      }
    }
    if (raceEl) {
      raceEl.textContent = '';
      if (activeRouteId && sessionStartTimeMs && sessionDistanceKm > 0) {
        var route = userRoutes.find(function(r){ return r.id === activeRouteId; });
        if (route && route.bestTimeMs && route.goalKm) {
          var now = Date.now();
          var elapsedMs = now - sessionStartTimeMs;
          var currentPaceMinPerKm = (elapsedMs / 60000) / Math.max(sessionDistanceKm, 0.001);
          var bestPaceMinPerKm = (route.bestTimeMs / 60000) / route.goalKm;
          var diffMinPerKm = currentPaceMinPerKm - bestPaceMinPerKm;
          var label = '';
          if (Math.abs(diffMinPerKm) < 0.05) {
            label = '이전 기록과 거의 비슷한 페이스예요.';
          } else if (diffMinPerKm < 0) {
            label = '이전 나보다 더 빠르게 걷는 중이에요! (-' + formatPace(Math.abs(diffMinPerKm)) + '/km)';
          } else {
            label = '이전 기록보다 조금 느려요. (+' + formatPace(diffMinPerKm) + '/km)';
          }
          raceEl.textContent = label;
        }
      }
    }
    var totalKmEl = document.getElementById('walkTotalKm');
    if (totalKmEl) totalKmEl.textContent = totalWalkDistanceKm.toFixed(3);
    var titleObj = getTitleForKm(totalWalkDistanceKm);
    currentTitleId = titleObj.id;
    var titleBadge = document.getElementById('titleBadge');
    if (titleBadge) titleBadge.textContent = titleObj.name;
    renderLevel();
    renderGold();
    updateWalkMap();
  }
  function renderLevel() {
    var info = xpToLevel(totalXp);
    var numEl = document.getElementById('levelNum');
    var barEl = document.getElementById('levelBarFill');
    if (numEl) numEl.textContent = info.level;
    if (barEl) barEl.style.width = (info.need ? (info.current / info.need * 100) : 0) + '%';
  }
  function renderGold() {
    var h = document.getElementById('headerGold');
    var g = document.getElementById('gachaGold');
    var btnGacha = document.getElementById('btnGacha');
    var btnGachaPremium = document.getElementById('btnGachaPremium');
    if (h) h.textContent = gold;
    if (g) g.textContent = gold;
    if (btnGacha) btnGacha.disabled = gold < GACHA_COST;
    if (btnGachaPremium) btnGachaPremium.disabled = gold < GACHA_PREMIUM_COST;
  }
  function renderRouteSelect() {
    var sel = document.getElementById('selectActiveRoute');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- 코스를 선택하세요 --</option>';
    userRoutes.forEach(function(r) {
      var opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = r.name + ' (' + r.goalKm + ' km)' + (r.completedAt ? ' ✓ 완주' : '');
      opt.disabled = !!r.completedAt;
      sel.appendChild(opt);
    });
  }
  function addNewRoute() {
    var name = document.getElementById('newRouteName');
    var goal = document.getElementById('newRouteGoalKm');
    if (!name || !goal) return;
    var n = (name.value || '').trim();
    var g = parseFloat(goal.value) || 1;
    if (n.length < 1) { showToast('코스 이름을 입력해 주세요.'); return; }
    if (g < 0.5) g = 0.5;
    userRoutes.push({ id: 'r_' + Date.now(), name: n, goalKm: g, path: [], completedAt: null, bestTimeMs: null, lastTimeMs: null });
    saveAll();
    name.value = '';
    goal.value = '1';
    document.getElementById('routeCreateCard').style.display = 'none';
    renderRouteSelect();
    showToast('코스가 추가되었어요.');
  }
  function initWalkMap() {
    if (walkMapPathEl) return;
    var el = document.getElementById('walkMap');
    if (!el) return;
    el.innerHTML = '';
    var w = 400, h = 220;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    var grid = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    grid.setAttribute('class', 'our-map-grid');
    for (var i = 0; i <= 10; i++) {
      var v = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      v.setAttribute('x1', (i * w / 10));
      v.setAttribute('y1', 0);
      v.setAttribute('x2', (i * w / 10));
      v.setAttribute('y2', h);
      grid.appendChild(v);
      var hor = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      hor.setAttribute('x1', 0);
      hor.setAttribute('y1', (i * h / 10));
      hor.setAttribute('x2', w);
      hor.setAttribute('y2', (i * h / 10));
      grid.appendChild(hor);
    }
    svg.appendChild(grid);
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'our-map-path');
    path.setAttribute('d', '');
    svg.appendChild(path);
    var charG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    charG.setAttribute('class', 'our-map-char');
    var shadow = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    shadow.setAttribute('class', 'char-shadow');
    shadow.setAttribute('cx', 0);
    shadow.setAttribute('cy', 10);
    shadow.setAttribute('rx', 12);
    shadow.setAttribute('ry', 4);
    charG.appendChild(shadow);
    var charHead = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    charHead.setAttribute('class', 'char-head');
    charHead.setAttribute('r', 7);
    charHead.setAttribute('cx', 0);
    charHead.setAttribute('cy', -8);
    charG.appendChild(charHead);
    var charBody = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    charBody.setAttribute('class', 'char-body');
    charBody.setAttribute('r', 10);
    charBody.setAttribute('cx', 0);
    charBody.setAttribute('cy', 6);
    charG.appendChild(charBody);
    svg.appendChild(charG);
    el.appendChild(svg);
    var label = document.createElement('span');
    label.className = 'our-map-label';
    label.textContent = '실시간 이동 경로';
    el.appendChild(label);
    walkMapEl = el;
    walkMapPathEl = path;
    walkMapCharEl = charG;
  }
  function updateWalkMap() {
    if (!walkMapPathEl || !walkMapCharEl) return;
    var coords = pathCoords.length ? pathCoords : (activeRouteId ? (userRoutes.find(function(r){ return r.id === activeRouteId; }) || {}).path : []);
    var w = 400, h = 220;
    if (coords.length === 0) {
      walkMapPathEl.setAttribute('d', '');
      walkMapCharEl.setAttribute('transform', 'translate(-1000,-1000)');
      return;
    }
    var bounds = ourMapBounds(coords);
    var pts = coords.map(function(c) { return ourMapLatLonToXY(c.lat, c.lon, bounds, w, h); });
    var d = 'M ' + pts[0].x + ' ' + pts[0].y;
    for (var i = 1; i < pts.length; i++) d += ' L ' + pts[i].x + ' ' + pts[i].y;
    walkMapPathEl.setAttribute('d', d);
    var last = pts[pts.length - 1];
    walkMapCharEl.setAttribute('transform', 'translate(' + last.x + ',' + last.y + ')');
  }

  function renderSteps() {
    var today = todayStr();
    if (today !== lastDate) {
      steps = 0;
      lastDate = today;
      saveAll();
    }
    var stepVal = document.getElementById('stepValue');
    var lifeVal = document.getElementById('lifetimeSteps');
    var progressFill = document.getElementById('progressFill');
    var progressText = document.getElementById('progressText');
    var card = document.getElementById('stepCard');
    if (stepVal) stepVal.textContent = steps.toLocaleString();
    if (lifeVal) lifeVal.textContent = lifetimeSteps.toLocaleString();
    var pct = Math.min(100, (steps / GOAL) * 100);
    if (progressFill) progressFill.style.width = pct + '%';
    if (progressText) progressText.textContent = steps.toLocaleString() + ' / ' + GOAL.toLocaleString();
    if (card) {
      if (steps >= GOAL) card.classList.add('goal-reached');
      else card.classList.remove('goal-reached');
    }
  }

  function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
      b.setAttribute('aria-selected', b.getAttribute('data-tab') === tabId ? 'true' : 'false');
    });
    document.querySelectorAll('.page').forEach(function (p) {
      p.classList.toggle('active', p.id === 'page-' + tabId);
    });
    if (tabId === 'walk') {
      renderSteps();
      renderWalk();
      renderRouteSelect();
      renderRoutes();
      renderQuests();
      renderAttendance();
      initWalkMap();
      setTimeout(function () { initWalkMap(); updateWalkMap(); }, 150);
    }
    if (tabId === 'avatar') { renderAvatar(); renderPet(); }
    if (tabId === 'storage') renderStorage();
    if (tabId === 'shop') { renderGold(); }
    if (tabId === 'equipment') { renderEquipped(); renderInventory(); renderEnhanceSelect(); }
    if (tabId === 'story') { renderStory(); renderAchievements(); renderAnimalCollection(); }
  }
  function doGachaPull(premium) {
    var cost = premium ? GACHA_PREMIUM_COST : GACHA_COST;
    if (gold < cost) { showToast('G가 부족해요. (필요: ' + cost + ' G)'); return; }
    gold -= cost;
    var item = pickItemByTierWeight(!!premium);
    var rarity = premium ? rollRarityPremium() : rollRarity();
    var newItem = { id: item.id + '_' + Date.now(), name: item.name, type: item.type, emoji: item.emoji, rarity: rarity, enhance: 0, tier: item.tier || 'standard' };
    inventory.push(newItem);
    questGachaCount += 1;
    // 장비 도감 영구 등록 + 파트너 포인트 (장비/뽑기 보너스)
    markEquipmentOwnedByItem(newItem);
    addPartnerPointsForSource(premium ? 2 : 1, 'codex');
    saveAll();
    renderGold();
    renderInventory();
    renderQuests();
    var rarityLabel = { common: '커먼', rare: '레어', epic: '에픽', legend: '레전드' }[rarity];
    var tierLabel = TIER_LABELS[item.tier] || '스탠다드';
    showToast(getItemIcon(newItem) + ' ' + item.name + ' (' + tierLabel + ' · ' + rarityLabel + ') 뽑기 성공!');
  }
  function renderEnhanceTable() {
    var tbody = document.getElementById('enhanceTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    for (var i = 0; i <= ENHANCE_MAX; i++) {
      var tr = document.createElement('tr');
      var next = i + 1;
      var rate = i < ENHANCE_MAX ? ENHANCE_RATES[i] : 0;
      var failText = i < 4 ? '장비 파괴' : (i < ENHANCE_MAX ? '시도 시 ' + ENHANCE_ATTEMPT_GOLD[i] + ' G' : '최대 강화');
      var col1 = i < ENHANCE_MAX ? ('+' + i + ' → +' + next) : ('+' + i + ' (최대)');
      var rateClass = rate >= 75 ? 'rate-ok' : (rate >= 45 ? 'rate-mid' : 'rate-low');
      tr.innerHTML = '<td class="enhance-col">' + col1 + '</td><td class="' + rateClass + '">' + (i < ENHANCE_MAX ? rate + '%' : '-') + '</td><td>' + failText + '</td>';
      tbody.appendChild(tr);
    }
  }
  function renderEnhanceSelect() {
    renderEnhanceTable();
    var sel = document.getElementById('enhanceSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- 장비 선택 --</option>';
    inventory.forEach(function(item) {
      if (item.type === 'supply_kit') return;
      var enh = item.enhance != null ? item.enhance : 0;
      var opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = (item.emoji || '') + ' ' + item.name + ' +' + enh + (enh >= ENHANCE_MAX ? ' (최대)' : '');
      sel.appendChild(opt);
    });
  }
  function tryEnhance() {
    var sel = document.getElementById('enhanceSelect');
    if (!sel || !sel.value) { showToast('강화할 장비를 선택해 주세요.'); return; }
    var item = inventory.find(function(i){ return i.id === sel.value; });
    if (!item) { showToast('장비를 찾을 수 없어요.'); return; }
    var enh = item.enhance != null ? item.enhance : 0;
    if (enh >= ENHANCE_MAX) { showToast('이미 최대 강화(+7)입니다.'); return; }
    var attemptGold = ENHANCE_ATTEMPT_GOLD[enh];
    if (attemptGold > 0) {
      if (gold < attemptGold) { showToast('강화 시도에 ' + attemptGold + ' G가 필요해요.'); return; }
      gold -= attemptGold;
      saveAll();
      renderGold();
    }
    var successRate = ENHANCE_RATES[enh];
    if (Math.random() * 100 >= successRate) {
      if (enh < 4) {
        var idx = inventory.indexOf(item);
        inventory.splice(idx, 1);
        saveAll();
        renderEnhanceSelect();
        renderInventory();
        renderEquipped();
        renderAvatar();
        showToast('강화 실패... ' + item.name + '이(가) 파괴되었어요.');
      } else {
        renderEnhanceSelect();
        showToast('강화 실패. (장비 유지, 시도 비용 ' + attemptGold + ' G 소모)');
      }
      return;
    }
    item.enhance = enh + 1;
    saveAll();
    renderEnhanceSelect();
    renderInventory();
    showToast(item.name + ' +' + (enh + 1) + ' 강화 성공!');
  }
  function renderAchievements() {
    var grid = document.getElementById('achievementGrid');
    if (!grid) return;
    grid.innerHTML = '';
    ACHIEVEMENTS.forEach(function(a) {
      var unlocked = a.check();
      var div = document.createElement('div');
      div.className = 'achievement-item' + (unlocked ? ' unlocked' : ' locked');
      div.innerHTML = '<span class="ach-icon">' + a.icon + '</span><div><span class="ach-name">' + a.name + '</span><div class="ach-desc">' + a.desc + '</div></div>';
      grid.appendChild(div);
    });
  }

  function renderQuests() {
    var list = document.getElementById('questList');
    if (!list) return;
    list.innerHTML = '';
    DAILY_QUESTS.forEach(function(q) {
      var progress = q.getProgress();
      var done = progress >= q.goal;
      var claimed = questClaimed[q.id];
      var item = document.createElement('div');
      item.className = 'quest-item' + (claimed ? ' done' : '');
      var progressText = q.goal === 1 ? (progress + ' / ' + q.goal) : (progress.toLocaleString() + ' / ' + q.goal.toLocaleString());
      if (claimed) {
        item.innerHTML = '<div class="quest-info"><span class="quest-name">' + q.name + '</span><div class="quest-progress">' + q.desc + '</div></div><span class="quest-done-label">✓ 완료</span>';
      } else if (done) {
        item.innerHTML = '<div class="quest-info"><span class="quest-name">' + q.name + '</span><div class="quest-progress">' + progressText + '</div></div><span class="quest-reward">+' + q.reward + ' G</span><button type="button" class="btn-claim" data-quest="' + q.id + '">보상 수령</button>';
      } else {
        item.innerHTML = '<div class="quest-info"><span class="quest-name">' + q.name + '</span><div class="quest-progress">' + progressText + '</div></div><span class="quest-reward">+' + q.reward + ' G</span>';
      }
      list.appendChild(item);
    });
    list.querySelectorAll('.btn-claim').forEach(function(btn) {
      btn.addEventListener('click', function() { claimQuest(this.getAttribute('data-quest')); });
    });
  }
  function claimQuest(questId) {
    var q = DAILY_QUESTS.find(function(x){ return x.id === questId; });
    if (!q || questClaimed[questId]) return;
    if (q.getProgress() < q.goal) { showToast('아직 목표를 달성하지 못했어요'); return; }
    questClaimed[questId] = true;
    gold += q.reward;
    // 토끼(퀘스트 보너스) 및 파트너 포인트
    addPartnerPointsForSource(2, 'quest');
    saveAll();
    renderQuests();
    renderGold();
    showToast('+' + q.reward + ' G 획득!');
  }
  function doShare() {
    var url = location.href;
    var text = 'WalkStory - 걸음으로 키우는 나만의 동물 친구';
    if (navigator.share) {
      navigator.share({ title: 'WalkStory', text: text, url: url }).then(function() {
        onShareSuccess();
      }).catch(function() { onShareSuccess(); });
    } else {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function() { onShareSuccess(); }).catch(function() { onShareSuccess(); });
      } else { onShareSuccess(); }
    }
  }
  function onShareSuccess() {
    if (sharedToday) { showToast('오늘은 이미 공유 보상을 받았어요'); return; }
    sharedToday = true;
    gold += 40;
    // 공유 성공도 퀘스트/수집 보너스와 연결
    addPartnerPointsForSource(1, 'quest');
    saveAll();
    renderGold();
    renderQuests();
    showToast('공유 감사해요! +40 G');
  }
  function renderHeaderAuth() {
    var btn = document.getElementById('btnHeaderAuth');
    var logoutBtn = document.getElementById('btnLogout');
    if (!btn) return;
    if (isLoggedIn && userProfile && userProfile.nickname) {
      btn.textContent = userProfile.nickname;
      btn.classList.add('logged-in');
      btn.setAttribute('aria-label', '프로필');
      if (logoutBtn) {
        logoutBtn.style.display = 'block';
      }
    } else {
      btn.textContent = '🔐 로그인';
      btn.classList.remove('logged-in');
      btn.setAttribute('aria-label', '로그인');
      if (logoutBtn) {
        logoutBtn.style.display = 'none';
      }
    }
    renderAuthGate();
  }
  function renderAuthGate() {
    var appMain = document.getElementById('appMain');
    var authOverlay = document.getElementById('authOverlay');
    if (!appMain || !authOverlay) return;
    if (isLoggedIn) {
      appMain.classList.remove('hidden');
      authOverlay.style.display = 'none';
      authOverlay.classList.remove('auth-gate');
    } else {
      appMain.classList.add('hidden');
      authOverlay.style.display = 'flex';
      authOverlay.classList.add('auth-gate');
    }
  }
  function openAuthModal() {
    var overlay = document.getElementById('authOverlay');
    if (overlay) { overlay.style.display = 'flex'; overlay.classList.remove('auth-gate'); }
    document.getElementById('authLoginPanel').style.display = 'block';
    document.getElementById('authSignupPanel').style.display = 'none';
    document.querySelectorAll('.auth-tab').forEach(function(t){ t.classList.remove('active'); if (t.getAttribute('data-auth-tab') === 'login') t.classList.add('active'); });
    document.getElementById('authTitle').textContent = '로그인';
  }
  function closeAuthModal() {
    var overlay = document.getElementById('authOverlay');
    if (overlay && isLoggedIn) {
      // 페이드아웃 애니메이션
      overlay.classList.add('fade-out');
      setTimeout(function() {
        overlay.style.display = 'none';
        overlay.classList.remove('fade-out');
      }, 300);
    }
    if (overlay && !isLoggedIn) { 
      overlay.style.display = 'flex'; 
      overlay.classList.add('auth-gate'); 
    }
  }
  
  function showWelcomeModal(nickname) {
    var modal = document.getElementById('welcomeModal');
    var title = document.getElementById('welcomeTitle');
    var message = document.getElementById('welcomeMessage');
    if (modal && title && message) {
      title.textContent = nickname ? nickname + '님 환영합니다!' : '환영합니다!';
      message.textContent = 'WalkStory와 함께 걸어요!';
      modal.classList.add('show');
    }
  }
  
  function hideWelcomeModal() {
    var modal = document.getElementById('welcomeModal');
    if (modal) {
      modal.classList.remove('show');
    }
    // 튜토리얼이 완료되지 않았으면 표시
    if (!tutorialCompleted && isLoggedIn) {
      setTimeout(function() {
        showTutorial();
      }, 500);
    }
  }
  
  var tutorialSteps = [
    { icon: '👋', title: 'WalkStory에 오신 것을 환영합니다!', text: '걸음으로 키우는 나만의 동물 친구와 함께 산책을 즐겨보세요.' },
    { icon: '🚶', title: '산책 시작하기', text: '산책 탭에서 코스를 선택하고 "산책 시작" 버튼을 눌러보세요. GPS로 이동 거리가 자동으로 기록됩니다.' },
    { icon: '🦋', title: '야생 동물 포획하기', text: '산책 중 주변에 나타나는 동물을 발견하면 포획할 수 있어요! 희귀한 동물일수록 골드 보상이 큽니다.' },
    { icon: '📦', title: '보급 키트 받기', text: '코스를 완주하면 보급 키트를 받을 수 있어요. 장비를 뽑아 캐릭터를 강화하세요!' },
    { icon: '🎯', title: '퀘스트 완료하기', text: '매일 새로운 퀘스트가 주어집니다. 완료하면 골드를 받을 수 있어요.' },
    { icon: '🏆', title: '업적 달성하기', text: '다양한 업적을 달성하고 스토리 탭에서 컬렉션을 확인해보세요!' }
  ];
  var currentTutorialStep = 0;
  
  function showTutorial() {
    var modal = document.getElementById('tutorialModal');
    if (!modal) return;
    currentTutorialStep = 0;
    updateTutorialSlide();
    modal.style.display = 'flex';
  }
  
  function hideTutorial() {
    var modal = document.getElementById('tutorialModal');
    if (modal) modal.style.display = 'none';
    tutorialCompleted = true;
    saveAll();
  }
  
  function updateTutorialSlide() {
    var slide = tutorialSteps[currentTutorialStep];
    if (!slide) {
      hideTutorial();
      return;
    }
    
    var iconEl = document.getElementById('tutorialIcon');
    var titleEl = document.getElementById('tutorialTitle');
    var textEl = document.getElementById('tutorialText');
    var progressEl = document.getElementById('tutorialProgress');
    var prevBtn = document.getElementById('btnTutorialPrev');
    var nextBtn = document.getElementById('btnTutorialNext');
    
    if (iconEl) iconEl.textContent = slide.icon;
    if (titleEl) titleEl.textContent = slide.title;
    if (textEl) textEl.textContent = slide.text;
    if (progressEl) progressEl.textContent = (currentTutorialStep + 1) + ' / ' + tutorialSteps.length;
    if (prevBtn) prevBtn.style.display = currentTutorialStep === 0 ? 'none' : 'block';
    if (nextBtn) nextBtn.textContent = currentTutorialStep === tutorialSteps.length - 1 ? '시작하기' : '다음';
  }
  
  function nextTutorialStep() {
    if (currentTutorialStep < tutorialSteps.length - 1) {
      currentTutorialStep++;
      updateTutorialSlide();
    } else {
      hideTutorial();
    }
  }
  
  function prevTutorialStep() {
    if (currentTutorialStep > 0) {
      currentTutorialStep--;
      updateTutorialSlide();
    }
  }
  
  // 야생 동물 만료 체크
  function checkExpiredWildAnimals() {
    var now = Date.now();
    wildAnimals = wildAnimals.filter(function(animal) {
      return animal.expiresAt > now;
    });
    saveAll();
  }
  
  function showAuthLoading() {
    var loading = document.getElementById('authLoading');
    var overlay = document.getElementById('authOverlay');
    if (loading) loading.classList.add('active');
    if (overlay) overlay.style.display = 'flex';
  }
  
  function hideAuthLoading() {
    var loading = document.getElementById('authLoading');
    if (loading) loading.classList.remove('active');
  }
  function doLogin() {
    var nick = (document.getElementById('authLoginNick') || {}).value.trim();
    var pw = (document.getElementById('authLoginPw') || {}).value;
    if (!nick || !pw) { showToast('닉네임과 비밀번호를 입력해 주세요.'); return; }
    var url = API_BASE + '/api/auth/login';
    console.log('Login attempt:', { url: url, API_BASE: API_BASE, location: typeof location !== 'undefined' ? location.href : 'N/A', isCapacitorApp: typeof window !== 'undefined' && window.isCapacitorApp });
    
    // 모바일 앱에서 네트워크 요청 시 타임아웃 설정
    var fetchOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: nick, password: pw }),
      mode: 'cors',
      credentials: 'omit'
    };
    
    // 타임아웃 추가 (30초)
    var timeoutPromise = new Promise(function(_, reject) {
      setTimeout(function() {
        reject(new Error('요청 시간 초과 (30초)'));
      }, 30000);
    });
    
    Promise.race([
      fetch(url, fetchOptions),
      timeoutPromise
    ]).then(function (r) {
      console.log('Login response status:', r.status, 'URL:', r.url);
      if (!r.ok) {
        return r.text().then(function (text) {
          console.error('Login error response:', text);
          try { return { ok: false, body: JSON.parse(text) }; }
          catch { return { ok: false, body: { error: 'HTTP ' + r.status + ': ' + text.substring(0, 50) } }; }
        });
      }
      return r.json().then(function (j) { 
        console.log('Login success:', { userId: j.user?.id, nickname: j.user?.nickname });
        return { ok: true, body: j }; 
      });
    })
      .then(function (x) {
        if (!x || !x.ok) { 
          var errorMsg = x && x.body && x.body.error ? x.body.error : '로그인에 실패했어요.';
          console.error('Login failed:', x);
          showToast(errorMsg);
          return; 
        }
        setAuthToken(x.body.token);
        userProfile = x.body.user;
        isLoggedIn = true;
        return fetch(API_BASE + '/api/user/data', { headers: { 'Authorization': 'Bearer ' + x.body.token } });
      })
      .then(function (r) {
        if (!r) return;
        if (!r.ok) {
          console.warn('User data fetch failed:', r.status);
          return null;
        }
        return r.json();
      })
      .then(function (body) {
        if (body && body.data) {
          try {
            var data = typeof body.data === 'string' ? JSON.parse(body.data) : body.data;
            applyGameState(data);
            renderPet();
          } catch (e) {
            console.error('Failed to parse user data:', e);
          }
        }
        saveAll();
        closeAuthModal();
        setTimeout(function() {
          renderHeaderAuth();
          renderAuthGate();
          renderPet();
          renderAttendance();
          var card = document.getElementById('attendanceCard');
          if (card) card.style.display = 'block';
          if (userProfile && userProfile.nickname) {
            showWelcomeModal(userProfile.nickname);
          } else {
            showWelcomeModal();
          }
        }, 300);
      })
      .catch(function (err) {
        console.error('Login error:', err);
        console.error('Error details:', { 
          message: err.message, 
          name: err.name, 
          stack: err.stack,
          url: url, 
          API_BASE: API_BASE,
          location: typeof location !== 'undefined' ? location.href : 'N/A',
          isCapacitorApp: typeof window !== 'undefined' && window.isCapacitorApp,
          online: navigator.onLine,
          userAgent: navigator.userAgent
        });
        var errorMsg = '서버에 연결할 수 없어요.';
        if (err.message && err.message.includes('Failed to fetch')) {
          // 모바일 앱에서 네트워크 오류인 경우 더 자세한 정보 제공
          if (typeof window !== 'undefined' && window.isCapacitorApp) {
            errorMsg = '모바일 앱 네트워크 오류: ' + API_BASE + '에 연결할 수 없어요. 인터넷 연결을 확인해 주세요.';
          } else {
            errorMsg = '네트워크 연결을 확인해 주세요. (API: ' + API_BASE + ')';
          }
        } else if (err.message && err.message.includes('요청 시간 초과')) {
          errorMsg = '서버 응답 시간이 초과되었어요. 다시 시도해 주세요.';
        } else if (err.message) {
          errorMsg = '오류: ' + err.message;
        }
        showToast(errorMsg);
      });
  }
  function doSignup() {
    var nick = (document.getElementById('authSignupNick') || {}).value.trim();
    var email = (document.getElementById('authSignupEmail') || {}).value.trim();
    var pw = (document.getElementById('authSignupPw') || {}).value;
    var pw2 = (document.getElementById('authSignupPw2') || {}).value;
    if (!nick || nick.length < 2) { showToast('닉네임은 2자 이상이에요.'); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('올바른 이메일을 입력해 주세요.'); return; }
    if (!pw || pw.length < 6) { showToast('비밀번호는 6자 이상이에요.'); return; }
    if (pw !== pw2) { showToast('비밀번호가 일치하지 않아요.'); return; }
    var url = API_BASE + '/api/auth/signup';
    console.log('Signup attempt:', { url: url, API_BASE: API_BASE });
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: nick, password: pw, email: email })
    }).then(function (r) {
      console.log('Signup response status:', r.status);
      if (!r.ok) {
        return r.text().then(function (text) {
          console.error('Signup error response:', text);
          try { return { ok: false, body: JSON.parse(text) }; }
          catch { return { ok: false, body: { error: 'HTTP ' + r.status + ': ' + text.substring(0, 50) } }; }
        });
      }
      return r.json().then(function (j) { 
        console.log('Signup success:', { userId: j.user?.id, nickname: j.user?.nickname });
        return { ok: true, body: j }; 
      });
    })
      .then(function (x) {
        if (!x || !x.ok) { 
          var errorMsg = x && x.body && x.body.error ? x.body.error : '가입에 실패했어요.';
          console.error('Signup failed:', x);
          showToast(errorMsg);
          return; 
        }
        setAuthToken(x.body.token);
        userProfile = x.body.user;
        isLoggedIn = true;
        saveAll();
        closeAuthModal();
        setTimeout(function() {
          renderHeaderAuth();
          renderAuthGate();
          renderPet();
          renderAttendance();
          var card = document.getElementById('attendanceCard');
          if (card) card.style.display = 'block';
          if (userProfile && userProfile.nickname) {
            showWelcomeModal(userProfile.nickname);
          } else {
            showWelcomeModal();
          }
        }, 300);
      })
      .catch(function (err) {
        console.error('Signup error:', err);
        console.error('Error details:', { 
          message: err.message, 
          name: err.name, 
          stack: err.stack,
          url: url, 
          API_BASE: API_BASE,
          location: typeof location !== 'undefined' ? location.href : 'N/A',
          isCapacitorApp: typeof window !== 'undefined' && window.isCapacitorApp,
          online: navigator.onLine,
          userAgent: navigator.userAgent
        });
        var errorMsg = '서버에 연결할 수 없어요.';
        if (err.message && err.message.includes('Failed to fetch')) {
          // 모바일 앱에서 네트워크 오류인 경우 더 자세한 정보 제공
          if (typeof window !== 'undefined' && window.isCapacitorApp) {
            errorMsg = '모바일 앱 네트워크 오류: ' + API_BASE + '에 연결할 수 없어요. 인터넷 연결을 확인해 주세요.';
          } else {
            errorMsg = '네트워크 연결을 확인해 주세요. (API: ' + API_BASE + ')';
          }
        } else if (err.message && err.message.includes('요청 시간 초과')) {
          errorMsg = '서버 응답 시간이 초과되었어요. 다시 시도해 주세요.';
        } else if (err.message) {
          errorMsg = '오류: ' + err.message;
        }
        showToast(errorMsg);
      });
  }
  function doFindId() {
    var email = (document.getElementById('authFindIdEmail') || {}).value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('올바른 이메일을 입력해 주세요.'); return;
    }
    var url = API_BASE + '/api/auth/find-id';
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    }).then(function (r) {
      if (!r.ok) {
        return r.text().then(function (text) {
          try { return { ok: false, body: JSON.parse(text) }; }
          catch { return { ok: false, body: { error: 'HTTP ' + r.status + ': ' + text.substring(0, 50) } }; }
        });
      }
      return r.json().then(function (j) { return { ok: true, body: j }; });
    }).then(function (x) {
      var resultDiv = document.getElementById('findIdResult');
      if (!x.ok) {
        if (resultDiv) {
          resultDiv.style.display = 'block';
          resultDiv.innerHTML = '<div style="color: #ef4444;">' + (x.body.error || '아이디 찾기에 실패했어요.') + '</div>';
        } else {
          showToast(x.body.error || '아이디 찾기에 실패했어요.');
        }
        return;
      }
      if (resultDiv) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<div style="color: var(--accent);">닉네임: <strong>' + x.body.fullNickname + '</strong></div>';
      }
    }).catch(function (err) {
      console.error('Find ID error:', err);
      showToast('서버에 연결할 수 없어요.');
    });
  }
  function doFindPw() {
    var email = (document.getElementById('authFindPwEmail') || {}).value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('올바른 이메일을 입력해 주세요.'); return;
    }
    var url = API_BASE + '/api/auth/reset-password-request';
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    }).then(function (r) {
      if (!r.ok) {
        return r.text().then(function (text) {
          try { return { ok: false, body: JSON.parse(text) }; }
          catch { return { ok: false, body: { error: 'HTTP ' + r.status + ': ' + text.substring(0, 50) } }; }
        });
      }
      return r.json().then(function (j) { return { ok: true, body: j }; });
    }).then(function (x) {
      var resultDiv = document.getElementById('findPwResult');
      var resetPanel = document.getElementById('authResetPwPanel');
      if (!x.ok) {
        if (resultDiv) {
          resultDiv.style.display = 'block';
          resultDiv.innerHTML = '<div style="color: #ef4444;">' + (x.body.error || '비밀번호 재설정 요청에 실패했어요.') + '</div>';
        } else {
          showToast(x.body.error || '비밀번호 재설정 요청에 실패했어요.');
        }
        return;
      }
      if (resultDiv) {
        resultDiv.style.display = 'block';
        var msg = x.body.message || '비밀번호 재설정 링크를 발송했어요.';
        if (x.body.resetToken) {
          msg += '<br><small style="color: var(--text-muted); margin-top: 0.5rem; display: block;">개발 모드: 토큰 = ' + x.body.resetToken + '</small>';
        }
        resultDiv.innerHTML = '<div style="color: var(--accent);">' + msg + '</div>';
      }
      if (resetPanel && x.body.resetToken) {
        resetPanel.style.display = 'block';
        document.getElementById('authResetToken').value = x.body.resetToken;
      }
    }).catch(function (err) {
      console.error('Find PW error:', err);
      showToast('서버에 연결할 수 없어요.');
    });
  }
  function doResetPw() {
    var token = (document.getElementById('authResetToken') || {}).value.trim();
    var pw = (document.getElementById('authResetPw') || {}).value;
    var pw2 = (document.getElementById('authResetPw2') || {}).value;
    if (!token) { showToast('토큰을 입력해 주세요.'); return; }
    if (!pw || pw.length < 6) { showToast('비밀번호는 6자 이상이에요.'); return; }
    if (pw !== pw2) { showToast('비밀번호가 일치하지 않아요.'); return; }
    var url = API_BASE + '/api/auth/reset-password';
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token, newPassword: pw })
    }).then(function (r) {
      if (!r.ok) {
        return r.text().then(function (text) {
          try { return { ok: false, body: JSON.parse(text) }; }
          catch { return { ok: false, body: { error: 'HTTP ' + r.status + ': ' + text.substring(0, 50) } }; }
        });
      }
      return r.json().then(function (j) { return { ok: true, body: j }; });
    }).then(function (x) {
      if (!x.ok) {
        showToast(x.body.error || '비밀번호 재설정에 실패했어요.');
        return;
      }
      showToast('비밀번호가 재설정되었어요. 로그인해 주세요.');
      switchAuthTab('login');
    }).catch(function (err) {
      console.error('Reset PW error:', err);
      showToast('서버에 연결할 수 없어요.');
    });
  }
  function doSocialLogin(provider) {
    // 카카오/구글 OAuth는 프론트엔드에서 처리하고, 백엔드에 사용자 정보 전송
    if (provider === 'kakao') {
      // 카카오 로그인 (Kakao SDK 필요)
      if (typeof Kakao === 'undefined') {
        showToast('카카오 SDK가 로드되지 않았어요. 카카오 개발자 앱 설정이 필요해요.');
        return;
      }
      // 로딩 표시
      showAuthLoading();
      Kakao.Auth.login({
        // 닉네임만 요청 (이메일은 권한 없음 상태이므로 제외)
        scope: 'profile_nickname',
        success: function(authObj) {
          Kakao.API.request({
            url: '/v2/user/me',
            success: function(res) {
              console.log('Kakao API response:', res);
              console.log('Kakao account:', res.kakao_account);
              console.log('Properties:', res.properties);
              try {
                var socialId = res.id ? res.id.toString() : null;
                if (!socialId) {
                  showToast('카카오 사용자 정보를 가져올 수 없어요.');
                  return;
                }
                
                // 닉네임 추출 (안전하게 - 여러 경로 확인)
                var nickname = '카카오사용자' + Math.floor(Math.random() * 1000); // 기본값에 랜덤 숫자 추가
                if (res.kakao_account) {
                  if (res.kakao_account.profile && res.kakao_account.profile.nickname) {
                    nickname = res.kakao_account.profile.nickname;
                  } else if (res.kakao_account.profile_nickname) {
                    nickname = res.kakao_account.profile_nickname;
                  }
                }
                if (res.properties) {
                  if (res.properties.nickname) {
                    nickname = res.properties.nickname;
                  }
                }
                
                // 이메일은 권한 없음이므로 null로 설정
                var email = null;
                
                console.log('Extracted nickname:', nickname, 'socialId:', socialId);
                sendSocialLogin(provider, socialId, nickname, email);
              } catch (err) {
                console.error('Kakao API response processing error:', err);
                showToast('카카오 사용자 정보 처리 중 오류가 났어요.');
              }
            },
            fail: function(err) {
              console.error('Kakao API error:', err);
              hideAuthLoading();
              showToast('카카오 사용자 정보를 가져올 수 없어요: ' + (err.error_description || err.error || '알 수 없는 오류'));
            }
          });
        },
        fail: function(err) {
          console.error('Kakao Auth error:', err);
          hideAuthLoading();
          showToast('카카오 로그인에 실패했어요: ' + (err.error_description || err.error || '알 수 없는 오류'));
        }
      });
    } else if (provider === 'google') {
      // 구글 로그인 (Google Sign-In API 필요)
      if (typeof gapi === 'undefined') {
        showToast('구글 SDK가 로드되지 않았어요. Google OAuth 설정이 필요해요.');
        return;
      }
      var googleClientId = (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.google) 
        ? window.APP_CONFIG.google.clientId 
        : 'YOUR_GOOGLE_CLIENT_ID';
      if (googleClientId === 'YOUR_GOOGLE_CLIENT_ID') {
        showToast('구글 클라이언트 ID가 설정되지 않았어요.');
        return;
      }
      gapi.load('auth2', function() {
        gapi.auth2.init({
          client_id: googleClientId
        }).then(function() {
          var authInstance = gapi.auth2.getAuthInstance();
          authInstance.signIn().then(function(googleUser) {
            var profile = googleUser.getBasicProfile();
            var socialId = profile.getId();
            var nickname = profile.getName() || '구글사용자';
            var email = profile.getEmail() || null;
            sendSocialLogin(provider, socialId, nickname, email);
          }).catch(function(err) {
            console.error('Google Sign-In error:', err);
            showToast('구글 로그인에 실패했어요.');
          });
        });
      });
    }
  }
  function sendSocialLogin(provider, socialId, nickname, email) {
    console.log('sendSocialLogin called:', { provider, socialId: socialId?.substring(0, 10) + '...', nickname: nickname?.substring(0, 20), email: email ? 'provided' : 'null' });
    var url = API_BASE + '/api/auth/social';
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: provider, socialId: socialId, nickname: nickname, email: email })
    }).then(function (r) {
      console.log('Social login response status:', r.status);
      if (!r.ok) {
        return r.text().then(function (text) {
          console.error('Social login error response:', text);
          try { 
            var parsed = JSON.parse(text);
            console.error('Parsed error:', parsed);
            return { ok: false, body: parsed, status: r.status }; 
          }
          catch { 
            console.error('Failed to parse error response:', text);
            return { ok: false, body: { error: 'HTTP ' + r.status + ': ' + text.substring(0, 100) }, status: r.status }; 
          }
        });
      }
      return r.json().then(function (j) { 
        console.log('Social login success:', { userId: j.user?.id, nickname: j.user?.nickname });
        return { ok: true, body: j }; 
      });
    }).catch(function(err) {
      console.error('sendSocialLogin fetch error:', err);
      return { ok: false, body: { error: '네트워크 오류: ' + err.message } };
    }).then(function (x) {
      if (!x || !x.ok) {
        hideAuthLoading();
        var errorMsg = x && x.body && x.body.error ? x.body.error : '소셜 로그인에 실패했어요.';
        if (x && x.body && x.body.details) {
          console.error('Server error details:', x.body.details);
        }
        if (x && x.body && x.body.code) {
          console.error('Server error code:', x.body.code);
        }
        showToast(errorMsg);
        return null;
      }
      if (!x.body || !x.body.user || !x.body.token) {
        hideAuthLoading();
        showToast('서버 응답이 올바르지 않아요.');
        return null;
      }
      setAuthToken(x.body.token);
      userProfile = x.body.user;
      isLoggedIn = true;
      
      // userProfile이 제대로 설정되었는지 확인
      if (!userProfile || !userProfile.nickname) {
        hideAuthLoading();
        console.error('userProfile is invalid:', userProfile);
        showToast('사용자 정보를 가져오는 중 오류가 났어요.');
        return null;
      }
      
      hideAuthLoading();
      return fetch(API_BASE + '/api/user/data', { headers: { 'Authorization': 'Bearer ' + x.body.token } });
    }).then(function (r) {
      if (!r) {
        // 로그인은 성공했지만 데이터 로드는 스킵
        if (userProfile && userProfile.nickname) {
          saveAll();
          closeAuthModal();
          setTimeout(function() {
            renderHeaderAuth();
            renderAuthGate();
            renderPet();
            renderAttendance();
            var card = document.getElementById('attendanceCard');
            if (card) card.style.display = 'block';
            showWelcomeModal(userProfile.nickname);
          }, 300);
        }
        return null;
      }
      if (!r.ok) {
        // 데이터 로드 실패해도 로그인은 성공
        console.warn('Failed to load user data:', r.status);
        if (userProfile && userProfile.nickname) {
          saveAll();
          closeAuthModal();
          setTimeout(function() {
            renderHeaderAuth();
            renderAuthGate();
            renderPet();
            renderAttendance();
            var card = document.getElementById('attendanceCard');
            if (card) card.style.display = 'block';
            showWelcomeModal(userProfile.nickname);
          }, 300);
        }
        return null;
      }
      return r.json();
    }).then(function (body) {
      if (!body) return;
      if (body && body.data) {
        try {
          var data = typeof body.data === 'string' ? JSON.parse(body.data) : body.data;
          applyGameState(data);
        } catch (e) {
          console.error('Failed to apply game state:', e);
        }
      }
      saveAll();
      closeAuthModal();
      setTimeout(function() {
        renderHeaderAuth();
        renderAuthGate();
        renderPet();
        renderAttendance();
        var card = document.getElementById('attendanceCard');
        if (card) card.style.display = 'block';
        if (userProfile && userProfile.nickname) {
          showWelcomeModal(userProfile.nickname);
        } else {
          showWelcomeModal();
        }
      }, 300);
    }).catch(function(err) {
      hideAuthLoading();
      console.error('User data load error:', err);
      if (userProfile && userProfile.nickname) {
        saveAll();
        closeAuthModal();
        setTimeout(function() {
          renderHeaderAuth();
          renderAuthGate();
          renderPet();
          renderAttendance();
          var card = document.getElementById('attendanceCard');
          if (card) card.style.display = 'block';
          showWelcomeModal(userProfile.nickname);
        }, 300);
      } else {
        showToast('로그인 중 오류가 났어요: ' + (err.message || '알 수 없는 오류'));
      }
    }).catch(function (err) {
      hideAuthLoading();
      console.error('Social login error:', err);
      // 로그인은 성공했지만 데이터 로드 실패
      if (userProfile && userProfile.nickname) {
        saveAll();
        closeAuthModal();
        setTimeout(function() {
          renderHeaderAuth();
          renderAuthGate();
          renderPet();
          renderAttendance();
          var card = document.getElementById('attendanceCard');
          if (card) card.style.display = 'block';
          showWelcomeModal(userProfile.nickname);
        }, 300);
      } else {
        showToast('로그인 중 오류가 났어요: ' + (err.message || '알 수 없는 오류'));
      }
    });
  }
  function switchAuthTab(tab) {
    document.getElementById('authLoginPanel').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('authSignupPanel').style.display = tab === 'signup' ? 'block' : 'none';
    document.getElementById('authFindIdPanel').style.display = tab === 'findId' ? 'block' : 'none';
    document.getElementById('authFindPwPanel').style.display = tab === 'findPw' ? 'block' : 'none';
    document.querySelectorAll('.auth-tab').forEach(function(t){ 
      t.classList.remove('active'); 
      if (t.getAttribute('data-auth-tab') === tab) t.classList.add('active'); 
    });
    document.getElementById('authTitle').textContent = 
      tab === 'login' ? '로그인' : 
      tab === 'signup' ? '회원가입' : 
      tab === 'findId' ? '아이디 찾기' : 
      tab === 'findPw' ? '비밀번호 찾기' : '로그인';
  }
  function doLogout() {
    // 카카오 로그인인 경우 카카오 로그아웃도 처리
    if (typeof Kakao !== 'undefined' && Kakao.Auth.getAccessToken()) {
      Kakao.Auth.logout(function() {
        console.log('카카오 로그아웃 완료');
      });
    }
    clearAuthToken();
    userProfile = null;
    isLoggedIn = false;
    saveAll();
    renderHeaderAuth();
    renderAuthGate();
    renderAttendance();
    var card = document.getElementById('attendanceCard');
    if (card) card.style.display = 'none';
    showToast('로그아웃되었어요.');
  }
  function renderAttendance() {
    var card = document.getElementById('attendanceCard');
    var statusEl = document.getElementById('attendanceStatus');
    var btn = document.getElementById('btnAttendance');
    if (!card || !statusEl) return;
    if (!isLoggedIn) {
      card.style.display = 'none';
      return;
    }
    card.style.display = 'block';
    var today = todayStr();
    var already = lastAttendanceDate === today;
    if (already) {
      statusEl.textContent = '오늘 출석 완료! 연속 ' + attendanceStreak + '일';
      if (btn) btn.style.display = 'none';
    } else {
      var nextDay = attendanceStreak + 1;
      if (nextDay <= 7) {
        statusEl.textContent = '오늘 출석하면 ' + (nextDay === 7 ? ATTENDANCE_7DAY_BOX_NAME : nextDay + '일차 보상') + ' 받기';
        if (btn) { btn.style.display = 'block'; btn.textContent = nextDay === 7 ? '출석하고 선물상자 받기' : '출석 체크'; }
      } else {
        statusEl.textContent = '연속 ' + attendanceStreak + '일 달성! 내일 다시 1일차부터 시작해요.';
        if (btn) btn.style.display = 'none';
      }
    }
  }
  function doAttendance() {
    if (!isLoggedIn) { showToast('로그인 후 출석할 수 있어요.'); return; }
    var today = todayStr();
    if (lastAttendanceDate === today) { showToast('오늘은 이미 출석했어요.'); return; }
    var yesterday = (function(){
      var d = new Date(); d.setDate(d.getDate() - 1);
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    })();
    if (lastAttendanceDate !== yesterday && lastAttendanceDate !== '') attendanceStreak = 0;
    attendanceStreak++;
    lastAttendanceDate = today;
    if (attendanceStreak <= 6) {
      var reward = ATTENDANCE_DAILY_GOLD[attendanceStreak - 1] || 10;
      gold += reward;
      // 곰(출석 보너스) 및 파트너 포인트
      addPartnerPointsForSource(1, 'attendance');
      saveAll();
      renderGold();
      renderAttendance();
      showToast('출석 ' + attendanceStreak + '일차! +' + reward + ' G');
    } else {
      attendanceStreak = 7;
      saveAll();
      openWeekMasterBox();
    }
  }
  function openWeekMasterBox() {
    if (Math.random() < 0.5) {
      gold += ATTENDANCE_7DAY_GOLD;
      // 7일 상자 출석 보너스
      addPartnerPointsForSource(3, 'attendance');
      saveAll();
      renderGold();
      renderAttendance();
      showToast(ATTENDANCE_7DAY_BOX_NAME + '에서 ' + ATTENDANCE_7DAY_GOLD + ' G 획득!');
    } else {
      var item = pickItemByTierWeight(true);
      var rarity = rollRarityPremium();
      var newItem = { id: item.id + '_' + Date.now(), name: item.name, type: item.type, emoji: item.emoji, rarity: rarity, enhance: 0, tier: item.tier || 'standard' };
      inventory.push(newItem);
      // 장비 도감 영구 등록 + 파트너 포인트
      markEquipmentOwnedByItem(newItem);
      addPartnerPointsForSource(2, 'codex');
      saveAll();
      renderInventory();
      renderAttendance();
      var tierLabel = TIER_LABELS[newItem.tier] || newItem.tier;
      var rarityLabel = (RARITY_NAMES.indexOf(rarity) >= 0 ? rarity : 'common');
      showToast(getItemIcon(newItem) + ' ' + newItem.name + ' (' + tierLabel + ' · ' + rarityLabel + ') 획득!');
    }
    attendanceStreak = 0;
    saveAll();
    renderAttendance();
    showToast('공유 감사해요! +40 G');
  }

  function renderPet() {
    var petEmoji = document.getElementById('petEmoji');
    var petName = document.getElementById('petName');
    var petLevel = document.getElementById('petLevel');
    var petExpFill = document.getElementById('petExpFill');
    var petExpText = document.getElementById('petExpText');
    
    if (!pet.type) {
      if (petEmoji) petEmoji.textContent = '🐾';
      if (petName) petName.textContent = '동물을 선택해주세요';
      if (petLevel) petLevel.textContent = '';
      if (petExpFill) petExpFill.style.width = '0%';
      if (petExpText) petExpText.textContent = '';
      return;
    }
    
    var petType = PET_TYPES.find(function(p) { return p.id === pet.type; });
    if (!petType) return;
    
    var expForNextLevel = pet.level * 100; // 레벨당 100 경험치 필요
    var expPercent = (pet.exp / expForNextLevel) * 100;
    
    if (petEmoji) petEmoji.textContent = petType.emoji;
    if (petName) petName.textContent = pet.name || petType.name;
    if (petLevel) petLevel.textContent = 'Lv.' + pet.level;
    if (petExpFill) petExpFill.style.width = Math.min(expPercent, 100) + '%';
    if (petExpText) {
      var abilityLabel = '';
      switch (petType.ability) {
        case 'xp_bonus': abilityLabel = '걷기 XP 보너스'; break;
        case 'gold_bonus': abilityLabel = '골드 보상 보너스'; break;
        case 'route_challenge_bonus': abilityLabel = '코스 도전 추가 보상'; break;
        case 'quest_bonus': abilityLabel = '퀘스트 보상 보너스'; break;
        case 'attendance_bonus': abilityLabel = '출석 보상 보너스'; break;
        case 'extra_partner_points': abilityLabel = '파트너 포인트 추가 획득'; break;
        case 'codex_bonus': abilityLabel = '도감/장비 수집 보너스'; break;
        case 'wild_bonus': abilityLabel = '야생 동물 보상 보너스'; break;
        default: abilityLabel = '';
      }
      var abilityText = abilityLabel ? ' · 특성: ' + abilityLabel : '';
      petExpText.textContent = '경험치: ' + pet.exp + ' / ' + expForNextLevel + abilityText;
    }
  }
  
  function addPetExp(amount) {
    if (!pet.type) return;
    pet.exp += amount;
    var expForNextLevel = pet.level * 100;
    while (pet.exp >= expForNextLevel) {
      pet.exp -= expForNextLevel;
      pet.level++;
      showToast('🎉 ' + (PET_TYPES.find(function(p) { return p.id === pet.type; }) || {}).name + '이(가) 레벨업했어요! Lv.' + pet.level);
      expForNextLevel = pet.level * 100;
    }
    saveAll();
    renderPet();
  }

  function getActivePetType() {
    if (!pet || !pet.type) return null;
    return PET_TYPES.find(function(p) { return p.id === pet.type; }) || null;
  }

  // 파트너 포인트 및 펫 특성 보정
  function addPartnerPointsForSource(baseAmount, source) {
    if (!baseAmount || baseAmount <= 0) return;
    var petType = getActivePetType();
    var extra = 0;
    if (petType && petType.ability) {
      switch (petType.ability) {
        case 'xp_bonus':
          if (source === 'walk_xp') extra += Math.ceil(baseAmount * 0.5);
          break;
        case 'gold_bonus':
          if (source === 'gold_reward' || source === 'quest') extra += Math.ceil(baseAmount * 0.5);
          break;
        case 'route_challenge_bonus':
          if (source === 'route_complete') extra += baseAmount; // 도전 보너스
          break;
        case 'quest_bonus':
          if (source === 'quest') extra += baseAmount; // 퀘스트 보너스
          break;
        case 'attendance_bonus':
          if (source === 'attendance') extra += baseAmount; // 출석 보너스
          break;
        case 'extra_partner_points':
          extra += Math.ceil(baseAmount * 0.5); // 어디서든 추가 포인트
          break;
        case 'codex_bonus':
          if (source === 'codex') extra += Math.ceil(baseAmount * 0.5); // 도감/장비 관련
          break;
        case 'wild_bonus':
          if (source === 'wild') extra += baseAmount; // 야생 동물 보너스
          break;
      }
    }
    var gain = baseAmount + extra;
    partnerPoints += gain;
    saveAll();
    // 토스트는 너무 자주 뜨지 않도록 간단하게만 표기
    showToast('✨ 파트너 포인트 +' + gain + (petType ? ' (' + petType.name + ')' : ''));
  }
  
  function renderAvatar() {
    var nameEl = document.getElementById('avatarName');
    var inputEl = document.getElementById('inputAvatarName');
    if (nameEl) nameEl.textContent = avatar.name || '산책러';
    if (inputEl) inputEl.value = avatar.name || '';
    var skin = avatar.skin || '#f5d0b0';
    var human = document.getElementById('avatarHuman');
    if (human) {
      human.style.setProperty('--skin', skin);
      var topItem = equipped.top ? inventory.find(function(i){ return i.id === equipped.top; }) : null;
      var bottomItem = equipped.bottom ? inventory.find(function(i){ return i.id === equipped.bottom; }) : null;
      human.style.setProperty('--top-color', topItem ? '#4a6fa5' : '#6b7280');
      human.style.setProperty('--bottom-color', bottomItem ? '#374151' : '#4b5563');
    }
    var headEl = document.getElementById('previewHead');
    var bodyEl = document.getElementById('previewBody');
    var armL = document.getElementById('previewArmL');
    var armR = document.getElementById('previewArmR');
    var legL = document.getElementById('previewLegL');
    var legR = document.getElementById('previewLegR');
    if (headEl) headEl.style.background = skin;
    if (bodyEl) bodyEl.style.background = (equipped.top ? inventory.find(function(i){ return i.id === equipped.top; }) : null) ? '#4a6fa5' : '#6b7280';
    if (armL) armL.style.background = skin;
    if (armR) armR.style.background = skin;
    if (legL) legL.style.background = (equipped.bottom ? inventory.find(function(i){ return i.id === equipped.bottom; }) : null) ? '#374151' : '#4b5563';
    if (legR) legR.style.background = (equipped.bottom ? inventory.find(function(i){ return i.id === equipped.bottom; }) : null) ? '#374151' : '#4b5563';
    var hatEl = document.getElementById('previewHat');
    var weaponEl = document.getElementById('previewWeapon');
    if (hatEl) { hatEl.textContent = ''; hatEl.style.display = 'none'; }
    var accSlot = equipped.watch || equipped.earphones || equipped.bag || equipped.glove;
    var accItem = accSlot ? inventory.find(function(i){ return i.id === accSlot; }) : null;
    if (weaponEl) { weaponEl.textContent = accItem ? getItemIcon(accItem) : ''; weaponEl.style.display = accItem ? 'block' : 'none'; }
    var selectHair = document.getElementById('selectHair');
    if (selectHair) selectHair.value = avatar.hair || 'short';
  }

  var routesMapPathEl = null;
  function initRoutesMap() {
    var el = document.getElementById('routesMap');
    if (!el) return;
    if (routesMapPathEl) return;
    el.innerHTML = '';
    var w = 400, h = 180;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    var grid = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    grid.setAttribute('class', 'our-map-grid');
    for (var i = 0; i <= 8; i++) {
      var v = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      v.setAttribute('x1', (i * w / 8));
      v.setAttribute('y1', 0);
      v.setAttribute('x2', (i * w / 8));
      v.setAttribute('y2', h);
      grid.appendChild(v);
      var hor = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      hor.setAttribute('x1', 0);
      hor.setAttribute('y1', (i * h / 8));
      hor.setAttribute('x2', w);
      hor.setAttribute('y2', (i * h / 8));
      grid.appendChild(hor);
    }
    svg.appendChild(grid);
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'our-map-path');
    path.setAttribute('d', '');
    svg.appendChild(path);
    el.appendChild(svg);
    var label = document.createElement('span');
    label.className = 'our-map-label';
    label.textContent = '완주한 경로';
    el.appendChild(label);
    routesMapPathEl = path;
  }
  function updateRoutesMap(routeId) {
    if (!routesMapPathEl) return;
    var r = routeId ? userRoutes.find(function(x){ return x.id === routeId; }) : null;
    var coords = (r && r.path && r.path.length) ? r.path : [];
    var w = 400, h = 180;
    if (coords.length === 0) {
      routesMapPathEl.setAttribute('d', '');
      return;
    }
    var bounds = ourMapBounds(coords);
    var pts = coords.map(function(c) { return ourMapLatLonToXY(c.lat, c.lon, bounds, w, h); });
    var d = 'M ' + pts[0].x + ' ' + pts[0].y;
    for (var i = 1; i < pts.length; i++) d += ' L ' + pts[i].x + ' ' + pts[i].y;
    routesMapPathEl.setAttribute('d', d);
  }
  function renderRoutes() {
    initRoutesMap();
    var list = document.getElementById('routeList');
    if (!list) return;
    list.innerHTML = '';
    if (userRoutes.length === 0) {
      list.innerHTML = '<p class="story-text" style="color:var(--text-muted);font-size:0.9rem;">아직 만든 코스가 없어요.<br>산책 탭에서 새 코스를 만들어 보세요!</p>';
      return;
    }
    userRoutes.forEach(function (r) {
      var card = document.createElement('div');
      card.className = 'route-card' + (r.completedAt ? '' : '');
      card.setAttribute('data-route-id', r.id);
      var status = r.completedAt ? 'done' : 'claim';
      var statusText = r.completedAt ? '완주' : r.goalKm + ' km';
      var bestText = '';
      if (r.bestTimeMs) {
        bestText = ' · 베스트 ' + formatDuration(r.bestTimeMs);
      }
      card.innerHTML =
        '<div class="route-icon">' + (r.completedAt ? '✅' : '🗺️') + '</div>' +
        '<div class="route-info">' +
          '<div class="route-name">' + r.name + '</div>' +
          '<div class="route-steps">목표 ' + r.goalKm + ' km' + (r.path && r.path.length ? ' · 경로 기록됨' : '') + bestText + '</div>' +
        '</div>' +
        '<span class="route-status ' + status + '">' + statusText + '</span>';
      card.onclick = function () { updateRoutesMap(r.id); };
      list.appendChild(card);
    });
  }

  function renderEquipped() {
    var wrap = document.getElementById('equippedSlots');
    if (!wrap) return;
    wrap.innerHTML = '';
    SLOT_ORDER.forEach(function (slot) {
      var itemId = equipped[slot];
      var item = itemId ? inventory.find(function (i) { return i.id === itemId; }) : null;
      var slotEl = document.createElement('div');
      slotEl.className = 'equipped-slot' + (item ? ' filled tier-' + (item.tier || 'standard') : '');
      slotEl.setAttribute('data-slot', slot);
      var tierLabel = item ? (TIER_LABELS[item.tier] || '스탠다드') : '';
      var icon = item ? getItemIcon(item) : '＋';
      var nameLine = item ? '<span class="slot-item-name" title="' + (item.name || '') + '">' + (item.name || '') + '</span>' : '';
      slotEl.innerHTML = '<span class="slot-label">' + SLOT_LABELS[slot] + '</span>' + icon + nameLine + (item ? '<span class="inv-tier">' + tierLabel + (item.enhance > 0 ? ' +' + item.enhance : '') + '</span>' : '');
      slotEl.onclick = function () { openEquipModal(slot); };
      wrap.appendChild(slotEl);
    });
    var sumEl = document.getElementById('equipBonusSummary');
    if (sumEl) {
      var b = getEquipmentBonus();
      var parts = [];
      if (b.xp > 0) parts.push('XP +' + b.xp + '%');
      if (b.distance > 0) parts.push('이동 거리 +' + b.distance + '%');
      if (b.gold > 0) parts.push('골드 +' + b.gold + '%');
      sumEl.innerHTML = parts.length ? '<strong>장비 보너스</strong>: ' + parts.join(', ') : '<strong>장비 보너스</strong>: 착용 장비에 따라 XP·거리·골드 보너스 적용 (걸음 수는 정확한 기록 유지를 위해 보너스 없음)';
    }
  }

  function openEquipModal(slot) {
    var list = inventory.filter(function (i) { return itemSlot(i) === slot; });
    if (list.length === 0) { showToast('해당 슬롯에 착용할 장비가 없어요'); return; }
    var current = equipped[slot];
    var idx = list.findIndex(function (i) { return i.id === current; });
    idx = (idx + 1) % list.length;
    equipped[slot] = list[idx].id;
    saveAll();
    renderEquipped();
    renderInventory();
    renderAvatar();
    showToast(list[idx].name + ' 착용');
  }

  function renderInventory() {
    var wrap = document.getElementById('inventoryBySlot');
    if (!wrap) return;
    wrap.innerHTML = '';
    var kits = inventory.filter(function(i){ return i.type === 'supply_kit'; });
    if (kits.length > 0) {
      var kitSec = document.createElement('div');
      kitSec.className = 'inventory-slot-section';
      kitSec.innerHTML = '<h4>📦 보급 키트</h4>';
      var kitList = document.createElement('div');
      kitList.className = 'inventory-slot-list';
      kits.forEach(function() {
        var div = document.createElement('div');
        div.className = 'inv-item inv-item-kit';
        div.innerHTML = '<span>📦</span><span class="inv-name">트레이닝 보급 키트</span><span class="inv-open">열기</span>';
        div.onclick = function () { openSupplyKit(); };
        kitList.appendChild(div);
      });
      kitSec.appendChild(kitList);
      wrap.appendChild(kitSec);
    }
    SLOT_ORDER.forEach(function (slot) {
      var list = inventory.filter(function (i) { return i.type !== 'supply_kit' && itemSlot(i) === slot; });
      if (list.length === 0) return;
      var sec = document.createElement('div');
      sec.className = 'inventory-slot-section';
      sec.innerHTML = '<h4>' + SLOT_LABELS[slot] + '</h4>';
      var listEl = document.createElement('div');
      listEl.className = 'inventory-slot-list';
      list.forEach(function (item) {
        var isEquipped = equipped[slot] === item.id;
        var rarity = item.rarity || 'common';
        var tier = item.tier || 'standard';
        var tierLabel = TIER_LABELS[tier] || '스탠다드';
        var div = document.createElement('div');
        div.className = 'inv-item rarity-' + rarity + ' tier-' + tier + (isEquipped ? ' equipped' : '');
        var enh = (item.enhance != null && item.enhance > 0) ? item.enhance : 0;
        var enhHtml = enh > 0 ? '<span class="inv-enhance">+' + enh + '</span>' : '';
        div.innerHTML = '<span class="rarity-dot"></span><span>' + getItemIcon(item) + '</span><span class="inv-name">' + (item.name || item.id) + '</span>' + enhHtml + '<span class="inv-tier">' + tierLabel + '</span>';
        div.onclick = function () {
          equipped[slot] = equipped[slot] === item.id ? null : item.id;
          saveAll();
          renderEquipped();
          renderInventory();
          renderAvatar();
        };
        listEl.appendChild(div);
      });
      sec.appendChild(listEl);
      wrap.appendChild(sec);
    });
  }

  function getStoryContent() {
    var completedCourses = userRoutes.filter(function(r){ return r.completedAt; });
    var lines = [];
    if (lifetimeSteps < 500 && totalXp < 10) {
      lines.push('아직 산책이 시작되지 않았어요.');
      lines.push('산책 탭에서 코스를 만들고 걸어 보세요.');
    } else {
      lines.push('당신은 걸음을 걸으며 세상을 탐험하고 있습니다.');
      if (completedCourses.length > 0) {
        var lastCourse = completedCourses[completedCourses.length - 1];
        lines.push('최근에 ' + lastCourse.name + ' 코스를 완주했어요.');
      }
      if (totalXp > 0) lines.push('트레이닝 보급 키트로 장비를 모으며 성장하고 있어요. (총 XP ' + totalXp + ')');
      if (lifetimeSteps >= 10000) lines.push('등산로 정상까지 오른 당신은 이제 진정한 산책의 달인입니다.');
      else if (lifetimeSteps >= 5000) lines.push('숲과 호수를 지나 더 높은 곳을 바라보고 있어요.');
      else if (lifetimeSteps >= 2000) lines.push('시내를 벗어나 강과 공원을 탐험하고 있어요.');
    }
    var coursesDone = userRoutes.filter(function(r){ return r.completedAt; }).length;
    return { text: lines.join('\n\n'), milestone: '누적 ' + lifetimeSteps.toLocaleString() + '걸음 · Lv.' + xpToLevel(totalXp).level + ' · 완주 코스 ' + coursesDone + '개' };
  }

  function renderStory() {
    var s = getStoryContent();
    var st = document.getElementById('storyText');
    var sm = document.getElementById('storyMilestone');
    if (st) st.textContent = s.text;
    if (sm) sm.textContent = s.milestone;
    renderAnimalCollection();
  }
  
  function renderAnimalCollection() {
    var grid = document.getElementById('animalCollectionGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    if (capturedAnimals.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted);">아직 포획한 동물이 없어요.<br>산책을 시작하면 주변에 동물이 나타날 거예요!</div>';
      return;
    }
    
    // 희귀도별로 정렬
    var rarityOrder = { legend: 0, epic: 1, rare: 2, common: 3 };
    var sorted = capturedAnimals.slice().sort(function(a, b) {
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });
    
    sorted.forEach(function(animal) {
      var rarityColor = { 
        common: 'var(--rarity-common)', 
        rare: 'var(--rarity-rare)', 
        epic: 'var(--rarity-epic)', 
        legend: 'var(--rarity-legend)' 
      }[animal.rarity];
      var rarityLabel = { common: '커먼', rare: '레어', epic: '에픽', legend: '레전드' }[animal.rarity];
      
      var card = document.createElement('div');
      card.style.cssText = 'background: var(--card); border: 2px solid ' + rarityColor + '; border-radius: var(--radius-lg); padding: 1rem; text-align: center; transition: transform 0.2s ease;';
      card.onmouseover = function() { this.style.transform = 'scale(1.05)'; };
      card.onmouseout = function() { this.style.transform = 'scale(1)'; };
      card.innerHTML = '<div style="font-size: 3rem; margin-bottom: 0.5rem;">' + animal.emoji + '</div><div style="font-weight: 600; margin-bottom: 0.25rem;">' + animal.name + '</div><div style="font-size: 0.75rem; color: ' + rarityColor + ';">' + rarityLabel + '</div>';
      grid.appendChild(card);
    });
  }

  function openCodexModal(initialTab) {
    var overlay = document.getElementById('codexOverlay');
    if (!overlay) return;
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    switchCodexTab(initialTab || 'equip');
    renderEquipmentCodex();
    renderCodexAnimals();
  }

  function closeCodexModal() {
    var overlay = document.getElementById('codexOverlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  function switchCodexTab(tab) {
    var equipBtn = document.getElementById('codexTabEquip');
    var animalBtn = document.getElementById('codexTabAnimal');
    var equipPanel = document.getElementById('codexEquipPanel');
    var animalPanel = document.getElementById('codexAnimalPanel');
    if (!equipBtn || !animalBtn || !equipPanel || !animalPanel) return;
    var isEquip = tab === 'animal' ? false : true;
    equipBtn.classList.toggle('active', isEquip);
    animalBtn.classList.toggle('active', !isEquip);
    equipPanel.style.display = isEquip ? 'block' : 'none';
    animalPanel.style.display = isEquip ? 'none' : 'block';
  }

  function markEquipmentOwnedByItem(item) {
    if (!item || !item.name || !item.type) return;
    var key = item.type + '|' + item.name;
    equipmentCodexOwned[key] = true;
  }
  function rebuildEquipmentCodexOwnedFromInventory() {
    // 인벤/보관함/착용 장비를 기준으로 한 번 싹 스캔해서 영구 도감에 반영
    equipmentCodexOwned = equipmentCodexOwned || {};
    function addFromItem(item) {
      if (!item || !item.name || !item.type) return;
      var key = item.type + '|' + item.name;
      equipmentCodexOwned[key] = true;
    }
    inventory.forEach(addFromItem);
    storage.forEach(addFromItem);
    Object.keys(equipped).forEach(function(slot) {
      var id = equipped[slot];
      if (!id) return;
      var item = inventory.find(function(i){ return i.id === id; });
      if (item) addFromItem(item);
    });
  }
  function getOwnedBaseItemIds() {
    // 영구 도감 기준 + 현재 인벤토리 기준을 모두 합쳐서 사용
    var ownedKeyMap = {};
    equipmentCodexOwned = equipmentCodexOwned || {};
    Object.keys(equipmentCodexOwned).forEach(function(key) {
      if (equipmentCodexOwned[key]) ownedKeyMap[key] = true;
    });
    function addFromItem(item) {
      if (!item || !item.name || !item.type) return;
      var key = item.type + '|' + item.name;
      ownedKeyMap[key] = true;
    }
    inventory.forEach(addFromItem);
    storage.forEach(addFromItem);
    Object.keys(equipped).forEach(function(slot) {
      var id = equipped[slot];
      if (!id) return;
      var item = inventory.find(function(i){ return i.id === id; });
      if (item) addFromItem(item);
    });
    return ownedKeyMap;
  }

  function renderEquipmentCodex() {
    var grid = document.getElementById('codexEquipGrid');
    if (!grid) return;
    grid.innerHTML = '';
    var owned = getOwnedBaseItemIds();
    // 장비를 type별로 그룹화
    var sorted = SUPPLY_POOL.slice().sort(function(a, b) {
      var at = a.type.localeCompare(b.type);
      if (at !== 0) return at;
      var atier = TIER_LABELS[a.tier] || a.tier;
      var btier = TIER_LABELS[b.tier] || b.tier;
      if (atier === btier) return a.name.localeCompare(b.name);
      return atier.localeCompare(btier);
    });
    sorted.forEach(function(baseItem) {
      // 이름+타입으로 보유 여부 확인
      var key = baseItem.type + '|' + baseItem.name;
      var isOwned = !!owned[key];
      // rarity가 없으면 tier를 기반으로 자동 매핑
      var inferredRarity = (function(tier) {
        switch (tier) {
          case 'standard': return 'common';
          case 'pro': return 'rare';
          case 'prime': return 'epic';
          case 'signature': return 'legend';
          default: return 'common';
        }
      })(baseItem.tier || 'standard');
      var rarity = baseItem.rarity || inferredRarity || 'common';
      var rarityLabel = {
        common: '커먼',
        rare: '레어',
        epic: '에픽',
        legend: '레전드',
        specialist: '스페셜리스트'
      }[rarity] || rarity;
      var rarityColor = {
        common: 'var(--rarity-common)',
        rare: 'var(--rarity-rare)',
        epic: 'var(--rarity-epic)',
        legend: 'var(--rarity-legend)',
        specialist: 'var(--gold)'
      }[rarity] || 'var(--text-muted)';
      var tierLabel = TIER_LABELS[baseItem.tier] || '스탠다드';
      var card = document.createElement('div');
      card.className = 'codex-card' + (isOwned ? ' owned' : '');
      var emoji = isOwned ? baseItem.emoji : '❓';
      var name = isOwned ? baseItem.name : '???';
      card.innerHTML =
        '<div class="codex-emoji">' + emoji + '</div>' +
        '<div class="codex-name">' + name + '</div>' +
        '<div class="codex-meta" style="color:' + rarityColor + ';">' + rarityLabel + ' · ' + tierLabel + '</div>';
      grid.appendChild(card);
    });
  }

  function renderCodexAnimals() {
    var grid = document.getElementById('codexAnimalGrid');
    if (!grid) return;
    grid.innerHTML = '';
    var capturedMap = {};
    capturedAnimals.forEach(function(c) {
      capturedMap[c.animalId] = true;
    });
    // 기본 펫(처음 선택하는 8종)도 도감에 포함
    var allAnimals = [];
    PET_TYPES.forEach(function(petType) {
      allAnimals.push({
        id: petType.id,
        name: petType.name,
        emoji: petType.emoji,
        rarity: 'partner',
        _kind: 'pet'
      });
    });
    WILD_ANIMALS.forEach(function(animal) {
      allAnimals.push(Object.assign({ _kind: 'wild' }, animal));
    });
    // 희귀도 순서대로 정렬 (파트너 > 스페셜리스트 > 레전드 > 에픽 > 레어 > 커먼)
    var rarityOrder = { partner: 0, specialist: 1, legend: 2, epic: 3, rare: 4, common: 5 };
    var sorted = allAnimals.slice().sort(function(a, b) {
      var ra = rarityOrder[a.rarity] != null ? rarityOrder[a.rarity] : 5;
      var rb = rarityOrder[b.rarity] != null ? rarityOrder[b.rarity] : 5;
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    });
    sorted.forEach(function(animal) {
      // 펫은 내가 선택한 동물이면 "획득" 처리, 야생 동물은 실제 포획 여부 체크
      var isMyPet = (animal._kind === 'pet' && pet && pet.type === animal.id);
      var captured = isMyPet || !!capturedMap[animal.id];
      var rarity = animal.rarity || 'common';
      var rarityLabel = {
        partner: '파트너',
        common: '커먼',
        rare: '레어',
        epic: '에픽',
        legend: '레전드',
        specialist: '스페셜리스트'
      }[rarity] || rarity;
      var rarityColor = {
        partner: 'var(--accent)',
        common: 'var(--rarity-common)',
        rare: 'var(--rarity-rare)',
        epic: 'var(--rarity-epic)',
        legend: 'var(--rarity-legend)',
        specialist: 'var(--gold)'
      }[rarity] || 'var(--text-muted)';
      var card = document.createElement('div');
      card.className = 'codex-card' + (captured ? ' owned' : '');
      var emoji = captured ? animal.emoji : '❓';
      var name = captured ? animal.name : '???';
      var desc = captured ? animal.description : '아직 만나지 못한 동물이에요.';
      card.innerHTML =
        '<div class="codex-emoji">' + emoji + '</div>' +
        '<div class="codex-name">' + name + '</div>' +
        '<div class="codex-meta" style="color:' + rarityColor + ';">' + rarityLabel + '</div>' +
        '<div class="codex-meta" style="margin-top:0.15rem;">' + desc + '</div>';
      grid.appendChild(card);
    });
  }
  
  function openPetSelectModal() {
    // 이미 스타팅 파트너를 선택했다면 다시 바꿀 수 없음
    if (pet && pet.type) {
      var currentPet = PET_TYPES.find(function(p) { return p.id === pet.type; });
      showToast((currentPet ? currentPet.name + '와(과) ' : '') + '이미 함께 걷고 있어요. 파트너는 한 번만 선택할 수 있어요.');
      return;
    }
    var overlay = document.getElementById('petSelectOverlay');
    var grid = document.getElementById('petGrid');
    if (!overlay || !grid) return;
    
    grid.innerHTML = '';
    var selectedPetId = pet.type;
    
    PET_TYPES.forEach(function(petType) {
      var item = document.createElement('div');
      item.className = 'pet-item' + (selectedPetId === petType.id ? ' selected' : '');
      item.setAttribute('data-pet-id', petType.id);
      item.innerHTML = '<div class="pet-item-emoji">' + petType.emoji + '</div><div class="pet-item-name">' + petType.name + '</div><div class="pet-item-desc">' + petType.description + '</div>';
      item.onclick = function() {
        document.querySelectorAll('.pet-item').forEach(function(el) { el.classList.remove('selected'); });
        item.classList.add('selected');
        selectedPetId = petType.id;
      };
      grid.appendChild(item);
    });
    
    overlay.style.display = 'flex';
  }
  
  function closePetSelectModal() {
    var overlay = document.getElementById('petSelectOverlay');
    if (overlay) overlay.style.display = 'none';
  }
  
  function confirmPetSelection() {
    // 이미 파트너가 있으면 변경 불가
    if (pet && pet.type) {
      var currentPet = PET_TYPES.find(function(p) { return p.id === pet.type; });
      showToast((currentPet ? currentPet.name + '는(은) ' : '파트너는 ') + '한 번 선택하면 변경할 수 없어요.');
      closePetSelectModal();
      return;
    }
    var selectedItem = document.querySelector('.pet-item.selected');
    if (!selectedItem) {
      showToast('동물을 선택해주세요.');
      return;
    }
    
    var petTypeId = selectedItem.getAttribute('data-pet-id');
    if (!petTypeId) return;
    
    var petType = PET_TYPES.find(function(p) { return p.id === petTypeId; });
    if (!petType) return;
    
    pet.type = petTypeId;
    pet.name = petType.name;
    if (!pet.level) pet.level = 1;
    if (pet.exp == null) pet.exp = 0;
    
    saveAll();
    renderPet();
    closePetSelectModal();
    showToast(petType.name + '을(를) 선택했어요! 함께 걸어 성장해봐요! 🐾');
  }

  function attachListeners() {
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { switchTab(btn.getAttribute('data-tab')); });
    });
    var btnAdd = document.getElementById('btnAdd');
    var btnReset = document.getElementById('btnReset');
    if (btnAdd) btnAdd.addEventListener('click', addStep);
    if (btnReset) btnReset.addEventListener('click', function () {
      if (confirm('오늘의 걸음 수만 0으로 초기화할까요? (누적 걸음과 장비는 유지됩니다)')) {
        steps = 0;
        saveAll();
        renderSteps();
      }
    });
    var inputName = document.getElementById('inputAvatarName');
    if (inputName) {
      inputName.addEventListener('input', function () {
        avatar.name = this.value.trim() || '산책러';
        var an = document.getElementById('avatarName');
        if (an) an.textContent = avatar.name;
        saveAll();
      });
      inputName.addEventListener('blur', saveAll);
    }
    document.querySelectorAll('.color-swatch[data-skin]').forEach(function (sw) {
      sw.addEventListener('click', function () {
        document.querySelectorAll('.color-swatch[data-skin]').forEach(function (s) { s.classList.remove('active'); });
        sw.classList.add('active');
        avatar.skin = sw.getAttribute('data-skin');
        var b = document.getElementById('previewBody'), h = document.getElementById('previewHead');
        if (b) b.style.background = avatar.skin;
        if (h) h.style.background = avatar.skin;
        saveAll();
      });
    });
    document.querySelectorAll('.color-swatch.hair-color').forEach(function (sw) {
      sw.addEventListener('click', function () {
        document.querySelectorAll('.color-swatch.hair-color').forEach(function (s) { s.classList.remove('active'); });
        sw.classList.add('active');
        avatar.hairColor = sw.getAttribute('data-hair');
        var hair = document.getElementById('previewHair');
        if (hair) hair.style.background = avatar.hairColor;
        saveAll();
      });
    });
    var selectHair = document.getElementById('selectHair');
    if (selectHair) selectHair.addEventListener('change', function () {
      avatar.hair = this.value;
      renderAvatar();
      saveAll();
    });
    var btnWalkStart = document.getElementById('btnWalkStart');
    var btnWalkStop = document.getElementById('btnWalkStop');
    if (btnWalkStart) btnWalkStart.addEventListener('click', startWalk);
    if (btnWalkStop) btnWalkStop.addEventListener('click', stopWalk);
    var courseInput = document.getElementById('courseGoalKm');
    var routeCreateCard = document.getElementById('routeCreateCard');
    var btnAddRoute = document.getElementById('btnAddRoute');
    var btnSaveRoute = document.getElementById('btnSaveRoute');
    if (btnAddRoute) btnAddRoute.addEventListener('click', function () { routeCreateCard.style.display = routeCreateCard.style.display === 'none' ? 'block' : 'none'; });
    if (btnSaveRoute) btnSaveRoute.addEventListener('click', addNewRoute);
    var themeToggle = document.getElementById('themeToggle');
    if (themeToggle) themeToggle.addEventListener('click', function () {
      var next = document.body.getAttribute('data-theme') === 'night' ? 'morning' : 'night';
      document.body.setAttribute('data-theme', next);
      localStorage.setItem(STORAGE_KEYS.theme, next);
      themeToggle.textContent = next === 'night' ? '🌙' : '☀️';
    });
    if (document.body.getAttribute('data-theme') === 'morning') themeToggle.textContent = '☀️';
    var btnGacha = document.getElementById('btnGacha');
    if (btnGacha) btnGacha.addEventListener('click', function() { doGachaPull(false); });
    var btnGachaPremium = document.getElementById('btnGachaPremium');
    if (btnGachaPremium) btnGachaPremium.addEventListener('click', function() { doGachaPull(true); });
    var btnShare = document.getElementById('btnShare');
    if (btnShare) btnShare.addEventListener('click', doShare);
    var btnEnhance = document.getElementById('btnEnhance');
    if (btnEnhance) btnEnhance.addEventListener('click', tryEnhance);
    var btnHeaderAuth = document.getElementById('btnHeaderAuth');
    if (btnHeaderAuth) btnHeaderAuth.addEventListener('click', function() {
      if (isLoggedIn) {
        // 로그인 상태일 때는 프로필 표시 (또는 아무 동작 안 함)
        // 로그아웃은 별도 버튼으로 처리
      } else {
        openAuthModal();
      }
    });
    var btnLogout = document.getElementById('btnLogout');
    if (btnLogout) btnLogout.addEventListener('click', function() {
      if (confirm('로그아웃할까요?')) {
        doLogout();
      }
    });
    document.querySelectorAll('.auth-tab').forEach(function(t) {
      t.addEventListener('click', function() {
        var tab = this.getAttribute('data-auth-tab');
        switchAuthTab(tab);
      });
    });
    var authClose = document.getElementById('authClose');
    if (authClose) authClose.addEventListener('click', closeAuthModal);
    var authOverlay = document.getElementById('authOverlay');
    if (authOverlay) authOverlay.addEventListener('click', function(e) { if (e.target === authOverlay && !authOverlay.classList.contains('auth-gate')) closeAuthModal(); });
    var btnAuthLogin = document.getElementById('btnAuthLogin');
    if (btnAuthLogin) btnAuthLogin.addEventListener('click', doLogin);
    var btnAuthSignup = document.getElementById('btnAuthSignup');
    if (btnAuthSignup) btnAuthSignup.addEventListener('click', doSignup);
    var btnFindId = document.getElementById('btnFindId');
    if (btnFindId) btnFindId.addEventListener('click', function() { switchAuthTab('findId'); });
    var btnFindPw = document.getElementById('btnFindPw');
    if (btnFindPw) btnFindPw.addEventListener('click', function() { switchAuthTab('findPw'); });
    var btnFindIdSubmit = document.getElementById('btnFindIdSubmit');
    if (btnFindIdSubmit) btnFindIdSubmit.addEventListener('click', doFindId);
    var btnFindPwSubmit = document.getElementById('btnFindPwSubmit');
    if (btnFindPwSubmit) btnFindPwSubmit.addEventListener('click', doFindPw);
    var btnResetPwSubmit = document.getElementById('btnResetPwSubmit');
    if (btnResetPwSubmit) btnResetPwSubmit.addEventListener('click', doResetPw);
    var btnBackToLogin = document.getElementById('btnBackToLogin');
    if (btnBackToLogin) btnBackToLogin.addEventListener('click', function() { switchAuthTab('login'); });
    var btnBackToLogin2 = document.getElementById('btnBackToLogin2');
    if (btnBackToLogin2) btnBackToLogin2.addEventListener('click', function() { switchAuthTab('login'); });
    var btnKakaoLogin = document.getElementById('btnKakaoLogin');
    if (btnKakaoLogin) btnKakaoLogin.addEventListener('click', function() { doSocialLogin('kakao'); });
    var btnKakaoSignup = document.getElementById('btnKakaoSignup');
    if (btnKakaoSignup) btnKakaoSignup.addEventListener('click', function() { doSocialLogin('kakao'); });
    var btnGoogleLogin = document.getElementById('btnGoogleLogin');
    if (btnGoogleLogin) btnGoogleLogin.addEventListener('click', function() { doSocialLogin('google'); });
    var btnGoogleSignup = document.getElementById('btnGoogleSignup');
    if (btnGoogleSignup) btnGoogleSignup.addEventListener('click', function() { doSocialLogin('google'); });
    var btnWelcomeClose = document.getElementById('btnWelcomeClose');
    if (btnWelcomeClose) btnWelcomeClose.addEventListener('click', hideWelcomeModal);
    var welcomeModal = document.getElementById('welcomeModal');
    if (welcomeModal) welcomeModal.addEventListener('click', function(e) {
      if (e.target === welcomeModal) hideWelcomeModal();
    });
    var btnTutorialNext = document.getElementById('btnTutorialNext');
    if (btnTutorialNext) btnTutorialNext.addEventListener('click', nextTutorialStep);
    var btnTutorialPrev = document.getElementById('btnTutorialPrev');
    if (btnTutorialPrev) btnTutorialPrev.addEventListener('click', prevTutorialStep);
    var tutorialClose = document.getElementById('tutorialClose');
    if (tutorialClose) tutorialClose.addEventListener('click', hideTutorial);
    var tutorialModal = document.getElementById('tutorialModal');
    if (tutorialModal) tutorialModal.addEventListener('click', function(e) {
      if (e.target === tutorialModal) hideTutorial();
    });
    var btnSelectPet = document.getElementById('btnSelectPet');
    if (btnSelectPet) btnSelectPet.addEventListener('click', openPetSelectModal);
    var btnConfirmPet = document.getElementById('btnConfirmPet');
    if (btnConfirmPet) btnConfirmPet.addEventListener('click', confirmPetSelection);
    var petSelectClose = document.getElementById('petSelectClose');
    if (petSelectClose) petSelectClose.addEventListener('click', closePetSelectModal);
    var petSelectOverlay = document.getElementById('petSelectOverlay');
    if (petSelectOverlay) petSelectOverlay.addEventListener('click', function(e) {
      if (e.target === petSelectOverlay) closePetSelectModal();
    });
    var btnAttendance = document.getElementById('btnAttendance');
    if (btnAttendance) btnAttendance.addEventListener('click', doAttendance);
  }

  var lastAcc = 0, lastPeakTime = 0;
  function onMotion(e) {
    var acc = e.accelerationIncludingGravity;
    if (acc.x == null || acc.y == null || acc.z == null) return;
    var magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
    var now = Date.now();
    if (magnitude > 12 && (now - lastPeakTime) > 400 && lastAcc > 0 && lastAcc < magnitude) {
      lastPeakTime = now;
      addStep();
    }
    lastAcc = magnitude;
  }
  function initSensorAndStatus() {
    var statusEl = document.getElementById('status');
    if (!statusEl) return;
    if (typeof DeviceMotionEvent !== 'undefined') {
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        statusEl.textContent = 'iOS: 화면을 한 번 탭하면 센서를 켤 수 있어요. 버튼으로도 걸음을 추가할 수 있어요.';
        document.body.addEventListener('click', function req() {
          DeviceMotionEvent.requestPermission()
            .then(function (p) {
              if (p === 'granted') {
                window.addEventListener('devicemotion', onMotion);
                statusEl.textContent = '걸음 감지 켜짐';
                statusEl.classList.add('sensor-ok');
              }
            }, function () { statusEl.textContent = '센서 사용 불가. 버튼으로 걸음을 추가해 주세요.'; });
        }, { once: true });
      } else {
        window.addEventListener('devicemotion', onMotion);
        statusEl.textContent = '걸음 감지 켜짐 (버튼으로도 추가 가능)';
        statusEl.classList.add('sensor-ok');
      }
    } else {
      statusEl.textContent = '버튼을 눌러 걸음을 추가해 주세요.';
    }
  }

  function init() {
    attachListeners();
    attachCodexListeners();
    loadAll();
    initAuth().then(function () {
      checkRouteRewards();
      renderSteps();
      renderWalk();
      renderAvatar();
      renderPet();
      renderRoutes();
      renderStorage();
      renderQuests();
      renderHeaderAuth();
      renderAttendance();
      renderEquipped();
      renderInventory();
      renderStory();
      renderLevel();
      renderRouteSelect();
      renderAchievements();
      renderGold();
      renderEnhanceSelect();
      renderEquipmentCodex();
      renderCodexAnimals();
      var themeToggle = document.getElementById('themeToggle');
      if (themeToggle && document.body.getAttribute('data-theme') === 'morning') themeToggle.textContent = '☀️';
      initSensorAndStatus();
      // 만료된 야생 동물 제거
      checkExpiredWildAnimals();
      // 30초마다 만료 체크
      setInterval(checkExpiredWildAnimals, 30000);
    });
  }

  function attachCodexListeners() {
    var btnCodex = document.getElementById('btnCodex');
    var codexOverlay = document.getElementById('codexOverlay');
    var codexClose = document.getElementById('codexClose');
    var codexTabEquip = document.getElementById('codexTabEquip');
    var codexTabAnimal = document.getElementById('codexTabAnimal');
    if (btnCodex) btnCodex.addEventListener('click', function() { openCodexModal('equip'); });
    if (codexClose) codexClose.addEventListener('click', closeCodexModal);
    if (codexOverlay) codexOverlay.addEventListener('click', function(e) {
      if (e.target === codexOverlay) closeCodexModal();
    });
    if (codexTabEquip) codexTabEquip.addEventListener('click', function() { switchCodexTab('equip'); renderEquipmentCodex(); });
    if (codexTabAnimal) codexTabAnimal.addEventListener('click', function() { switchCodexTab('animal'); renderCodexAnimals(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});