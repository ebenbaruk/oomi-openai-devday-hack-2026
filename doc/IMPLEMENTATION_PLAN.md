# Plan d’implémentation Oomi

Branche : `feat/oomi-foundation`. Priorité validée : blocs 1 et 2 avant le bloc 3.

## Bloc 1 — socle et voix

- Next.js App Router, TypeScript strict, Zod, PostgreSQL, migrations versionnées.
- Un projet Vercel ; une connexion de contrôle persistante par session.
- Simulateur : huit expressions, clic/toucher/espace, LED liée au micro réel.
- Audio WebRTC vers `gpt-realtime-2.1-mini`, transcription `gpt-live-transcribe`, VAD désactivé.
- SDP créé côté serveur, attachement sideband avant ouverture du microphone.
- Toutes les commandes Realtime appartiennent au serveur ; le client ne transmet que des événements Oomi typés.
- Sessions authentifiées pour une démo par adultes, durée bornée, annulation et fermeture explicites.

## Bloc 2 — sécurité avant parole

- Transcription finale → modération → règles → Decisions (`gpt-6-luna`).
- Échec, timeout ou résultat invalide : aucun déclenchement de réponse libre.
- Refus et redirections lus à partir de phrases fixes ; pas de paraphrase par le modèle conversationnel.
- Contrôle de la sortie avant lecture : tampon audio du tour, modération du texte et validation de la politique Oomi. Surveillance pendant génération et interruption immédiate.
- Tests du contrôleur avec fournisseurs simulés, séparés de `eval:live` qui interroge les vrais modèles.
- Les 11 cas de la spec sont un minimum, avec variantes, erreurs et interruptions.
- Le seuil de 1,5 s est mesuré, jamais présenté comme acquis. La validation complète avant lecture peut l’augmenter.

## Bloc 3 — valeur produit (après validation live des deux premiers blocs)

- Brain `gpt-6.1-sol` : activité canonique commune à la voix, au journal et à la mémoire.
- Images `gpt-image-2.5-flare` et enrichissements en tâches reprenables.
- Journal mobile, réglages appliqués côté serveur, mémoire visible et supprimable.
- Histoires illustrées coupées en premier si nécessaire.

L’activité ne peut pas être inventée indépendamment par deux modèles. La voix peut démarrer avant l’illustration et la mise en page du journal, mais le défi prononcé doit rester la source de vérité.

## Bloc 4 — intégration et démo

- Scénario avions, retour sur le défi, journal, refus et renvoi adulte.
- Mesures des latences, interruptions, reconnexion et erreur réseau.
- Contrat métier partagé avec Eli. Le transport et le rendu ESP32 auront un adaptateur ; leur réutilisation sans modification n’est pas présumée.
- README, vidéo de secours, déploiement Vercel puis répétition.

## Critères pour déclarer les blocs 1–2 verts

Le build, les tests locaux et l’évaluation live passent ; l’audio est réellement testé au micro, aucun son bloqué n’est joué, les limites de session et l’interruption fonctionnent. Un résultat avec fournisseurs simulés ne valide ni l’API réelle ni la latence.

## Sources d’intégration

- [Realtime : tours manuels](https://developers.openai.com/api/docs/guides/realtime-conversations)
- [WebRTC](https://developers.openai.com/api/docs/guides/voice-webrtc?voice-api=realtime)
- [Sideband et lecture contrôlée](https://developers.openai.com/api/docs/guides/voice-server-controls)
- [Decisions : requête et réponse](https://developers.openai.com/api/reference/resources/decisions/methods/create)
- [WebSockets avec Next.js sur Vercel](https://vercel.com/docs/functions/websockets)
- [Développement local Vercel](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package#upgradewebsocket)
