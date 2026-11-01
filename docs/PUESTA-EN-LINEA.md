# Puesta en línea de Tremplin FLE

Guía paso a paso. Las etapas A a D se hacen una sola vez. Lo que requiere tu cuenta personal (crear proyectos, claves, pagos) solo lo puedes hacer tú; todo lo demás ya está preparado en el repositorio.

## Estado actual

| Pieza | Estado |
| --- | --- |
| Aplicación (interfaz, roles, vínculo, progreso, deberes, mensajes) | Lista y probada en navegador (modo demostración) |
| Base de datos y reglas de seguridad | Lista y probada: 27 escenarios en PostgreSQL 16 (`supabase/tests/run.sh`) |
| Función de IA (corrección, tutor, plan) | Escrita, **no probada** (requiere tu clave de Anthropic) |
| Pagos | **No integrados**: falta elegir proveedor (etapa E) |
| Verificaciones automáticas en GitHub | Listas (`.github/workflows/ci.yml`) |
| Publicación automática de la demo | Lista (`.github/workflows/pages.yml`) |

## A. Demo pública gratuita (GitHub Pages), 5 minutos

Sirve para enseñar la aplicación ya, sin servidor: los datos quedan en el navegador de cada visitante y la IA no está conectada.

1. Fusiona la rama `claude/nice-shannon-sj22xa` en `main` (pull request).
2. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Ve a la pestaña **Actions**: el flujo «Démo en ligne» publica el sitio. La dirección aparece al terminar, del tipo `https://proyectosedwinzr-glitch.github.io/preparacion-examenes-fle/`.

## B. Base de datos y cuentas (Supabase), 20 minutos

1. Crea una cuenta en [supabase.com](https://supabase.com) y un proyecto nuevo (región: São Paulo, la más cercana a Colombia). El plan gratuito basta para empezar.
2. **SQL Editor → New query**: pega todo el contenido de `supabase/migrations/001_init.sql` y pulsa **Run**.
3. **Authentication → URL Configuration**: en *Site URL* pon la dirección de la etapa A (o tu dominio) y añádela también en *Redirect URLs*.
4. **Authentication → Email Templates → Magic Link**: traduce el asunto y el texto del correo de conexión al francés (por ejemplo: «Votre lien de connexion à Tremplin FLE»).
5. **Project Settings → API**: copia la *Project URL* y la clave *anon public*.
6. En GitHub: **Settings → Secrets and variables → Actions → Variables**, crea `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con esos valores. En la siguiente publicación, el sitio deja el modo demostración y usa cuentas reales.

Nota: el envío de correos incluido en Supabase está muy limitado (pensado para pruebas). Antes de abrir al público, configura un servicio SMTP propio en **Authentication → SMTP Settings** (Resend, Brevo, etc.).

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

### Coste estimado de la IA

Estimación aproximada a partir de las tarifas publicadas por Anthropic (octubre de 2026), suponiendo unos 2 500 tokens (unidades de texto) de entrada y 4 000 de salida por corrección. El coste real depende de la longitud de los textos: mídelo en la consola durante la prueba piloto.

| Modelo | Coste por corrección | Alumno que agota 60 consultas al mes |
| --- | --- | --- |
| Claude Opus 5.5 (configurado por defecto, el más preciso) | ≈ 0,09 USD | ≈ 5,40 USD |
| Claude Sonnet 5.5 | ≈ 0,045 USD | ≈ 2,70 USD |
| Claude Haiku 5.5 | ≈ 0,002 USD | ≈ 0,15 USD |

La mayoría de los alumnos no agotarán la cuota. Para un precio bajo, una opción razonable es Sonnet 5.5 o Opus 5.5 con una cuota menor (por ejemplo 30). Antes de decidir, compara la calidad de corrección de cada modelo con 10 o 20 redacciones reales.

## D. Dominio propio (opcional)

Puedes comprar un dominio (por ejemplo `tremplin-fle.com`) y apuntarlo a GitHub Pages (**Settings → Pages → Custom domain**). Recuerda actualizar la *Site URL* de Supabase.

## E. Pagos: elección del proveedor

Condición del modelo: cada alumno y cada profesor paga su propio acceso, sin comisión sobre las clases. La base de datos ya está lista: solo falta que el proveedor de pagos actualice `abonnement` y `abonnement_fin` del perfil mediante un *webhook* (una pequeña función más).

| Opción | Ventajas | Puntos que verificar |
| --- | --- | --- |
| **Lemon Squeezy** (vende por ti y gestiona impuestos internacionales) | Cobra en todo el mundo; su lista oficial de pagos bancarios incluye Colombia ([lista de países](https://docs.lemonsqueezy.com/help/getting-started/supported-countries)) | Comisión del orden de 5 % + 0,50 USD por venta según terceros ([fuente](https://dodopayments.com/blogs/lemonsqueezy-review)); verificar condiciones actuales |
| **Paddle** (vende por ti) | Acepta pagos de clientes en pesos colombianos ([países](https://developer.paddle.com/concepts/sell/supported-countries-locales)) | El peso colombiano no sirve como moneda de pago al vendedor ([cambio 2023](https://developer.paddle.com/changelog/2023/colombian-peso-cop-supported-currency.md)); confirmar con su soporte la aceptación de vendedores en Colombia |
| **Mercado Pago** (suscripciones, `/preapproval`) | Muy conocido en Latinoamérica, medios de pago locales | Gestión de impuestos a tu cargo; menos práctico para alumnos de fuera de la región |
| **Stripe** | Referencia técnica | No disponible para empresas colombianas según varias fuentes ([Global66](https://global66.com/blog/stripe-colombia/)) |

Recomendación provisional: **Lemon Squeezy** si tus alumnos están en varios países; **Mercado Pago** si son sobre todo latinoamericanos. En ambos casos, confirma comisiones y condiciones en sus sitios oficiales antes de decidir. No es asesoría fiscal: consulta a un contador por la facturación en Colombia.

## F. Antes de abrir al público

- [ ] Revisión pedagógica completa (cuaderno de revisión).
- [ ] Prueba de la IA con 10 a 20 redacciones reales y comparación con tu propia corrección.
- [ ] Audios reales para la comprensión oral.
- [ ] SMTP propio para los correos de conexión.
- [ ] Páginas legales: condiciones de uso, política de privacidad (datos de alumnos, posiblemente menores), mención de no afiliación a los organismos certificadores.
- [ ] Prueba piloto con 3 a 5 parejas profesor-alumno.
