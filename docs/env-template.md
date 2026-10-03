# Plantilla de Variables de Entorno (.env.local)

Creá un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Administrative Secrets
ADMIN_SECRET_KEY=your_tenant_admin_master_secret
SUPERADMIN_SECRET_KEY=your_superadmin_master_secret

# Multi-tenant Routing
# En desarrollo local: localhost:3000
# En producción: tenddy.shop
NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000
```
