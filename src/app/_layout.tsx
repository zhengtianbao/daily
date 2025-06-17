import { Colors } from '@/constants/colors';
import { database } from '@/store/database';
import { ReaderProvider } from '@epubjs-react-native/core';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const customDarkTheme = { ...MD3DarkTheme, colors: Colors.dark };
const customLightTheme = { ...MD3LightTheme, colors: Colors.light };

const App = () => {
  const colorScheme = useColorScheme();
  const customTheme = colorScheme === 'dark' ? customDarkTheme : customLightTheme;
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await database.initialize();
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    };
    initializeDatabase();
  }, []);

  return (
    <ReaderProvider>
      <PaperProvider theme={customTheme}>
        <SafeAreaProvider>
          <RootNavigation />
        </SafeAreaProvider>
      </PaperProvider>
    </ReaderProvider>
  );
};

const RootNavigation = () => {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
};

export default App;
