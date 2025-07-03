import { Stack } from 'expo-router';

const BookshelfLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="bookReader" options={{ headerShown: false }} />
    </Stack>
  );
};

export default BookshelfLayout;
