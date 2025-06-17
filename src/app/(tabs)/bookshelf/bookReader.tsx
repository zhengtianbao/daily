import { Reader } from '@epubjs-react-native/core';
import { useFileSystem } from '@epubjs-react-native/expo-file-system';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const BookReader = () => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const { bookUri, bookTitle } = useLocalSearchParams();

  return (
    <>
      <Appbar.Header>
        <Appbar.Content title="bookReader" />
        <Appbar.BackAction
          onPress={() => {
            router.navigate('/bookshelf');
          }}
        />
      </Appbar.Header>

      <SafeAreaView
        style={{
          ...styles.container,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}>
        <View style={styles.container}>
          <View>
            <Reader
              src={bookUri}
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
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 10,
    paddingTop: 40, // 适配状态栏
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  navTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  reader: {
    flex: 1,
  },
});

export default BookReader;
