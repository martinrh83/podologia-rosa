# Manual de deploy

Procedimiento real de este proyecto. Todos los comandos de acá se corrieron y
funcionan; si alguno deja de andar, corregilo acá antes de seguir.

---

## El mapa

| | |
|---|---|
| Repo | `martinrh83/podologia-rosa` |
| Sitio público | https://podologia-mitre-salta.vercel.app |
| Supabase **producción** | ref `apsprxafxqvrmfbgxmtv` · São Paulo |
| Supabase **staging** | ref `tdtaxrfcjzgkioekrpqc` · São Paulo |
| Supabase local | `npx supabase start` |

### El default es staging, a propósito

El proyecto linkeado —al que le pega `db push` **sin flags**— es **staging**.
Producción hay que nombrarla:

```bash
npx supabase db push                                        # staging
npx supabase db push --linked --project-ref apsprxafxqvrmfbgxmtv   # producción
```

El camino corto es el seguro. El comando que corrés distraído toca staging.

Para consultar, `db query` necesita `--linked` junto con `--project-ref`:

```bash
echo "select 1;" | npx supabase db query --linked --project-ref apsprxafxqvrmfbgxmtv
```

---

## Flujo normal

```
rama → PR → CI en verde → merge a main → Vercel deploya solo
                                       → las migraciones las corrés vos
```

⚠️ **Vercel deploya al mergear; las migraciones no.** Entre que Vercel levanta
el código nuevo (~1 min) y que vos corrés `db push`, el código nuevo corre
contra el esquema viejo.

Mientras eso siga así, la regla es: **si el PR trae una migración, pusheala a
producción apenas mergeás** — o, mejor, escribí el cambio con *expand and
contract* para que el orden no importe.

---

## Migraciones

```bash
# 1. crear el archivo (nunca inventar el nombre a mano)
npx supabase migration new descripcion_corta
#    renombrarlo a 00NN_descripcion_corta.sql para seguir la numeración

# 2. probar desde cero en local — esto BORRA la base local y la reconstruye
npx supabase db reset

# 3. mirar qué se aplicaría, sin aplicar
npx supabase db push --dry-run

# 4. staging
npx supabase db push

# 5. producción
npx supabase db push --linked --project-ref apsprxafxqvrmfbgxmtv

# ver qué está aplicado dónde
npx supabase migration list
```

### Reglas

- **Nunca editar una migración ya aplicada.** Si está mal, escribí la siguiente.
  Editarla hace que local (que la reaplica desde cero) y producción (que guarda
  el efecto de la versión vieja) dejen de ser lo mismo.
- **Nunca `supabase db reset --linked`.** Existe, apunta a la nube y te borra la
  base entera. A la nube se va con `db push`, siempre.
- **Nunca tocar el esquema desde el SQL Editor del dashboard.** Si `db push`
  deja de ser la única forma en que cambia el esquema, la carpeta de
  migraciones deja de describir la realidad.
- Una migración que **borra datos** tiene que poder distinguir el dato de
  ejemplo del real. Ver `0016`, que exige que coincidan nombre **y** precio.

---

## Verificar paridad entre ambientes

Lo que tiene que ser idéntico: esquema, policies, versión de Postgres. Lo que
no: los datos.

```bash
PROD=apsprxafxqvrmfbgxmtv
Q="select tablename||' · '||policyname||' · '||cmd as p from pg_policies where schemaname='public' order by 1;"

echo "$Q" | npx supabase db query --linked                      > /tmp/stg.txt
echo "$Q" | npx supabase db query --linked --project-ref $PROD   > /tmp/prod.txt
diff /tmp/stg.txt /tmp/prod.txt
```

Sin salida = sin drift.

---

## Advisors

Correlos **después de cada `db push` a producción**. Hay hallazgos que sólo
aparecen contra la nube — el lint de funciones expuestas no corre en local.

```bash
npx supabase db advisors --linked --type security
npx supabase db advisors --linked --type performance
npx supabase db advisors --local  --type security
```

Hallazgos aceptados a conciencia, que no son bugs:

- `rls_auto_enable()` × 2 — la crea la opción "automatic RLS" del dashboard y no
  se puede invocar: Postgres rechaza toda llamada a una función que devuelve
  `event_trigger`.
- `is_staff()` para `authenticated` — devuelve un booleano sobre quien llama.
  Mudarla a un schema no expuesto obligaría a reescribir las 24 policies.

---

## Configuración de Supabase

⚠️ **`config push` empuja TODO el diff.** No tiene forma de subir una sola
opción. Mirá siempre el diff primero.

```bash
npx supabase config diff
SUPABASE_AUTH_SITE_URL=https://podologia-mitre-salta.vercel.app npx supabase config push
```

Si una variable de `env()` **no está definida**, el CLI no falla: manda el
string literal `env(NOMBRE)` como valor. El diff lo muestra; el push no
pregunta. Por eso existe `supabase/.env` (copiá `supabase/.env.example`).

---

## Vercel

### Variables

Las cinco van **sólo en Production**. Ver `.env.production.example`.

Darle las de Supabase a Preview hace que un PR escriba en la base real.

### Después de un deploy

```bash
U=https://podologia-mitre-salta.vercel.app
curl -s -o /dev/null -w "%{http_code}\n" $U/turnos              # 200
curl -s -o /dev/null -w "%{http_code}\n" $U/no-existe           # 404
curl -s -o /dev/null -w "%{http_code}\n" $U/api/cron/retencion  # 401 sin secreto
curl -s -I $U/turnos/rosa | grep x-vercel-id                    # gru1::gru1
curl -s $U/sitemap.xml | head -5                                # el dominio correcto
```

- **`gru1::gru1`** — funciones en São Paulo, al lado de la base. Si dice
  `gru1::iad1`, se perdió `"regions": ["gru1"]` de `vercel.json` y la página de
  reserva pasa de ~0.5s a ~1.3s.
- **La URL del deployment** (la larga, con hash) tiene Vercel Authentication:
  todo redirige a `vercel.com/sso-api`. La pública es la corta.

### Rollback

*Deployments → el anterior → Instant Rollback.* Vuelve en segundos.

⚠️ **El rollback trae el código viejo, no el esquema viejo.** Si el deploy
incluía una migración, volver atrás deja código viejo contra esquema nuevo. Por
eso expand-and-contract: mientras el cambio sea compatible hacia atrás, el
rollback es seguro.

---

## Alta de un ambiente nuevo

Lo que `db push` **no** hace:

1. **No corre `supabase/seed.sql`** — es sólo local. No hay usuario del panel.
2. **No cierra el registro público.** Dashboard → *Authentication → Sign In /
   Providers → Email* → desactivar "Allow new users to sign up". Verificar:

   ```bash
   curl -s -X POST "https://<ref>.supabase.co/auth/v1/signup" \
     -H "apikey: <publishable>" -H 'Content-Type: application/json' \
     -d '{"email":"probe@example.com","password":"probe1234"}'
   # 422 signup_disabled
   ```

3. **No crea el usuario del panel.** Dashboard → *Authentication → Add user*,
   con **Auto Confirm**, y enlazarlo:

   ```bash
   # `0007` crea la fila como 'Secretaría'. En producción está renombrada a
   # 'admin', así que si apuntás allá, cambiá el nombre — o mejor, enlazá por
   # el id de la fila, que no depende de cómo se llame:
   #   ... where id = '<uuid de la fila de staff>'
   echo "update staff set auth_user_id = (select id from auth.users where email = '<el tuyo>') where full_name = 'Secretaría' returning full_name, auth_user_id;" \
     | npx supabase db query --linked
   ```

   Sin eso el login anda pero `requireStaff()` no lo reconoce.

4. **No carga el contenido.** Las migraciones dejan `clinic_settings` con
   placeholders. En orden, desde el panel: `/admin/consultorio` (es lo único que
   el paciente ve mientras el resto está vacío) → `/admin/sedes` →
   `/admin/profesionales` → `/admin/servicios`.

---

## Cosas que muerden

- **El plan free pausa el proyecto** tras una semana sin actividad. Desde que
  las páginas de catálogo se prerenderizan, eso no sólo rompe el sitio: **rompe
  el build**, porque consulta la base al compilar.
- **Los IDs de server action cambian entre builds.** Durante un deploy, una
  pestaña con el panel viejo pierde los botones de guardar hasta recargar.
- **`.next/types/` queda obsoleto** al borrar una ruta, y el type check falla
  por un archivo que ya no existe. Se arregla con `npx next typegen`.
- **`npx supabase login` necesita TTY.** No corre dentro de un agente; hacelo en
  una terminal de verdad.
