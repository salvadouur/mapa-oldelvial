# Duplicar Norte — Auca Mahuida · Allen

Sitio de archivo audiovisual de obra montado sobre un mapa: la traza del ducto va de
**EB Auca Mahuida** (Neuquén) a **EB Allen** (Río Negro), y a lo largo del recorrido se
anclan publicaciones. Debajo del mapa, un carrusel tipo Netflix; y una serie de videos
de ~1 minuto que se consumen encadenados, tipo Shorts.

Todo se administra desde un backoffice propio en `/admin`.

---

## Arrancar

```bash
npm install
npm run dev
```

Abre en <http://localhost:3000>. **Sin configurar nada** el sitio ya se ve completo: usa el
contenido de demostración de `src/lib/content/seed.ts`. Eso permite maquetar, mostrar y
revisar sin depender de la infraestructura.

Para cargar contenido real hace falta Supabase (ver abajo).

---

## Cómo está armado

| Pieza | Qué se usa | Notas |
| --- | --- | --- |
| Framework | Next.js 16, App Router | Server Components + Server Actions |
| Estilos | Tailwind CSS 4 | Tokens de color y tipografía en `src/app/globals.css` |
| Mapa | MapLibre GL 6 | Teselas raster de Esri, sin API key |
| Datos | Supabase (Postgres + Auth + Storage) | Con caída automática al seed |
| Video | Vimeo | Embebido diferido; el SDK solo se carga en la serie |

### Rutas

- `/` — mapa con la traza, las 7 estaciones de bombeo y los especiales, más el cajón del
  carrusel.
- `/contenido/[slug]` — ficha de un especial, armada con bloques.
- `/serie` y `/serie/[slug]` — playlist de scroll infinito de los simples.
- `/admin` — backoffice.

### Los dos tipos de contenido

Toda la app se organiza alrededor de esta distinción, definida en `src/lib/types.ts` y en
el enum `content_type` de la base:

- **Especiales** (`especial`) — georreferenciados sobre la traza, en el punto donde pasó lo
  que muestran (no necesariamente una estación de bombeo). En el mapa se marcan con un
  radar y abren ficha propia, armada con bloques: video, texto, galería, modelo 3D de
  Sketchfab, infografía, cifras y pasos. **No aparecen en el carrusel.**
- **Simples** (`simple`) — videos de ~1 minuto. **No van al mapa.** Viven en el carrusel de
  la home y en `/serie`, que es una playlist de scroll infinito: un video por pantalla, el
  siguiente arranca solo al terminar, y al costado van los contenidos sugeridos.

Los sugeridos son el puente entre los dos tipos: además de otros simples, se ofrece el
especial más afín, para saltar del video de un minuto a la ficha completa de esa etapa. El
criterio de afinidad vive entero en `src/lib/content/sugerencias.ts`.

---

## La traza

Las coordenadas que hay hoy en `src/data/traza.ts` son **aproximadas**: siguen el corredor
real pero no vienen del trazado oficial. Lo mismo vale para las posiciones de las 7
estaciones de bombeo (Auca Mahuida, Cerro Bayo, Crucero Catriel, Medanito, La Escondida,
Lago Pellegrini, Allen).

Cuando esté el KMZ oficial:

```bash
npm run traza -- ruta/al/trazado.kmz
```

El script escribe `public/data/traza.geojson`, y desde ese momento el mapa lo usa en lugar
de la aproximación — sin tocar código. Además lista los `Placemark` de tipo `Point` que
encuentre, con nombre y coordenadas, para corregir `ESTACIONES` en `src/data/traza.ts`.

Acepta también `.kml`, y simplifica la geometría (Douglas–Peucker) para que el archivo no
pese de más: `--tolerancia 0.0005` afloja la simplificación, `--tolerancia 0` la desactiva.

### Límites del mapa

`ARGENTINA_BOUNDS` en `src/data/traza.ts` impide que el mapa se salga del país, y
`ZOOM_MIN` / `ZOOM_MAX` acotan el zoom. Hay dos capas base intercambiables desde el propio
mapa —satélite y trazado oscuro—, ambas con un velo azul que les da la identidad del
sitio; se definen en `src/components/map/mapStyle.ts`.

> Las teselas son de Esri y no requieren API key, pero sí atribución (ya está puesta). Si
> el tráfico crece o hace falta más definición, el reemplazo natural es MapTiler o Mapbox
> con token: solo cambia `mapStyle.ts`.

---

## Supabase

> Los pasos concretos, con los valores de este proyecto, están en
> [`supabase/INSTALAR.md`](supabase/INSTALAR.md). Lo que sigue es el detalle de cada pieza.

### 1. Crear el proyecto

En <https://supabase.com> → **New project**. De **Settings → API** salen la URL y la
`anon key`.

> **Que sea un proyecto propio, no uno compartido.** Los usuarios de Supabase Auth son de
> todo el proyecto: si el backoffice comparte proyecto con otra aplicación, cualquier
> usuario de esa otra aplicación puede escribir contenido acá, porque las políticas dan
> permiso de escritura a `authenticated`. Si por algún motivo hay que compartir proyecto,
> antes hay que atar las políticas de escritura a una tabla de administradores habilitados.
>
> Ojo con el plan: una organización **Free** admite 2 proyectos sin cargo, pero en una
> organización **Pro** cada proyecto extra tiene costo mensual. Conviene verificarlo en
> **Organization → Billing** antes de crear.

### 2. Correr las migraciones

En el **SQL Editor**, en este orden:

1. `supabase/migrations/0001_init.sql` — tablas, índices, RLS y el bucket `media`.
2. `supabase/seed.sql` — crea las tres filas del carrusel.

El esquema deja la lectura pública limitada a lo publicado: un borrador no sale del
backoffice ni aunque alguien adivine el slug.

### 3. Configurar el entorno

```bash
cp .env.example .env.local
```

Completar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`, y reiniciar el
servidor.

### 4. Crear el usuario del backoffice

**Authentication → Users → Add user**, con email y contraseña. No hay registro abierto:
las altas se hacen a mano, a propósito.

---

## Backoffice

`/admin`. Qué se puede hacer:

- **Contenidos** — listado con publicar/despublicar en un clic, separado entre especiales y
  simples.
- **Editor** — identidad, ficha, video principal, georreferencia y bloques. El punto se
  elige apretando una estación de bombeo, haciendo clic en cualquier lugar del mapa o
  pegando coordenadas: un especial puede ir donde sea, no solo sobre una EB.
- **Bloques** — se agregan, reordenan y borran. El orden es el orden de lectura, salvo que
  la ficha empiece con video + texto: esos dos se muestran apareados.
- **Carrusel** — qué filas hay, en qué orden y qué contenido va en cada una. Muestra solo
  simples; si se agrega un especial a una fila, no se va a ver. La primera fila es la que
  queda visible con el cajón contraído.
- **Imágenes** — se suben desde el navegador directo al bucket `media`. Con Vimeo casi no
  hacen falta: la portada y la duración salen del video (ver abajo).

Detalle de seguridad, en tres capas: el guard de `src/proxy.ts` filtra la navegación; cada
Server Action verifica sesión **y habilitación** por su cuenta, porque las actions son
endpoints POST alcanzables sin pasar por el proxy; y las políticas de RLS rechazan la
escritura en la base aunque alguien se saltee las dos primeras.

La habilitación importa: Supabase Auth acepta altas con la clave pública, así que estar
autenticado no puede ser suficiente para escribir. Quién administra el sitio se define a
mano en la tabla `backoffice_admins` — ver [`supabase/INSTALAR.md`](supabase/INSTALAR.md).

---

## Videos

El campo `vimeoId` admite dos formas:

- `123456789` — video público.
- `123456789/a1b2c3` — video **no listado**, con hash de privacidad. Es la forma
  recomendada para material de obra: se ve embebido en el sitio pero no aparece en las
  búsquedas de Vimeo.

Los simples deberían durar cerca de un minuto, y conviene cargarlos en Vimeo con el mismo
criterio de recorte para que el encadenado se sienta parejo.

**Portadas y duraciones se resuelven solas.** `src/lib/vimeo-server.ts` consulta oEmbed —que
funciona con videos no listados si se pasa el hash— y completa la miniatura y la duración de
cualquier contenido que tenga `vimeoId` y no los tenga cargados. Se cachea 24 h. Lo que se
suba a mano desde el backoffice siempre gana.

Un detalle a tener en cuenta: si los videos traen placa de título quemada en el primer
frame, esa placa va a ser la portada. Para las fichas conviene subir una imagen propia.

---

## Notas de implementación

**El worker de MapLibre.** MapLibre 6 arma la URL de su worker a partir de
`import.meta.url` del bundle principal. Con Turbopack ese bundle vive en
`/_next/static/chunks/`, donde el worker nunca se emite: la URL derivada da 404, el worker
muere sin emitir ningún evento de error y las fuentes GeoJSON quedan cargando para siempre
—mientras las capas raster siguen andando, lo que vuelve el síntoma muy confuso: se ve el
satélite pero no la traza. `scripts/copy-maplibre-worker.mjs` copia el worker a
`public/maplibre/` en el `postinstall`, y `src/components/map/setup.ts` lo apunta con
`setWorkerUrl()`.

**Rótulos como marcadores HTML.** Las estaciones y los puntos de contenido son marcadores
DOM, no `symbol layers`. Así el estilo del mapa no necesita servidor de glifos, y los
rótulos usan la misma tipografía y el mismo tracking que el resto del sitio.

**La home no scrollea.** El mapa se queda con la rueda del mouse para el zoom, y el
catálogo vive en un cajón con scroll propio. Ninguno de los dos gestos le roba el scroll al
otro. El alto del cajón contraído está en `src/components/rail/medidas.ts` y lo comparten
el cajón y el encuadre del mapa.

**Los controles del mapa van todos arriba.** El cajón puede ocupar hasta el 80% de la
pantalla, así que cualquier control apoyado abajo queda inalcanzable. Por eso el zoom está
arriba a la izquierda, y el selector de capa con las referencias arriba a la derecha. La
atribución de las teselas la rendereamos nosotros dentro del panel de referencias, en vez
de usar el control de MapLibre, que también vive abajo: Esri exige que el crédito se vea.

**El feed de la serie monta un solo reproductor.** Solo el slide activo tiene iframe de
Vimeo; el resto muestra la miniatura. Es lo que permite tener decenas de slides sin que la
página se arrastre. La playlist se cicla —al acercarse al final se agrega otra vuelta— con
un tope de 120 slides, que con 9 simples son 13 vueltas.

**Portadas generadas.** Un contenido sin imagen no muestra un rectángulo vacío: se dibuja
un fondo determinístico a partir del slug, con una trama de curvas de nivel. La grilla del
carrusel mantiene su ritmo y nada parece roto mientras se está armando una publicación.

---

## Deploy

Pensado para Vercel. Importar el repo, definir `NEXT_PUBLIC_SUPABASE_URL` y
`NEXT_PUBLIC_SUPABASE_ANON_KEY` en **Environment Variables**, y listo: el `postinstall` se
encarga del worker de MapLibre.
