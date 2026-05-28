# MongoDB verification

Planned command:

```powershell
docker compose up -d
docker compose exec mongodb mongosh /work/init.js
docker compose exec mongodb mongosh /work/queries.js
docker compose exec mongodb mongosh /work/comparison.js
docker compose exec mongodb mongosh /work/indexes.js
```

Actual local environment status on 2026-04-26:

- `docker compose up -d` started `lab14_mongodb`.
- JavaScript files were copied into the container with `docker cp`.
- `init.js`, `queries.js`, `comparison.js`, and `indexes.js` were executed with `mongosh`.
- Outputs were saved to:
  - `mongodb_init_output.txt`
  - `mongodb_queries_output.txt`
  - `mongodb_comparison_output.txt`
  - `mongodb_indexes_output.txt`

