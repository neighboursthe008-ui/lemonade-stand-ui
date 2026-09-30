<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All Laravel endpoints live in src/api/registry.ts; services never hardcode paths — keeps contract in one place.
- Modules without a Laravel JSON API use repositories in src/repositories/* with mock impls in src/mocks/* — swap to Laravel impl without UI changes.
- Module data source is set in src/config/backendCapabilities.ts + VITE_<MODULE>_DATA_SOURCE — progressive migration.
- Router is TanStack Router (not React Router DOM) — fixed by the platform.
- Never call POST /api/v1/queue/{id}/start until backend P0 is fixed — unsafe transaction.
