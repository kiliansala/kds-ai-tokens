# Token Structure

kds-ai-tokens is organized in three layers. Each layer builds on the one below it using aliases, creating a traceable chain from raw design values all the way to component-specific tokens.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  ETX  (Extended themes)                             │
│  Neutral · Events · Analytics · Locations ·         │
│  EcoTrafiX · Devices · Messages                     │
│  ↓ aliases to Semantic or Primitives                │
├─────────────────────────────────────────────────────┤
│  Semantic  (Meaningful, mode-aware)                 │
│  Typography · Space · Key · Status                  │
│  ↓ aliases to Primitives                            │
├─────────────────────────────────────────────────────┤
│  Primitives  (Raw values, no aliases)               │
│  Colors · Typescale · Space · Typeface              │
└─────────────────────────────────────────────────────┘
```

## Layer 1 — Primitives

**File:** `tokens/primitives.json`

Raw, hardcoded values. No aliases. These are the atoms of the system — every value in the Semantic and ETX layers ultimately resolves to a primitive.

| Collection | Token count | Description |
|---|---|---|
| Colors / Base | 15 | Named base colors: black, white, transparent, and brand anchors |
| Colors / Ramps | 1 200 | 12 hue ramps × 100 steps each (0–99), full-spectrum palette |
| Typescale | 77 | Font family, weight, size, line-height, tracking per text style |
| Space | 14 | Spacing scale from `0px` to `128px` |
| Typeface | 5 | Font family and weight aliases (Brand / Plain) |

## Layer 2 — Semantic

**File:** `tokens/semantic.json`

Named, meaningful tokens. Every `$value` is an alias pointing to a primitive. Collections with Light/Dark modes use `$extensions.modes` to carry the alternate value.

| Collection | Token count | Has modes | Description |
|---|---|---|---|
| Key | 14 | Yes | Core UI colors (black, white, brand hues) with dark variants |
| Status | 8 | Yes | Semantic status colors (error, warning, success, info) |
| Typography | 77 | No | Typography styles referencing `Typescale` primitives |
| Space | 20 | No | Layout spacing referencing `Space` primitives |

### Alias chain example

```
semantic.json   Key.red.$value = "{Colors.Ramps.red.50}"
                               ↓
primitives.json   Colors.Ramps.red.50.$value = "#FF3B30"
```

## Layer 3 — ETX (Extended Themes)

**File:** `tokens/etx.json`

Theme-specific token sets for each product vertical. Each theme contains 251 color tokens. All themes share the same `Space` (20) and `Typography` (77) collections.

Most tokens in every theme are aliases to Semantic values. Each theme **overrides a small set of tonal tokens** — replacing the Neutral grey ramp with a product-branded color ramp. The rest of the 251 tokens are inherited unchanged from Neutral.

| Theme | Overrides | Color ramp | Notes |
|---|---|---|---|
| Neutral | — | gray | Baseline; all other themes are derived from this |
| Events | 11 | brown | Tonal scale + surface tokens |
| Analytics | 14 | teal | Tonal scale + surface + some `on-low` tokens |
| Locations | 14 | indigo | Tonal scale + surface + some `on-primary` tokens |
| EcoTrafiX | 17 | yellow | Tonal scale + surface + `on-low` + `on-lower` tokens |
| Devices | 14 | blue | Tonal scale + surface + some `on-low` tokens |
| Messages | 0 | gray | Currently identical to Neutral |

### Overridden token groups

Every non-Neutral theme overrides tokens in these groups:

- **Tonal scale** — `lowest`, `lower`, `low`, `primary`, `high`, `higher`, `highest` (the main brand color and its brightness variants)
- **Surface** — `surface`, `on-surface`, `on-surface-inactive`, `on-surface-disabled`
- Depending on theme: `on-low`, `on-lower`, `on-primary` and their inactive/disabled variants

### Alias chain example (ETX → Semantic → Primitive)

```
etx.json        Events.highest.$value = "{Colors.Ramps.brown.90}"
                                       ↓
primitives.json   Colors.Ramps.brown.90.$value = "#3E2723"
```

Neutral tokens alias Semantic, creating a three-hop chain:

```
etx.json        Neutral.surface.$value = "{Key.white}"
                                        ↓
semantic.json   Key.white.$value = "{Colors.Base.white}"
                                  ↓
primitives.json   Colors.Base.white.$value = "#FFFFFF"
```
