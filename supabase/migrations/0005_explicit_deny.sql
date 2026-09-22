-- Blindaje estricto contra escrituras no autorizadas en tablas de catálogo
-- En PostgreSQL RLS, si no hay política para INSERT, UPDATE o DELETE, queda denegado por defecto para roles normales.
-- Pero para dejarlo explícito e inquebrantable ante cualquier role:

CREATE POLICY "Deny anon insert on products" ON products FOR INSERT WITH CHECK (FALSE);
CREATE POLICY "Deny anon update on products" ON products FOR UPDATE USING (FALSE);
CREATE POLICY "Deny anon delete on products" ON products FOR DELETE USING (FALSE);

CREATE POLICY "Deny anon insert on tenants" ON tenants FOR INSERT WITH CHECK (FALSE);
CREATE POLICY "Deny anon update on tenants" ON tenants FOR UPDATE USING (FALSE);
CREATE POLICY "Deny anon delete on tenants" ON tenants FOR DELETE USING (FALSE);

CREATE POLICY "Deny anon insert on branches" ON branches FOR INSERT WITH CHECK (FALSE);
CREATE POLICY "Deny anon update on branches" ON branches FOR UPDATE USING (FALSE);
CREATE POLICY "Deny anon delete on branches" ON branches FOR DELETE USING (FALSE);

CREATE POLICY "Deny anon insert on categories" ON categories FOR INSERT WITH CHECK (FALSE);
CREATE POLICY "Deny anon update on categories" ON categories FOR UPDATE USING (FALSE);
CREATE POLICY "Deny anon delete on categories" ON categories FOR DELETE USING (FALSE);

CREATE POLICY "Deny anon delete on quotes" ON quotes FOR DELETE USING (FALSE);
CREATE POLICY "Deny anon insert on quotes" ON quotes FOR INSERT WITH CHECK (FALSE);
