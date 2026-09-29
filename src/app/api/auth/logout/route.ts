import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  allCookies.forEach((c) => {
    if (c.name.startsWith('admin_session_') || c.name.startsWith('tenddy_')) {
      cookieStore.delete({ name: c.name, path: '/' });
    }
  });

  return NextResponse.json({ success: true });
}
