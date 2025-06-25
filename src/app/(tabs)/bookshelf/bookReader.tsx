import { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import { Appbar, Button, IconButton, Modal, Portal, ProgressBar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router, useLocalSearchParams, useNavigation } from 'expo-router';

import { useFileSystem } from '@epubjs-react-native/expo-file-system';

import Reverso from '@/components/translate/reverso';
import { Reader, useReader } from '@/vendor/epubjs-react-native/src';

const BookReader = () => {
  const { width, height } = useWindowDimensions();
  const [isAppBarVisible, setIsAppBarVisible] = useState(false);
  const [isSettingModalVisible, setIsSettingModalVisible] = useState(false);
  const [selectedFont, setSelectedFont] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  let reverso = new Reverso();
  const { bookUri, bookTitle } = useLocalSearchParams();

  const { changeFontSize, changeFontFamily, changeTheme, theme } = useReader();

  const defaultTheme = theme;
  const disableTextSelectionTimeout = useRef<NodeJS.Timeout>();

  const disableTextSelectionTemporarily = () => {
    console.log('disableTextSelectionTemporarily');
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

  const handleFontSelect = (fontName: string) => {
    setSelectedFont(fontName);
    console.log('selected font: ', fontName);
    changeFontFamily(fontName);
  };

  const handleFontSizeChange = (delta: number) => {
    const newSize = fontSize + delta;
    if (newSize >= 10 && newSize <= 30) {
      setFontSize(newSize);
      console.log('selected font size: ', newSize);
      changeFontSize(newSize.toString() + 'px');
    }
  };

  // Hide bottom tab bar when component mounts, restore when unmounts
  useEffect(() => {
    // Find the parent tab navigator
    let parent = navigation.getParent();
    while (parent && parent.getState().type !== 'tab') {
      parent = parent.getParent();
    }

    if (parent) {
      parent.setOptions({
        tabBarStyle: { display: 'none' },
      });
      return () => {
        parent.setOptions({
          tabBarStyle: { display: 'flex' },
        });
      };
    }
  }, [navigation]);

  // TODO: migrate to gestures API instead:
  //   https://docs.swmansion.com/react-native-gesture-handler/docs/gesture-handlers/about-handlers
  // Handle swipe-down gesture
  const onGestureEvent = ({ nativeEvent }: PanGestureHandlerGestureEvent) => {
    if (nativeEvent.translationY > 100) {
      setIsAppBarVisible(true);
    } else if (nativeEvent.translationY < -100) {
      setIsAppBarVisible(false);
    }
  };

  const onSelected = async (selection: string, cfiRange: string) => {
    console.log('selected', selection);

    try {
      const translationsNew = await reverso.getContextFromWebPage(selection, 'english', 'chinese');

      if (translationsNew.Translations.length === 0) {
        // let translation = await reverso.getTranslationFromAPI(selection, 'english', 'chinese');
        // setPanelContent(translation);
      } else {
        // translationsNew.Book = bookTitle;
        // translationsNew.TextView = latestSentence.current;
        // setPanelContent(translationsNew);
      }
      console.log('translationsNew', translationsNew);
      // setIsPanelVisible(true);
    } catch (error) {
      console.error('Error fetching translation:', error);
      // setIsPanelVisible(false);
    }
  };

  const memoReader = useMemo(
    () => (
      <Reader
        src={bookUri as string}
        width={width - insets.left - insets.right}
        height={height - insets.top - insets.bottom - (isAppBarVisible ? 64 : 0)}
        fileSystem={useFileSystem}
        enableSelection={false}
        enableSwipe={true}
        onSwipeUp={disableTextSelectionTemporarily}
        onSwipeDown={disableTextSelectionTemporarily}
        onSwipeLeft={disableTextSelectionTemporarily}
        onSwipeRight={disableTextSelectionTemporarily}
        onSelected={onSelected}
        onReady={() => changeFontSize(`20px`)}
        menuItems={[
          {
            label: '🟡',
            action: cfiRange => {
              console.log(cfiRange);
              return true;
            },
          },
          {
            label: '🔴',
            action: cfiRange => {
              console.log(cfiRange);
              return true;
            },
          },
        ]}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <GestureHandlerRootView>
      <SafeAreaView
        style={{
          ...styles.container,
          paddingTop: isAppBarVisible ? insets.top : 0,
          paddingBottom: 0,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}>
        <PanGestureHandler onGestureEvent={onGestureEvent}>
          <View style={styles.reader}>
            {isAppBarVisible && (
              <Appbar.Header>
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
        </PanGestureHandler>
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
                      onPress={() => handleFontSelect(font)}
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
                    disabled={fontSize <= 10}
                    onPress={() => handleFontSizeChange(-2)}
                    style={[
                      styles.sizeButton,
                      fontSize <= 10 && styles.disabledButton,
                    ]}></IconButton>

                  <View style={styles.progressWrapper}>
                    <ProgressBar
                      progress={(fontSize - 10) / 20}
                      color="#2196F3"
                      style={styles.progressBar}
                    />
                  </View>

                  <IconButton
                    icon="format-annotation-plus"
                    size={20}
                    mode="outlined"
                    disabled={fontSize >= 30}
                    onPress={() => handleFontSizeChange(2)}
                    style={[
                      styles.sizeButton,
                      fontSize >= 30 && styles.disabledButton,
                    ]}></IconButton>
                </View>
              </View>
            </View>
          </Modal>
        </Portal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  reader: {
    flex: 1,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
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
    backgroundColor: '#E0E0E0',
  },
});

export default BookReader;
