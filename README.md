# Superwall Docs

## Run Locally
First time you run the docs, you'll need to build the docs first
```
bun run build
```

Then can just run the dev server
```
bun run dev
```

will run the docs at http://localhost:8293

Note that some changes need to re-run build/dev to take effect, like redirects or remarks

### Run AI Search
```
cd ../docs-ai-api
bun run dev
```

## Deploy
### Deploy Production
```
bun run deploy
```

### Deploy Staging
```
bun run deploy:staging
```
