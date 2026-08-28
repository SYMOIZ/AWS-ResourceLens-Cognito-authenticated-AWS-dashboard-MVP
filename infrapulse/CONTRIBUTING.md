# Contributing

Thanks for considering a contribution to InfraPulse.

## How to contribute

1. Open an issue describing the change if it is more than a small fix.
2. Keep the local MVP working without AWS credentials (`DEMO_MODE=true`).
3. Do not commit `.env`, keys, account IDs, or production URLs.
4. Add or update tests when you change API or generation behavior.
5. Run backend and frontend tests before you open a pull request.

## Development

Follow [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

```powershell
cd backend
pytest -q

cd ..\frontend
npm test
npm run build
```

## Scope

- Prefer small pull requests.
- Do not add EventBridge/Lambda/DynamoDB implementation in the same PR as an unrelated UI change.
- Do not introduce a second AI schema; extend `InfrastructureInsight` in `backend/app/schemas/insight.py` if the structured record must change.

## License

Contributions are accepted under the MIT License ([LICENSE](LICENSE)).
