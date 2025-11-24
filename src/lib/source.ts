import { docs } from '@/.source';
import { loader } from 'fumadocs-core/source';
import { createElement, SVGProps } from 'react';
import { icons, AlertTriangle } from 'lucide-react'

// ---------- custom SVG icons ----------
export const AndroidIcon = (props: SVGProps<SVGSVGElement>) =>
  createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      fill: 'currentColor',
      height: 24,
      width: 24,
      className: 'h-6 w-6 text-white',
      viewBox: '0 0 16 16',
      ...props,
    },
    createElement('path', {
      d: 'M0,12H16a9.3,9.3,0,0,0-3.841-6.688l1.288-2.576a.5.5,0,1,0-.894-.447L11.3,4.805a7.146,7.146,0,0,0-6.59,0L3.447,2.289a.5.5,0,1,0-.894.447L3.841,5.312A9.3,9.3,0,0,0,0,12ZM11.5,8a1,1,0,1,1-1,1A1,1,0,0,1,11.5,8Zm-7,0a1,1,0,1,1-1,1A1,1,0,0,1,4.5,8Z',
    }),
  );

export const FlutterIcon = (props: SVGProps<SVGSVGElement>) =>
  createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      fill: 'currentColor',
      height: 24,
      width: 24,
      className: 'h-6 w-6 text-white',
      viewBox: '0 0 24 24',
      ...props,
    },
    createElement('path', {
      d: 'M14.314 0L2.3 12 6 15.7 21.684.012h-7.357L14.314 0zm.014 11.072l-6.471 6.457 6.47 6.47H21.7l-6.46-6.468 6.46-6.46h-7.371z',
    }),
  );

export const ExpoIcon = (props: SVGProps<SVGSVGElement>) =>
  createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      fill: 'currentColor',
      height: 24,
      width: 24,
      className: 'h-6 w-6 text-white',
      viewBox: '0 0 256 256',
      ...props,
    },
    createElement('path', {
      d: 'M121.309004 84.6732585C123.402504 81.5874152 125.694292 81.1950171 127.553451 81.1950171C129.41261 81.1950171 132.509843 81.5874152 134.604162 84.6732585C151.106348 107.339593 178.345607 152.492 198.439108 185.798721C211.542532 207.519499 221.6069 224.201947 223.671721 226.324944C231.422996 234.294992 242.053551 229.327949 248.230809 220.287799C254.312201 211.387762 256.000111 205.138399 256.000111 198.471155C256.000111 193.930186 167.895315 30.0714244 159.022317 16.4322117C150.48936 3.31359639 147.710044 0 133.105527 0H122.176721C107.615631 0 105.511479 3.31359639 96.9777022 16.4322117C88.1055238 30.0714244 0.0001105152 193.930186 0.0001105152 198.471155C0.0001105152 205.138399 1.68839227 211.387762 7.76991495 220.287799C13.9471241 229.327949 24.5775965 234.294992 32.3286259 226.324944C34.3936934 224.201947 44.4580605 207.519499 57.5616485 185.798721C77.654822 152.492 104.806818 107.339593 121.309004 84.6732585Z',
    }),
  );

export const AppleIcon = (props: SVGProps<SVGSVGElement>) =>
  createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      fill: 'currentColor',
      height: 24,
      width: 24,
      className: 'h-6 w-6 text-white',
      viewBox: '0 0 22.773 22.773',
      ...props,
    },
    createElement(
      'g',
      {},
      createElement(
        'g',
        {},
        createElement('path', {
          d: 'M15.769,0c0.053,0,0.106,0,0.162,0c0.13,1.606-0.483,2.806-1.228,3.675c-0.731,0.863-1.732,1.7-3.351,1.573    c-0.108-1.583,0.506-2.694,1.25-3.561C13.292,0.879,14.557,0.16,15.769,0z',
        }),
        createElement('path', {
          d: 'M20.67,16.716c0,0.016,0,0.03,0,0.045c-0.455,1.378-1.104,2.559-1.896,3.655c-0.723,0.995-1.609,2.334-3.191,2.334    c-1.367,0-2.275-0.879-3.676-0.903c-1.482-0.024-2.297,0.735-3.652,0.926c-0.155,0-0.31,0-0.462,0    c-0.995-0.144-1.798-0.932-2.383-1.642c-1.725-2.098-3.058-4.808-3.306-8.276c0-0.34,0-0.679,0-1.019    c0.105-2.482,1.311-4.5,2.914-5.478c0.846-0.52,2.009-0.963,3.304-0.765c0.555,0.086,1.122,0.276,1.619,0.464    c0.471,0.181,1.06,0.502,1.618,0.485c0.378-0.011,0.754-0.208,1.135-0.347c1.116-0.403,2.21-0.865,3.652-0.648    c1.733,0.262,2.963,1.032,3.723,2.22c-1.466,0.933-2.625,2.339-2.427,4.74C17.818,14.688,19.086,15.964,20.67,16.716z',
        }),
      ),
    ),
  );

export function icon(name: string, props: React.SVGProps<SVGSVGElement> = {}) {
  if (name in icons) {
    return createElement(icons[name as keyof typeof icons], {
      className: 'h-6 w-6 text-white',
      ...props,
    });
  }

  return createElement('img', {
    src: `/icons/${name}.svg`,
    alt: name,
    className: 'h-6 w-6',
    ...props,
  });
}

export const customIcons = {
  Apple: AppleIcon,
  Android: AndroidIcon,
  Flutter: FlutterIcon,
  Expo: ExpoIcon,
} as const;
// ---------- end custom SVG icons ----------

// See https://fumadocs.vercel.app/docs/headless/source-api for more info
export const source = loader({
  // it assigns a URL to your pages
  baseUrl: '/',
  source: docs.toFumadocsSource(),
  icon(name, props = {}) {
    if (!name) return undefined

    if (name === 'Apple') {
      return createElement(AppleIcon, {
        className: 'h-6 w-6 text-white',
        ...props,
      });
    }

    if (name === 'Android') {
      return createElement(AndroidIcon, {
        className: 'h-6 w-6 text-white',
        ...props,
      });
    }

    if (name === 'Flutter') {
      return createElement(FlutterIcon, {
        className: 'h-6 w-6 text-white',
        ...props,
      });
    }

    if (name === 'Expo') {
      return createElement(ExpoIcon, {
        className: 'h-6 w-6 text-white',
        ...props,
      });
    }

    if (name === 'AlertTriangle') {
      return createElement(AlertTriangle, {
        className: 'h-6 w-6 text-white',
        ...props,
      });
    }

    if (name in icons) {
      return createElement(icons[name as keyof typeof icons], {
        className: 'h-6 w-6 text-white',
        ...props,
      });
    }
    // Fallback to <img> for custom SVGs
    return createElement('img', { src: `/resources/${name}`, className: 'size-3', ...props });
  },
});
