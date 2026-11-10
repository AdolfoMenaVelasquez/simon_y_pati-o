# Casa de Simón I. Patiño — Uncía

Sitio web con recorrido 3D construido con **Three.js puro** (sin frameworks
ni paso de compilación): tres páginas HTML, una hoja de estilos y unos
pocos archivos JavaScript.

```
index.html          → Inicio: modelo 3D del exterior, cámara libre
historia.html        → Historia de la casa y del pueblo de Uncía
interior.html        → Recorrido interior en primera persona + puntos de interés
style.css             → Todo el diseño visual del sitio
js/exterior-scene.js  → Lógica 3D de la página de inicio
js/interior-scene.js  → Lógica 3D del recorrido interior
js/hotspots-data.js   → Lista editable de los puntos de interés del interior
js/nav.js             → Menú móvil
models/                → Aquí van tus archivos casa-exterior.glb y casa-interior.glb
```

## 1. Cómo verlo en tu computadora

Los navegadores no permiten cargar módulos JavaScript ni archivos .glb
directamente desde `file://`, así que necesitas un servidor local muy
simple. Abre una terminal dentro de la carpeta del proyecto y ejecuta
**una** de estas opciones:

```bash
# Opción A — si tienes Python instalado
python3 -m http.server 8000

# Opción B — si tienes Node.js instalado
npx serve .
```

Luego abre `http://localhost:8000` (o el puerto que te indique) en tu
navegador.

## 2. Cómo agregar tus modelos 3D reales

1. Exporta tus dos modelos como `.glb`.
2. Cámbiales el nombre exactamente a `casa-exterior.glb` y
   `casa-interior.glb`.
3. Colócalos dentro de la carpeta `models/`.
4. Recarga la página — el aviso de "modelo de reemplazo" desaparecerá
   solo.

Mientras no agregues los archivos, el sitio sigue funcionando con una
casa y una habitación de prueba, para que puedas revisar la navegación
y el diseño desde ya.

## 3. Cómo editar los puntos de interés del interior

Abre `js/hotspots-data.js`. Cada punto de interés es un objeto con:

- `position`: coordenadas x, y, z dentro de tu modelo (en metros).
- `label`: texto corto que aparece junto al punto.
- `title` y `description`: lo que se muestra en el panel al hacer click.

Para encontrar la posición correcta dentro de tu modelo real: entra al
recorrido y camina hasta el lugar exacto donde quieres el punto. En la
esquina superior derecha verás un pequeño texto tipo
`x: 1.40 · y: 1.65 · z: -2.00` que se actualiza mientras te mueves —
copia esos números al campo `position` del punto de interés
correspondiente en `js/hotspots-data.js` (usa la altura `y` que ya trae
cada ejemplo, o ajústala si quieres que el punto flote más alto o más
bajo). Ese texto es solo una ayuda de calibración; una vez que tengas
todos los puntos bien ubicados puedes borrarlo quitando la línea
`<div class="coord-debug" ...>` de `interior.html`.

## 4. Cómo editar el texto de "Historia"

El texto de `historia.html` es un borrador redactado a partir de
fuentes públicas generales sobre Simón I. Patiño y Uncía. Revísalo,
corrígelo y complétalo con la historia verificada de la casa antes de
publicar el sitio — hay una nota en cursiva al final de la página que
puedes borrar una vez que el texto esté validado.

## 5. Subirlo a GitHub

Todo el proyecto es una sola carpeta autocontenida (HTML, CSS, JS y tus
modelos), así que se sube tal cual a un repositorio:

```bash
cd casa-patino
git init
git add .
git commit -m "Sitio de la Casa Patiño"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
git push -u origin main
```

**Importante sobre el tamaño de los modelos:** GitHub rechaza cualquier
archivo individual de más de 100 MB, y ya avisa con una advertencia
desde los 50 MB. Antes de subir el proyecto, asegúrate de que tus
archivos `.glb` ya estén comprimidos (ver la sección "Cómo reducir el
peso de tus modelos" más abajo) y queden bien por debajo de 100 MB —
además de que un archivo tan pesado también hace que tu sitio cargue
muy lento para quien lo visite. Si por alguna razón necesitas
mantenerlos pesados, GitHub ofrece Git LFS para archivos grandes, pero
lo ideal es comprimir primero.

## 6. Publicarlo en internet

Como es un sitio 100% estático (HTML, CSS y JS), puedes subirlo tal
cual a cualquiera de estas opciones gratuitas:

- **GitHub Pages**: sube la carpeta a un repositorio y activa Pages.
- **Netlify** o **Vercel**: arrastra la carpeta a su panel y listo.
- Cualquier hosting compartido tradicional (subir por FTP).

Solo asegúrate de subir también la carpeta `models/` con tus archivos
`.glb` reales.

## 7. Limitaciones actuales y posibles mejoras

- La colisión al caminar es básica (un rayo hacia cada dirección de
  movimiento); funciona bien para paredes y muebles simples, pero un
  modelo con geometría muy irregular puede necesitar ajustes.
- El ajuste automático al piso permite subir escalones suaves, pero no
  está pensado para varios pisos conectados por una escalera real
  (subir de nivel) — si tu casa tiene más de una planta, avísame para
  adaptar el control de altura.
- En celulares se usa un modo simplificado (arrastrar para mirar +
  botones para caminar) en vez del control por mouse. Si quieres una
  versión con joystick virtual más pulida, se puede mejorar.
- Los modelos se cargan sin compresión Draco. Si tus archivos `.glb`
  son muy pesados, puedo agregar el decodificador Draco para que
  carguen más rápido.

Cualquiera de estos puntos lo puedo ajustar — solo dime qué necesitas
primero.
