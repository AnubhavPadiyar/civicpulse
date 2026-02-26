# 📍 SpotScout — Campus Library Booking App

> Smart seat booking system for **Graphic Era Hill University (GEHU)** libraries. Book a seat, scan QR at entrance, check out when done — all from your phone!

---

## 📲 Download & Install

### ⬇️ Latest APK
👉 **[Download SpotScout APK](YOUR_APK_LINK_HERE)**

> Replace `YOUR_APK_LINK_HERE` with your Expo build link

**How to install:**
1. Open the link on your Android phone
2. Tap **Download APK**
3. Go to Settings → Allow unknown apps
4. Install the downloaded file
5. Open SpotScout! 🎉

---

## 📱 Features

| Feature | Description |
|---------|-------------|
| 🏠 Home | See all libraries + available seats instantly |
| 📷 QR Scanner | Scan library entrance QR to check in / check out |
| ⏳ 6-min Reserve | Book a seat → 6 min window to scan QR at entrance |
| 📋 My Spots | View all your booking history |
| 🗺️ Campus Map | See all libraries on GEHU campus map |
| ⚙️ Admin Panel | PIN-protected panel for librarians |
| 👤 Profile | Your student details (Name, ERP, Dept, Year) |

---

## 🔄 How Booking Works

```
1. Open app → tap "Book Seat" on any library card
2. Seat reserved for 6 minutes ⏳
3. Go to library → scan QR code at entrance
4. Seat confirmed ✅ — valid for 4 hours
5. Scan same QR at exit to release seat 🚪
6. (If you forget — seat auto-releases after 4 hours)
```

---

## 🏛️ Libraries Available

| Library | Location |
|---------|----------|
| Central Library | Graphic Era Hill University |
| Law Library | GEHU Law Block |
| Santoshanad Library | Santoshanad Block |
| CSIT Block Library | CSIT Department |
| Chanakya Block Library | Chanakya Block |

---

## 🔐 Admin PINs (For Librarians Only)

| Library | PIN |
|---------|-----|
| Central Library | 1111 |
| Law Library | 2222 |
| Santoshanad Library | 3333 |
| CSIT Block Library | 4444 |
| Chanakya Block Library | 5555 |
| Master Admin (all libraries) | 1234 |

---

## 📷 Library QR Codes (For Admins)

Print these QR codes and place at library entrance. Encode these values:

| Library | QR Value |
|---------|----------|
| Central Library | `gehu-central` |
| Law Library | `gehu-law` |
| Santoshanad Library | `santoshanad` |
| CSIT Block Library | `csit-block` |
| Chanakya Block Library | `chanakya` |

Generate QR codes at 👉 [qr.io](https://qr.io)

---

## 🛠️ For Developers

### Tech Stack
- **React Native** (Expo ~50)
- **AsyncStorage** — local data storage
- **React Navigation** — bottom tabs + stack
- **expo-barcode-scanner** — QR scanning
- **react-native-maps** — campus map
- **react-native-qrcode-svg** — QR generation
- **expo-linear-gradient** — UI gradients

### Run locally
```bash
git clone https://github.com/AnubhavPadiyar/spotscout-android.git
cd spotscout-android
npm install
npx expo start
```

### Build APK
```bash
eas build -p android --profile preview
```

---

## 👨‍💻 Developer

Made by **Anubhav Padiyar**
GEHU Campus · 2026
