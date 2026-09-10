# Selah: Daily Bible & Devotions 📖✨

> *Pause, Reflect & Praise* — An aesthetic devotional journaling and Scripture reader app crafted with a classic paper notebook aesthetic and warm companion mascot.

**Selah: Daily Bible & Devotions** is a mobile application built with **React Native**, **Expo SDK 54**, and **Expo SQLite**, designed for thoughtful Scripture meditation, structured devotional reflection, habit tracking, and aesthetic shareable cards.

---

## 🌟 Key Features

- **📖 Scripture Reader**: Complete King James Version (KJV) Bible powered by local SQLite database with fast book/chapter/verse navigation and highlights.
- **✍️ Devotional Journaling**: Guided reflection workflow.
- **📅 Daily Dashboard & Streaks**: Habit tracking, today's actionable steps, and devotion streak statistics.
- **🎨 Shareable Cards**: High-res aesthetic quote & devotional image export via `react-native-view-shot`.
- **🔒 Privacy Gate**: Biometric (Face ID / Fingerprint) & PIN security powered by `expo-local-authentication`.
- **📜 Classic Notebook Theme**: Rich typography featuring *Playfair Display*, *Lora*, and *Caveat* with warm paper textures and dark/light modes.

---

## ⚡ Quick Commands

### 1. Start Development Server
```bash
npx expo start
```

### 2. Mirror Android Phone to PC Monitor (`scrcpy`)
```powershell
# Install scrcpy (one-time on Windows):
winget install Genymobile.scrcpy

# Check phone connection:
adb devices

# Mirror phone screen to PC:
scrcpy
```

### 3. Build APK with EAS (Cloud Build)
```bash
# Build Live Development Client APK:
npx eas-cli build --profile development --platform android

# Build Standalone Preview APK (Direct Install):
npx eas-cli build --profile preview --platform android
```

---

## 📚 Documentation & Installation Guide

For comprehensive system requirements, device setup (Expo Go, Android Studio, Xcode, Web), database preparation, and troubleshooting, please refer to the complete guide:

👉 **[Read the Full Installation Guide](INSTALLATION.md)**

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

