# SonicStream Quick Start Guide

## 5-Minute Setup

### 1. Clone and Install
```bash
git clone <your-repo>
cd sonicstream
npm run setup
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Verify Everything Works
```bash
# Health check
curl http://localhost:3000/health/live

# API status
curl http://localhost:3000/api/v1/identity/status
```

## Production Deployment

### Cloud Run
```bash
npm run deploy:api
npm run deploy:worker
npm run deploy:ai
```

### Docker
```bash
npm run docker:build
npm run docker:run
```

## Common Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript check |
| `npm run test` | Run tests |
| `npm run migrate` | Run database migrations |
| `npm run env:validate` | Validate environment |
