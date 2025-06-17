import { Reader } from '@epubjs-react-native/core';
import { useFileSystem } from '@epubjs-react-native/expo-file-system';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
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

  const { bookUri, bookTitle } = useLocalSearchParams();

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
    if (nativeEvent.translationY > 50) {
      setAppBarVisible(true);
    } else if (nativeEvent.translationY < -50) {
      setAppBarVisible(false);
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
              onSelected={() => console.log('selected')}
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
