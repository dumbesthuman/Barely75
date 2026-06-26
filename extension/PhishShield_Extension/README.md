# PhishShield Extension

PhishShield is a browser extension and FastAPI service that analyzes visited URLs for phishing risk using a trained machine learning model.

## Features

- Real-time phishing checks while browsing
- Local popup with current status and recent scan history
- FastAPI prediction endpoint for URL classification
- XGBoost model integration with engineered URL and page features
- Firefox-compatible extension packaging (`.zip` / `.xpi`)

## Project Structure

- `manifest.json`, `background.js`, `popup.html`, `popup.js`, `styles.css`: extension files
- `icons/`: extension icons
- `backend/`: FastAPI inference service and feature extraction code

## Local Development

1. Run backend service from `backend/`.
2. Load extension from this folder (`PhishShield_Extension`) in Firefox.
3. Open popup to view phishing status and history.

## Packaging

- Build upload artifacts from this folder with `zip`.
- Ensure the archive root contains `manifest.json` directly.
- Exclude hidden macOS metadata files (`__MACOSX`, `._*`, `.DS_Store`).

