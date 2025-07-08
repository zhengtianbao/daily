import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { useFileSystem } from '@epubjs-react-native/expo-file-system';

import { database } from '@/db/database';
import { ReaderState, useReaderStore } from '@/modules/bookshelf/store/reader';
import { Location, Reader, useReader } from '@/vendor/epubjs-react-native/src';

const EpubReader = ({ bookTitle, bookUri }: { bookTitle: string; bookUri: string }) => {
  const setIsAppBarVisible = useReaderStore((state: ReaderState) => state.setIsAppBarVisible);
  const setIsAssistantVisible = useReaderStore((state: ReaderState) => state.setIsAssistantVisible);
  const setSelectedWord = useReaderStore((state: ReaderState) => state.setSelectedWord);
  const setSelectedSentence = useReaderStore((state: ReaderState) => state.setSelectedSentence);
  const setPressAt = useReaderStore((state: ReaderState) => state.setPressAt);

  const [initialLocation, setInitialLocation] = useState<string | undefined>(undefined);
  const [readingProgress, setReadingProgress] = useState(0);

  const { width, height } = useWindowDimensions();
  const { changeTheme, theme } = useReader();
  const disableTextSelectionTimeout = useRef<NodeJS.Timeout>();
  const defaultTheme = { ...theme, body: { ...theme.body, background: '#CCE8CF' } };
  const disableTextSelectionTemporarily = () => {
    if (disableTextSelectionTimeout.current) {
      clearTimeout(disableTextSelectionTimeout.current);
    }

    changeTheme({
      ...defaultTheme,
      body: {
        ...defaultTheme.body,
        '-webkit-touch-callout': 'none' /* iOS Safari */,
        '-webkit-user-select': 'none' /* Safari */,
        '-khtml-user-select': 'none' /* Konqueror HTML */,
        '-moz-user-select': 'none' /* Firefox */,
        '-ms-user-select': 'none' /* Internet Explorer/Edge */,
        'user-select': 'none',
      },
    });

    disableTextSelectionTimeout.current = setTimeout(() => {
      changeTheme({
        ...defaultTheme,
        body: {
          ...defaultTheme.body,
          '-webkit-touch-callout': 'auto' /* iOS Safari */,
          '-webkit-user-select': 'auto' /* Safari */,
          '-khtml-user-select': 'auto' /* Konqueror HTML */,
          '-moz-user-select': 'auto' /* Firefox */,
          '-ms-user-select': 'auto' /* Internet Explorer/Edge */,
          'user-select': 'auto',
        },
      });
    }, 500);
  };

  const handleLocationChange = async (
    totalLocations: number,
    currentLocation: Location,
    progress: number
  ) => {
    try {
      if (currentLocation && currentLocation.start) {
        await database.updateBook(bookTitle, currentLocation.start.cfi);
        if (totalLocations !== 0) {
          await database.updateBookProgress(bookTitle, progress);
        }
      }
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const onWordSelected = async (
    selection: string,
    cfiRange: string,
    paragraph: string,
    sentence: string
  ) => {
    console.log('word selected:', selection);
    console.log('cfiRange:', cfiRange);
    console.log('paragraph:', paragraph);
    console.log('sentence:', sentence);
    if (selection.includes(' ')) {
      return;
    }
    setSelectedWord(selection);
    setSelectedSentence(sentence);
    setIsAssistantVisible(true);
  };

  useEffect(() => {
    const initializeBook = async () => {
      const book = await database.getBookByTitle(bookTitle);
      if (book?.currentLocation !== null) {
        setInitialLocation(book?.currentLocation);
      }
      if (book?.progress !== undefined) {
        setReadingProgress(book.progress);
      }
    };

    initializeBook();
  }, [bookTitle]);

  return (
    <View style={styles.container}>
      <Reader
        src={bookUri}
        width={width}
        height={height}
        fileSystem={useFileSystem}
        initialLocation={initialLocation}
        onLocationChange={handleLocationChange}
        enableSelection={false}
        enableSwipe={true}
        onSwipeUp={() => {
          disableTextSelectionTemporarily();
          setIsAppBarVisible(false);
        }}
        onSwipeDown={() => {
          disableTextSelectionTemporarily();
          setIsAppBarVisible(true);
        }}
        onSwipeLeft={disableTextSelectionTemporarily}
        onSwipeRight={disableTextSelectionTemporarily}
        onSelected={onWordSelected}
        onLongPress={e => {
          if (e) {
            setPressAt(e.absoluteY);
          }
        }}
        onReady={() => {
          // changeFontSize(selectedFontSize + 'px');
          changeTheme(defaultTheme);
        }}
        menuItems={[]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default EpubReader;
