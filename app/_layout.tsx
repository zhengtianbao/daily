import { Colors } from '@/app/constants/colors';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const customDarkTheme = { ...MD3DarkTheme, colors: Colors.dark };
const customLightTheme = { ...MD3LightTheme, colors: Colors.light };

const App = () => {
  const colorScheme = useColorScheme();
  const customTheme = colorScheme === 'dark' ? customDarkTheme : customLightTheme;

  return (
    <PaperProvider theme={customTheme}>
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
