<script setup>
import { ref, computed } from 'vue'
import primitives from '../../tokens/primitives.json'
import etx        from '../../tokens/etx.json'

const themes = ['Neutral', 'Events', 'Analytics', 'Locations', 'EcoTrafiX', 'Devices', 'Messages']

const NO_DARK_MODE = new Set([])

const selectedTheme = ref('Neutral')
const mode          = ref('light')

const themeHasDarkMode = computed(() => !NO_DARK_MODE.has(selectedTheme.value))

const themeData      = computed(() => etx[selectedTheme.value])
const pathPrefix     = computed(() => selectedTheme.value.toLowerCase())
const spaceData      = etx.Space
const typographyData = etx.Typography
</script>

# ETX Tokens

<DownloadButton :data="etx" filename="etx.json" />

Extended theme tokens for each kds-ai product vertical. Each theme defines 251 color tokens. **Space** and **Typography** are shared across all themes.

Most tokens alias [Semantic](/design-tokens/semantic) values. Each theme overrides a small set of tonal tokens — replacing the Neutral grey ramp with a product-branded color ramp. All other tokens are inherited unchanged from Neutral.

| Theme | Overrides vs Neutral | Color ramp |
|---|---|---|
| Neutral | — (baseline) | gray |
| Events | 11 | brown |
| Analytics | 14 | teal |
| Locations | 14 | indigo |
| EcoTrafiX | 17 | yellow |
| Devices | 14 | blue |
| Messages | 0 (identical to Neutral) | gray |

## Theme

<div class="theme-selector">
  <button
    v-for="theme in themes"
    :key="theme"
    :class="{ active: selectedTheme === theme }"
    @click="selectedTheme = theme"
  >{{ theme }}</button>
</div>

<div class="mode-toggle" style="margin-bottom:16px;">
  <span style="font-size:0.8em;color:var(--vp-c-text-2);margin-right:4px;">Mode:</span>
  <button :class="{ active: mode === 'light' }" @click="mode = 'light'">Light</button>
  <button
    :class="{ active: mode === 'dark' }"
    :disabled="!themeHasDarkMode"
    :title="themeHasDarkMode ? '' : 'This theme has no dark mode variants in the source data'"
    @click="themeHasDarkMode && (mode = 'dark')"
  >Dark</button>
  <span v-if="!themeHasDarkMode" style="font-size:0.75em;color:var(--vp-c-text-3);margin-left:4px;">
    (not defined for {{ selectedTheme }})
  </span>
</div>

**Tonal scale** — the primary color and its brightness variants for the selected theme and mode:

<ThemePalette :data="themeData" :primitives="primitives" :mode="mode" />

<TokenTable :data="themeData" :collection-name="selectedTheme" :path-prefix="pathPrefix" :primitives="primitives" :external-mode="mode" />

## Space

20 layout spacing tokens — identical across all ETX themes.

<TokenTable :data="spaceData" collection-name="Space" path-prefix="space" :primitives="primitives" />

## Typography

77 typography tokens — identical across all ETX themes.

<TokenTable :data="typographyData" collection-name="Typography" path-prefix="typography" :primitives="primitives" />
