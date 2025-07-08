import { SafeAreaView, StyleSheet } from 'react-native';

import { useLocalSearchParams } from 'expo-router';

import Assistant from '@/modules/bookshelf/components/Assistant';
import EpubReader from '@/modules/bookshelf/components/EpubReader';
import EpubReaderHeader from '@/modules/bookshelf/components/EpubReaderHeader';
import Settings from '@/modules/bookshelf/components/Settings';
import { ReaderState, useReaderStore } from '@/modules/bookshelf/store/reader';

const Reader = () => {
  const { bookUri, bookTitle } = useLocalSearchParams<{
    bookUri: string;
    bookTitle: string;
  }>();

  const isAppBarVisible = useReaderStore((state: ReaderState) => state.isAppBarVisible);
  const isSettingsVisible = useReaderStore((state: ReaderState) => state.isSettingsVisible);
  const isAssistantVisible = useReaderStore((state: ReaderState) => state.isAssistantVisible);

  return (
    <SafeAreaView style={styles.container}>
      {isAppBarVisible && <EpubReaderHeader title={bookTitle}></EpubReaderHeader>}

      <EpubReader bookTitle={bookTitle} bookUri={bookUri}></EpubReader>

      {isSettingsVisible && <Settings title={bookTitle}></Settings>}

      {isAssistantVisible && <Assistant></Assistant>}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Reader;
