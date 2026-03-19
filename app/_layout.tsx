import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ThemeProvider as CustomThemeProvider, useTheme } from '@/hooks/use-theme';
import { AuthProvider } from '@/src/context/AuthContext';

export const unstable_settings = {
  initialRouteName: 'login',
};

function RootLayoutContent() {
  const { colorScheme } = useTheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="assessment" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="games/word-card" options={{ headerShown: false, title: 'Word Card' }} />
        <Stack.Screen name="games/visual-search" options={{ headerShown: false, title: 'Visual Search' }} />
        <Stack.Screen name="games/reaction-speed" options={{ headerShown: false, title: 'Reaction Speed' }} />
        <Stack.Screen name="games/planning-puzzle" options={{ headerShown: false, title: 'Planning Puzzle' }} />
        <Stack.Screen name="games/market-rush" options={{ headerShown: false, title: 'Market Rush' }} />
        <Stack.Screen name="games/blink-trail" options={{ headerShown: false, title: 'Blink Trail' }} />
        <Stack.Screen name="games/speedy-current" options={{ headerShown: false, title: 'Speedy Current' }} />
        <Stack.Screen name="games/emotion-meadow" options={{ headerShown: false, title: 'Emotion Meadow' }} />
        <Stack.Screen name="games/sound-forest" options={{ headerShown: false, title: 'Sound Forest' }} />
        <Stack.Screen name="games/dual-task-flow" options={{ headerShown: false, title: 'Dual Task Flow' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <CustomThemeProvider>
      <AuthProvider>
        <RootLayoutContent />
      </AuthProvider>
    </CustomThemeProvider>
  );
}
