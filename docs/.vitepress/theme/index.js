import DefaultTheme from 'vitepress/theme'
import TokenTable from '../components/TokenTable.vue'
import ThemePalette from '../components/ThemePalette.vue'
import DownloadButton from '../components/DownloadButton.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('TokenTable', TokenTable)
    app.component('ThemePalette', ThemePalette)
    app.component('DownloadButton', DownloadButton)
  }
}
