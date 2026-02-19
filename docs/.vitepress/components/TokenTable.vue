<template>
  <div>
    <!-- Mode toggle — only when no external mode is provided and modes exist -->
    <div v-if="hasModes && externalMode == null" class="mode-toggle">
      <span style="font-size:0.8em;color:var(--vp-c-text-2);margin-right:4px;">Mode:</span>
      <button :class="{ active: internalMode === 'light' }" @click="internalMode = 'light'">Light</button>
      <button :class="{ active: internalMode === 'dark' }"  @click="internalMode = 'dark'">Dark</button>
    </div>

    <!-- ── Typography preview ── -->
    <div v-if="isTypographyCollection">
      <div
        v-for="group in typographyGroups"
        :key="group.name"
        :id="groupId(group.name)"
        class="type-preview-card"
      >
        <div class="type-preview-header">
          <span class="type-preview-name">{{ group.name }}</span>
          <span class="type-preview-meta">
            <span v-for="(prop, key) in group.props" :key="key" class="type-meta-item">
              <span class="type-meta-key">{{ key }}</span>
              <span class="type-meta-val">
                <span v-if="isAlias(prop.value)" class="token-alias" style="font-size:0.9em;">
                  <a :href="resolveAliasHref(prop.value)">{{ prop.value }}</a>
                </span>
                <span v-else>{{ prop.value }}</span>
                <span v-if="prop.value !== prop.resolved" style="color:var(--vp-c-text-3);margin-left:3px;">→ {{ prop.resolved }}</span>
              </span>
            </span>
          </span>
        </div>
        <div class="type-preview-sample" :style="buildTypographyStyle(group)">
          The quick brown fox jumps over the lazy dog
        </div>
      </div>
    </div>

    <!-- ── Color ramp grid ── -->
    <div v-else-if="isColorRamp">
      <div v-for="ramp in rampGroups" :key="ramp.name" style="margin-bottom:1.5rem;">
        <div class="token-section-header">{{ ramp.name }}</div>
        <div class="color-grid">
          <div
            v-for="token in ramp.tokens"
            :key="token.id"
            :id="token.id"
            class="color-grid-cell"
            :title="token.value"
          >
            <div class="color-grid-swatch" :style="{ background: token.value }"></div>
            <div class="color-grid-label">{{ token.step }}</div>
            <div class="color-grid-label">{{ token.value }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Standard table ── -->
    <table v-else class="token-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>{{ hasModes ? (activeMode === 'light' ? 'Light value' : 'Dark value') : 'Value' }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="token in flatTokens" :key="token.id" :id="token.id">
          <td class="token-name">{{ token.name }}</td>
          <td><span class="token-type-badge">{{ token.type }}</span></td>
          <td>
            <div class="token-value-cell">
              <span
                v-if="token.type === 'color'"
                class="token-swatch"
                :style="{ background: resolveSwatchColor(displayValue(token)) }"
              ></span>
              <span v-if="isAlias(displayValue(token))" class="token-alias">
                <a :href="resolveAliasHref(displayValue(token))">{{ displayValue(token) }}</a>
              </span>
              <span v-else class="token-raw-value">{{ displayValue(token) }}</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'

const props = defineProps({
  data:           { type: Object,  required: true },
  collectionName: { type: String,  default: '' },
  primitives:     { type: Object,  default: null },
  /**
   * Prefix prepended to every token id so that alias hrefs resolve correctly.
   * e.g. "colors-base" → token 'black' gets id "colors-base-black"
   * which matches the anchor generated from alias {Colors.Base.black}
   */
  pathPrefix:     { type: String,  default: '' },
  /**
   * External mode override. When provided the internal toggle is hidden
   * and this value drives light/dark display.
   */
  externalMode:   { type: String,  default: null },
})

// ─────────────────────────────────────────
// Mode
// ─────────────────────────────────────────
const internalMode = ref('light')
const activeMode   = computed(() => props.externalMode ?? internalMode.value)

// ─────────────────────────────────────────
// Flatten token tree
// ─────────────────────────────────────────
function flattenTokens(obj, path = []) {
  const results = []
  const pre = props.pathPrefix
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('$')) continue
    if (typeof val !== 'object' || val === null) continue
    const newPath = [...path, key]
    if ('$value' in val) {
      const segments = newPath.map(s => s.toLowerCase().replace(/\s+/g, '-'))
      const id = pre ? `${pre}-${segments.join('-')}` : segments.join('-')
      results.push({
        id,
        name:  newPath.join(' / '),
        path:  newPath,
        type:  val['$type'] ?? '',
        value: val['$value'],
        modes: val['$extensions']?.modes ?? null,
      })
    } else {
      results.push(...flattenTokens(val, newPath))
    }
  }
  return results
}

const flatTokens = computed(() => flattenTokens(props.data))

// ─────────────────────────────────────────
// Modes
// ─────────────────────────────────────────
const hasModes = computed(() => flatTokens.value.some(t => t.modes))

function displayValue(token) {
  if (!token.modes) return token.value
  if (activeMode.value === 'dark') return token.modes.dark ?? token.value
  return token.value
}

// ─────────────────────────────────────────
// Alias detection
// ─────────────────────────────────────────
function isAlias(value) {
  return typeof value === 'string' && /^\{[^}]+\}$/.test(value)
}

// ─────────────────────────────────────────
// Alias → page href
// ─────────────────────────────────────────
const PRIMITIVE_COLLECTIONS = new Set(['colors', 'typescale', 'space', 'typeface'])
const SEMANTIC_COLLECTIONS  = new Set(['typography', 'key', 'status'])

function resolveAliasHref(alias) {
  const inner = alias.slice(1, -1)
  const parts = inner.split('.')
  const coll  = parts[0].toLowerCase()

  let page
  if (PRIMITIVE_COLLECTIONS.has(coll))     page = '/design-tokens/primitives'
  else if (SEMANTIC_COLLECTIONS.has(coll)) page = '/design-tokens/semantic'
  else                                     page = '/design-tokens/etx'

  const anchor = parts.map(s => s.toLowerCase().replace(/\s+/g, '-')).join('-')
  return `${page}#${anchor}`
}

// ─────────────────────────────────────────
// Generic alias resolver (walks all segments)
// ─────────────────────────────────────────
function resolveValue(value) {
  if (!value || typeof value !== 'string') return value
  let current = value
  for (let i = 0; i < 4; i++) {
    if (!isAlias(current)) return current
    if (!props.primitives)  return current
    const path = current.slice(1, -1).split('.')
    let node = props.primitives
    for (const seg of path) {
      node = node?.[seg]
      if (node == null) return current
    }
    if (typeof node !== 'object') return current
    current = node['$value'] ?? current
  }
  return current
}

function resolveSwatchColor(value) {
  const resolved = resolveValue(value)
  if (!resolved || typeof resolved !== 'string' || isAlias(resolved)) return 'transparent'
  return resolved
}

// ─────────────────────────────────────────
// Color ramp grid
// ─────────────────────────────────────────
const isColorRamp = computed(() =>
  props.collectionName?.toLowerCase().includes('ramp')
)

const rampGroups = computed(() => {
  if (!isColorRamp.value) return []
  return Object.entries(props.data).map(([rampName, steps]) => ({
    name: rampName,
    tokens: Object.entries(steps)
      .filter(([, v]) => v && '$value' in v)
      .map(([step, v]) => {
        const base = `${rampName.toLowerCase()}-${step}`
        const id   = props.pathPrefix ? `${props.pathPrefix}-${base}` : base
        return { id, step, value: v['$value'] }
      })
  }))
})

// ─────────────────────────────────────────
// Typography preview
// ─────────────────────────────────────────
const isTypographyCollection = computed(() => {
  const name = props.collectionName?.toLowerCase() ?? ''
  return name.includes('typography') || name.includes('typescale')
})

function groupId(groupName) {
  const slug = groupName.toLowerCase().replace(/\s+/g, '-')
  return props.pathPrefix ? `${props.pathPrefix}-${slug}` : slug
}

const typographyGroups = computed(() => {
  if (!isTypographyCollection.value) return []
  const map = new Map()
  for (const token of flatTokens.value) {
    const groupName = token.path[0]
    if (!map.has(groupName)) map.set(groupName, { name: groupName, props: {} })
    const propKey = token.path.slice(1).join(' / ') || token.path[0]
    map.get(groupName).props[propKey] = {
      type:     token.type,
      value:    token.value,
      resolved: resolveValue(token.value),
    }
  }
  return [...map.values()]
})

const FONT_WEIGHT_MAP = {
  regular: '400', Regular: '400',
  medium:  '500', Medium:  '500',
  semibold:'600', Semibold:'600',
  bold:    '700', Bold:    '700',
  light:   '300', Light:   '300',
}

function buildTypographyStyle(group) {
  const p = group.props
  const style = {}
  if (p['Font'])        style['font-family']   = resolveValue(p['Font'].value)
  if (p['Size'])        style['font-size']      = resolveValue(p['Size'].value)
  if (p['Line Height']) style['line-height']    = resolveValue(p['Line Height'].value)
  if (p['Tracking'])    style['letter-spacing'] = resolveValue(p['Tracking'].value)
  if (p['Weight']) {
    const raw = resolveValue(p['Weight'].value)
    style['font-weight'] = FONT_WEIGHT_MAP[raw] ?? raw
  }
  return style
}

// ─────────────────────────────────────────
// Scroll to hash on mount (dynamic elements)
// ─────────────────────────────────────────
onMounted(async () => {
  await nextTick()
  const hash = window.location.hash.slice(1)
  if (!hash) return
  const el = document.getElementById(hash)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('token-highlight')
    setTimeout(() => el.classList.remove('token-highlight'), 2000)
  }
})
</script>
