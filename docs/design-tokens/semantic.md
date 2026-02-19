<script setup>
import primitives from '../../tokens/primitives.json'
import semantic  from '../../tokens/semantic.json'

const key        = semantic.Key
const status     = semantic.Status
const typography = semantic.Typography
const space      = semantic.Space
</script>

# Semantic

<DownloadButton :data="semantic" filename="semantic.json" />

Meaningful, intent-named tokens. Every `$value` is an alias to a [Primitive](/design-tokens/primitives). The **Key** and **Status** collections have Light/Dark mode variants — use the toggle to preview both.

## Key

14 core UI color tokens with **Light/Dark mode** variants.

<TokenTable :data="key" collection-name="Key" path-prefix="key" :primitives="primitives" />

## Status

8 semantic status colors (error, warning, success, info) with **Light/Dark mode** variants.

<TokenTable :data="status" collection-name="Status" path-prefix="status" :primitives="primitives" />

## Typography

77 typography tokens aliasing [Typescale primitives](/design-tokens/primitives#typescale).

<TokenTable :data="typography" collection-name="Typography" path-prefix="typography" :primitives="primitives" />

## Space

20 layout spacing tokens aliasing [Space primitives](/design-tokens/primitives#space).

<TokenTable :data="space" collection-name="Space" path-prefix="space" :primitives="primitives" />
