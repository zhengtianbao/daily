import { Stack } from 'expo-router';
import { View } from 'react-native';
const SentencesLayout = () => {
  return (
    <View>
      <Stack>
        <Stack.Screen name="index" options={{ headerTitle: 'Sentences' }} />
      </Stack>
    </View>
  );
};

export default SentencesLayout;
