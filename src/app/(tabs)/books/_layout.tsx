import { Stack } from 'expo-router';

const BooksLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerTitle: 'Books' }} />
    </Stack>
  );
};

export default BooksLayout;
