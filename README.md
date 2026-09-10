# PocketPTT — Internet-based Walkie-Talkie (Android)

Push-to-talk voice messaging over Firebase (Option A from the design doc:
store-and-forward voice clips, not live streaming). No cellular voice, no
paid relay infra — works over WiFi or mobile data.

Follows the same build pattern as FamilyCircle / SpamGuard / CallVault:

```
Expo managed workflow → expo prebuild → Gradle → GitHub Actions → signed APK → sideload via ADB
```

No local Android SDK/Studio required. No EAS, no Play Store.

## Repo layout

```
.github/workflows/build-android.yml   CI: builds a signed release APK
app/                                   all Expo/React Native source
  App.js                               navigation shell
  src/screens/                         Channels, Channel (PTT), Contacts, Settings
  src/services/                        audioService.js, firestoreService.js
  src/firebaseConfig.js                fill in your Firebase project keys
  firestore.rules                      security rules for channels/clips
```

## First-time setup

1. Create a Firebase project → enable **Firestore** and **Storage**.
2. Copy your web app config into `app/src/firebaseConfig.js`.
3. Deploy `app/firestore.rules` (Firebase console → Firestore → Rules, paste and publish).
4. Push to GitHub — the Actions workflow builds `app-release.apk` as a build artifact.
5. Download the artifact, `adb install app-release.apk` on a test device (Nokia 8 / S24 / Android 16 device).

## What v1 does

- Create or join a **channel** by invite code (same closed-group model as FamilyCircle).
- **Press-and-hold** the PTT button to record; release to upload.
- Every member listening to that channel gets the clip pushed via a live Firestore
  listener and it auto-plays.
- No live audio streaming yet — each "transmission" is a short recorded clip
  (typically 1–15s), which is why this works fine on flaky mobile data.

## Before your first real CI build

`expo prebuild --clean` regenerates `android/` from scratch every run, so the
release **signing config** needs to be wired in via a config plugin (or a
small patch step in the workflow) pointing `android/app/build.gradle` at
`release.keystore` — the same pattern used in CallVault for a fixed,
committed signing identity. Add `ANDROID_KEYSTORE_BASE64` (and the
matching store/key passwords) as GitHub Actions secrets once you've
generated a keystore.

## Known v1 limitations (see design doc for detail)

- No offline / no-internet mode yet (WiFi-Direct is phase 2).
- No push notification when app is backgrounded — only reacts while the
  Channel screen is open. Background delivery via FCM is a near-term next step.
- Android only.
