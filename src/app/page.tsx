import { redirect } from 'next/navigation';

// The proxy sends signed-out visitors to /login; signed-in users land in the app.
export default function Home() {
  redirect('/rooms');
}
