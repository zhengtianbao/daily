import { Stack } from 'expo-router';

const SentencesLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerTitle: 'Sentences' }} />
    </Stack>
  );
};

export default SentencesLayout;
