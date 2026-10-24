# OomiWatch — le collier de test sur Apple Watch

App watchOS autonome (SwiftUI, watchOS 10+) qui joue le rôle du collier pendant le hackathon : un bouton à maintenir, les yeux d'Oomi, la LED micro. Elle parle au serveur par la route **`POST /api/turn`** (mode tour par tour), parce que watchOS n'a pas WebRTC. Le pipeline de sécurité est exactement le même que pour le simulateur web.

## Flux

1. Appui sur le bouton : l'app enregistre le micro (AAC mono 24 kHz) tant que le doigt reste posé. Yeux `listening`, anneau vert = micro actif.
2. Relâchement : l'enregistrement est envoyé en base64 à `/api/turn` avec le code d'accès dans l'en-tête `x-oomi-access-code`. Yeux `thinking`.
3. Le serveur transcrit, applique les garde-fous, génère et vérifie le texte, puis synthétise l'audio. Réponse JSON : verdict, texte, audio WAV, expression à afficher.
4. L'app joue l'audio (`speaking`), puis affiche l'expression renvoyée (`happy`, `grown_up`…) et revient à `idle`.

Un nouvel appui pendant la lecture coupe le son et repart sur une nouvelle question.

## Construire sur un Mac

Prérequis : Xcode 16, [XcodeGen](https://github.com/yonaskolb/XcodeGen) (`brew install xcodegen`).

```bash
cd apple
xcodegen generate          # crée OomiWatch.xcodeproj (non versionné)
open OomiWatch.xcodeproj
```

Choisir le schéma `OomiWatch`, une cible « Apple Watch » (simulateur ou montre appairée), puis Run. Pour installer sur une vraie montre il faut un compte développeur Apple dans Xcode → Signing & Capabilities (signature automatique).

Dans l'app, ouvrir les réglages (roue dentée) et renseigner :
- **Server** : l'URL du serveur Oomi (`http://<ip-du-mac>:3000` en local, ou l'URL Vercel).
- **Access code** : la valeur de `OOMI_ACCESS_CODE` du serveur.

En local, le serveur doit être lancé avec `npm run dev` et joignable depuis la montre (même Wi-Fi, et `APP_ORIGIN` n'intervient pas pour cette route).

## Tests

`OomiWatchTests` vérifie que les états du visage, la requête et la réponse correspondent exactement aux contrats du serveur (`src/lib/contracts.ts`, `src/lib/turn.ts`). Le workflow GitHub **Apple Watch app** compile et lance ces tests sur un runner macOS à chaque changement dans `apple/`.

## Fichiers

| Fichier | Rôle |
|---|---|
| `project.yml` | spec XcodeGen (cibles, Info.plist, permission micro) |
| `OomiWatch/ContentView.swift` | écran principal, machine à états, bouton push-to-talk, réglages |
| `OomiWatch/FaceView.swift` | les 8 expressions |
| `OomiWatch/AudioEngine.swift` | enregistrement et lecture |
| `OomiWatch/TurnClient.swift` | appel HTTP à `/api/turn` |
| `OomiWatch/Models.swift` | miroirs Swift des contrats TypeScript |
