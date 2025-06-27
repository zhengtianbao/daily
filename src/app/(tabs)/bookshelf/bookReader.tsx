import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Appbar, Button, IconButton, Modal, Portal, ProgressBar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router, useLocalSearchParams, useNavigation } from 'expo-router';

import { useFileSystem } from '@epubjs-react-native/expo-file-system';
import { debounce } from 'lodash';

import Reverso from '@/components/translate/reverso';
import { database } from '@/db/database';
import { WordInfo, dictionary } from '@/db/dictionary';
import { Location, Reader, useReader } from '@/vendor/epubjs-react-native/src';

const BookReader = () => {
  const [isAppBarVisible, setIsAppBarVisible] = useState(false);
  const [isSettingModalVisible, setIsSettingModalVisible] = useState(false);
  const [selectedFont, setSelectedFont] = useState('');
  const [selectedFontSize, setSelectedFontSize] = useState(20);
  const [isWordInfoModalVisible, setIsWordInfoModalVisible] = useState(false);
  const [pressY, setPressY] = useState(0);
  const [selectedWord, setSelectedWord] = useState<WordInfo>();
  const [initialLocation, setInitialLocation] = useState<string | undefined>(undefined);
  const [readingProgress, setReadingProgress] = useState(0);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { bookUri, bookTitle } = useLocalSearchParams<{
    bookUri: string;
    bookTitle: string;
  }>();
  const { changeFontSize, changeFontFamily, changeTheme, theme } = useReader();

  // Hide bottom tab bar when component mounts, restore when unmounts
  useEffect(() => {
    let parent = navigation.getParent();
    while (parent && parent.getState().type !== 'tab') {
      parent = parent.getParent();
    }

    if (parent) {
      parent.setOptions({ tabBarStyle: { display: 'none' } });
      return () => {
        parent.setOptions({ tabBarStyle: { display: 'flex' } });
      };
    }
  }, [navigation]);

  useEffect(() => {
    const initializeBook = async () => {
      const book = await database.getBookByTitle(bookTitle);
      if (book?.currentLocation !== null) {
        setInitialLocation(book?.currentLocation);
        console.log('Loaded saved location:', book?.currentLocation);
      }
      if (book?.progress !== undefined) {
        setReadingProgress(book.progress);
      }
    };

    initializeBook();
  }, [bookTitle]);

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
          setReadingProgress(progress);
          console.log('Reading progress updated:', progress);
        }
      }
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const reverso = new Reverso();
  const defaultTheme = { ...theme, body: { ...theme.body, background: '#CCE8CF' } };
  const disableTextSelectionTimeout = useRef<NodeJS.Timeout>();

  const fonts = [
    'Arial',
    'Verdana',
    'Tahoma',
    'Trebuchet MS',
    'Times New Roman',
    'Georgia',
    'Garamond',
    'Courier New',
    'Brush Script MT',
  ];

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

  const handleFontSelected = (fontName: string) => {
    setSelectedFont(fontName);
    console.log('selected font: ', fontName);
    changeFontFamily(fontName);
  };

  const handleFontSizeChange = (delta: number) => {
    const newSize = selectedFontSize + delta;
    if (newSize >= 10 && newSize <= 30) {
      setSelectedFontSize(newSize);
      console.log('selected font size: ', newSize);
      changeFontSize(newSize.toString() + 'px');
    }
  };

  const onSentenceSelected = useCallback(
    debounce(async (selection: string) => {
      try {
        console.log('sentence selected:', selection);
        const translationsNew = await reverso.getContextFromWebPage(
          selection,
          'english',
          'chinese'
        );
        console.log('translationsNew', translationsNew);
      } catch (error) {
        console.error('Error fetching translation:', error);
      }
    }, 2000),
    []
  );

  const onWordSelected = async (
    selection: string,
    cfiRange: string,
    paragraphText: string,
    paragraphCfiRange: string,
    sentence: string,
    sentenceCfiRange: string
  ) => {
    console.log('word selected:', selection);
    console.log('cfiRange:', cfiRange);
    console.log('paragraphText:', paragraphText);
    console.log('paragraphCfiRange:', paragraphCfiRange);
    console.log('sentence:', sentence);
    console.log('sentenceCfiRange:', sentenceCfiRange);
    if (selection.includes(' ')) {
      return;
    }
    try {
      const wordInfo = await dictionary.getWordInfoByWord(selection);
      // console.log('WordInfo: ', wordInfo);
      if (wordInfo) {
        setSelectedWord(wordInfo);
        setIsWordInfoModalVisible(true);
      }
    } catch (error) {
      console.error('Error fetching translation:', error);
    }
  };

  const memoReader = useMemo(
    () => (
      <Reader
        src={bookUri as string}
        width={width - insets.left - insets.right}
        height={height - (isAppBarVisible ? 64 : 0)}
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
            setPressY(e.absoluteY);
          }
        }}
        onReady={() => {
          changeFontSize(selectedFontSize + 'px');
          changeTheme(defaultTheme);
        }}
        menuItems={[]}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bookUri, initialLocation]
  );

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.reader}>
          {isAppBarVisible && (
            <Appbar.Header style={styles.appBar}>
              <Appbar.Content title={bookTitle} />
              <Appbar.BackAction
                onPress={() => {
                  router.navigate('/bookshelf');
                }}
              />
              <Appbar.Action
                icon="book-settings-outline"
                onPress={() => setIsSettingModalVisible(true)}
              />
            </Appbar.Header>
          )}
          {memoReader}
        </View>

        <Portal>
          <Modal
            visible={isSettingModalVisible}
            onDismiss={() => setIsSettingModalVisible(false)}
            contentContainerStyle={styles.modal}>
            <View style={styles.fontSelectContainer}>
              <View style={styles.rowContainer}>
                <Text style={styles.label}>Font: </Text>
                <ScrollView
                  horizontal={true}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContainer}>
                  {fonts.map((font, index) => (
                    <Button
                      key={index}
                      mode={selectedFont === font ? 'contained' : 'outlined'}
                      onPress={() => handleFontSelected(font)}
                      style={styles.fontButton}>
                      {font}
                    </Button>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.fontSelectContainer}>
              <View style={styles.rowContainer}>
                <Text style={styles.label}>Font Size: </Text>
                <View style={styles.progressContainer}>
                  <IconButton
                    icon="format-annotation-minus"
                    size={20}
                    mode="outlined"
                    disabled={selectedFontSize <= 10}
                    onPress={() => handleFontSizeChange(-2)}
                    style={[
                      styles.sizeButton,
                      selectedFontSize <= 10 && styles.disabledButton,
                    ]}></IconButton>

                  <View style={styles.progressWrapper}>
                    <ProgressBar
                      progress={(selectedFontSize - 10) / 20}
                      color="#2196F3"
                      style={styles.progressBar}
                    />
                  </View>

                  <IconButton
                    icon="format-annotation-plus"
                    size={20}
                    mode="outlined"
                    disabled={selectedFontSize >= 30}
                    onPress={() => handleFontSizeChange(2)}
                    style={[
                      styles.sizeButton,
                      selectedFontSize >= 30 && styles.disabledButton,
                    ]}></IconButton>
                </View>
              </View>
            </View>
          </Modal>
        </Portal>
      </SafeAreaView>

      <Portal>
        <Modal
          visible={isWordInfoModalVisible}
          onDismiss={() => setIsWordInfoModalVisible(false)}
          contentContainerStyle={[
            styles.wordInfoModal,
            {
              top: pressY < height / 2 ? pressY + 40 : 40,
              left: width * 0.1,
              width: width * 0.8,
            },
          ]}>
          <ScrollView>
            <View>
              <Text>{selectedWord?.word}</Text>
              <Text>{'[' + selectedWord?.phonetic + ']'}</Text>
            </View>
            <View>
              <Text>{selectedWord?.definition}</Text>
            </View>
            <View>
              <Text>{selectedWord?.translation}</Text>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1000,
    width: '100%',
  },
  reader: {
    flex: 1,
  },
  wordInfoModal: {
    position: 'absolute',
    backgroundColor: 'white',
    padding: 10,
    width: '80%',
    height: '40%',
    borderRadius: 10,
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    padding: 10,
    width: '90%',
    alignSelf: 'center',
    borderRadius: 10,
  },
  fontSelectContainer: {
    padding: 10,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    marginRight: 0,
    fontSize: 16,
    minWidth: 80,
  },
  scrollContainer: {
    paddingHorizontal: 0,
  },
  fontButton: {
    marginHorizontal: 5,
    minWidth: 120,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sizeButton: {
    minWidth: 32,
    height: 32,
  },
  disabledButton: {
    opacity: 0.3,
  },
  progressWrapper: {
    flex: 1,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
});

export default BookReader;
