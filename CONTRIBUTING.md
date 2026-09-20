# Contributing

## Development

Academy requires [Bun](https://bun.com/) 1.3 or later.

1. Fork and clone the repository.
2. Create a focused branch from `main`.
3. Install dependencies and Git hooks:

   ```bash
   bun install
   bunx lefthook install
   ```

4. Make the change and update documentation when behavior changes.
5. Run the required checks:

   ```bash
   bun run lint
   bun run typecheck
   ```

6. Open a pull request that explains the reason for the change.

Use conventional commit messages in the form `type(scope): summary`. Supported types are `feat`, `fix`, `docs`, `chore`, `refactor`, and `test`.

## Publishing

Publishing is reserved for maintainers. GitHub Actions publishes through npm trusted publishing, so no npm token belongs in the repository or its GitHub secrets.

Start from a clean, current `main` branch and run the checks above. Choose the version increment based on semantic versioning:

```bash
bun pm version patch # backward-compatible fix
bun pm version minor # backward-compatible feature
bun pm version major # breaking change
```

`bun pm version` updates `package.json`, creates a version commit, and creates the matching `vX.Y.Z` tag. Push both the commit and tag:

```bash
git push origin main --follow-tags
```

The `publish.yml` workflow checks that the tag matches `package.json`, reruns lint and type checking, then publishes `@divaltor/academy` to npm. Do not publish a normal release manually or reuse an existing version.
