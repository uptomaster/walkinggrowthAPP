# Java 21 설정 가이드 (안드로이드 스튜디오)

## 🔴 문제 상황

Capacitor 8.x가 Android SDK 36 (VANILLA_ICE_CREAM)을 요구하며, 이는 Java 21이 필요합니다.

## ✅ 해결 방법

### 1. 안드로이드 스튜디오에서 Java 21 설정 확인

1. **안드로이드 스튜디오 열기**
2. **File** → **Settings** (또는 **Ctrl+Alt+S**)
3. **Build, Execution, Deployment** → **Build Tools** → **Gradle**
4. **Gradle JDK** 확인:
   - **JDK 21** 또는 **jbr-21** 선택
   - 없으면 **Download JDK** 클릭하여 Java 21 다운로드

### 2. 프로젝트별 JDK 설정

1. 안드로이드 스튜디오에서 `android` 폴더 열기
2. **File** → **Project Structure** (또는 **Ctrl+Alt+Shift+S**)
3. **SDK Location** 탭:
   - **JDK location**: Java 21 경로 확인
   - 예: `C:\Program Files\Android\Android Studio\jbr`

### 3. Gradle JDK 확인

**안드로이드 스튜디오 터미널에서:**
```bash
cd android
.\gradlew --version
```

출력에서 Java 버전이 21인지 확인:
```
JVM:          21.x.x (Eclipse AdoptOpenJDK 21.x.x)
```

## 🔧 수동 설정 (필요시)

### gradle.properties에 JDK 경로 추가

안드로이드 스튜디오의 JDK 경로를 찾아서:

```properties
org.gradle.java.home=C\:\\Program Files\\Android\\Android Studio\\jbr
```

또는:

```properties
org.gradle.java.home=C\:\\Program Files\\Java\\jdk-21
```

**주의**: 경로에 백슬래시(`\`)를 두 개씩 사용해야 합니다!

## 📝 변경된 설정

- `variables.gradle`: `compileSdkVersion = 36`
- `app/build.gradle`: `JavaVersion.VERSION_21`
- `build.gradle`: `JavaVersion.VERSION_21`
- `gradle.properties`: `android.suppressUnsupportedCompileSdk=36`

## 🚀 빌드하기

안드로이드 스튜디오에서 Java 21이 설정되었는지 확인한 후:

```bash
cd android
.\gradlew clean assembleDebug
```

## ⚠️ 중요 사항

1. **Java 21 필수**: Capacitor 8.x는 Java 21을 요구합니다
2. **안드로이드 스튜디오 JDK**: 안드로이드 스튜디오는 자체 JDK를 포함합니다 (jbr)
3. **경로 확인**: JDK 경로에 공백이나 특수문자가 있으면 이스케이프 필요

## 💡 Java 버전 확인 방법

**Windows PowerShell:**
```powershell
java -version
```

**Gradle로 확인:**
```bash
cd android
.\gradlew --version
```

## 🆘 여전히 오류가 발생하면

1. **안드로이드 스튜디오 재시작**
2. **File** → **Invalidate Caches / Restart**
3. **Build** → **Clean Project**
4. 다시 빌드 시도
