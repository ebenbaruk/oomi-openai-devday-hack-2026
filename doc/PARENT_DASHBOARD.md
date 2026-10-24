# Dashboard parent — état d’intégration

Branche : `feat/parent-dashboard`  
Base : `feat/oomi-foundation`, commit `1ea0b6d`

## Objectif

Le dashboard parent permet de suivre les découvertes d’un enfant, d’administrer les repères de la famille et de recevoir des signaux discrets sur des sujets sensibles. Il évite de stocker l’audio et les formulations brutes de l’enfant.

## Ce qui a été ajouté

### Expérience parent

La page [`/parent`](/parent) comprend :

- un espace « Aujourd’hui » avec chiffres clés, découverte et activité suggérée ;
- les découvertes et défis associés ;
- les moments « À reprendre avec vous » ;
- les histoires du soir ;
- la mémoire visible et effaçable ;
- les réglages du quotidien et les sujets de vigilance ;
- un mode aperçu, utilisable avant la connexion de Postgres.

L’écran est implémenté dans `src/components/parent-dashboard.tsx` et rendu par `src/app/parent/page.tsx`.

### Données et migrations

`db/migrations/002_parent_dashboard.sql` ajoute :

- `parent_settings` : durée d’utilisation, plages calmes, histoires et notifications ;
- `parent_care_topics` : changement familial, adoption, deuil ou note parent privée ;
- `discoveries` : résumé, activité, défi et lien optionnel vers la session et le tour vocal ;
- `memories` : intérêt, difficulté, fait ou préférence ;
- `stories` : histoires et découvertes sources ;
- `parent_alerts` : signal parent, sans verbatim de l’enfant.

`db/migrations/003_parent_accounts_devices.sql` ajoute :

- `parent_accounts` ;
- une relation parent → plusieurs profils enfants ;
- `devices`, avec le code de jumelage haché SHA-256.

## Protection des données

- Aucun audio n’est enregistré.
- Aucune transcription ni formulation de l’enfant n’est enregistrée dans le dashboard.
- Les alertes ne contiennent qu’un résumé parent approuvé.
- Les sujets de vigilance et les notes privées ne sont jamais envoyés au collier ni répétés à l’enfant.
- Les API parent demandent le cookie de session adulte et vérifient l’origine des requêtes d’écriture.

## API parent

| Route | Usage |
| --- | --- |
| `GET /api/parent/dashboard` | Charger le dashboard du profil de démonstration |
| `PUT /api/parent/settings` | Enregistrer les réglages parent |
| `PUT /api/parent/care-topics` | Activer ou désactiver un sujet de vigilance |
| `POST /api/parent/discoveries` | Ajouter une découverte reliée à un tour vocal optionnel |
| `POST /api/parent/memory` | Ajouter un souvenir |
| `DELETE /api/parent/memory/:id` | Effacer un souvenir |
| `POST /api/parent/stories` | Créer une histoire à préparer |
| `PATCH /api/parent/alerts/:id` | Marquer une alerte comme lue ou ignorée |
| `GET /api/parent/children` | Lister les enfants et appareils du parent démo |
| `POST /api/parent/children` | Créer un enfant et son appareil |

## Contrat d’intégration avec la voix

Le flux vocal continue de garder la transcription hors de la base. Après l’audit d’un tour, le futur intégrateur peut appeler :

```ts
recordParentSignal({
  turnAuditId,
  kind: "family_change" | "adoption" | "grief" | "none",
});
```

Cette fonction :

1. vérifie que le parent a activé le sujet correspondant ;
2. crée une alerte privée reliée au `turn_audit` ;
3. ne sauvegarde pas la question de l’enfant.

Le contrat `parentSignalSchema` est défini dans `src/lib/contracts.ts`.

## À faire après installation locale

1. Installer Node 24 ou 26, Docker Desktop, puis lancer `npm ci`.
2. Renseigner `.env.local` et démarrer Postgres avec `docker compose up -d`.
3. Exécuter `npm run db:migrate` pour appliquer les migrations 001, 002 et 003.
4. Démarrer `npm run dev:web`, puis ouvrir `/parent`.
5. Ajouter le sélecteur multi-enfant persistant dans la session adulte avant la démo finale.
6. Connecter la génération Brain au `POST /api/parent/discoveries`.
7. Connecter le verdict sensible au contrat `recordParentSignal` une fois le flux vocal d’Ali validé.

## Vérification effectuée

`git diff --check` passe. Les migrations, tests et rendu Next n’ont pas été exécutés ici : l’environnement actuel utilise Node 25, incompatible avec Vitest 5, et Docker n’est pas disponible.
