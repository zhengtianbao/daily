import { Stack } from 'expo-router';

const SentencesLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
};

export default SentencesLayout;
