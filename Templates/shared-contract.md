# Template — Shared Contract

> Fill one per BRD with server scope, at Phase-1 exit. Contract module:
> [../Architecture/shared-contract.md](../Architecture/shared-contract.md).
> Location: `contracts/<brd-id>/` (single repo) or the bound `resources.contracts` slot (split repos).

## `VERSION`

```
CTR-<brd-id>-v<n>
product_freeze: <sha of the FE merge commit>
issued: <YYYY-MM-DD>
supersedes: CTR-<brd-id>-v<n-1> | none
supersedes_reason: <what changed and why> | n/a
```

## `contract.ts`

```ts
// The interface BOTH adapters implement. No implementation here.
export interface <Domain>Adapter {
  <method>(input: <InputType>): Promise<<OutputType>>;
}
```

## `contract.md`

### Adapter selection point

`<path>` — the one file per domain integration is permitted to touch (`C_ISOLATION` exception).

### Method: `<method>`

| Field | Value |
|---|---|
| Input | `<InputType>` — field-by-field, with which are optional |
| Output | `<OutputType>` |
| Error variants | one row per variant: name · when it occurs · **which S09 state renders it** |
| Ordering | what the front-end assumes about arrival order |
| Idempotency | whether a retry is safe, and on what key |
| Latency tolerance | what the front-end shows past which threshold |

Repeat per method. A method with no error variants stated is incomplete, not error-free.

## `fixtures/`

| File | Case |
|---|---|
| `<method>.happy.json` | the ordinary success |
| `<method>.empty.json` | the zero-result success |
| `<method>.error.<variant>.json` | one per error variant above |
| `<method>.slow.json` | the latency case, with the delay it simulates |
