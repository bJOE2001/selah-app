# Selah: Bible & Devotional — Installation & Setup Guide

> *Pause, Reflect & Praise*

Welcome to **Selah: Bible & Devotional**, an aesthetic devotional journaling and Scripture reader app built with **React Native**, **Expo SDK 54**, **Expo Router**, **TypeScript**, and **Expo SQLite**.

This guide walks you through setting up, configuring, and running the project from scratch on your local development machine.

---

## 📋 System Prerequisites

Before you start, make sure you have the following installed on your machine:

1. **Node.js**: `v18.x` or `v20.x` LTS recommended (check with `node -v`)
2. **Package Manager**: `npm` (v9+ or v10+) or `yarn` / `pnpm` / `bun` (npm is recommended as `package-lock.json` is provided)
3. **Git**: Installed and configured
4. **Development Device or Emulator**:
   - **Physical Device**: Install the **Expo Go** app from Google Play Store (Android) or Apple App Store (iOS).
   - **Android Emulator**: Android Studio with an Android Virtual Device (AVD) configured and Android SDK platform tools added to `PATH`.
   - **iOS Simulator**: Xcode (macOS only) with iOS Simulator installed.
   - **Web Browser**: Chrome, Edge, Safari, or Firefox for web development preview.

---

## 🚀 Quick Start (Step-by-Step)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/selah-app.git
cd selah-app
```

### 2. Install Dependencies

Install project dependencies using `npm`:

```bash
npm install
```

> **Note:** If you encounter peer dependency warnings on newer npm versions, run `npm install --legacy-peer-deps`.

---

### 3. Bible Database Setup

Selah includes a local SQLite database of the King James Version (KJV) Bible located at:
```
assets/db/KJV.db (~33MB)
```

- **Pre-bundled:** The database file is already included in `assets/db/KJV.db`. On the first app launch, the database manager automatically copies this asset to the app's internal SQLite document directory.
- **Rebuilding Database (Optional):** If you ever need to regenerate or clean the Bible SQLite database from source, run:
  ```bash
  node scripts/build-bible-db.js
  ```
  *(Uses Node.js 22+ built-in `node:sqlite` module with zero native C++ build tools required)*.

---

### 4. Start the Development Server

Start Metro bundler using Expo CLI:

```bash
npm start
# or
npx expo start
```

This will launch the interactive Expo DevTools terminal UI and display a QR code.

---

## 📱 Running on Different Platforms

### A. Real Android Device as Screen-Mirrored Emulator (Recommended)
You can mirror your real Android phone to your PC monitor using `scrcpy` and get instant real-time live coding:

1. **Enable USB Debugging on your phone**:
   - Go to **Settings > About Phone** and tap **Build Number** 7 times.
   - Go to **Developer Options** and turn **ON**:
     - `USB Debugging`
     - `Install via USB` *(Xiaomi/MIUI)*
     - `USB Debugging (Security settings)` *(Xiaomi/MIUI)*
2. **Install `scrcpy` on PC (PowerShell)**:
   ```powershell
   winget install Genymobile.scrcpy
   ```
3. **Verify Phone Connection**:
   ```powershell
   adb devices
   ```
4. **Mirror Screen in Window**:
   ```powershell
   scrcpy
   ```
5. **Start Live Dev Server**:
   ```powershell
   npx expo start
   ```

---

### B. Building Standalone APKs & Development Client (EAS CLI)

Use Expo Application Services (EAS) to compile native Android APKs in the cloud without needing local Android Studio configuration:

```powershell
# 1. Build a Live Development Client APK (Hot Reloading via USB/Wi-Fi):
npx eas-cli build --profile development --platform android

# 2. Build a Standalone Preview APK (Direct Installable .apk):
npx eas-cli build --profile preview --platform android

# 3. Build a Production APK:
npx eas-cli build --profile production --platform android
```

---

### C. Physical Device (Expo Go)
1. Run `npx expo start`.
2. **Android**: Open the **Expo Go** app and scan the QR code from the terminal.
3. **iOS**: Open the native **Camera** app, scan the QR code, and tap the prompt to open in **Expo Go**.
> *Ensure your computer and mobile device are connected to the same Wi-Fi network (or use `npx expo start --tunnel`).*

### D. Local Native Build (Android Studio)
If you have Android Studio and Android SDK installed on your PC:
```powershell
npx expo run:android
```

### E. iOS Simulator (macOS only)
1. Open the iOS Simulator.
2. Run:
   ```bash
   npm run ios
   # or press 'i' in the interactive Expo terminal
   ```

### F. Web Browser
Selah supports web preview via React Native Web:
```bash
npm run web
# or press 'w' in the interactive Expo terminal
```
Your default browser will open `http://localhost:8081`.

---


## 📂 Project Architecture

```
selah-app/
├── app/                        # Expo Router navigation & screen routes
│   ├── (tabs)/                 # Bottom tab navigator (Home, Bible, Journal, Profile)
│   ├── devotional/             # Devotional creation & detail screens
│   ├── share/                  # Share card generation modal
│   ├── settings/               # Settings & configuration screens
│   ├── _layout.tsx             # Root layout, database provider, theme & lock gate
│   └── index.tsx               # App entry point
├── assets/                     # Static media assets
│   ├── db/                     # Pre-bundled KJV.db SQLite database
│   ├── fonts/                  # Custom font files
│   └── images/                 # App icons, splash screens, illustrations
├── src/                        # Feature-based source modules
│   ├── bible-data/             # SQLite schema, queries, indexing & DB manager
│   ├── bible-reader/           # Book/Chapter/Verse selector and reading view
│   ├── daily-dashboard/        # Daily tasks, streak tracking & home feed
│   ├── design-system/          # Aesthetic design tokens, themes & UI primitives
│   ├── devotional-core/        # Devotional models, CRUD layer & Zustand state
│   ├── journal-history/        # Timeline, search, calendar & filtering
│   ├── notebook-editor/        # Devotional journaling editor
│   ├── privacy-lock/           # Biometrics & PIN authentication layer
│   ├── settings/               # User settings and preferences
│   └── utils/                  # Shared helper functions
├── scripts/                    # Database seeding and compilation scripts
├── app.json                    # Expo configuration & plugins
├── metro.config.js             # Metro bundler config (supports .db & .wasm assets)
├── package.json                # Project dependencies & scripts
└── tsconfig.json               # TypeScript configuration
```

---

## 🛠️ Key Technologies & Dependencies

| Category | Technology |
|---|---|
| **Framework** | [React Native 0.81](https://reactnative.dev/) / [Expo SDK 54](https://docs.expo.dev/) |
| **Routing** | [Expo Router v6](https://docs.expo.dev/router/introduction/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Local Database** | [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) & [TanStack Query v5](https://tanstack.com/query) |
| **Animations** | [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) |
| **Typography** | Playfair Display, Lora, Caveat (`@expo-google-fonts/*`) |
| **Security & Biometrics**| [Expo Local Authentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/) |

---

## ⚙️ Build & Export Commands

| Command | Description |
|---|---|
| `npm start` | Starts the Metro bundler |
| `npm run android` | Launches the app in an Android emulator/device |
| `npm run ios` | Launches the app in an iOS simulator/device |
| `npm run web` | Launches the app in the web browser |
| `npx expo start -c` | Clears the Metro bundler cache and restarts |
| `npx expo-doctor` | Diagnoses issues with dependencies and project configuration |

---

## 🔧 Troubleshooting & FAQ

### 1. Font Loading or Metro Bundling Errors
If you see font errors or stale cache issues, clear Metro bundler cache:
```bash
npx expo start -c
```

### 2. SQLite Database Not Loading on Mobile
The app copies `assets/db/KJV.db` to the device's sandbox on first boot. If the database appears empty or corrupt:
1. Uninstall the app from Expo Go / Emulator.
2. Re-run `npx expo start -c` and open the app fresh.

### 3. Biometric / Privacy Lock on Simulators
- **iOS Simulator:** In the top menu, go to **Features** ➔ **Face ID** / **Touch ID** ➔ **Enrolled**, then trigger **Matching Touch** / **Face**.
- **Android Emulator:** Set up a fingerprint or PIN under **Settings** ➔ **Security** inside the emulator.

### 4. Native Dependency Compilation Issues
The project uses pure JavaScript/TypeScript packages for cross-platform compatibility and Node.js 22 built-in `node:sqlite` for backend seeding scripts. If you ever experience native build script issues during installation, use:
```bash
npm install --ignore-scripts
```

---

## 📄 License

This project is licensed under the terms of the [LICENSE](LICENSE) file in the root directory.
