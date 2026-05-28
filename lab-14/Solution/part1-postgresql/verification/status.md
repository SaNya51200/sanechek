# PostgreSQL verification

Planned command:

```powershell
docker compose up -d
docker compose exec postgres psql -U lab_user -d shop_analytics -f /work/schema.sql
docker compose exec postgres psql -U lab_user -d shop_analytics -f /work/queries.sql
docker compose exec postgres psql -U lab_user -d shop_analytics -f /work/index_analysis.sql
```

Actual local environment status on 2026-04-26:

- `docker compose up -d` started `lab14_postgres`.
- SQL files were copied into the container with `docker cp`.
- `schema.sql`, `queries.sql`, and `index_analysis.sql` were executed with `psql`.
- Outputs were saved to:
  - `postgres_schema_output.txt`
  - `postgres_queries_output.txt`
  - `postgres_index_output.txt`

