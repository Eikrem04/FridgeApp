import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.kitch.mobile',
  appName: 'Kitch',
  webDir: 'dist',
  plugins: {
    // "DEFAULT" tracks the device's own light/dark appearance natively, before any JS has run —
    // matching the app's own "system" theme option for the common case with zero flash. Once
    // React mounts, useThemeSync.ts takes over and corrects this for an explicit light/dark
    // theme choice (where it can differ from the device's own appearance).
    StatusBar: {
      style: 'DEFAULT',
    },
  },
}

export default config
