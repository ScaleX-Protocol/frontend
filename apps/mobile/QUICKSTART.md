# QuickStart: Run ScaleX Mobile on Android

## ✅ Simple 3-Step Guide

### Step 1: Navigate to Mobile Directory
```bash
cd /Users/renakaagusta/Documents/scalex/frontend/apps/mobile
```

### Step 2: Start Dev Server (in one terminal)
```bash
pnpm dev
```
Leave this running. You'll see:
```
› Metro waiting on http://localhost:8082
```

### Step 3: Run on Android (in another terminal)
```bash
cd /Users/renakaagusta/Documents/scalex/frontend/apps/mobile
pnpm android
```

**That's it!** The app will build and launch automatically on your emulator.

---

## 🔧 If Build Fails

The build is failing due to React Native dependency version mismatches. Here's the fix:

### Option 1: Use Expo Go (Fastest - No Build Required)

1. **Install Expo Go on your emulator:**
   - Open Play Store in emulator
   - Search "Expo Go"
   - Install it

2. **Start dev server:**
   ```bash
   pnpm dev
   ```

3. **Press 'a' in terminal** - It will open in Expo Go automatically!

### Option 2: Fix Dependencies & Rebuild

```bash
# Update all dependencies to compatible versions
pnpm add expo@~54.0 react-native@0.81.5 react-native-reanimated@~4.1.1 react-native-gesture-handler@~2.28.0

# Clean and rebuild
rm -rf android node_modules
pnpm install
pnpm android
```

---

##Current Status

✅ **Working**:
- Expo dev server on port 8082
- 3 tabs: Home, Trade, Lending
- NativeWind (Tailwind) configured
- Privy Expo SDK setup
- Android emulator connected

⚠️ **Issue**:
- First Android build failing due to React Native version mismatches
- **Solution**: Use Expo Go (recommended) or update dependencies

---

## 📱 What You'll See

Once running, you'll see the ScaleX app with:
- **Home Tab**: "ScaleX Mobile - Welcome to ScaleX DeFi Trading Platform"
- **Trade Tab**: "Trading interface coming soon..."
- **Lending Tab**: "Lending interface coming soon..."

---

## 🎯 Next Steps After Running

1. Copy shared code from web app (configs, types, utils)
2. Build mobile UI components
3. Implement actual screens with real functionality
4. Test wallet connection with Privy

---

## 🆘 Troubleshooting

**Emulator not connected?**
```bash
adb devices  # Should show: emulator-5554
```

**Port 8082 already in use?**
```bash
pnpm dev --port 8083
```

**Expo Go not opening?**
- Make sure Expo Go is installed in emulator
- Press 'a' in the terminal where `pnpm dev` is running

**Want to start fresh?**
```bash
rm -rf android node_modules .expo
pnpm install
```
