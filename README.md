## Qrogin

React widgets that deliver passkey-powered QR (or button) powered social logins in a couple lines of code.

These widgets are designed to work with the QROGIN system and can be easily dropped into your React app. You will need to be registered with QROGIN on https://qrogin.com to use the widgets, 

## Features:

    -Password-free: works with passkeys / FIDO flows.

    -Self-contained: headers are baked in; just supply your customer ID + API key.

    -Style-agnostic: override any element with the styles prop or wrap in your own themed container.

    -Built-in smart polling: each widget polls login status and can notify your app when sign-in completes.

    -Button login (for same device authentication): QrWithLink includes a button with secure one-time link alongside the QR. SecureLinkButton is the button only version.

## Install

npm i qrogin
# or
npm i qrogin --legacy-peer-deps
# or
yarn add qrogin

## QrWidget

Basic QR-only login widget. Polls for login status and handles expiry automatically.

### Usage

```tsx
import { QrWidget } from "qrogin";

<QrWidget
  baseUrl="https://your.qrogin.server/api"
  statusBase="https://your.qrogin.server/api/status"
  customerId="your-customer-id"
  apiKey="your-api-key"
  onStatus={(res) => {
    if (res.status === "ok") {
      // login succeeded
    }
  }}
  styles={{
    root: { marginTop: 20 },
    img: { border: "2px solid gold" },
    overlay: { borderRadius: "10%" }
  }}
  ttlMs={55000}
  pollInterval={5000}
  maxAttempts={9}
/>
```

### Props

- `baseUrl` – **required**: URL to fetch QR code sessions from
- `statusBase` – **required**: URL to poll session status
- `customerId` – **required**: Your customer ID
- `apiKey` – **required**: Your API key
- `onStatus` – **required**: Callback receiving `{ status: "ok" | "pending" | ... }`
- `styles` – optional: Style overrides for the elements
  - `root`: outer wrapper
  - `img`: the QR code image
  - `overlay`: the image or "Q" in the middle
- `ttlMs` – optional: QR time to live (default: 55000)
- `pollInterval` – optional: milliseconds between polling attempts (default: 5000)
- `maxAttempts` – optional: max polling tries before giving up (default: 9)

---

## QrWithLink

Like `QrWidget`, but includes a clickable secure one-time link below the QR. Useful for same-device login.

'buttonLabel' param can be used to change the text on button, with "Continue with", "Login with", "Sign up with" or stay with default.'

### Usage

```tsx
import { QrWithLink } from "qrogin";

<QrWithLink
  baseUrl="https://your.qrogin.server/api"
  statusBase="https://your.qrogin.server/api/status"
  customerId="your-customer-id"
  apiKey="your-api-key"
  onStatus={(res) => {
    if (res.status === "ok") {
      // login succeeded
    }
  }}
  logoSrc="/logo.png" //Safety Feature: your logo to prevent QR misuse.
  styles={{
    root: { padding: "1rem" },
    img: { border: "2px dashed #999" },
    overlay: { background: "#fff" },
    linkBtn: { background: "#222", color: "#fff" }
  }}
  ttlMs={55000}
  pollInterval={10000}
  maxAttempts={9}
/>
```

### Additional Features

- Adds a secure one-time link under the QR
- Link opens in a popup by default
- Users can toggle to open in a new tab
- Link is disabled once the QR expires

### Props

All props from `QrWidget`, plus:

- `styles.linkBtn` – optional: style for the secure link button

---

## SecureLinkButton (Button Only)

One-button, same-device login for situations where a QR code would be overkill or awkward.
It fetches a single secure one-time link, counts down the TTL bar beneath it, auto-refreshes (twice by default), and—if the link is clicked or time runs out the button turns to manual refresh mode.

buttonLabel param can be used to change the text on button, with "Continue with", "Login with", "Sign up with" or stay with default.

### Usage
```tsx
import { SecureLinkButton } from "qrogin";

<SecureLinkButton
  baseUrl="https://your.qrogin.server/api"
  statusBase="https://your.qrogin.server/api/status"
  customerId="your-customer-id"
  apiKey="your-api-key"
  onStatus={(res) => {
    if (res.status === "ok") {
      // login succeeded
    }
  }}
  /* --- optional extras --- */
  buttonLabel="Continue in"      // renders: QROGIN Continue in
  autoRefreshLimit={3}           // auto-refresh three times instead of two
  ttlMs={87000}                  // custom TTL in ms
  pollInterval={8000}            // ms between status polls
  maxAttempts={12}               // total poll attempts
  styles={{
    linkBtn: { background: "#222", colour: "#fff" },
    root:   { marginTop: 24 }
  }}
/>
```

## Styling Guide

All components support the following `styles` keys:


## Support

For help, issues, or custom builds, visit:

https://qrogin.com

© NKChakshu UK Ltd 2025