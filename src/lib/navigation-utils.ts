/**
 * Navigation utilities for smart SDK switching
 * Handles path resolution and fallback logic between different SDK sections
 */

export type SDKType = 'ios' | 'android' | 'flutter' | 'expo' | 'react-native' | 'dashboard'

export const SDK_ROOTS: Record<SDKType, string> = {
  ios: '/ios',
  android: '/android', 
  flutter: '/flutter',
  expo: '/expo',
  'react-native': '/react-native',
  dashboard: '/dashboard'
}

export const SDK_NAMES: Record<SDKType, string> = {
  ios: 'iOS',
  android: 'Android',
  flutter: 'Flutter', 
  expo: 'Expo',
  'react-native': 'React Native (Deprecated)',
  dashboard: 'Dashboard'
}

/**
 * Extracts the SDK type and relative path from a docs URL
 * @param pathname - Current pathname like "/ios/guides/using-revenuecat"
 * @returns Object with sdk type and relative path
 */
export function parseDocsPath(pathname: string): {
  sdk: SDKType | null
  relativePath: string
} {
  // Find which SDK this path belongs to
  for (const [sdk, root] of Object.entries(SDK_ROOTS)) {
    if (pathname === root || pathname.startsWith(root + '/')) {
      const relativePath = pathname.replace(root, '').replace(/^\/+/, '')
      return {
        sdk: sdk as SDKType,
        relativePath: relativePath || ''
      }
    }
  }
  
  return {
    sdk: null,
    relativePath: pathname
  }
}

/**
 * Constructs the target URL when switching between SDKs
 * @param targetSdk - The SDK to navigate to
 * @param currentPath - Current pathname
 * @returns Target URL with smart path resolution
 */
export function getSmartNavigationUrl(targetSdk: SDKType, currentPath: string): string {
  const { sdk: currentSdk, relativePath } = parseDocsPath(currentPath)
  
  // Special case: when switching to dashboard, always go to dashboard root
  if (targetSdk === 'dashboard') {
    return SDK_ROOTS.dashboard
  }
  
  // Special case: when switching from dashboard to SDK, always go to SDK root  
  if (currentSdk === 'dashboard') {
    return SDK_ROOTS[targetSdk]
  }
  
  // SDK to SDK: try to preserve the path
  if (currentSdk && relativePath) {
    return `${SDK_ROOTS[targetSdk]}/${relativePath}`
  }
  
  // Fallback to target SDK root
  return SDK_ROOTS[targetSdk]
}

/**
 * Checks if we're currently in a docs page that should have smart navigation
 * @param pathname - Current pathname
 * @returns true if this is a docs page that should have smart navigation
 */
export function shouldShowSmartNavigation(pathname: string): boolean {
  // Check if it's any of our SDK paths
  const { sdk } = parseDocsPath(pathname)
  return sdk !== null
}

/**
 * Gets all available SDKs for navigation
 * @returns Array of SDK objects with id, name, and current status
 */
export function getAvailableSDKs(currentPath: string): Array<{
  id: SDKType
  name: string
  href: string
  isCurrent: boolean
}> {
  const { sdk: currentSdk } = parseDocsPath(currentPath)
  
  return Object.entries(SDK_NAMES).map(([id, name]) => ({
    id: id as SDKType,
    name,
    href: getSmartNavigationUrl(id as SDKType, currentPath),
    isCurrent: currentSdk === id
  }))
}