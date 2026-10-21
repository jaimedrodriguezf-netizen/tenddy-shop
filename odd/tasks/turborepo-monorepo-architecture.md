# Arquitectura Monorepo Modular con Turborepo para Tenddy y Landings Corporativas
Ecosistema monorepo para desacoplar el SaaS multi-tenant de Tenddy (`apps/tenddy-shop`) de las landings corporativas a medida (`apps/landing-ayme-pet`) con paquetes compartidos (`packages/*`).

## Specs
- S1: "vamos con mono repo... pero desde ahora me vas a enseñar mono repo que no se nada". Configurar la raíz del proyecto como un workspace monorepo con Turborepo (`apps/*`, `packages/*`), permitiendo compilación inteligente y despliegues aislados con dominios independientes.
- S2: Mudar el SaaS multi-tenant principal a `apps/tenddy-shop/` manteniendo el 100% de la funcionalidad de catálogo ágil estilo Temu, endpoints de administración y Supabase sin regresiones.
- S3: Extraer la capa de tokens de diseño a un paquete compartido local `packages/theme-tokens/` para que cualquier app del monorepo consuma la misma matemática de colores sin duplicar código.
- S4: Crear la aplicación independiente `apps/landing-ayme-pet/` con su propio dominio y diseño de fábrica desacoplado de Tenddy.
- S5: Garantizar que cada app compile y corra de forma autónoma con scripts de ejecución claros y pedagógicos.

## Tasks
- [x] T1 (S1): Configurar la raíz del monorepo con workspaces en `package.json` y pipeline de compilación en `turbo.json`. (Commit: pending)
- [x] T2 (S2): Migrar el código del SaaS multi-tenant a `apps/tenddy-shop/` y verificar su compilación y ejecución. (Commit: pending)
- [x] T3 (S3): Crear `packages/theme-tokens/` como paquete interno compartido y vincularlo en `apps/tenddy-shop`. (Commit: pending)
- [x] T4 (S4): Crear la app independiente `apps/landing-ayme-pet/` consumiendo la API de Tenddy. (Commit: pending)
- [x] T5 (S5): Ejecutar tests automatizados, verificar builds independientes y documentar comandos de uso. (Commit: pending)

## Evidencia de Verificación
- **Orquestación Monorepo**: Configurado `packageManager: npm@11.19.0`, `workspaces: ["apps/*", "packages/*"]` y `turbo.json` v2 en la raíz.
- **Apps Aisladas**:
  - `apps/tenddy-shop`: SaaS multi-tenant principal con catálogo directo, 35 rutas Next.js compiladas limpiamente.
  - `apps/landing-ayme-pet`: Portal corporativo independiente para AYME INDUSTRIAS PET con diseño de soplado e inyección, listo para dominio propio.
- **Paquete Compartido**:
  - `packages/theme-tokens`: Capa centralizada `@tenddy/theme-tokens` con cálculo de luminancia y variables CSS.
- **Compilación en Paralelo**: `npx turbo build` ejecuta builds concurrentes con éxito total (`Tasks: 2 successful, 2 total`).
- **Linters**: `npx turbo lint` verificado en todos los paquetes (`Tasks: 3 successful, 3 total`).
- **Pruebas Automatizadas**: 100% de la suite de tests en `apps/tenddy-shop/tests/` ejecutada exitosamente sin regresiones.

## Log
- L1: Decisión del usuario: "ok vamos con mono repo, esto es escalable ?" y aprobación para aprender y ejecutar: "si dale hagamislo, perro desde ahora me vas a enseñar mono repo que no se nada".
