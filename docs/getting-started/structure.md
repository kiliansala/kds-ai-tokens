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

---

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

---

## Layer 2 — Semantic

**File:** `tokens/semantic.json`

Named, meaningful tokens. Every `$value` is an alias pointing to a primitive. Collections with Light/Dark modes use `$extensions.modes` to carry the alternate value.

| Collection | Token count | Has modes | Description |
|---|---|---|---|
| Typography | 77 | No | Typography styles referencing `Typescale` primitives |
| Space | 20 | No | Layout spacing referencing `Space` primitives |
| Key | 14 | Yes | Core UI colors (black, white, brand hues) with dark variants |
| Status | 8 | Yes | Semantic status colors (error, warning, success, info) |

### Alias chain example

```
semantic.json  Key.red.$value = "{Colors.Ramps.red.50}"
                              ↓
primitives.json  Colors.Ramps.red.50.$value = "#FF3B30"
```

---

## Layer 3 — ETX (Extended Themes)

**File:** `tokens/etx.json`

Theme-specific token sets for each product vertical. Most values are aliases to Semantic tokens; overridden tokens carry product-specific primitive aliases.

| Theme | Token count | Description |
|---|---|---|
| Neutral | 251 | Default theme — maps directly to semantic values |
| Events | 251 | Brown-accented theme for Events product |
| Analytics | 251 | Teal-accented theme for Analytics product |
| Locations | 251 | Purple-accented theme for Locations product |
| EcoTrafiX | 251 | Green-accented theme for EcoTrafiX product |
| Devices | 251 | Blue-accented theme for Devices product |
| Messages | 251 | Indigo-accented theme for Messages product |

Shared across all ETX themes:
- `Space` (20 tokens) — identical layout spacing
- `Typography` (77 tokens) — identical type styles

### Alias chain example (ETX → Semantic → Primitive)

```
etx.json       Events.highest.$value = "{Colors.Ramps.brown.90}"
                                      ↓
primitives.json  Colors.Ramps.brown.90.$value = "#3E2723"
```

Most tokens in the Neutral theme alias semantic tokens directly:

```
etx.json       Neutral.surface.$value = "{Key.white}"
                                       ↓
semantic.json  Key.white.$value = "{Colors.Base.white}"
                                 ↓
primitives.json  Colors.Base.white.$value = "#FFFFFF"
```
