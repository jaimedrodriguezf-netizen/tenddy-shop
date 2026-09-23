import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

// Registrar o buscar cuenta corporativa de comprador B2B
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      company_name,
      tax_id,
      phone,
      email,
      billing_city,
      billing_address,
      tenant_id,
    } = body;

    if (!company_name || !email || !phone || !tenant_id) {
      return NextResponse.json(
        { error: 'Empresa, email, teléfono y tienda son requeridos' },
        { status: 400 }
      );
    }

    const admin = getAdminClient();

    // 1. Buscar o crear la cuenta B2B universal del comprador
    let accountId: string;
    const { data: existingAccount } = await admin
      .from('b2b_accounts')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (existingAccount) {
      accountId = existingAccount.id;
    } else {
      const { data: newAccount, error: createAccErr } = await admin
        .from('b2b_accounts')
        .insert({
          company_name: company_name.trim(),
          tax_id: tax_id ? tax_id.trim() : null,
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          billing_city: billing_city || null,
          billing_address: billing_address || null,
        })
        .select('id')
        .single();

      if (createAccErr) {
        return NextResponse.json({ error: createAccErr.message }, { status: 500 });
      }
      accountId = newAccount.id;
    }

    // 2. Asociar el comprador a esta tienda proveedora si no estaba asociado
    const { data: relation } = await admin
      .from('b2b_tenant_customers')
      .select('id')
      .eq('account_id', accountId)
      .eq('tenant_id', tenant_id)
      .single();

    if (!relation) {
      await admin.from('b2b_tenant_customers').insert({
        account_id: accountId,
        tenant_id: tenant_id,
        customer_tier: 'standard',
        status: 'active',
      });
    }

    return NextResponse.json({
      success: true,
      account_id: accountId,
      message: 'Comprador B2B vinculado con éxito a la tienda',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
