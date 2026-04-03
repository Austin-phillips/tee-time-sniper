# Beta Testing Setup (iOS Preview Build)

Step-by-step instructions for getting a tester set up with the iOS preview build.

## For the Tester

### 1. Enable Developer Mode (iOS 16+)

1. Open **Settings** on your iPhone
2. Go to **Privacy & Security**
3. Scroll down and tap **Developer Mode**
4. Toggle it **on**
5. Tap **Restart** when prompted
6. After restart, tap **Turn On** when prompted to confirm

### 2. Register Your Device

1. You'll receive a registration link from the developer
2. Open the link **on your iPhone** in Safari
3. Follow the prompts to install the device enrollment profile
4. Go to **Settings → General → VPN & Device Management** and approve the profile if prompted

### 3. Install the App

1. Once the build is ready, you'll receive an install link
2. Open the link **on your iPhone** in Safari
3. Tap **Install** when prompted
4. The app will appear on your home screen

---

## For the Developer

### 1. Register the Tester's Device

```bash
eas device:create
```

This generates a URL. Send it to the tester (they complete Step 2 above).

### 2. Build with the New Device

After the tester has registered, rebuild so their device is included in the provisioning profile:

```bash
npm run build:preview
```

### 3. Share the Build

Once the build finishes, EAS provides an install URL. Send it to the tester (they complete Step 3 above).

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Unable to Install" | Tester's device isn't provisioned. Run `eas device:create`, have them register, then rebuild. |
| Developer Mode not visible in Settings | Only appears on physical devices running iOS 16+. Make sure they're not looking on a simulator. |
| Profile installation fails | Make sure the tester opens the registration link in **Safari**, not another browser. |
| App crashes on launch | Check that the build was made **after** the device was registered. If not, rebuild. |
