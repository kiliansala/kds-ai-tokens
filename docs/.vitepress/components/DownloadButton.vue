<template>
  <div class="download-bar">
    <span class="download-bar-label">{{ filename }}</span>
    <a class="download-bar-btn" href="#" @click.prevent="download">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 12l-4.5-4.5 1.06-1.06L7 8.88V2h2v6.88l2.44-2.44 1.06 1.06L8 12z"/>
        <path d="M2 13h12v1.5H2z"/>
      </svg>
      Download
    </a>
  </div>
</template>

<script setup>
const props = defineProps({
  /** The parsed JSON object to download */
  data:     { type: Object, required: true },
  /** Suggested filename, e.g. "primitives.json" */
  filename: { type: String, required: true },
})

function download() {
  const blob = new Blob([JSON.stringify(props.data, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = props.filename
  a.click()
  URL.revokeObjectURL(url)
}
</script>
