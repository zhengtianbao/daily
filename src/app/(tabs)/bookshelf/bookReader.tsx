import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import {
  Appbar,
  Button,
  IconButton,
  Modal,
  Portal,
  ProgressBar,
  Text,
  TextInput,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';

import { useFileSystem } from '@epubjs-react-native/expo-file-system';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { debounce } from 'lodash';

import { getCompletionStream } from '@/components/openai/deepseek';
import { client as TmtClient } from '@/components/translators/tencent';
import { database } from '@/db/database';
import { WordInfo, dictionary } from '@/db/dictionary';
import { Location, Reader, useReader } from '@/vendor/epubjs-react-native/src';

const BookReader = () => {
  const [isAppBarVisible, setIsAppBarVisible] = useState(false);
  const [isSettingModalVisible, setIsSettingModalVisible] = useState(false);
  const [selectedFont, setSelectedFont] = useState('');
  const [selectedFontSize, setSelectedFontSize] = useState(20);
  const [isWordInfoModalVisible, setIsWordInfoModalVisible] = useState(false);
  const [wordInfoActiveTab, setWordInfoActiveTab] = useState('word');
  const [pressY, setPressY] = useState(0);
  const [selectedWord, setSelectedWord] = useState<WordInfo>();
  const [selectedWordSentence, setSelectedWordSentence] = useState<string | undefined>(undefined);
  const [selectedWordSentenceTranslation, setSelectedWordSentenceTranslation] = useState<
    string | undefined
  >(undefined);
  const [prompt, setPrompt] = useState('请分析句子的语法');
  const [response, setResponse] = useState('');
  const responseScrollViewRef = useRef<ScrollView>(null);
  const [initialLocation, setInitialLocation] = useState<string | undefined>(undefined);
  const [readingProgress, setReadingProgress] = useState(0);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { bookUri, bookTitle } = useLocalSearchParams<{
    bookUri: string;
    bookTitle: string;
  }>();
  const { changeFontSize, changeTheme, theme } = useReader();

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

  const defaultTheme = { ...theme, body: { ...theme.body, background: '#CCE8CF' } };
  const disableTextSelectionTimeout = useRef<NodeJS.Timeout>();

  const fonts = [
    'SpaceMono',
    'Roboto',
    'Menbere',
    'JetBrainsMono',
    'Manufacturing',
    'DancingScript',
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
    // changeFontFamily() not work with custom font.
    changeTheme({
      ...defaultTheme,
      '* p': { 'font-family': fontName + ' !important' },
    });
  };

  const handleFontSizeChange = (delta: number) => {
    const newSize = selectedFontSize + delta;
    if (newSize >= 10 && newSize <= 30) {
      setSelectedFontSize(newSize);
      console.log('selected font size: ', newSize);
      changeFontSize(newSize.toString() + 'px');
    }
  };

  const translateSentence = useCallback(async () => {
    try {
      if (!selectedWordSentence) {
        return;
      }

      const translationsNew = await TmtClient.getTranslationFromAPI(
        selectedWordSentence,
        'en',
        'zh'
      );

      setSelectedWordSentenceTranslation(translationsNew.Response.TargetText);
    } catch (error) {
      console.log('Error fetching translation:', error);
    }
  }, [selectedWordSentence]);

  const debouncedTranslateSentence = debounce(translateSentence, 1000);

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
    try {
      const wordInfo = await dictionary.getWordInfoByWord(selection);
      // console.log('WordInfo: ', wordInfo);
      if (wordInfo) {
        setSelectedWord(wordInfo);
        setSelectedWordSentence(sentence);
        setIsWordInfoModalVisible(true);
        Speech.speak(selection);
      }
    } catch (error) {
      console.error('Error fetching translation:', error);
    }
  };

  const handleInputChange = (text: string) => {
    setPrompt(text);
  };

  const handleSubmit = async () => {
    setResponse('');
    try {
      const question = selectedWordSentence + prompt;
      await getCompletionStream(question, chunk => {
        setResponse(prev => prev + chunk);
      });
    } catch (error) {
      console.error('Error getting completion:', error);
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
                  router.back();
                }}
              />
              <Appbar.Action
                icon={({ size, color }) => (
                  <MaterialIcons name="settings" size={24} color="black" />
                )}
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
          onDismiss={() => {
            setIsWordInfoModalVisible(false);
            setWordInfoActiveTab('word');
          }}
          contentContainerStyle={[
            styles.wordInfoModal,
            {
              top: pressY < height / 2 ? pressY + 40 : 40,
              left: width * 0.1,
              width: width * 0.8,
            },
          ]}>
          {/* Tab Buttons */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, wordInfoActiveTab === 'word' && styles.activeTab]}
              onPress={() => setWordInfoActiveTab('word')}>
              <Text style={[styles.tabText, wordInfoActiveTab === 'word' && styles.activeTabText]}>
                单词翻译
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, wordInfoActiveTab === 'sentence' && styles.activeTab]}
              onPress={() => {
                debouncedTranslateSentence();
                setWordInfoActiveTab('sentence');
              }}>
              <Text
                style={[styles.tabText, wordInfoActiveTab === 'sentence' && styles.activeTabText]}>
                整句翻译
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, wordInfoActiveTab === 'ai' && styles.activeTab]}
              onPress={() => setWordInfoActiveTab('ai')}>
              <Text style={[styles.tabText, wordInfoActiveTab === 'ai' && styles.activeTabText]}>
                AI助手
              </Text>
            </TouchableOpacity>
          </View>

          {wordInfoActiveTab === 'word' && (
            <ScrollView style={styles.contentContainer}>
              <View>
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
              </View>
            </ScrollView>
          )}
          {wordInfoActiveTab === 'sentence' && (
            <ScrollView style={styles.contentContainer}>
              <View>
                <View>
                  <Text>{selectedWordSentence}</Text>
                </View>
                <View>
                  <Text>{selectedWordSentenceTranslation}</Text>
                </View>
              </View>
            </ScrollView>
          )}
          {wordInfoActiveTab === 'ai' && (
            <>
              <ScrollView
                ref={responseScrollViewRef}
                onContentSizeChange={() =>
                  responseScrollViewRef.current?.scrollToEnd({ animated: true })
                }
                style={styles.contentContainer}>
                <View>
                  <Markdown>{response}</Markdown>
                </View>
              </ScrollView>
              <View style={styles.inputContainer}>
                <TextInput
                  value={prompt}
                  mode="outlined"
                  style={styles.textInput}
                  onChangeText={handleInputChange}
                />
                <IconButton
                  icon="rocket"
                  mode="contained-tonal"
                  size={16}
                  style={styles.iconButton}
                  onPress={handleSubmit}
                />
              </View>
            </>
          )}
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
  contentContainer: {
    padding: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
  },
  textInput: {
    height: 20,
    width: '80%',
  },
  iconButton: {
    height: 20,
    width: '10%',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 5,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6200ee',
  },
  tabText: {
    fontSize: 14,
    color: '#333',
  },
  activeTabText: {
    color: '#6200ee',
    fontWeight: 'bold',
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
