# Product Requirement Document (PRD): QR Identity Ecosystem

## 1. Project Overview
We are building a "Digital Identity" ecosystem consisting of two connected applications:
1.  **iOS App (The "Editor"):** Allows users to manage their profile and generates a QR code widget for their home screen.
2.  **Web App (The "Viewer"):** A public-facing profile page (Next.js) that visitors see when scanning the QR code.

**Core Value Proposition:** A seamless way to share contact info/CV via a home screen widget, with a "Freemium" business model controlling the visual design of the web profile.

## 2. Tech Stack & Constraints
### A. Web App (The Public Profile & CRM)
* **Framework:** Next.js (React)
* **Hosting:** Vercel
* **Styling:** Tailwind CSS
* **Data:** Firebase Firestore (Private subcollections for CRM)
* **PWA:** Standalone mode with iOS install prompts.

### B. iOS App (The Admin Panel) - *Currently Secondary*
* **Language:** Swift 5+
* **Framework:** SwiftUI
* **Widget:** WidgetKit

## 3. Current System State (March 2026)

### A. Architectural Mapping
* **Public Profiles:** Located at `/u/[slug]` or `/u/[uid]`. Direct UID lookup is tried first, followed by Slug query.
* **Private CRM:** Stored in `users/{uid}/encounters` (interaction logs) and `users/{uid}/connections` (intelligence nodes/profiles).
* **Intelligence Pipeline:** 
    1. **Ghost Scan:** Background logging of OS, Browser, and Referrer (suppressed for profile owners).
    2. **Handshake:** Guest-facing form capturing Name, Email, Phone, and Reason.
    3. **Identification:** Automated merging of handshake data into master Connection Profiles.

### B. Key Knowledge & Specialized Logic
* **vCard Standard (v3.0/2.1):** 
    * Requires **CRLF Line Folding** (72-character limit) for embedded Base64 photos to be recognized by iOS.
    * Uses specific `N` field mapping for degree suffixes (e.g., `, B.S.`).
* **Firestore Optimization:** Uses `memoryLocalCache()` to bypass common `FILE_ERROR_NO_SPACE` browser bugs.
* **Session Persistence:** `browserLocalPersistence` combined with `localStorage` UID caching enables "Instant Resume" (Warm Start) UX.
* **Custom Routing:** Premium users can claim alphanumeric slugs. QR codes automatically prioritize the slug for professional URLs.
* **Ambient Context:** Captures device fingerprints and geolocation (browser-native) during encounters.

### C. Aesthetic Profile
* **Theming:** Supports Minimal, Bold (High Contrast), and Dark themes.
* **Typography:** Selectable Sans, Serif, Mono, and Display fonts.
* **Landscape Mode:**CSS-triggered flip transforms the profile into a professional traditional business card layout when the phone is rotated.

## 4. Development Roadmap

### Phase 1: CRM & Networking (Complete)
* [x] Conversational frictionless capture.
* [x] Intelligent merging & master node management.
* [x] Priority-based "Needs Attention" Rolodex view.
* [x] One-tap follow-up generation (Draft Email, Invite to Coffee, Calendar Event).

### Phase 2: Professional Expansion (Complete)
* [x] Multi-Role management (The "Multiple Hats" system).
* [x] Innovation Gallery (Hackathon/Pitch Deck blocks).
* [x] DOI & PubMed API research integrations.
* [x] Section-level visibility toggles.

### Phase 3: Notification & Reconnection Engine (Next)
* [ ] **Local PWA Reminders:** Browser-native notifications for `loopClosureDate` deadlines.
* [ ] **Reconnecting Facilitator:** Automated script prompts based on interaction context (e.g., "Ask [Name] about [Transcription] update").
* [ ] **Network Analytics:** Visualizing connection growth and "Close-the-loop" efficiency.

## 5. Implementation Mandates
1. **Absolute Domain:** Always use `BASE_URL` from `src/lib/constants.ts` for QR/Link generation.
2. **vCard Safety:** Never modify `SaveContactButton.tsx` photo logic without verifying CRLF line folding compliance.
3. **Ghost Scan Integrity:** Ensure `HandshakeSystem.tsx` continues to suppress scans for the `ownerUid` to prevent ledger pollution.
