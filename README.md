# kds-ai-tokens

Design tokens for the **kds-ai** design system, extracted from Figma and distributed in [W3C Design Token Community Group (DTCG)](https://design-tokens.github.io/community-group/format/) format.

---

## Overview

`kds-ai-tokens` is the **Single Source of Truth (SSOT)** for all design decisions in the kds-ai design system. Tokens are sourced directly from Figma variable collections and transformed into a portable, spec-compliant format consumable by kds-ai components and any other downstream tools.

## Token Architecture

The token system is structured in three layers:

### 1. Primitives (`tokens/primitives.json`)

Raw, context-free values. Each token maps a name directly to a concrete value — no aliases. These are the palette and scale from which semantic tokens are composed.

| Collection | Tokens | Types |
|------------|--------|-------|
| **Colors** | 1215 | `color` — Base (15) + Ramps (12 hues × 100 steps) |
| **Typescale** | 77 | `dimension`, `fontFamily`, `fontWeight` |
| **Space** | 14 | `dimension` (px) |
| **Typeface** | 5 | `fontFamily`, `fontWeight` |

Example:
```json
{
  "Colors": {
    "Base": {
      "blue": { "$type": "color", "$value": "#007AFF" }
    },
    "Ramps": {
      "blue": {
        "50": { "$type": "color", "$value": "#057DFF" }
      }
    }
  },
  "Space": {
    "space-16": { "$type": "dimension", "$value": "16px" }
  }
}
```

### 2. Semantic (`tokens/semantic.json`)

Contextual, role-based tokens. Most tokens are **aliases** that reference primitives using the W3C `{Collection.group.token}` syntax. Collections with multiple Figma modes (Light/Dark, Baseline/Wireframe) include secondary mode values in `$extensions.modes`.

| Collection | Tokens | Description |
|------------|--------|-------------|
| **Typography** | 77 | Aliases → `{Typescale.*}` and `{Typeface.*}` |
| **Space** | 20 | Aliases → `{Space.*}` + named canvas/layout values |
| **Key** | 14 | Color aliases with `light` (default) and `dark` modes |
| **Status** | 8 | Semantic status colors with `light` and `dark` modes |

Example:
```json
{
  "Typography": {
    "Display Large": {
      "Font":        { "$type": "fontFamily", "$value": "{Typeface.Brand}" },
      "Size":        { "$type": "dimension",  "$value": "{Typescale.Display Large.Size}" }
    }
  },
  "Key": {
    "blue": {
      "$type": "color",
      "$value": "{Colors.Ramps.blue.50}",
      "$extensions": {
        "modes": { "dark": "{Colors.Ramps.blue.70}" }
      }
    }
  },
  "Status": {
    "error": {
      "$type": "color",
      "$value": "{Colors.Ramps.red.50}",
      "$extensions": {
        "modes": { "dark": "{Colors.Ramps.red.70}" }
      }
    }
  }
}
```

### 3. Product — ETX (`tokens/etx.json`)

Product-level tokens for the **EcoTrafiX** product. Includes a base neutral palette plus six theme collections built with Figma's **extended variables** feature — each theme inherits all tokens from `Neutral` and overrides only the values that differ.

| Collection | Tokens | Description |
|------------|--------|-------------|
| **Neutral** | 251 | Base palette — color roles with `light` and `dark` modes |
| **Events** | 251 | Extends Neutral — brown hue override (11 overrides) |
| **Analytics** | 251 | Extends Neutral |
| **Locations** | 251 | Extends Neutral |
| **EcoTrafiX** | 251 | Extends Neutral |
| **Devices** | 251 | Extends Neutral |
| **Messages** | 251 | Extends Neutral |
| **Space** | 20 | Aliases → `{Space.*}` (shared with semantic) |
| **Typography** | 77 | Aliases → `{Typescale.*}` and `{Typeface.*}` (shared with semantic) |

Extended theme collections contain only the tokens that differ from `Neutral` as overrides; all other tokens inherit their parent's value. The output JSON contains the **resolved** values for every token in every collection — consumers do not need to handle inheritance themselves.

Example (override in Events vs inherited value in Neutral):
```json
{
  "Neutral": {
    "primary": {
      "$type": "color",
      "$value": "{Colors.Ramps.gray.50}",
      "$extensions": { "modes": { "dark": "{Colors.Ramps.gray.70}" } }
    }
  },
  "Events": {
    "primary": {
      "$type": "color",
      "$value": "{Colors.Ramps.brown.50}",
      "$extensions": { "modes": { "dark": "{Colors.Ramps.brown.70}" } }
    }
  }
}
```

## Token Format

Tokens follow the [W3C Design Token Format Specification (DTCG)](https://design-tokens.github.io/community-group/format/).

| Field | Description |
|-------|-------------|
| `$type` | Token type (see table below) |
| `$value` | Concrete value or alias reference (`{Collection.path.token}`) |
| `$extensions.modes` | Secondary mode values (dark, wireframe) |

### Supported `$type` values

| Type | Used for |
|------|----------|
| `color` | Color values (hex) |
| `dimension` | Sizes with `px` unit — spacing, font size, line height, letter spacing, border radius |
| `fontFamily` | Font family strings |
| `fontWeight` | Font weight strings (Regular, Medium, Semibold…) |
| `number` | Unitless numbers |

### Alias syntax

References use the dot-separated token path, matching the JSON structure:

```
{Collection.Group.SubGroup.tokenName}
```

Examples:
- `{Colors.Base.black}`
- `{Colors.Ramps.red.50}`
- `{Typescale.Display Large.Size}`
- `{Typeface.Weight.Bold}`
- `{Space.space-16}`

## Source of Truth

All tokens originate from **Figma variable collections**:

| Figma file | File key | Output |
|------------|----------|--------|
| `tokens.primitive` | `nFZZKbwZjwWtGhcto3Bew4` | `tokens/primitives.json` |
| `tokens.semantic` | `X9TzGj6LUcQo65RXeV6GHL` | `tokens/semantic.json` |
| `tokens.ETX` | `IZiHUj1t0VIuw3UOroUhgF` | `tokens/etx.json` |

The token files in this repository are **generated artifacts** — do not edit them by hand. All changes must originate in Figma.

## Project Structure

```
kds-ai-tokens/
├── README.md
├── package.json
├── tokens/
│   ├── primitives.json     # Raw values — no aliases
│   ├── semantic.json       # Aliases referencing primitives
│   └── etx.json            # EcoTrafiX product tokens (resolved)
└── scripts/
    └── import.js           # Figma → token files
```

## Import workflow

```
Figma Variables (SSOT)
        │
        │  REST API  (X-Figma-Token)
        ▼
  scripts/import.js
        │
        ├──▶ tokens/primitives.json
        ├──▶ tokens/semantic.json
        └──▶ tokens/etx.json
```

### Requirements

- Node.js ≥ 18
- A [Figma personal access token](https://www.figma.com/developers/api#access-tokens) with read access to all three files

### Run

```bash
FIGMA_ACCESS_TOKEN=<your-token> npm run import
```

Or set the variable in your environment and run:

```bash
npm run import
```

## Rules

| Rule | Primitives | Semantic | ETX |
|------|-----------|---------|-----|
| Contains raw values | ✅ | Mostly ❌ | ❌ |
| Contains aliases (`{…}`) | ❌ | ✅ | ✅ |
| References other files | ❌ | → primitives | → primitives + semantic |
| Uses extended variables | ❌ | ❌ | ✅ (resolved in output) |
| Editable by hand | ❌ | ❌ | ❌ |

---

*Generated tokens — do not edit manually. Run `npm run import` to regenerate from Figma.*
