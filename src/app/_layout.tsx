import { useColorScheme } from 'react-native';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import { install } from 'react-native-quick-crypto';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { Colors } from '@/constants/colors';
import useDatabase from '@/hooks/useDatabase';
import { ReaderProvider } from '@/vendor/epubjs-react-native/src';

SplashScreen.preventAutoHideAsync();
install();

const App = () => {
  const customDarkTheme = { ...MD3DarkTheme, colors: Colors.dark };
  const customLightTheme = { ...MD3LightTheme, colors: Colors.light };
  const customTheme = useColorScheme() === 'dark' ? customDarkTheme : customLightTheme;
  const isDBLoadingComplete = useDatabase();

  if (isDBLoadingComplete) {
    SplashScreen.hideAsync();

    return (
      <PaperProvider theme={customTheme}>
        <SafeAreaProvider>
          <ReaderProvider>
            <RootNavigation />
          </ReaderProvider>
        </SafeAreaProvider>
      </PaperProvider>
    );
  }
};

const RootNavigation = () => {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="bookshelf/toc" options={{ headerShown: false }} />
      <Stack.Screen name="bookshelf/bookmarks" options={{ headerShown: false }} />
      <Stack.Screen name="bookshelf/reader" options={{ headerShown: false }} />
    </Stack>
  );
};

export default App;
