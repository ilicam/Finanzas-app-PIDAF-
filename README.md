# FinanzasApp · PIDAF — guía para instalarla en tu celular

Esta carpeta es tu app completa, lista para publicar gratis y usar como si
fuera una app nativa (ícono en tu pantalla de inicio, funciona sin barra del
navegador). Sigue estos pasos en orden.

---

## 1. Crear tu base de datos gratis (Firebase)

1. Entra a **https://console.firebase.google.com** con tu cuenta de Google.
2. **Crear proyecto** → ponle un nombre, ej. "finanzasapp-pidaf" → puedes
   desactivar Google Analytics (no lo necesitas) → Crear.
3. En el menú izquierdo, **Compilación → Authentication** → pestaña
   "Sign-in method" → habilita **Anónimo**. (Esto identifica tu instalación
   sin pedirte crear cuenta ni contraseña).
4. **Compilación → Firestore Database** → Crear base de datos → elige
   **modo producción** → selecciona la región más cercana (ej.
   `southamerica-east1`) → Habilitar.
5. Dentro de Firestore, ve a la pestaña **Reglas** y reemplaza todo por esto:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /finanzas/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```

   Esto asegura que **solo tú** puedas leer o escribir tus propios datos.
   Publica los cambios.

6. Ve a **Configuración del proyecto** (ícono ⚙️ arriba a la izquierda) →
   baja hasta "Tus apps" → clic en el ícono **</>** (Web) → dale un apodo →
   Registrar app. Firebase te mostrará un bloque de código con valores como
   `apiKey`, `authDomain`, etc.

7. Abre el archivo `src/firebase.js` de esta carpeta y **reemplaza** los
   valores de ejemplo (`TU_API_KEY`, `TU_PROYECTO`, etc.) con los tuyos.

---

## 2. Instalar y compilar el proyecto en tu computadora

Necesitas tener [Node.js](https://nodejs.org) instalado (versión 18 o
mayor). Luego, en una terminal dentro de esta carpeta:

```bash
npm install
npm run build
```

Esto genera una carpeta `dist/` con tu app ya lista para publicar.

Si quieres probarla primero en tu propia computadora antes de publicarla:

```bash
npm run dev
```

y abre la dirección que te muestre (normalmente `http://localhost:5173`).

---

## 3. Publicarla gratis en internet

**Opción recomendada: Vercel**

1. Crea una cuenta gratis en **https://vercel.com** (puedes entrar con
   GitHub o con tu correo).
2. Sube esta carpeta a un repositorio de GitHub, o usa el botón "Add New
   → Project" y arrastra la carpeta directamente.
3. Vercel detecta que es un proyecto Vite automáticamente. Dale "Deploy".
4. En 1–2 minutos te da un link como `https://finanzasapp-pidaf.vercel.app`.

**Alternativa: Netlify** — entra a **https://app.netlify.com/drop** y
arrastra la carpeta `dist/` (la que generó `npm run build`) directamente
en la página. Te da un link al instante.

---

## 4. Instalarla en tu celular

1. Abre el link que te dio Vercel o Netlify **desde Chrome en tu celular**.
2. Toca el menú ⋮ (arriba a la derecha) → **"Agregar a pantalla de
   inicio"** o **"Instalar app"**.
3. Listo — te queda un ícono dorado con "%" en tu pantalla de inicio, y al
   abrirlo se ve a pantalla completa, sin la barra del navegador.

Tus datos ahora se guardan en Firestore (la nube de Google) en vez del
guardado temporal del chat, así que persisten aunque cambies de celular o
borres el caché — simplemente vuelve a abrir la app y espera unos segundos
a que cargue.

---

## Sobre venderla más adelante

Esta versión web (PWA) es perfecta para uso personal y para probarla a
fondo. Si más adelante quieres publicarla en Google Play o App Store para
venderla, el siguiente paso es convertir este mismo código a **React
Native / Expo** — puedo ayudarte con eso cuando llegue el momento; la
lógica y el diseño que ya tienes se reutilizan casi tal cual.
