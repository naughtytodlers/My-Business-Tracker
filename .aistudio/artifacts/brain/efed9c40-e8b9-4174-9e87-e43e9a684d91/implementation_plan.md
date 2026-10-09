# Automatic Apps Script URL Configuration for GitHub Pages & New Devices

Seamless zero-prompt login experience across all devices and GitHub Pages deployments by permanently pre-configuring the verified Google Apps Script backend URL while keeping manual override settings in the header menu.

> [!IMPORTANT]
> **Confirmed User Choice**: The confirmed Google Apps Script Web App URL (`https://script.google.com/macros/s/AKfycbxKuuIeU6S9pLbkCig-aMYAbX9SJHWB7_3IR8JauzRh7M6hHHqj4x0BU8b3zhTBFD-qsg/exec`) will be permanently configured as the application default.

---

## 1. Overview & Core Concept

- **What It Does**: Eliminates the prompt asking users for the Google Apps Script URL on new devices, incognito windows, and GitHub Pages deployments. Upon opening the app and entering their credentials, users are immediately signed in with live Google Sheet synchronization active.
- **Target Audience**: Business owners, staff, and admins of *Naughty Toddlers* accessing the tracker on computers, tablets, or phones without technical setup steps.
- **Key Value**: Frictionless access across devices without compromising the ability to update the script URL later if a new Google Sheet deployment is created.

---

## 2. User Experience & Visual Design

- **New Device Login Flow**:
  1. User opens the GitHub Pages link on any new phone, tablet, or browser.
  2. The sign-in screen appears with the *Naughty Toddlers* brand logo and credentials fields.
  3. User enters their username and password and clicks **Sign In**.
  4. The app immediately signs in, fetches live transactions and catalog data from the Google Sheet, and displays the main dashboard with a green "Connected" badge.
  5. At no point is the user asked to enter or configure the Google Apps Script URL.
- **Manual URL Management Flow (Retained)**:
  1. An admin or user clicks their profile avatar/name in the top-right header.
  2. In the dropdown menu, they select **Connection Settings**.
  3. The connection modal opens showing the current active Apps Script URL with options to test and save a new URL or preview demo mode if needed.

---

## 3. Key Product Decisions & Trade-Offs

- **Default URL Strategy**:
  - *Chosen Approach*: Embed the confirmed URL directly into `DEFAULT_APPS_SCRIPT_URL` in `src/constants.ts`, and fallback gracefully to `import.meta.env.VITE_APPS_SCRIPT_URL` if an environment variable override is ever provided.
  - *Why*: GitHub Pages builds run in automated CI without interactive secrets unless configured; having the verified URL embedded in constants guarantees 100% reliable zero-configuration deployments everywhere.
  - *Alternatives Considered*: Requiring GitHub Secrets (`VITE_APPS_SCRIPT_URL`) in repository settings — discarded because it creates an unnecessary barrier and fails if secrets are not configured in GitHub repo settings.
- **Client Cache Synchronization**:
  - *Chosen Approach*: In `getSavedScriptUrl()`, if `localStorage` has no URL saved or an empty string, initialize and cache `DEFAULT_APPS_SCRIPT_URL` automatically. When the user modifies the URL via Connection Settings, the user's custom URL is saved in `localStorage` and takes precedence.
  - *Why*: Preserves custom user overrides while ensuring fresh devices always inherit the working production URL.

---

## 4. Technical Architecture & Data Strategy

```
┌──────────────────────────────────────────────────────────────┐
│                      Client Device                           │
│                                                              │
│  ┌────────────────────┐          ┌────────────────────────┐  │
│  │   Login Screen     │ ───────> │     Main Dashboard     │  │
│  │ (Direct Password)  │          │ (Immediate Live Sync)  │  │
│  └────────────────────┘          └───────────┬────────────┘  │
│            │                                 │               │
│            ▼                                 ▼               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                     sheetService                       │  │
│  │  getSavedScriptUrl()                                   │  │
│  │   ├── Check localStorage (saved custom URL)            │  │
│  │   └── Fallback: DEFAULT_APPS_SCRIPT_URL (Production)   │  │
│  └──────────────────────────┬─────────────────────────────┘  │
└─────────────────────────────┼────────────────────────────────┘
                              │ HTTPS (action=getData / post)
                              ▼
┌──────────────────────────────────────────────────────────────┐
│            Google Apps Script Web App (Backend)              │
│       https://script.google.com/macros/s/.../exec            │
│                              │                               │
│                              ▼                               │
│              Google Sheet ID: 1bltksqx6u...                  │
│       (Data, Settings, Users, Items, Sellers tabs)           │
└──────────────────────────────────────────────────────────────┘
```

### Component & File Mapping

1. **`src/constants.ts`**:
   - Set `DEFAULT_APPS_SCRIPT_URL` to `https://script.google.com/macros/s/AKfycbxKuuIeU6S9pLbkCig-aMYAbX9SJHWB7_3IR8JauzRh7M6hHHqj4x0BU8b3zhTBFD-qsg/exec`.
2. **`src/services/sheetService.ts`**:
   - Ensure `getSavedScriptUrl()` immediately initializes and returns `DEFAULT_APPS_SCRIPT_URL` on any device without local storage data.
   - Retain `saveScriptUrl()` for manual overrides from the UI.
3. **`src/components/Header.tsx` & `src/components/ConnectionModal.tsx`**:
   - Ensure the existing "Connection Settings" dropdown item continues to allow manual changes and status checks seamlessly.
4. **Build & Deployment**:
   - Compile and verify build with `compile_applet`.
   - Ensure `npm run build` synchronizes `/dist` and `/docs` for GitHub Pages.
