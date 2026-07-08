# Déploiement sur Vercel

Ce guide explique comment déployer le dashboard Coupe du Monde 2026 sur Vercel.

## Prérequis

- Compte Vercel (https://vercel.com)
- Git configuré localement
- Node.js 18+ et pnpm

## Configuration de la Base de Données

**Important** : Vous devez avoir une base de données MySQL accessible depuis Vercel.

### Options recommandées :
1. **PlanetScale** (MySQL compatible) - https://planetscale.com
2. **AWS RDS** - https://aws.amazon.com/rds
3. **DigitalOcean Managed Databases** - https://www.digitalocean.com
4. **Supabase** (PostgreSQL, nécessite adaptation)

## Étapes de Déploiement

### 1. Préparer votre dépôt Git

```bash
# Initialiser Git si nécessaire
git init
git add .
git commit -m "Initial commit: World Cup 2026 Dashboard"

# Créer un dépôt sur GitHub/GitLab/Bitbucket
# Puis pousser votre code
git remote add origin https://github.com/votre-username/world-cup-2026-dashboard.git
git branch -M main
git push -u origin main
```

### 2. Créer un projet Vercel

**Option A : Via l'interface Vercel**
1. Aller sur https://vercel.com/new
2. Importer votre dépôt Git
3. Sélectionner le framework : **Other**
4. Build Command : `pnpm build`
5. Output Directory : `dist`
6. Install Command : `pnpm install`

**Option B : Via la CLI Vercel**

```bash
npm install -g vercel
vercel
```

### 3. Configurer les Variables d'Environnement

Dans le dashboard Vercel, allez à **Settings > Environment Variables** et ajoutez :

```
DATABASE_URL=mysql://user:password@host:3306/database
JWT_SECRET=votre-secret-jwt-sécurisé
VITE_APP_ID=votre-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=votre-owner-id
OWNER_NAME=Votre Nom
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=votre-clé-api
VITE_FRONTEND_FORGE_API_KEY=votre-clé-frontend
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im
VITE_APP_TITLE=FIFA World Cup 2026 Dashboard
VITE_APP_LOGO=https://url-vers-votre-logo.png
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=votre-website-id
```

### 4. Déployer

Une fois les variables configurées, Vercel déploiera automatiquement :

```bash
# Ou déclencher manuellement
vercel --prod
```

### 5. Configurer le Domaine (Optionnel)

Dans Vercel, allez à **Settings > Domains** pour :
- Utiliser un domaine Vercel gratuit (xxx.vercel.app)
- Ajouter votre propre domaine personnalisé

## Structure du Projet

```
world-cup-2026-dashboard/
├── client/              # Frontend React
│   ├── src/
│   ├── public/
│   └── index.html
├── server/              # Backend Express + tRPC
│   ├── routers.ts
│   ├── db.ts
│   └── _core/
├── drizzle/             # Migrations base de données
├── shared/              # Code partagé
├── vercel.json          # Configuration Vercel
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Build et Déploiement Local

Pour tester avant de déployer :

```bash
# Installer les dépendances
pnpm install

# Build production
pnpm build

# Démarrer le serveur production
pnpm start
```

## Dépannage

### Erreur : "Cannot find module"
- Vérifier que toutes les dépendances sont dans `package.json`
- Exécuter `pnpm install` localement

### Erreur : "Database connection failed"
- Vérifier que `DATABASE_URL` est correctement configurée
- S'assurer que la base de données est accessible depuis Vercel
- Vérifier les pare-feu et les règles de sécurité

### Erreur : "Build failed"
- Vérifier les logs Vercel dans le dashboard
- Exécuter `pnpm build` localement pour reproduire

### Erreur : "OAuth callback failed"
- Vérifier que `VITE_OAUTH_PORTAL_URL` est correctement configurée
- S'assurer que le domaine Vercel est autorisé dans la configuration OAuth

## Performance

Vercel optimise automatiquement :
- Minification du code
- Compression des assets
- CDN global
- Caching des images

Pour améliorer les performances :
1. Optimiser les images (utiliser WebP)
2. Ajouter du caching HTTP
3. Utiliser les API routes pour les opérations côté serveur

## Support

Pour plus d'aide :
- Documentation Vercel : https://vercel.com/docs
- Documentation Vite : https://vitejs.dev
- Documentation tRPC : https://trpc.io
