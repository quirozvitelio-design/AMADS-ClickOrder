import './index.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import GoogleSignInPlugin from 'vue3-google-signin' // Importamos el plugin

const app = createApp(App)

// Configuración global de Google Cloud
app.use(GoogleSignInPlugin, {
  clientId: '130057316456-gmtiq84j2rrilvua4dbnkban9m2loum1.apps.googleusercontent.com',
})

app.use(router)
app.mount('#app')