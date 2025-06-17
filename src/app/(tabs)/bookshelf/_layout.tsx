import { Stack } from 'expo-router';

const BookshelfLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerTitle: 'Bookshelf', headerShown: false }} />
      <Stack.Screen name="bookReader" options={{ headerTitle: 'bookReader', headerShown: false }} />
    </Stack>
  );
};

export default BookshelfLayout;
