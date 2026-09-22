import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirigir por defecto a la tienda principal (ayme-pet)
  redirect('/store/ayme-pet');
}
