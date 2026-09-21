# Mobile Demo and Installation

Demo mode uses the same store and CRUD screens on phones, tablets, and desktop. No Supabase connection or authentication is needed. `/login` offers Demo User Login and Continue As Guest; Home exposes every additional module through Explore.

The mobile bottom bar contains Home, Planner, Focus, Life Edit, Journal, and Insights, including during onboarding. Secondary workspace screens have a Back button. Safe-area spacing protects content and navigation on notched devices. Tab groups support touch scrolling without causing page overflow.

## Install

Serve a production build over **HTTPS** for phone installation. `localhost` is a secure-context exception on the machine running the browser; a phone visiting a computer's plain HTTP LAN address is not. Hosting and a public HTTPS URL are not configured by this change.

- iPhone/iPad: open the HTTPS app in Safari, tap Share, Add To Home Screen, then Add. Keep Open as Web App enabled when offered.
- Android: use Install App from the browser menu or the native install button in the app guide when the browser provides it.
- The mobile invitation is dismissible. Reopen the guide from Theme Studio / Settings or Demo Login. Installed standalone launches suppress the invitation.

The manifest provides custom regular and maskable icons and standalone presentation. Android creates its launch screen from manifest metadata. iOS has portrait/landscape startup images generated from the existing app logo with `node scripts/generate-splash.cjs`. Platform status bars and installation controls remain OS-controlled.

## Local Data and Offline Launch

Demo/guest records persist in localStorage; uploaded images persist in IndexedDB. Reopening the same installed app and origin uses that local workspace. A browser or OS can isolate installed-app storage from its browser tab, evict storage, or clear it when the app is removed; there is no guaranteed cross-container migration. Export important records before switching browsers or clearing storage. Native install attempts request persistent storage where supported, but approval is browser-controlled.

The service worker caches static assets and visited demo document shells. Visit screens online once before reopening those screens offline. Unvisited screens show an offline fallback. API responses, authentication requests, external requests, and production documents are never cached. Service-worker updates activate after old app windows close. Cache cleanup is limited to Life Edit's own cache namespace and never removes local records.

## Verification

Automated browser checks cover phone and tablet widths, six-tab navigation, install-guide controls, manifest/icons/startup links, service-worker offline reopening, data persistence across browser-context restarts, and simulated standalone launches. Actual iOS/Android installation, OS splash rendering, and storage behavior still require physical-device verification over HTTPS.

Platform references: [Apple Home Screen web apps](https://support.apple.com/en-ca/guide/iphone/iphea86e5236/ios), [PWA installation](https://web.dev/learn/pwa/installation), [manifest configuration](https://web.dev/learn/pwa/web-app-manifest).
