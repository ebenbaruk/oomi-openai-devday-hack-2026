# Oomi Preview — clean TestFlight candidate

This is a clean, independent copy of the Oomi iPhone + Apple Watch app.
It exists to isolate TestFlight distribution from the original App Store Connect record.

## Identity

- Display name: `Oomi Preview`
- iPhone bundle ID: `com.otterappdev.oomi.preview`
- Apple Watch bundle ID: `com.otterappdev.oomi.preview.watchkitapp`
- Initial version/build: `1.0 (1)`
- Team: `L976M3ADD6`

## Before uploading

1. In Xcode, select the `OomiWatch` scheme and confirm automatic signing with team `L976M3ADD6`.
2. Archive with **Any iOS Device (arm64)**.
3. In App Store Connect, create a separate app record called **Oomi Preview** with bundle ID `com.otterappdev.oomi.preview`.
4. Distribute the archive to App Store Connect and add the processed build to the internal TestFlight group.

This app uses the same Oomi server and dashboard pairing flow as the production candidate. It intentionally has a separate bundle identity so a successful installation proves that the earlier failure was specific to the original TestFlight app record.
