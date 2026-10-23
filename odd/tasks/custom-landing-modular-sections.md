# Motor de Secciones Modulares para Landings Personalizadas y Skill de Creación B2B
Estandarización del sistema de landing personalizada con 6 secciones modulares configurables e interruptores ON/OFF desde el panel de administración, más la Skill formal de Tenddy para creación y personalización de clientes VIP.

## Specs
- S1: "quisiera que cada una de estas secciones sean configurables y que est3n en el panel solo de admin de la 5i3nda con pagina personalizada". En `AppearanceTab.tsx`, habilitar el editor modular de secciones exclusivamente cuando la tienda tiene autorizada la landing personalizada (`store_template === 'landing'`), agrupando en una sola experiencia los ajustes de Top Bar, Header, Hero con Telemetría, Pilares de Respaldo, Cotizador con Mapa y Footer.
- S2: "y que un check estas secciones se puedan desca5ivar 9 activar, es viable?". Cada una de las 6 secciones debe poseer un interruptor (switch/check) ON/OFF independiente. Cuando una sección está desactivada, se oculta por completo en el storefront público; cuando está activa, se renderizan sus datos personalizados con fallbacks seguros.
- S3: El endpoint `/api/admin/appearance` debe validar, sanitizar y persistir la estructura de `sections` dentro de `landing_config` en la base de datos Supabase/PostgreSQL.
- S4: "crear una skill con las ewcificaciones de las secciones asi cuando venga un nuevo cliente estas secciones se 3nganchan a la nueva ladibg pague y yo solo hago los esrilos del clwinte lanperzonalizacion de pagina al gusntobdel cliente". Crear la skill `.agents/skills/tenddy-custom-landing/SKILL.md` con los contratos de las 6 secciones, los esquemas de datos, la guía de estilos y el procedimiento paso a paso para desplegar nuevas landings VIP.

## Tasks
- [x] T1 (S1, S2): Definir los contratos de tipos `LandingSectionsConfig` y la función de normalización con valores por defecto seguros en `src/lib/types.ts`.
- [x] T2 (S3): Actualizar el endpoint `/api/admin/appearance` para procesar y persistir `sections` en `landing_config`.
- [x] T3 (S1, S2): Construir el Editor de Secciones en `src/components/AppearanceTab.tsx` con interruptores ON/OFF y acordeones por sección.
- [x] T4 (S2): Integrar el renderizado condicional respetando los toggles y datos en `src/components/TenantLandingView.tsx` y `apps/landing-ayme-pet/src/app/page.tsx`.
- [x] T5: Crear suite de pruebas automatizadas en `tests/custom-landing-sections.test.js` y verificar compilación limpia.
- [x] T6 (S4): Crear y registrar la skill `.agents/skills/tenddy-custom-landing/SKILL.md` con la guía de arquitectura y personalización.

## Evidencia de Verificación
- **Contratos y Datos**: Tipos `LandingSectionsConfig`, `LandingTopBarSection`, `LandingHeaderSection`, `LandingHeroSection`, `LandingPillarsSection`, `LandingRfqMapSection`, `LandingFooterSection` y funciones `getDefaultLandingSections` y `resolveLandingSections` en `src/lib/types.ts`.
- **Persistencia en Supabase**: Endpoint `PATCH /api/admin/appearance` sanitiza y persiste `landing_config.sections` con revalidación de caché en Next.js.
- **Editor en Panel Admin**: `AppearanceTab.tsx` implementa el editor de 6 bloques por secciones exclusivamente para tiendas con plantilla `landing`, con interruptores ON/OFF atómicos y acordeones de edición.
- **Renderizado Reactivo**: `TenantLandingView.tsx` y `apps/landing-ayme-pet/src/app/page.tsx` renderizan condicionalmente protegiendo cada bloque con su interruptor correspondiente y fallbacks automáticos.
- **Skill B2B Formal**: `.agents/skills/tenddy-custom-landing/SKILL.md` documentada con activation contract, filosofía de motor vs estilos, contratos de secciones y procedimiento para clientes VIP.
- **Tests Automatizados**: 100% de tests en `tests/custom-landing-sections.test.js`, suite móvil y suite de colores ejecutadas con éxito. Compilación TypeScript limpia sin errores en monorepo (`npx tsc --noEmit`).

## Log
- L1: Solicitud del usuario: "ok quisiera que cada una de estas secciones sean configurables y que est3n en el panel solo de admin de la 5i3nda con pagina personalizada asi que si hay configuraxiones de perwonalizaciin quiero qi2 hagamos todo una sola, dicidida en estas seciicon y que un check estas secciones se puedan desca5ivar 9 activar, es viable?".
- L2: Aprobación para avanzar con ambos frentes: "si dsle con los dos uno por uno".
- L3: Aprobación explícita para commit y push: "si dale".
