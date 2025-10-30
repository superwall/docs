// redirects-map.ts
export const folderRedirectsMap = {
} as const 

export const fileRedirectsMap = {
  // Legacy SDK installation redirects
  "sdk-installation/installation-via-expo": "expo/quickstart/install",
  "sdk-installation/installation-via-rn-expo": "expo/quickstart/install",
  
  // SDK / home
  "ios/home": "ios",
  "android/home": "android",
  "flutter/home": "flutter",
  "expo/home": "expo",



  /*
   *  Mintlify structure
   */

  // SDK / Quickstart / Install
  "installation": "sdk/quickstart/install",
  "installation-via-spm": "ios/quickstart/install",
  "installation-via-cocoapods": "ios/quickstart/install",
  "installation-via-gradle": "android/quickstart/install",
  "installation-via-pubspec": "expo/quickstart/install",
  "installation-via-expo": "expo/quickstart/install",

  // SDK / Quickstart
  "configuring-the-sdk": "sdk/quickstart/configure",
  "identity-management": "sdk/quickstart/user-management",
  "feature-gating": "sdk/quickstart/feature-gating",
  "tracking-subscription-state": "sdk/quickstart/tracking-subscription-state",
  "setting-user-properties": "sdk/quickstart/setting-user-properties",
  "in-app-paywall-previews": "sdk/quickstart/in-app-paywall-previews",

  // SDK / Guides
  "advanced-configuration": "sdk/guides/advanced-configuration",
  "using-superwalloptions": "sdk/guides/configuring",
  "using-superwall-delegate": "sdk/guides/using-superwall-delegate",
  "using-revenuecat": "sdk/guides/using-revenuecat",
  "experimental-flags": "sdk/guides/experimental-flags",
  "testing-purchases": "sdk/guides/testing-purchases",
  "app-privacy-nutrition-labels": "sdk/guides/app-privacy-nutrition-labels",

  // SDK / Guides / Web Checkout
  "web-checkout-post-checkout-redirecting": "sdk/guides/web-checkout/post-checkout-redirecting",
  "web-checkout-using-revenuecat": "sdk/guides/web-checkout/using-revenuecat",
  "web-checkout-linking-membership-to-iOS-app": "sdk/guides/web-checkout/linking-membership-to-iOS-app",

  // SDK / Guides / 3rd Party Analytics
  "3rd-party-analytics": "sdk/guides/3rd-party-analytics",
  "tracking-analytics": "sdk/guides/3rd-party-analytics/tracking-analytics",
  "cohorting-in-3rd-party-tools": "sdk/guides/3rd-party-analytics/cohorting-in-3rd-party-tools",
  "custom-paywall-analytics": "sdk/guides/3rd-party-analytics/custom-paywall-analytics",

  // SDK / Guides / Advanced
  "presenting-paywalls": "sdk/guides/advanced/presenting-paywalls",
  "custom-paywall-actions": "sdk/guides/advanced/custom-paywall-actions",
  "observer-mode": "sdk/guides/advanced/observer-mode",
  "direct-purchasing": "sdk/guides/advanced/direct-purchasing",
  "game-controller-support": "sdk/guides/advanced/game-controller-support",
  
  // SDK / Guides / Migrations
  "migrating-to-v4": "ios/guides/migrations/migrating-to-v4",
  "migrating-to-v3": "ios/guides/migrations/migrating-to-v3",
  "migrating-to-v2-android": "android/guides/migrations/migrating-to-v2",
  "migrating-to-v2-flutter": "flutter/guides/migrations/migrating-to-v2",
  "migrating-to-v2-react-native": "react-native/guides/migrations/migrating-to-v2",
  
  // Dashboard
  "overview-metrics": "dashboard/overview-metrics",
  "paywalls": "dashboard/paywalls",
  "templates": "dashboard/templates",
  "charts": "dashboard/charts",
  "products": "dashboard/products",
  "surveys": "dashboard/surveys",
  "overview-users": "dashboard/overview-users",
  "overview-localization": "dashboard/overview-localization",
  "creating-applications": "dashboard/creating-applications",

  // Dashboard / Campaigns
  "campaigns": "dashboard/dashboard-campaigns/campaigns",
  "campaigns-structure": "dashboard/dashboard-campaigns/campaigns-structure",
  "campaigns-placements": "dashboard/dashboard-campaigns/campaigns-placements",
  "campaigns-standard-placements": "dashboard/dashboard-campaigns/campaigns-standard-placements",
  "campaigns-audience": "dashboard/dashboard-campaigns/campaigns-audience",
  "campaigns-starting-an-experiment": "dashboard/dashboard-campaigns/campaigns-starting-an-experiment",
  "campaigns-understanding-experiment-results": "dashboard/dashboard-campaigns/campaigns-understanding-experiment-results",
  "campaigns-paywalled-users": "dashboard/dashboard-campaigns/campaigns-paywalled-users",
  "campaign-rules": "dashboard/dashboard-campaigns/campaign-rules",

  // Dashboard / Paywall editor
  "paywall-editor-overview": "dashboard/dashboard-creating-paywalls/paywall-editor-overview",
  "paywall-editor-layout": "dashboard/dashboard-creating-paywalls/paywall-editor-layout",
  "paywall-editor-styling-elements": "dashboard/dashboard-creating-paywalls/paywall-editor-styling-elements",
  "paywall-editor-stacks": "dashboard/dashboard-creating-paywalls/paywall-editor-stacks",
  "paywall-editor-drawer-component": "dashboard/dashboard-creating-paywalls/paywall-editor-drawer-component",
  "paywall-editor-navigation-component": "dashboard/dashboard-creating-paywalls/paywall-editor-navigation-component",
  "paywall-editor-autoscroll-component": "dashboard/dashboard-creating-paywalls/paywall-editor-autoscroll-component",
  "paywall-editor-slides-component": "dashboard/dashboard-creating-paywalls/paywall-editor-slides-component",
  "paywall-editor-carousel-component": "dashboard/dashboard-creating-paywalls/paywall-editor-carousel-component",
  "paywall-editor-dynamic-values": "dashboard/dashboard-creating-paywalls/paywall-editor-dynamic-values",
  "paywall-editor-products": "dashboard/dashboard-creating-paywalls/paywall-editor-products",
  "paywall-editor-theme": "dashboard/dashboard-creating-paywalls/paywall-editor-theme",
  "paywall-editor-variables": "dashboard/dashboard-creating-paywalls/paywall-editor-variables",
  "paywall-editor-liquid": "dashboard/dashboard-creating-paywalls/paywall-editor-liquid",
  "paywall-editor-localization": "dashboard/dashboard-creating-paywalls/paywall-editor-localization",
  "paywall-editor-surveys": "dashboard/dashboard-creating-paywalls/paywall-editor-surveys",
  "paywall-editor-notifications": "dashboard/dashboard-creating-paywalls/paywall-editor-notifications",
  "paywall-editor-settings": "dashboard/dashboard-creating-paywalls/paywall-editor-settings",
  "paywall-editor-debugger": "dashboard/dashboard-creating-paywalls/paywall-editor-debugger",
  "paywall-editor-floating-toolbar": "dashboard/dashboard-creating-paywalls/paywall-editor-floating-toolbar",
  "paywall-editor-publishing": "dashboard/dashboard-creating-paywalls/paywall-editor-publishing",
  "paywall-editor-previewing": "dashboard/dashboard-creating-paywalls/paywall-editor-previewing",
  "paywall-editor-duplicating-paywalls": "dashboard/dashboard-creating-paywalls/paywall-editor-duplicating-paywalls",
  "paywall-editor-renaming-paywalls": "dashboard/dashboard-creating-paywalls/paywall-editor-renaming-paywalls",
  
  // Dashboard / Settings
  "overview-settings": "dashboard/dashboard-settings/overview-settings",
  "overview-settings-keys": "dashboard/dashboard-settings/overview-settings-keys",
  "overview-settings-billing": "dashboard/dashboard-settings/overview-settings-billing",
  "overview-settings-revenue-tracking": "dashboard/dashboard-settings/overview-settings-revenue-tracking",
  "overview-settings-refund-protection": "dashboard/dashboard-settings/overview-settings-refund-protection",
  "overview-settings-apple-search-ads": "dashboard/dashboard-settings/overview-settings-apple-search-ads",
  "overview-settings-audit-log": "dashboard/dashboard-settings/overview-settings-audit-log",
  "overview-settings-team": "dashboard/dashboard-settings/overview-settings-team",
  "overview-settings-projects": "dashboard/dashboard-settings/overview-settings-projects",
  "overview-settings-all-teams": "dashboard/dashboard-settings/overview-settings-all-teams",
  "overview-settings-public-beta": "dashboard/dashboard-settings/overview-settings-public-beta",
  "overview-settings-advanced": "dashboard/dashboard-settings/overview-settings-advanced",
  "overview-settings-revenue-tracking-google-play": "dashboard/dashboard-settings/overview-settings-revenue-tracking-google-play",

  // Dashboard / Guides
  "migrating-from-revenuecat-to-superwall": "dashboard/guides/migrating-from-revenuecat-to-superwall",
  "pre-launch-checklist": "dashboard/guides/pre-launch-checklist",
  "tips-paywalls-based-on-placement": "dashboard/guides/tips-paywalls-based-on-placement",
  "tips-abandoned-transaction-paywall": "dashboard/guides/tips-abandoned-transaction-paywall",
  "tips-first-touch-paywall": "dashboard/guides/tips-first-touch-paywall",
  "tips-paywalls-feature-gating": "dashboard/guides/tips-paywalls-feature-gating",
  "tips-using-custom-actions": "dashboard/guides/tips-using-custom-actions",

  // Dashboard / Web Checkout
  "web-checkout": "dashboard/web-checkout/web-checkout-overview",
  "web-checkout-overview": "dashboard/web-checkout/web-checkout-overview",
  "web-checkout-creating-an-app": "dashboard/web-checkout/web-checkout-creating-an-app",
  "web-checkout-configuring-stripe-keys-and-settings": "dashboard/web-checkout/web-checkout-configuring-stripe-keys-and-settings",
  "web-checkout-adding-a-stripe-product": "dashboard/web-checkout/web-checkout-adding-a-stripe-product",
  "web-checkout-creating-campaigns-to-show-paywalls": "dashboard/web-checkout/web-checkout-creating-campaigns-to-show-paywalls",
  "web-checkout-direct-stripe-checkout": "dashboard/web-checkout/web-checkout-direct-stripe-checkout",
  "web-checkout-testing-purchases": "dashboard/web-checkout/web-checkout-testing-purchases",
  "web-checkout-managing-memberships": "dashboard/web-checkout/web-checkout-managing-memberships",
  "web-checkout-faq": "dashboard/web-checkout/web-checkout-faq",
  
  // Feature gating and paywalls
  // TODO: Add these back in
  // "presenting": "sdk/presenting",
  "presenting-paywalls-from-one-another": "dashboard/guides/presenting-paywalls-from-one-another",
  // "feature-gating-in-paywall-settings": "sdk/feature-gating-in-paywall-settings",
  // "handling-paywalls-during-poor-network-conditions": "sdk/handling-paywalls-during-poor-network-conditions",
  // "using-placement-parameters": "sdk/using-placement-parameters",
  // "using-the-presentation-handler": "sdk/using-the-presentation-handler",
  // "viewing-purchased-products": "sdk/viewing-purchased-products",

  // Troubleshooting
  // see external
  
  // Legacy docs
  "legacy_3rd-party-analytics": "legacy/legacy_3rd-party-analytics",
  "legacy_advanced-configuration": "legacy/legacy_advanced-configuration",
  "legacy_cohorting-in-3rd-party-tools": "legacy/legacy_cohorting-in-3rd-party-tools",
  "legacy_configuring-the-sdk": "legacy/legacy_configuring-the-sdk",
  "legacy_custom-paywall-events": "legacy/legacy_custom-paywall-events",
  "legacy_feature-gating": "legacy/legacy_feature-gating",
  "legacy_identity-management": "legacy/legacy_identity-management",
  "legacy_in-app-paywall-previews": "legacy/legacy_in-app-paywall-previews",
  "legacy_installation-via-cocoapods": "legacy/legacy_installation-via-cocoapods",
  "legacy_installation-via-gradle": "legacy/legacy_installation-via-gradle",
  "legacy_installation-via-package": "legacy/legacy_installation-via-package",
  "legacy_installation-via-pubspec": "legacy/legacy_installation-via-pubspec",
  "legacy_installation-via-spm": "legacy/legacy_installation-via-spm",
  "legacy_installation": "legacy/legacy_installation",
  "legacy_pre-launch-checklist": "legacy/legacy_pre-launch-checklist",
  "legacy_presenting-paywalls-from-one-another": "legacy/legacy_presenting-paywalls-from-one-another",
  "legacy_presenting": "legacy/legacy_presenting",
  "legacy_setting-user-properties": "legacy/legacy_setting-user-properties",
  "legacy_tracking-analytics": "legacy/legacy_tracking-analytics",
  "legacy_troubleshooting": "legacy/legacy_troubleshooting",
  "legacy_using-revenuecat": "legacy/legacy_using-revenuecat",
  "legacy_using-superwall-delegate": "legacy/legacy_using-superwall-delegate",
  "legacy_using-superwalloptions": "legacy/legacy_using-superwalloptions",
  
  // External guides
  // "guide-countdown-timer": "sdk/guide-countdown-timer",
  // "guide-handling-connectivity-issues": "sdk/guide-handling-connectivity-issues",
  // "guide-multi-tier-paywalls": "sdk/guide-multi-tier-paywalls",
  // "guide-sdk-flutter": "sdk/guide-sdk-flutter",
  // "guide-sdk-ios": "sdk/guide-sdk-ios",
  // "guide-sdk-rn": "sdk/guide-sdk-rn",

  // Redirects
  "flutter-alpha": "flutter/home",
  "flutter-beta": "flutter/home",
  "flutter/quickstart": "flutter/quickstart/install",
  "android-beta": "android/home",



  /*
   *  Redirects from v1 fumadocs structure (pre SDK split) / some current links
   */

  // Expo
  "expo/quickstart": "expo/quickstart/install",
  "expo/getting-started/installation": "expo/quickstart/install",
  "expo/getting-started/configuring": "expo/quickstart/configure",
  "expo/getting-started/present-first-paywall": "expo/quickstart/present-first-paywall",

  // SDK
  // sdk-installation
  "sdk-installation/installation": "sdk/quickstart/install",
  "sdk-installation/installation-via-spm": "ios/quickstart/install",
  "sdk-installation/installation-via-cocoapods": "ios/quickstart/install",
  "sdk-installation/installation-via-gradle": "android/quickstart/install",
  "sdk-installation/installation-via-pubspec": "flutter/quickstart/install",
  // "sdk-installation/installation-via-expo": "expo/quickstart/install",

  // sdk-configuring
  "sdk-configuring/configuring-the-sdk": "sdk/quickstart/configure",
  "sdk-configuring/using-superwalloptions": "sdk/guides/configuring",

  "sdk-advanced/advanced-configuration": "sdk/guides/advanced/advanced-configuration",
  "sdk-advanced/using-revenuecat": "sdk/guides/using-revenuecat",

  // sdk-user-management
  "user-management": "sdk/quickstart/user-management",
  "sdk-user-management/identity-management": "sdk/quickstart/user-management",
  "sdk-user-management/setting-user-properties": "sdk/quickstart/setting-user-properties",

  // sdk-showing-paywalls
  "sdk-showing-paywalls/feature-gating": "sdk/quickstart/feature-gating",
  // "feature-gating-in-paywall-settings",
  // "using-placement-parameters",
  // "using-the-presentation-handler",
  "viewing-purchased-products": "sdk/guides/advanced/viewing-purchased-products",
  // "presenting",
  // "presenting-paywalls-from-one-another",
  // "handling-paywalls-during-poor-network-conditions",
  
  // "tracking-subscription-state": "sdk/quickstart/tracking-subscription-state",
  // "using-superwall-delegate": "sdk/guides/using-superwall-delegate",

  // sdk-3rd-party-analytics
  "sdk-3rd-party-analytics/3rd-party-analytics": "sdk/guides/3rd-party-analytics",
  "sdk-3rd-party-analytics/tracking-analytics": "sdk/guides/3rd-party-analytics/tracking-analytics",
  "sdk-3rd-party-analytics/cohorting-in-3rd-party-tools": "sdk/guides/3rd-party-analytics/cohorting-in-3rd-party-tools",
  "sdk-3rd-party-analytics/custom-paywall-analytics": "sdk/guides/3rd-party-analytics/custom-paywall-analytics",

  // TODO: Add these back in
  // "in-app-paywall-previews": "sdk/quickstart/in-app-paywall-previews",
  "custom-paywall-events": "sdk/guides/advanced/custom-paywall-actions",
  // "observer-mode": "sdk/guides/advanced/observer-mode",
  // "direct-purchasing": "sdk/guides/advanced/direct-purchasing",
  // "game-controller-support": "sdk/guides/advanced/game-controller-support",
  // "app-privacy-nutrition-labels": "ios/guides/app-privacy-nutrition-labels",
  // "testing-purchases": "ios/guides/testing-purchases",
  // "experimental-flags": "sdk/guides/experimental-flags",

  // sdk-troubleshooting
  // "troubleshooting-products-not-loading",
  // "troubleshooting-debug-paywalls-production",
  // "troubleshooting-sandbox-free-trial-not-showing",
  // "troubleshooting-storekit-transaction-stuck",
  // "troubleshooting-unexpected-paywall-behavior",
  // "troubleshooting-paywall-memory-usage-on-iOS",
  // "troubleshooting-testflight-subscriptions",

  // "pre-launch-checklist",
  // "legacy",

  // ---Web Checkout---
  // "web-checkout-overview": "dashboard/web-checkout/web-checkout-overview",
  // "web-checkout-creating-an-app": "dashboard/web-checkout/web-checkout-creating-an-app",
  // "web-checkout-configuring-stripe-keys-and-settings": "dashboard/web-checkout/web-checkout-configuring-stripe-keys-and-settings",
  // "web-checkout-adding-a-stripe-product": "dashboard/web-checkout/web-checkout-adding-a-stripe-product",
  // "web-checkout-creating-campaigns-to-show-paywalls": "dashboard/web-checkout/web-checkout-creating-campaigns-to-show-paywalls",
  // "web-checkout-post-checkout-redirecting": "sdk/guides/web-checkout/post-checkout-redirecting",
  // "web-checkout-linking-membership-to-iOS-app": "sdk/guides/web-checkout/linking-membership-to-iOS-app",
  // "web-checkout-using-revenuecat": "sdk/guides/web-checkout/using-revenuecat",
  // "web-checkout-direct-stripe-checkout": "dashboard/web-checkout/web-checkout-direct-stripe-checkout",
  // "web-checkout-testing-purchases": "dashboard/web-checkout/web-checkout-testing-purchases",
  // "web-checkout-managing-memberships": "dashboard/web-checkout/web-checkout-managing-memberships",
  // "web-checkout-faq": "dashboard/web-checkout/web-checkout-faq",

  // ---Guides---
  "getting-started-with-our-sdks": "sdk/quickstart/install",
  // "using-referral-or-promo-codes-with-superwall",
  // "migrating-from-revenuecat-to-superwall",
  // "using-superwall-with-cursor",
  // "[Creating a Countdown Timer](https://superwall.com/blog/creating-countdown-timers-in-paywalls)",
  // "[Building Multi-Tier Paywalls](https://superwall.com/blog/how-to-build-multi-tiered-paywalls)",
  // "[Managing Connectivity Issues](https://superwall.com/blog/handling-connectivity-interruptions-with-superwall)",

  // "---Tips---",
  // "tips-paywalls-based-on-placement",
  // "tips-abandoned-transaction-paywall",
  // "tips-first-touch-paywall",
  // "tips-paywalls-feature-gating",
  // "tips-using-custom-actions",

  // "---SDK Reference---",
  // "[iOS](https://sdk.superwall.me/documentation/superwallkit/)",
  // "android",
  // "flutter",
  // "expo",
  // "react-native",
  // "migrating-to-v4",
  // "migrating-to-v3",
  // "migrating-to-v2-android",
  // "migrating-to-v2-flutter",
  // "migrating-to-v2-react-native",

  // "---SDK Quickstart---",
  // "[iOS](https://superwall.com/blog/getting-started-with-superwall-in-your-indie-ios-app)",
  // "[React Native](https://superwall.com/blog/integrating-superwall-in-your-indie-react-native-app)",
  // "[Flutter](https://superwall.com/blog/integrating-superwall-in-your-flutter-app)",

  // "---Dashboard---",
  // "overview-metrics": "dashboard/overview-metrics",
  // "paywalls": "dashboard/paywalls",
  // "templates": "dashboard/templates",

  // dashboard-campaigns
  "dashboard-campaigns/campaigns": "dashboard/dashboard-campaigns/campaigns",
  "dashboard-campaigns/campaigns-structure": "dashboard/dashboard-campaigns/campaigns-structure",
  "dashboard-campaigns/campaigns-placements": "dashboard/dashboard-campaigns/campaigns-placements",
  "dashboard-campaigns/campaigns-standard-placements": "dashboard/dashboard-campaigns/campaigns-standard-placements",
  "dashboard-campaigns/campaigns-audience": "dashboard/dashboard-campaigns/campaigns-audience",
  "dashboard-campaigns/campaigns-starting-an-experiment": "dashboard/dashboard-campaigns/campaigns-starting-an-experiment",
  "dashboard-campaigns/campaigns-understanding-experiment-results": "dashboard/dashboard-campaigns/campaigns-understanding-experiment-results",
  "dashboard-campaigns/campaigns-paywalled-users": "dashboard/dashboard-campaigns/campaigns-paywalled-users",
  "dashboard-campaigns/campaign-rules": "dashboard/dashboard-campaigns/campaign-rules",

  // dashboard-creating-paywalls
  "dashboard-creating-paywalls/paywall-editor-overview": "dashboard/dashboard-creating-paywalls/paywall-editor-overview",
  "dashboard-creating-paywalls/paywall-editor-layout": "dashboard/dashboard-creating-paywalls/paywall-editor-layout",
  "dashboard-creating-paywalls/paywall-editor-styling-elements": "dashboard/dashboard-creating-paywalls/paywall-editor-styling-elements",
  "dashboard-creating-paywalls/paywall-editor-stacks": "dashboard/dashboard-creating-paywalls/paywall-editor-stacks",
  "dashboard-creating-paywalls/paywall-editor-drawer-component": "dashboard/dashboard-creating-paywalls/paywall-editor-drawer-component",
  "dashboard-creating-paywalls/paywall-editor-navigation-component": "dashboard/dashboard-creating-paywalls/paywall-editor-navigation-component",
  "dashboard-creating-paywalls/paywall-editor-autoscroll-component": "dashboard/dashboard-creating-paywalls/paywall-editor-autoscroll-component",
  "dashboard-creating-paywalls/paywall-editor-slides-component": "dashboard/dashboard-creating-paywalls/paywall-editor-slides-component",
  "dashboard-creating-paywalls/paywall-editor-carousel-component": "dashboard/dashboard-creating-paywalls/paywall-editor-carousel-component",
  "dashboard-creating-paywalls/paywall-editor-dynamic-values": "dashboard/dashboard-creating-paywalls/paywall-editor-dynamic-values",
  "dashboard-creating-paywalls/paywall-editor-products": "dashboard/dashboard-creating-paywalls/paywall-editor-products",
  "dashboard-creating-paywalls/paywall-editor-theme": "dashboard/dashboard-creating-paywalls/paywall-editor-theme",
  "dashboard-creating-paywalls/paywall-editor-variables": "dashboard/dashboard-creating-paywalls/paywall-editor-variables",
  "dashboard-creating-paywalls/paywall-editor-liquid": "dashboard/dashboard-creating-paywalls/paywall-editor-liquid",
  "dashboard-creating-paywalls/paywall-editor-localization": "dashboard/dashboard-creating-paywalls/paywall-editor-localization",
  "dashboard-creating-paywalls/paywall-editor-surveys": "dashboard/dashboard-creating-paywalls/paywall-editor-surveys",
  "dashboard-creating-paywalls/paywall-editor-notifications": "dashboard/dashboard-creating-paywalls/paywall-editor-notifications",
  "dashboard-creating-paywalls/paywall-editor-settings": "dashboard/dashboard-creating-paywalls/paywall-editor-settings",
  "dashboard-creating-paywalls/paywall-editor-debugger": "dashboard/dashboard-creating-paywalls/paywall-editor-debugger",
  "dashboard-creating-paywalls/paywall-editor-floating-toolbar": "dashboard/dashboard-creating-paywalls/paywall-editor-floating-toolbar",
  "dashboard-creating-paywalls/paywall-editor-publishing": "dashboard/dashboard-creating-paywalls/paywall-editor-publishing",
  "dashboard-creating-paywalls/paywall-editor-previewing": "dashboard/dashboard-creating-paywalls/paywall-editor-previewing",
  "dashboard-creating-paywalls/paywall-editor-duplicating-paywalls": "dashboard/dashboard-creating-paywalls/paywall-editor-duplicating-paywalls",
  "dashboard-creating-paywalls/paywall-editor-renaming-paywalls": "dashboard/dashboard-creating-paywalls/paywall-editor-renaming-paywalls",
  
  // "charts": "dashboard/charts",
  "dashboard-campaigns": "dashboard/dashboard-campaigns",
  // "products": "dashboard/products",
  // "surveys": "dashboard/surveys",
  // "overview-users": "dashboard/overview-users",
  // "overview-localization": "dashboard/overview-localization",

  // dashboard-settings
  "dashboard-settings/overview-settings": "dashboard/dashboard-settings/overview-settings",
  "dashboard-settings/overview-settings-keys": "dashboard/dashboard-settings/overview-settings-keys",
  "dashboard-settings/overview-settings-billing": "dashboard/dashboard-settings/overview-settings-billing",
  "dashboard-settings/overview-settings-revenue-tracking": "dashboard/dashboard-settings/overview-settings-revenue-tracking",
  "dashboard-settings/overview-settings-refund-protection": "dashboard/dashboard-settings/overview-settings-refund-protection",
  "dashboard-settings/overview-settings-apple-search-ads": "dashboard/dashboard-settings/overview-settings-apple-search-ads",
  "dashboard-settings/overview-settings-audit-log": "dashboard/dashboard-settings/overview-settings-audit-log",
  "dashboard-settings/overview-settings-team": "dashboard/dashboard-settings/overview-settings-team",
  "dashboard-settings/overview-settings-projects": "dashboard/dashboard-settings/overview-settings-projects",
  "dashboard-settings/overview-settings-all-teams": "dashboard/dashboard-settings/overview-settings-all-teams",
  "dashboard-settings/overview-settings-public-beta": "dashboard/dashboard-settings/overview-settings-public-beta",
  "dashboard-settings/overview-settings-advanced": "dashboard/dashboard-settings/overview-settings-advanced",
  "dashboard-settings/overview-settings-revenue-tracking-google-play": "dashboard/dashboard-settings/overview-settings-revenue-tracking-google-play",

  // "creating-applications": "dashboard/creating-applications",


  /*
   *  Misc
   */
  "dashboard/web-checkout/web-checkout-linking-membership-to-iOS-app": "sdk/guides/web-checkout/linking-membership-to-iOS-app",
  "expo/quickstart/installation": "expo/quickstart/install",
  "expo/quickstart/configuring": "expo/quickstart/configure",
  "installation-via-rn-legacy": "expo/quickstart/install",
  "using-the-superwall-delegate": "sdk/guides/using-the-superwall-delegate",

  // Web Checkout redirects (moved from dashboard to top-level)
  "dashboard/web-checkout/web-checkout-overview": "web-checkout/web-checkout-overview",
  "dashboard/web-checkout/web-checkout-creating-an-app": "web-checkout/web-checkout-creating-an-app",
  "dashboard/web-checkout/web-checkout-configuring-stripe-keys-and-settings": "web-checkout/web-checkout-configuring-stripe-keys-and-settings",
  "dashboard/web-checkout/web-checkout-paddle-setup": "web-checkout/web-checkout-paddle-setup",
  "dashboard/web-checkout/web-checkout-adding-a-stripe-product": "web-checkout/web-checkout-adding-a-stripe-product",
  "dashboard/web-checkout/web-checkout-creating-campaigns-to-show-paywalls": "web-checkout/web-checkout-creating-campaigns-to-show-paywalls",
  "dashboard/web-checkout/web-checkout-direct-stripe-checkout": "web-checkout/web-checkout-direct-stripe-checkout",
  "dashboard/web-checkout/web-checkout-testing-purchases": "web-checkout/web-checkout-testing-purchases",
  "dashboard/web-checkout/web-checkout-managing-memberships": "web-checkout/web-checkout-managing-memberships",
  "dashboard/web-checkout/web-checkout-faq": "web-checkout/web-checkout-faq",

  // Integrations redirects (moved from dashboard to top-level)
  "dashboard/integrations": "integrations",
  "dashboard/dashboard-integrations/integrations-webhooks": "integrations/webhooks",
  "dashboard/dashboard-integrations/integrations-apple-search-ads": "integrations/apple-search-ads",
  "dashboard/dashboard-integrations/integrations-mixpanel": "integrations/mixpanel",
  "dashboard/dashboard-integrations/inegrations-mixpanel": "integrations/mixpanel",
  "dashboard/dashboard-integrations/integrations-amplitude": "integrations/amplitude",
  "dashboard/dashboard-integrations/inegrations-amplitude": "integrations/amplitude",
  "dashboard/dashboard-integrations/integrations-statsig": "integrations/statsig",
  "dashboard/dashboard-integrations/inegrations-statsig": "integrations/statsig",
  "dashboard/dashboard-integrations/integrations-slack": "integrations/slack",
  "dashboard/dashboard-integrations/inegrations-slack": "integrations/slack"
}

export const externalRedirectsMap = {
  "ios/troubleshooting": "https://support.superwall.com/articles/1219792086-products-not-loading",

  "troubleshooting": "https://support.superwall.com/collections/6437438776-troubleshooting",
  "troubleshooting-debug-paywalls-production": "https://support.superwall.com/collections/6437438776-troubleshooting",
  "troubleshooting-paywall-memory-usage-on-iOS": "https://support.superwall.com/collections/6437438776-troubleshooting",
  "troubleshooting-products-not-loading": "https://support.superwall.com/collections/6437438776-troubleshooting",
  "troubleshooting-sandbox-free-trial-not-showing": "https://support.superwall.com/collections/6437438776-troubleshooting",
  "troubleshooting-storekit-transaction-stuck": "https://support.superwall.com/collections/6437438776-troubleshooting",
  "troubleshooting-testflight-subscriptions": "https://support.superwall.com/collections/6437438776-troubleshooting",
  "troubleshooting-unexpected-paywall-behavior": "https://support.superwall.com/collections/6437438776-troubleshooting",
  "sdk-troubleshooting/troubleshooting-debug-paywalls-production": "https://support.superwall.com/collections/6437438776-troubleshooting",
  "sdk-troubleshooting/troubleshooting-paywall-memory-usage-on-iOS": "https://support.superwall.com/collections/6437438776-troubleshooting",
  "sdk-troubleshooting/troubleshooting-products-not-loading": "https://support.superwall.com/collections/6437438776-troubleshooting",
  "sdk-troubleshooting/troubleshooting-sandbox-free-trial-not-showing": "https://support.superwall.com/collections/6437438776-troubleshooting",
  "sdk-troubleshooting/troubleshooting-storekit-transaction-stuck": "https://support.superwall.com/collections/6437438776-troubleshooting",
  "sdk-troubleshooting/troubleshooting-testflight-subscriptions": "https://support.superwall.com/collections/6437438776-troubleshooting",
  "sdk-troubleshooting/troubleshooting-unexpected-paywall-behavior": "https://support.superwall.com/collections/6437438776-troubleshooting",
}