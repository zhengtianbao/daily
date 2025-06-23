import Reverso from '@/components/translate/reverso';
import { Reader, useReader } from '@epubjs-react-native/core';
import { useFileSystem } from '@epubjs-react-native/expo-file-system';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, View, useWindowDimensions } from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import { Appbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BookReader = () => {
  const { width, height } = useWindowDimensions();
  const [appBarVisible, setAppBarVisible] = useState(false); // Default to hidden
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  let reverso = new Reverso();
  const { bookUri, bookTitle } = useLocalSearchParams();

  const { changeFontSize, changeTheme, theme } = useReader();

  const defaultTheme = theme;
  const disableTextSelectionTimeout = useRef<NodeJS.Timeout>();

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
    }, 1000);
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
      setAppBarVisible(true);
    } else if (nativeEvent.translationY < -100) {
      setAppBarVisible(false);
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

  return (
    <GestureHandlerRootView>
      <SafeAreaView
        style={{
          ...styles.container,
          paddingTop: appBarVisible ? insets.top : 0,
          paddingBottom: 0,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}>
        <PanGestureHandler onGestureEvent={onGestureEvent}>
          <View style={styles.reader}>
            {appBarVisible && (
              <Appbar.Header>
                <Appbar.Content title={bookTitle} />
                <Appbar.BackAction
                  onPress={() => {
                    router.navigate('/bookshelf');
                  }}
                />
              </Appbar.Header>
            )}
            <Reader
              src={bookUri as string}
              width={width - insets.left - insets.right}
              height={height - (appBarVisible ? insets.top + 56 : 0)}
              fileSystem={useFileSystem}
              enableSelection={true}
              enableSwipe={true}
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
          </View>
        </PanGestureHandler>
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
});

export default BookReader;
