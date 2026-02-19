<script setup>
import primitives from '../../tokens/primitives.json'

const colorsBase  = primitives.Colors.Base
const colorsRamps = primitives.Colors.Ramps
const typescale   = primitives.Typescale
const space       = primitives.Space
const typeface    = primitives.Typeface
</script>

# Primitives

<DownloadButton :data="primitives" filename="primitives.json" />

Raw design values — no aliases. Every token in the Semantic and ETX layers ultimately resolves to a value defined here.

## Colors / Base

15 named base colors: black, white, transparent, and a set of brand-anchored hues.

<TokenTable :data="colorsBase" collection-name="Colors / Base" path-prefix="colors-base" :primitives="primitives" />

## Colors / Ramps

1 200 color tokens across 12 hue ramps, each with 100 perceptual steps (0 = darkest, 99 = lightest).

<TokenTable :data="colorsRamps" collection-name="Colors / Ramps" path-prefix="colors-ramps" :primitives="primitives" />

## Typescale

77 typographic tokens covering font family, weight, size, line height, and letter spacing for each text style role (Display, Headline, Title, Body, Label).

<TokenTable :data="typescale" collection-name="Typescale" path-prefix="typescale" :primitives="primitives" />

## Space

14 spacing tokens on a geometric scale from `0px` to `128px`.

<TokenTable :data="space" collection-name="Space" path-prefix="space" :primitives="primitives" />

## Typeface

5 font-family and font-weight primitives that the Typescale aliases into.

<TokenTable :data="typeface" collection-name="Typeface" path-prefix="typeface" :primitives="primitives" />
