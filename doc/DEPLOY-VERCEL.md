# Déployer Oomi sur Vercel

Pour Eli. Durée : 20 minutes la première fois. Prérequis : un compte Vercel, l'accès au repo GitHub `ebenbaruk/oomi-openai-devday-hack-2026`, et les valeurs des variables ci-dessous (Ali les a dans son `.env.local`).

## 1. Ce qu'on déploie

- Une seule app Next.js 16 (App Router) : le simulateur du collier, le dashboard parent et les routes API.
- La base est sur **Supabase** (organisation Oomi, projet `oomi`, région Paris). Vercel ne fait tourner aucune base.
- La voix passe par la route `/api/voice`, qui ouvre un **WebSocket** côté Vercel. C'est une fonctionnalité bêta de Vercel (Fluid Compute), voir §4.

Le serveur local `scripts/serve.ts` n'est pas utilisé sur Vercel : il n'existe que pour `npm run dev`.

## 2. Importer le projet

1. Vercel → **Add New → Project** → importer `ebenbaruk/oomi-openai-devday-hack-2026`.
2. Framework preset : **Next.js** (détecté automatiquement). Root directory : la racine du repo. Ne rien changer aux commandes de build (`next build`).
3. **Production branch : `main`.** Toute PR crée automatiquement un déploiement de preview.
4. Région des fonctions : `cdg1` (Paris). C'est déjà dans `vercel.json`, Vercel le lit tout seul.
5. Ne pas cliquer « Deploy » avant d'avoir mis les variables (§3), sinon le premier build échoue sur la config.

## 3. Variables d'environnement

Project → Settings → Environment Variables. Cocher **Production** et **Preview** pour chacune. Aucune ne doit commencer par `NEXT_PUBLIC_`.

| Variable | Valeur | Qui la donne |
|---|---|---|
| `OPENAI_API_KEY` | clé API OpenAI du projet (accès Realtime + Decisions) | Ali |
| `DATABASE_URL` | `postgresql://postgres.<ref>:<mot de passe>@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=no-verify` | Ali (pooler **transaction**, port 6543, obligatoire en serverless) |
| `OOMI_ACCESS_CODE` | code de la démo, 16 caractères minimum | Ali, ou en générer un nouveau |
| `OOMI_SESSION_SECRET` | 32 caractères minimum, aléatoire | générer : `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `APP_ORIGIN` | l'URL publique exacte, par ex. `https://oomi.vercel.app` | à mettre à jour si le domaine change |
| `OPENAI_REALTIME_MODEL` | `gpt-realtime-2.1-mini` | défaut, optionnel |
| `OPENAI_TRANSCRIBE_MODEL` | `gpt-live-transcribe` | défaut, optionnel |
| `OPENAI_DECISION_MODEL` | `gpt-6-luna` | défaut, optionnel |
| `OPENAI_BRAIN_MODEL` | `gpt-6.1-sol` | défaut, optionnel |
| `OPENAI_IMAGE_MODEL` | `gpt-image-2.5-flare` | défaut, optionnel |
| `OOMI_LANGUAGE` | `en` ou `fr` | défaut `en` |
| `OOMI_CHILD_AGE` | `7` | défaut |
| `OOMI_SESSION_SECONDS` | `240` | défaut |

`APP_ORIGIN` sert à la vérification d'origine des requêtes. Pour les previews, l'URL change à chaque déploiement : soit on met l'URL du preview courant, soit on teste la voix uniquement en production. Les pages sans voix (dashboard) marchent sans ça.

## 4. Activer les WebSockets

La route `src/app/api/voice/route.ts` utilise `upgradeWebSocket` de `@vercel/functions`. Pour que ça marche :

1. Project → Settings → **Functions** → vérifier que **Fluid Compute** est activé (c'est le défaut sur les nouveaux projets).
2. La durée max d'une fonction est fixée dans la route à 300 s (`maxDuration = 300`). Sur le plan Hobby la limite est 300 s, sur Pro 800 s. Une session Oomi dure au plus 240 s, donc ça passe.
3. Si Vercel refuse le build avec un message sur les WebSockets, la fonctionnalité n'est pas disponible sur le compte : il faut l'activer depuis la page WebSockets de la doc Vercel ou passer le projet sur un compte Pro. Dans ce cas, déployer quand même : tout marche sauf la voix.

## 5. Déployer et vérifier

1. Cliquer **Deploy**, attendre le build (environ 2 minutes).
2. Ouvrir `https://<domaine>/api/health` : attendu `{"status":"ok","liveConfigured":true}`. Si `liveConfigured` est `false`, une variable manque ou est mal formée : regarder les Runtime Logs.
3. Ouvrir la page d'accueil, saisir le code d'accès, cliquer « Ouvrir une session vocale », autoriser le micro, maintenir le bouton et parler. Le panneau « État du prototype » en bas affiche le verdict et le temps de contrôle.
4. Dans Supabase → Table Editor → `voice_sessions` : une ligne doit apparaître à chaque session, et `turn_audits` une ligne par question.

## 6. Base de données

- Les migrations SQL sont dans `db/migrations/`. Elles sont appliquées sur Supabase par le workflow GitHub **Database migrations** à chaque push sur `main` qui touche ce dossier, ou à la main depuis l'onglet Actions (« Run workflow »).
- Le workflow utilise le secret GitHub `DATABASE_URL_MIGRATE` (pooler **session**, port 5432). Ali le crée dans Settings → Secrets and variables → Actions.
- Ne jamais lancer de migration depuis Vercel : le build n'a pas accès à la base et ne doit pas l'avoir.

## 7. Après le premier déploiement

- Settings → Domains : ajouter un domaine court si on en a un, puis mettre à jour `APP_ORIGIN`.
- Settings → Git : activer « Require a successful CI check » n'existe pas côté Vercel, c'est GitHub qui protège `main` (workflow **CI**).
- Pour la démo : faire un déploiement de production **samedi soir**, vérifier §5, puis ne plus pousser sur `main` le dimanche après 17h sans re-vérifier.

## Problèmes connus

| Symptôme | Cause probable | Correction |
|---|---|---|
| `liveConfigured: false` | variable manquante, `OOMI_SESSION_SECRET` trop court, `DATABASE_URL` sans `?sslmode=no-verify` | corriger la variable, redéployer |
| `401` au clic sur « Ouvrir une session » | `APP_ORIGIN` ne correspond pas à l'URL ouverte | mettre l'URL exacte, redéployer |
| « Impossible d'ouvrir la session » | WebSocket refusé par Vercel, ou clé OpenAI sans accès Realtime | Runtime Logs : la ligne `voice connect failed:` donne la raison |
| Erreurs `too many connections` | `DATABASE_URL` sur le port 5432 au lieu du pooler 6543 | utiliser le pooler transaction |
