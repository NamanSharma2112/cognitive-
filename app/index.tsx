import { Redirect } from 'expo-router';

export default function Index() {
  // This is the entry point of your app.
  // For now, we redirect everyone to the Login screen.
  return <Redirect href="/login" />;
}
