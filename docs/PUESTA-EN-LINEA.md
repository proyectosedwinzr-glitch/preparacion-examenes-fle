# Puesta en línea de Tremplin FLE

Guía paso a paso. Las etapas A a D se hacen una sola vez. Lo que requiere tu cuenta personal (crear proyectos, claves, pagos) solo lo puedes hacer tú; todo lo demás ya está preparado en el repositorio.

## Estado actual

| Pieza | Estado |
| --- | --- |
| Aplicación (alumno, profesor, vínculo, progreso, deberes, mensajes, test de nivel, revisiones, exámenes simulados) | Lista y probada en navegador (modo demostración, 45 comprobaciones) |
| Base de datos y reglas de seguridad | Lista y probada: 62 escenarios en PostgreSQL 16 (`supabase/tests/run.sh`) |
| Acceso de pago con códigos de activación | Listo y probado en la base de datos |
| Función de IA (corrección escrita y oral, tutor, plan) | Escrita, **no probada** con una clave real |
| Pago en línea automático | **No conectado**: falta elegir proveedor (etapa F) |
| Aplicación instalable y sin conexión (PWA) | Lista |
| Verificaciones automáticas y publicación de la demo en GitHub | Listas |

## A. Demo pública gratuita (GitHub Pages)

Ya está activa en `https://proyectosedwinzr-glitch.github.io/preparacion-examenes-fle/`. Cada fusión en `main` la actualiza sola. En el móvil, el navegador ofrece «Añadir a la pantalla de inicio».

## B. Base de datos y cuentas (Supabase), 20 minutos

1. Crea una cuenta en [supabase.com](https://supabase.com) y un proyecto nuevo (región: São Paulo, la más cercana a Colombia). El plan gratuito basta para empezar.
2. **SQL Editor → New query**: pega todo el contenido de `supabase/migrations/001_init.sql` y pulsa **Run**. Repite con `supabase/migrations/002_acces_codes_plan.sql`, en ese orden.
3. **Authentication → URL Configuration**: en *Site URL* pon la dirección de la demo (o tu dominio) y añádela también en *Redirect URLs*.
4. **Authentication → Email Templates → Magic Link**: traduce el asunto y el texto del correo al francés (por ejemplo: «Votre lien de connexion à Tremplin FLE»).
5. **Project Settings → API**: copia la *Project URL* y la clave *anon public*.
6. En GitHub: **Settings → Secrets and variables → Actions → Variables**, crea `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con esos valores. En la siguiente publicación, el sitio deja el modo demostración y usa cuentas reales.

Notas:
- El envío de correos incluido en Supabase está muy limitado (pensado para pruebas). Antes de abrir al público, configura un SMTP propio en **Authentication → SMTP Settings** (Resend, Brevo, etc.).
- El enlace de conexión debe abrirse en el mismo navegador donde se pidió (seguridad PKCE). La página de conexión ya lo explica.
- El tiempo real (los cambios del alumno aparecen solos en la pantalla del profesor y al revés) queda activado por la migración 002.

## C. Inteligencia artificial (Anthropic), 15 minutos

1. Crea una cuenta en [console.anthropic.com](https://console.anthropic.com), añade un medio de pago y genera una clave de API. Fija un **límite de gasto mensual** en la consola.
2. Instala la herramienta de Supabase en tu ordenador y despliega la función:

   ```bash
   npx supabase login
   ```

   ```bash
   npx supabase link --project-ref TU_REFERENCIA_DE_PROYECTO
   ```

   ```bash
   npx supabase secrets set ANTHROPIC_API_KEY=tu_clave
   ```

   ```bash
   npx supabase functions deploy ia
   ```

3. Opcional: `IA_MODELE` (modelo usado) e `IA_QUOTA_MENSUEL` (consultas de IA por alumno al mes, 60 por defecto), con el mismo comando `secrets set`.

Sin IA, la aplicación sigue funcionando: el plan de mejora se calcula a partir de los resultados, el tutor responde con las fichas y las correcciones muestran un retorno simplificado.

### Coste estimado de la IA

Estimación aproximada con las tarifas publicadas por Anthropic (octubre de 2026), suponiendo unos 2 500 tokens (unidades de texto) de entrada y 4 000 de salida por corrección. Mídelo en la consola durante la prueba piloto.

| Modelo | Coste por corrección | Alumno que agota 60 consultas al mes |
| --- | --- | --- |
| Claude Opus 5.5 (configurado por defecto, el más preciso) | ≈ 0,09 USD | ≈ 5,40 USD |
| Claude Sonnet 5.5 | ≈ 0,045 USD | ≈ 2,70 USD |
| Claude Haiku 5.5 | ≈ 0,002 USD | ≈ 0,15 USD |

La mayoría de los alumnos no agotarán la cuota. Para un precio bajo, una opción razonable es Sonnet 5.5, o Opus 5.5 con una cuota menor (por ejemplo 30). Compara antes la calidad con 10 o 20 redacciones reales.

## D. Vender el acceso con códigos de activación (sin proveedor de pago)

Es la forma más sencilla de empezar a cobrar desde Colombia: cobras por el medio que prefieras (transferencia, Nequi, Daviplata, una plataforma de venta) y entregas un código.

1. En Supabase, **SQL Editor**, genera los códigos:

   ```sql
   select * from generer_codes(20, 30, 'piloto-noviembre');
   ```

   Crea 20 códigos de 30 días. Otros ejemplos: `generer_codes(5, 365, 'profesores', 'professeur')` crea 5 códigos de un año solo para profesores; un quinto argumento fija la caducidad del código (en días).
2. Cada código (formato `TR-XXXXX-XXXXX`) sirve una sola vez. El alumno o el profesor lo escribe en **Mon compte → Activer le code**; los días se suman al final de su acceso actual.
3. Para ver qué códigos se han usado:

   ```sql
   select code, jours, lot, utilise_le from codes_activation order by cree_le desc;
   ```

## E. Dominio propio (opcional)

Compra un dominio (por ejemplo `tremplin-fle.com`) y apúntalo a GitHub Pages (**Settings → Pages → Custom domain**). Actualiza después la *Site URL* de Supabase.

## F. Pago en línea automático (más adelante)

Condición del modelo: cada alumno y cada profesor paga su propio acceso, sin comisión sobre las clases. La base de datos ya tiene la tabla `paiements` y la función `fixer_acces`: solo falta una pequeña función de servidor que reciba el aviso (*webhook*) del proveedor elegido y llame a `fixer_acces` con la fecha de fin del periodo pagado.

| Opción | Ventajas | Puntos que verificar |
| --- | --- | --- |
| **Lemon Squeezy** (vende por ti y gestiona impuestos internacionales) | Cobra en todo el mundo; su lista oficial de pagos bancarios incluye Colombia ([lista de países](https://docs.lemonsqueezy.com/help/getting-started/supported-countries)) | Comisión del orden de 5 % + 0,50 USD por venta según terceros ([fuente](https://dodopayments.com/blogs/lemonsqueezy-review)); verificar condiciones actuales |
| **Paddle** (vende por ti) | Acepta pagos de clientes en pesos colombianos ([países](https://developer.paddle.com/concepts/sell/supported-countries-locales)) | El peso colombiano no sirve como moneda de pago al vendedor ([cambio 2023](https://developer.paddle.com/changelog/2023/colombian-peso-cop-supported-currency.md)); confirmar con su soporte |
| **Mercado Pago** (suscripciones, `/preapproval`) | Muy conocido en Latinoamérica, medios de pago locales | Gestión de impuestos a tu cargo; menos práctico para alumnos de fuera de la región |
| **Stripe** | Referencia técnica | No disponible para empresas colombianas según varias fuentes ([Global66](https://global66.com/blog/stripe-colombia/)) |

Recomendación: empezar con los **códigos de activación** (etapa D) durante el piloto y conectar un proveedor cuando el volumen lo justifique. No es asesoría fiscal: consulta a un contador por la facturación en Colombia.

## G. Antes de abrir al público

- [ ] Revisión pedagógica completa (cuaderno de revisión).
- [ ] Prueba de la IA con 10 a 20 redacciones e intervenciones orales reales, comparada con tu propia corrección.
- [ ] Audios reales para la comprensión oral (ver README, sección «Audios»).
- [ ] SMTP propio para los correos de conexión.
- [ ] Completar los datos entre corchetes de la página **Conditions et confidentialité** (`src/pages/Legal.tsx`): editor, contacto, alojamiento. Hacerla revisar por un profesional.
- [ ] Prueba piloto con 3 a 5 parejas profesor-alumno.
