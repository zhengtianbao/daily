import { StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';

import { router } from 'expo-router';

import Slider from '@react-native-community/slider';
import { debounce } from 'lodash';

import { useReader } from '@/vendor/epubjs-react-native/src';

const EpubReaderFooter = ({ title }: { title: string }) => {
  const { currentLocation, totalLocations, injectJavascript } = useReader();

  const handleSliderChange = (percentage: number) => {
    injectJavascript(`
      try {
        const cfi = book.locations.cfiFromPercentage(${percentage} / 100);
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: "onCfiFromPercentage", cfi })); true
      } catch (error) {
        alert(error?.message);
      }
    `);
  };

  const debounced = debounce(handleSliderChange, 1000);

  return (
    <View style={styles.container}>
      <View style={styles.footerContainer}>
        <IconButton
          icon="format-list-bulleted-square"
          onPress={() => {
            router.navigate({
              pathname: '/bookshelf/toc',
              params: { bookTitle: title },
            });
          }}
          style={styles.iconButton}
        />

        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            disabled={totalLocations === 0}
            value={(currentLocation?.start.percentage || 0) * 100}
            minimumValue={0}
            maximumValue={100}
            minimumTrackTintColor="#c0c0c0"
            maximumTrackTintColor="#000000"
            step={1}
            tapToSeek
            onValueChange={(percentage: number) => debounced(percentage)}
          />
          <Text variant="labelMedium">
            {((currentLocation?.start.percentage || 0) * 100).toFixed(0)}%
          </Text>
        </View>

        <IconButton
          icon="bookmark-multiple"
          onPress={() => {
            router.navigate({
              pathname: '/bookshelf/bookmarks',
              params: { bookTitle: title },
            });
          }}
          style={styles.iconButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    zIndex: 1000,
    width: '100%',
    height: 55,
    paddingHorizontal: 10,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  footerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  iconButton: {
    minWidth: 32,
    height: 32,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
  },
});

export default EpubReaderFooter;
