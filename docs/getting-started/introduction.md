# Introduction

## What are Design Tokens?

Design tokens are the **smallest, indivisible units of a design system** — named entities that store visual design decisions. They are the bridge between design and code, giving a single name to values like colors, spacing, font sizes, and timing so every platform can consume the same source of truth.

Instead of hardcoding `#005BD3` in your CSS and `rgba(0,91,211,1)` in your iOS code, both reference the token `{Colors.Ramps.blue.50}`. Update the token once, and every consumer updates automatically.

**Benefits:**
- **Consistency** — one value, referenced everywhere; impossible to drift
- **Interoperability** — platform-agnostic JSON works for CSS, iOS, Android, Flutter, and any other target
- **Maintainability** — design decisions are decoupled from implementation; updating a brand color is a single-file change
- **Tooling** — a standard format enables exporters, transformers (e.g., Style Dictionary), and importers to interoperate

## W3C DTCG Format

kds-ai-tokens follows the [W3C Design Token Community Group](https://design-tokens.github.io/community-group/format/) (DTCG) format. Every token is a JSON object with reserved `$`-prefixed keys.

### Core token properties

| Property | Required | Description |
|---|---|---|
| `$value` | Yes | The token's value (format depends on `$type`) |
| `$type` | Recommended | Declares the semantic type of the value |
| `$description` | No | Human-readable documentation |
| `$extensions` | No | Tool-specific metadata (e.g. Figma modes) |

### Alias syntax

Tokens can reference other tokens using **alias syntax** — a path wrapped in `{}` braces:

```json
{
  "button-background": {
    "$type": "color",
    "$value": "{Colors.Ramps.blue.50}"
  }
}
```

This creates a live alias: the value is always resolved from the referenced token. kds-ai-tokens uses this extensively to build the semantic and ETX layers on top of primitives.

### Modes (`$extensions.modes`)

The `$extensions.modes` object holds alternate values for a token — typically used for **Light** and **Dark** themes:

```json
{
  "surface": {
    "$type": "color",
    "$value": "{Colors.Base.white}",
    "$extensions": {
      "modes": {
        "dark": "{Colors.Base.black}"
      }
    }
  }
}
```

The `$value` is the default (light) mode value. Additional modes are stored in `$extensions.modes`.

### Supported token types

| Type | Example value | Use |
|---|---|---|
| `color` | `"#FF3B30"` | Any color value |
| `dimension` | `"16px"` | Sizes, spacing, radii |
| `fontFamily` | `"Roboto"` | Font family names |
| `fontWeight` | `"Regular"`, `700` | Font weight |
| `number` | `1.5` | Unitless numbers |
| `typography` | `{ fontFamily, fontSize, … }` | Composite type |

## Figma Variables

kds-ai-tokens is sourced from **Figma Variables** — Figma's native implementation of the design token concept.

### Collections and modes

In Figma, variables are organized into **Collections**. Each collection defines a set of variables and their **modes** (e.g., Light / Dark). The collections in kds-ai-tokens map directly to the top-level keys in each token JSON file:

| Figma Collection | Token file | Top-level key |
|---|---|---|
| Colors | `primitives.json` | `Colors` |
| Typescale | `primitives.json` | `Typescale` |
| Space | `primitives.json` / `semantic.json` | `Space` |
| Typeface | `primitives.json` | `Typeface` |
| Typography | `semantic.json` | `Typography` |
| Key | `semantic.json` | `Key` |
| Status | `semantic.json` | `Status` |
| Neutral / Events / … | `etx.json` | `Neutral`, `Events`, … |

### Variable → Token mapping

| Figma concept | W3C token concept |
|---|---|
| Variable | Token |
| Variable name (slash-separated) | Token path (`.` separated) |
| Variable type | `$type` |
| Variable value | `$value` |
| Variable alias | Alias `{Collection.path}` |
| Mode | `$extensions.modes` key |
| Collection | Top-level JSON key |

Tokens were exported from Figma using a custom import script (`scripts/import.js`) that calls the Figma REST API (`GET /v1/files/:key/variables/local`) and transforms the response into the W3C DTCG format.
