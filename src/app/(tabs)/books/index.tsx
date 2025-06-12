import { Reader, ReaderProvider, useReader } from '@epubjs-react-native/core';
import { useFileSystem } from '@epubjs-react-native/expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as React from 'react';
import {
  Alert,
  GestureResponderEvent,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const base64 = '';
const epub = 'https://epubjs-react-native.s3.amazonaws.com/failing-forward.epub';
const opf = 'https://s3.amazonaws.com/moby-dick/OPS/package.opf';

const Books = () => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [src, setSrc] = React.useState(opf);

  const { goPrevious, goNext } = useReader();

  const handlePress = (event: GestureResponderEvent) => {
    const { locationX } = event.nativeEvent;
    const screenWidth = width;

    const leftThreshold = screenWidth * 0.3;
    const rightThreshold = screenWidth * 0.7;

    if (locationX < leftThreshold) {
      goPrevious();
    } else if (locationX > rightThreshold) {
      goNext();
    }
  };
  return (
    <SafeAreaView
      style={{
        ...styles.container,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}>
      <View style={styles.options}>
        <TouchableOpacity onPress={() => setSrc(opf)}>
          <Text>Book (.opf)</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setSrc(epub)}>
          <Text>Book (.epub)</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setSrc(base64)}>
          <Text>Book (base64)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Instructions',
              'To make this work copy the books (.epub) located on your computer and paste in the emulator',
              [
                {
                  text: 'Ok',
                  onPress: async () => {
                    const { assets } = await DocumentPicker.getDocumentAsync();
                    if (!assets) return;

                    const { uri } = assets[0];

                    if (uri) setSrc(uri);
                  },
                },
              ]
            );
          }}>
          <Text>Book (local)</Text>
        </TouchableOpacity>
      </View>

      <TouchableWithoutFeedback onPress={handlePress}>
        <View>
          <Reader
            src={src}
            width={width}
            height={height * 0.8}
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
      </TouchableWithoutFeedback>

      {src === opf && <Text style={styles.currentFormat}>Current format: .opf</Text>}

      {src === epub && <Text style={styles.currentFormat}>Current format: .epub</Text>}

      {src === base64 && <Text style={styles.currentFormat}>Current format: base64</Text>}

      {src !== opf && src !== epub && src !== base64 && (
        <Text style={styles.currentFormat}>Current format: local</Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  options: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  currentFormat: {
    textAlign: 'center',
  },
});

const BookReader = () => {
  return (
    <ReaderProvider>
      <Books />
    </ReaderProvider>
  );
};

export default BookReader;
