import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.qianli.margin',
  appName: '有余 Margin',
  webDir: 'dist',
  // Load the UI from the live deployment instead of the bundle baked into the
  // app binary — web-only changes go live on next launch with no App Store
  // review. Native changes (Swift, entitlements, the widget) still need a
  // new archive + review, since this URL only controls the WKWebView content.
  server: {
    url: 'https://margin-budget-olive.vercel.app',
    cleartext: false,
  },
};

export default config;
