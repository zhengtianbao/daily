import { useMaterial3Theme } from '@pchmn/expo-material3-theme';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const App = () => {
  const colorScheme = useColorScheme();
  const { theme } = useMaterial3Theme();

  const paperTheme =
    colorScheme === 'dark'
      ? { ...MD3DarkTheme, colors: theme.dark }
      : { ...MD3LightTheme, colors: theme.light };

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaProvider>
        <RootNavigation />
      </SafeAreaProvider>
    </PaperProvider>
  );
};

const RootNavigation = () => {
  return (
    <Stack>
      <Stack.Screen name="index" />
    </Stack>
  );
};

export default App;
