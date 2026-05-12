# Partybond — Mobile App

React Native (Expo) + TypeScript + NativeWind. Designed for Android and iOS, EN + PT.

## Setup

```bash
npm install
npm start          # opens Expo dev tools
# then press:
#   a → Android emulator / device
#   i → iOS simulator (Mac only)
#   w → web preview (Tailwind-only, real features need device)
```

### Pointing to the backend

`src/config/env.ts` reads `Constants.expoConfig.extra.apiUrl`, which is set to `http://10.0.2.2:4000` (Android emulator default) in `app.json`.

On a real phone, set it to your machine's LAN IP, e.g.:

```jsonc
// app.json
"extra": { "apiUrl": "http://192.168.0.42:4000" }
```

## Folder structure

```
App.tsx                   # Root: providers + RootNavigator + i18n sync + push hook
src/
  api/                    # axios client + endpoint wrappers (typed)
  components/
    ui/                   # Button, Input, Card, Badge, Avatar, Logo, FAB, ...
    SessionCard.tsx
    GameTile.tsx
    OnboardingHeader.tsx
  config/env.ts           # API_URL
  hooks/
    useMatchEvents.ts     # socket: match:created
    useSessionRoom.ts     # socket: queue:update for a session
    usePushRegistration.ts # FCM/Expo push token registration
  i18n/                   # i18next setup + en.json + pt.json
  navigation/
    RootNavigator.tsx     # auth → onboarding → app stack switching
  screens/                # Login, Register, Onboarding(4 steps), GameSelect,
                          # Home, CreateSession, Session, Queue, Match, Settings
  socket/                 # socket.io-client wrapper
  store/                  # authStore, onboardingStore (Zustand)
  theme/tokens.ts         # design tokens (colors, gradients, spacing)
```

## Design system

Direct from the BLUEPRINT v3.3 — Figma Ready section:

- Primary gradient: `#FF4DA6 → #7B3FF2 → #00D1FF` (`gradient.primary` token).
- Dark UI: bg `#0A0A12`, surface `#12121A`, card `#1C1C28`.
- Text: primary `#FFFFFF`, secondary `#A0A0B8`, disabled `#6B6B80`.
- Status: success `#00C853`, error `#FF5252`.
- Spacing: 4 / 8 / 12 / 16 / 24 / 32.
- Typography: 24 bold / 18 semibold / 14 regular / 16 semibold (button) / 12 regular.
- Components are auto-laid-out, dark-themed, and use a single `GradientButton` for the primary CTA.
- Subtle neon glow on Avatar, FAB, and the Copy ID button.

All of this is parameterized through `tailwind.config.js` and `src/theme/tokens.ts`.

## Internationalization

Languages: `en`, `pt`. Auto-detected from device locale via `expo-localization`. Users can switch language in the Settings screen; the preference is persisted on the server (`user.locale`).

## Images / assets to create

The code is complete. The user (you) should generate and drop these into `Frontend/assets/`:

| File | Size | Notes |
|---|---|---|
| `icon.png` | 1024×1024 | Square app icon. Bold "P" mark with the primary gradient on the brand dark `#0A0A12`. |
| `splash.png` | 1242×2436 (or 1242×2688) | Splash screen. Centered Partybond wordmark + logo with subtle neon glow on `#0A0A12`. |
| `adaptive-icon.png` | 432×432 | Android adaptive foreground. The "P" mark only (transparent background). |
| `notification-icon.png` | 96×96 (or 256×256) | Monochrome white "P" silhouette on transparent — Android notifications recolor it via `tint`. |

Once you've added these, Expo will pick them up automatically (referenced in `app.json`).

## Push notifications

`usePushRegistration` requests notification permissions on first launch, then sends the device push token to the backend (`PUT /users/me/fcm-token`). The backend (FCM via Firebase Admin) targets that token on `match_start` etc., respecting a 1/min cooldown.

For production:

1. Build the iOS/Android app with EAS (`eas build`).
2. Provide the FCM service account JSON to the backend via `FIREBASE_SERVICE_ACCOUNT_JSON`.
3. On iOS you'll also need to upload an APNs key in the Firebase console.

## Tested flows

- Email registration with name/age validation.
- 4-step onboarding (name+age → photo → game → Free Fire ID).
- Game selection (Free Fire active, others "coming soon").
- Home: live list of open/active sessions for the selected game, FAB to create new.
- Create session (casual/competitive, 2/4 players).
- Session detail: see waiting players, join queue.
- Queue: animated spinner with live "waiting" count over Socket.IO.
- Match screen: avatar + nickname + Player ID, **giant Copy ID button** with success feedback, 4-step guide, 5 quick-action chips, end match.
- Settings: language switcher (EN/PT) + logout.
- Auto-resume: if the user reopens the app while in a queue / match, they land back on the right screen.

## TypeScript

```bash
npm run typecheck
```
