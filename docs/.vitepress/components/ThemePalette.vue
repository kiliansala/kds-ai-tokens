<template>
  <div class="theme-palette">
    <div
      v-for="step in scaleSteps"
      :key="step.key"
      class="theme-palette-step"
      :class="{ 'theme-palette-step--primary': step.key === 'primary' }"
      :title="step.alias + ' → ' + step.hex"
    >
      <div class="theme-palette-swatch" :style="{ background: step.hex }"></div>
      <div class="theme-palette-label">{{ step.key }}</div>
      <div class="theme-palette-hex">{{ step.hex }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** One ETX theme object (e.g. etx.Events) */
  data:       { type: Object, required: true },
  primitives: { type: Object, required: true },
  /** 'light' | 'dark' */
  mode:       { type: String, default: 'light' },
})

const SCALE = ['lowest', 'lower', 'low', 'primary', 'high', 'higher', 'highest']

function resolveAlias(value) {
  if (!value || typeof value !== 'string') return value
  let current = value
  for (let i = 0; i < 4; i++) {
    if (!/^\{[^}]+\}$/.test(current)) return current
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

const scaleSteps = computed(() => {
  return SCALE.map(key => {
    const token = props.data[key]
    if (!token) return null
    const alias = props.mode === 'dark'
      ? (token['$extensions']?.modes?.dark ?? token['$value'])
      : token['$value']
    return { key, alias, hex: resolveAlias(alias) }
  }).filter(Boolean)
})
</script>
