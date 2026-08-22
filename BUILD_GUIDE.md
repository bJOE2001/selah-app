# 📖 Shepema — Complete Build & Deployment Guide

This guide provides step-by-step instructions for:
1. Building the **Shepema Android APK** (`shepema-app`).
2. Building & Deploying the **Shepema PWA (Progressive Web App)** to **Vercel**.
3. Running & building the **Shepema Web Landing Page** (`shepema-web`).
4. Deploying the website to **Vercel**.

---

## 📱 Part 1: Building the Android APK (`shepema-app`)

### 🌟 Option A: Cloud Build with EAS (Recommended & Easiest)
*No Android Studio needed. Expo builds your APK on cloud servers for free.*

1. Open your terminal in the mobile app directory:
   ```bash
   cd C:\xampp\htdocs\shepema-app
   ```

2. Log in to your Expo account (create a free account at [expo.dev](https://expo.dev) if needed):
   ```bash
   npx eas-cli login
   ```

3. Start the standalone APK build:
   ```bash
   npx eas-cli build -p android --profile preview
   ```

4. When prompted to generate a new Android Keystore, press **Enter** (Yes).
5. Once the build completes (~5–10 mins), copy the download URL in your terminal to download your `.apk` file.

---

### 💻 Option B: Local Build with Android Studio / Gradle
*Requires Android Studio, Android SDK, and JDK configured on your PC.*

1. Open your terminal in the app directory:
   ```bash
   cd C:\xampp\htdocs\shepema-app
   ```

2. Generate the native Android project:
   ```bash
   npx expo prebuild --platform android
   ```

3. Compile the release APK:
   ```powershell
   cd android
   .\gradlew.bat assembleRelease
   ```

4. Your compiled APK will be located at:
   ```
   C:\xampp\htdocs\shepema-app\android\app\build\outputs\apk\release\app-release.apk
   ```

---

### 📥 Connecting the APK to Your Website

Once you have your built APK file:
1. **Rename** the file to: `shepema.apk`
2. **Copy / Replace** it into:
   ```
   C:\xampp\htdocs\shepema-web\public\downloads\shepema.apk
   ```

---
 
 ## 🌐 Part 2: Building & Deploying the Shepema PWA (`shepema-app`) to Vercel

Shepema is fully configured as an installable Progressive Web App (PWA) with offline Service Worker support and mobile/desktop installation.

### Step 1: Build the PWA Locally
Open your terminal in `c:\xampp\htdocs\shepema-app`:
```bash
npm run build:pwa
```
This exports the optimized static PWA bundle into the `dist/` folder with `manifest.json`, `sw.js`, `icons/`, and `vercel.json`.

---

### Step 2: Deploy to Vercel

#### Option A: Via GitHub (Recommended)
1. Push `shepema-app` to your GitHub repository.
2. Go to **[Vercel Dashboard](https://vercel.com/new)** and import your repository.
3. In Project Settings:
   - **Framework Preset**: `Other`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build:pwa`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Click **Deploy**.

#### Option B: Direct Deploy via Vercel CLI
```bash
npm install -g vercel
vercel deploy --prod
```

---

## 💻 Part 3: Running & Building the Shepema Web Landing Page (`shepema-web`)

### 1. Install Dependencies
```bash
cd C:\xampp\htdocs\shepema-web
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for Production
```bash
npm run build
```
The optimized static production files will be output to the `dist/` directory.

### 4. Test Production Build Locally
```bash
npm run preview
```

---

## 🚀 Part 3: Deploying to Vercel

### Step 1: Initialize Git and Push to GitHub

1. Open your terminal in the web directory:
   ```bash
   cd C:\xampp\htdocs\shepema-web
   ```

2. Initialize Git and commit your files:
   ```bash
   git init
   git add .
   git commit -m "feat: initial shepema web landing page"
   ```

3. Create a new repository on **[GitHub](https://github.com/new)** (e.g., `shepema-web`).

4. Link and push to GitHub:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/shepema-web.git
   git push -u origin main
   ```

---

### Step 2: Deploy on Vercel Dashboard

1. Go to **[Vercel Dashboard](https://vercel.com/new)**.
2. Sign in with your GitHub account.
3. Click **"Add New..."** ➔ **"Project"**.
4. Select your **`shepema-web`** repository and click **"Import"**.
5. Configure Project Settings:
   - **Framework Preset**: `Vite` *(detected automatically)*
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. Click **"Deploy"**.

---

### Step 3: Your Site is Live! 🎉
- Vercel will provide you with a live production URL (e.g. `https://shepema-web.vercel.app`).
- The APK download button will serve the file directly from `https://your-domain.com/downloads/shepema.apk`.
- Every time you `git push` new changes to GitHub, Vercel will **automatically rebuild and redeploy** your website!

---

## 📂 Project Structure Overview

```
shepema-web/
├── public/
│   ├── downloads/
│   │   └── shepema.apk            # Downloadable Android APK (~101 MB)
│   └── images/
│       ├── app-icon.jpg            # Branding favicon & icons
│       ├── mascot-cozy-reading-transparent.png # Hero section mascot
│       ├── mascot-writing-journal-transparent.png # R.R.M.A. mascot
│       ├── mascot-holding-bible-transparent.png # About section mascot
│       └── screenshot-1.jpg ~ 6.jpg # Real app carousel screenshots
├── src/
│   ├── components/                 # React UI sections
│   ├── styles/                     # Design tokens & CSS stylesheets
│   ├── App.jsx                     # Root composition
│   └── main.jsx                    # Entry point
├── index.html                      # SEO & Google Fonts
├── package.json                    # Dependencies & scripts
└── vite.config.js                  # Vite configuration
```
