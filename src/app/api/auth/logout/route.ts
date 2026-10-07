import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function POST() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  allCookies.forEach((c) => {
    if (
      c.name.startsWith('admin_session_') ||
      c.name.startsWith('tenddy_') ||
      c.name.startsWith('sb-')
    ) {
      cookieStore.delete({ name: c.name, path: '/' });
    }
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore
            }
          },
        },
      }
    );
    await supabase.auth.signOut();
  } catch {
    // Ignore signOut errors
  }

  return NextResponse.json({ success: true });
}
