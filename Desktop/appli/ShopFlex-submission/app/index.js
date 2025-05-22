import { Redirect } from 'expo-router';
import { auth } from '../services/firebaseConfig';

export default function IndexRedirect() {
  // Check if user is authenticated
  const isAuthenticated = auth.currentUser !== null;
  
  // Redirect based on auth state
  return <Redirect href={isAuthenticated ? "/(tabs)" : "/(public)"} />;
}
