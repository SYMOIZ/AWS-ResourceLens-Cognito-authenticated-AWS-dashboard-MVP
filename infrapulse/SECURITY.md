# Security

## Reporting

If you find a vulnerability in InfraPulse, **do not** open a public issue. Contact the maintainers privately (for example via the GitHub Security advisory flow once the project is published).

Please include:

- Affected component (API, provider, scheduler, docs)
- Reproduction steps without including real secrets
- Impact (data leak, auth bypass, RCE, etc.)

## What this project stores

- Insights and topics in local SQLite
- Non-secret settings (provider name, schedule, demo flag)

It does not implement user login. Treat a deployed instance as a trusted-operator tool unless you add authentication.

## Secrets

- Never commit `.env`, AWS access keys, session tokens, or private key files
- Frontend must not receive AWS credentials (`VITE_*` is public in the JS bundle)
- `BedrockProvider` uses the AWS credential provider chain
- Production CORS should list explicit origins

## AI output

Model (or demo) text is persisted as JSON fields. The application does not execute generated content or run generated shell commands.
