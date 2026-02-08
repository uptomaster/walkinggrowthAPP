# 산책 성장기 – Unity 캐릭터 연동 가이드

웹/앱에서 **Unity**로 만든 3D 캐릭터를 넣고, 장비/아바타 정보를 연동하는 방법입니다.

---

## 1. 연동 방식 요약

| 환경 | 방식 | 설명 |
|------|------|------|
| **웹 (PWA/브라우저)** | Unity **WebGL** 빌드 삽입 | iframe 또는 `<canvas>`에 WebGL 빌드 로드, JavaScript ↔ Unity 메시지로 데이터 전달 |
| **앱 (Capacitor/Android)** | WebView 안에 WebGL **또는** 네이티브 Unity 플러그인 | 웹과 동일하게 WebGL 삽입하거나, 네이티브 Unity 뷰 연동(작업량 많음) |

가장 보편적인 방법은 **Unity WebGL 빌드**를 HTML 한 구역(아바타 영역)에 넣고, **JavaScript ↔ Unity**로만 통신하는 방식입니다.

---

## 2. Unity 쪽 준비 (WebGL)

### 2.1 WebGL 빌드

1. Unity에서 프로젝트 열기  
2. **File → Build Settings**  
3. **Platform**에서 **WebGL** 선택 후 **Switch Platform**  
4. **Player Settings**에서:
   - **Resolution and Presentation**  
     - **Default Canvas Width/Height** 적당히 (예: 400, 500)  
     - **Run In Background** 체크 시 탭 전환해도 애니 재생 가능  
   - **Publishing Settings**  
     - **Compression Format**: Gzip 또는 Brotli  
     - **Decompression Fallback** 체크 권장  
5. **Build** (또는 Build And Run) → 출력 폴더 예: `Build/`, `StreamingAssets/`  
6. 생성되는 파일 예:  
   - `Build/웹글로벌.loader.js`  
   - `Build/웹글로벌.framework.js`  
   - `Build/웹글로벌.data`  
   - `Build/웹글로벌.wasm`  
   - `TemplateData/` (이미지 등)

### 2.2 HTML에 넣을 코드 (Unity가 생성하는 예시)

빌드하면 **index.html** 같은 게 나옵니다. 그 안의 `<script>`와 `<canvas>` 부분을 참고해서, 우리 쪽 **아바타 영역**에 맞게 가져옵니다.

- **캔버스 크기**: 아바타 영역 크기에 맞게 (예: 320x400)
- **로더 스크립트**:  
  `createUnityInstance(canvas, config, onProgress)`  
  사용하는 부분을 그대로 쓰거나, 우리 페이지 구조에 맞게 `canvas`만 우리가 만든 요소로 바꿉니다.

---

## 3. HTML/JS 쪽 – 아바타 영역에 WebGL 넣기

### 3.1 아바타 영역 구조

지금 아바타 탭에는 `avatar-3d-placeholder` div가 있습니다. 여기를 **Unity WebGL**이 그려질 영역으로 바꿀 수 있습니다.

```html
<!-- 예: 기존 플레이스홀더를 Unity용으로 교체 -->
<div class="avatar-3d-placeholder" id="unityContainer">
  <canvas id="unityCanvas"></canvas>
  <!-- 로딩 중일 때 -->
  <div id="unityLoading" class="ph-desc">Unity 로딩 중...</div>
</div>
```

- `#unityContainer`: 크기·레이아웃 담당 (CSS로 320x400 등 고정 가능)
- `#unityCanvas`: Unity가 실제로 그리는 캔버스 (Unity 로더가 이 id를 사용하도록 설정)

### 3.2 Unity 로더 호출 (예시)

Unity WebGL 빌드 후 생성되는 **loader.js**를 페이지에 넣고, 아래처럼 호출합니다.

```html
<script src="Build/웹글로벌.loader.js"></script>
<script>
  var unityInstance = null;
  function initUnity() {
    var canvas = document.getElementById('unityCanvas');
    if (!canvas) return;
    createUnityInstance(canvas, {
      dataUrl: "Build/웹글로벌.data",
      frameworkUrl: "Build/웹글로벌.framework.js",
      codeUrl: "Build/웹글로벌.wasm",
    }, function(progress) {
      // progress 0~1
    }).then(function(instance) {
      unityInstance = instance;
      document.getElementById('unityLoading').style.display = 'none';
      // 최초 장비/아바타 데이터 전달
      sendAvatarDataToUnity();
    });
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', initUnity);
  else
    initUnity();
</script>
```

- 실제 파일명(`웹글로벌` 등)은 빌드 결과에 맞게 바꿉니다.
- 아바타 탭으로 들어왔을 때만 `initUnity()`를 호출하도록 하면, 첫 로딩 부담을 줄일 수 있습니다.

---

## 4. JavaScript → Unity 로 데이터 보내기

우리 앱(HTML/JS)에 있는 **아바타 이름, 착용 장비, 피부색** 등을 Unity로 넘기려면, Unity에서 **메시지 수신 함수**를 하나 두고, JS에서 그 함수를 호출하면 됩니다.

### 4.1 Unity C# 예시 (메시지 수신)

```csharp
// Unity: 어떤 GameObject의 스크립트에서
public class AvatarReceiver : MonoBehaviour
{
    public void SetAvatarData(string json) {
        // JSON: {"name":"산책러","skin":"#f5d0b0","equipped":{...}}
        var data = JsonUtility.FromJson<AvatarData>(json);
        // 캐릭터 이름, 옷/장비 적용, 색상 등 처리
    }
}
```

- `JsonUtility.FromJson` 대신 외부 라이브러리로 JSON 파싱해도 됩니다.
- `SetAvatarData`를 **public**으로 두면, 아래처럼 JS에서 호출할 수 있습니다.

### 4.2 HTML/JS에서 Unity로 보내기

Unity 인스턴스를 받은 뒤, `SendMessage("GameObject이름", "메서드이름", "인자")` 로 호출합니다.

```javascript
function sendAvatarDataToUnity() {
  if (!unityInstance) return;
  var data = {
    name: avatar.name,
    skin: avatar.skin,
    equipped: equipped,
    // 장비 id 목록만 보내도 됨
    equipmentIds: {
      shoes: equipped.shoes,
      top: equipped.top,
      bottom: equipped.bottom
      // ...
    }
  };
  unityInstance.SendMessage('AvatarController', 'SetAvatarData', JSON.stringify(data));
}
```

- `AvatarController`: Unity 씬에 있는 **GameObject 이름**
- `SetAvatarData`: 그 오브젝트에 붙은 스크립트의 **public 메서드 이름**
- 장비 변경·이름 변경 시 `sendAvatarDataToUnity()`를 다시 호출하면 Unity 캐릭터가 갱신됩니다.

---

## 5. Unity → JavaScript 호출 (선택)

Unity에서 웹으로 이벤트를 보내고 싶다면(예: 애니 종료, 클릭 이벤트), **jslib** 또는 **Application.ExternalCall**을 씁니다.

### 5.1 Unity (jslib)

`Assets/Plugins/WebGL/WebInterface.jslib`:

```javascript
mergeInto(LibraryManager.library, {
  NotifyWeb: function(str) {
    var s = UTF8ToString(str);
    if (typeof window.onUnityMessage === 'function')
      window.onUnityMessage(s);
  }
});
```

C#:

```csharp
[DllImport("__Internal")]
private static extern void NotifyWeb(string message);

void SomeEvent() {
  NotifyWeb("anim_finished");
}
```

### 5.2 HTML 쪽

```javascript
window.onUnityMessage = function(message) {
  if (message === 'anim_finished') {
    // 원하는 처리
  }
};
```

---

## 6. 파일 배치 (웹 기준)

- **Build/**  
  - `*.data`, `*.framework.js`, `*.wasm`, `*.loader.js`  
  - 같은 도메인 또는 CORS 허용된 경로에 두기  
- **TemplateData/**  
  - Unity가 요청하는 이미지 등  
- **walk-growth.html**  
  - 위 Build/ 경로를 상대 경로로 맞추거나, 같은 서버에 두고 스크립트/캔버스만 아바타 영역에 맞게 수정  

Capacitor 앱에서는 이 파일들을 `www/`(또는 `webDir`)에 넣고, 앱 WebView에서 같은 상대 경로로 로드하면 됩니다.

---

## 7. 정리

1. **Unity**에서 캐릭터 씬을 **WebGL**로 빌드  
2. 빌드 결과 **Build/** 를 웹 프로젝트에 복사  
3. 아바타 영역에 **canvas** + Unity **loader** 호출  
4. **SendMessage**로 아바타 이름·장비·색상 등 JSON 전달  
5. 필요하면 **jslib**으로 Unity → JS 이벤트 전달  

이렇게 하면 “캐릭터만 Unity, 나머지는 기존 HTML/JS” 구조로 연동할 수 있습니다.  
네이티브 앱에서 Unity 엔진을 직접 띄우는 방식은 설정이 더 필요하므로, 먼저 WebGL 방식으로 연동하는 것을 권장합니다.
