# Oomi Watch — first connected flow

The Watch app lives in `watch/OomiWatchApp/OomiWatch/OomiWatch.xcodeproj`.

## What works

1. Hold **Maintenir pour parler** to record a short AAC `.m4a` clip.
2. On release, the Watch sends the clip and its six-digit pairing code to `POST /api/watch/turn` over HTTPS.
3. The server transcribes the completed clip with OpenAI, applies moderation and the Oomi input verdict, generates a reply with the Responses API, then validates the reply before returning it.
4. The Watch reads only the returned, approved text using the device voice.
5. The request records only operational audit data. A configured family, adoption, separation, or grief category can create a discreet parent alert; the child’s wording is not copied into that alert.

## Pair a Watch

1. Open the parent dashboard and enter the adult access code.
2. In **Réglages**, choose **Préparer l’Apple Watch**. The displayed pairing code replaces any previous code for that Watch.
3. In the Watch app, tap the gear icon and enter:
   - the public HTTPS application address, for example `https://your-oomi-project.vercel.app`;
   - the six-digit pairing code.
4. Hold the microphone button and ask a short question.

The Watch cannot contact a local `localhost` server. Use a Vercel deployment or an HTTPS tunnel during development.

## Database and deployment

The shared database already has `002_journal.sql`. This branch adds:

- `003_parent_dashboard.sql` for private care topics and parent alerts;
- `004_watch_devices.sql` for hashed Watch pairing codes and connection status.

`DATABASE_URL` is the application connection URL. `DATABASE_URL_MIGRATE` can be a direct or session-pooler URL used only by `npm run db:migrate`.

The Watch never contains an OpenAI key or database credential.
