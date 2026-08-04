# Backoffice — estado y operación

El backoffice **ya está instalado**. Este documento sirve para dos cosas: saber cómo quedó
armado, y poder repetirlo en otro proyecto si alguna vez hace falta.

## Estado actual

| | |
| --- | --- |
| Organización | **OLDELVAL** (plan Free) |
| Proyecto | **duplicar-norte-web** · región São Paulo (`sa-east-1`) |
| URL | `https://otmyqxitrhnygwopfmyn.supabase.co` |
| Esquema | Aplicado — `contents`, `content_blocks`, `rails`, `rail_items`, `backoffice_admins` |
| Storage | Bucket público `media` |
| Contenido | 7 especiales, 9 simples, 23 bloques, 3 filas de carrusel |
| Credenciales | En `.env.production` (solo claves públicas) |

## Habilitar a alguien para administrar

Dos pasos, y el segundo es el que suele olvidarse.

**1. Crear el usuario.** En Supabase: **Authentication → Users → Add user → Create new
user**, con email y contraseña. Marcar **Auto Confirm User** para no tener que validar el
mail.

**2. Habilitarlo.** En el **SQL Editor**, reemplazando el mail:

```sql
insert into backoffice_admins (user_id, email)
select id, email from auth.users where email = 'alguien@tronadores.com'
on conflict (user_id) do nothing;
```

Sin el segundo paso, la persona entra al backoffice pero ve una pantalla que le avisa que
no está habilitada. Es a propósito: **estar autenticado no alcanza para escribir**.

### Por qué la lista existe

Supabase Auth acepta altas con la clave pública, que viaja al navegador. Si escribir
dependiera solo de estar autenticado, cualquiera podría registrarse y editar el sitio. Con
la lista, la habilitación es explícita y no depende de que la opción de registro abierto
siga desactivada en el panel.

Conviene además desactivarla: **Authentication → Sign In / Providers → Email**, y apagar
*Allow new users to sign up*. Con eso ni siquiera se pueden crear cuentas.

### Quitarle el acceso a alguien

```sql
delete from backoffice_admins where email = 'alguien@tronadores.com';
```

El usuario sigue existiendo y puede entrar, pero no puede modificar nada.

---

## Instalar desde cero en otro proyecto

1. **New project** en la organización que corresponda. Ojo con el plan: una organización
   Free admite 2 proyectos sin cargo; en una Pro, cada proyecto extra se cobra.
2. **SQL Editor** → correr `supabase/migrations/0001_init.sql`.
3. **SQL Editor** → correr `supabase/seed.sql` (crea las tres filas del carrusel).
4. Copiar **Project URL** y la **publishable key** de *Project Settings → API* a
   `.env.local` (ver `.env.example`), y reiniciar el servidor.
5. Crear y habilitar el usuario, como arriba.

Si el paso 2 termina con un warning sobre permisos de storage, el esquema quedó bien: solo
falta crear a mano el bucket `media` en **Storage → New bucket**, marcándolo público.

---

## Cómo se comporta el sitio

Mientras no haya contenido publicado en la base —o si faltan las variables de entorno— el
sitio público muestra el material de demostración de `src/lib/content/seed.ts`. En cuanto
hay contenido publicado, manda la base.

Las portadas y las duraciones no hace falta cargarlas: si un contenido tiene `vimeo_id`,
salen del propio video vía oEmbed y se cachean 24 h. Lo que se sube a mano siempre gana.
