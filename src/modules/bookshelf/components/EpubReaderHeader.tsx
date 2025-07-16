import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';

import { router } from 'expo-router';

import FontAwesome from '@expo/vector-icons/FontAwesome';

import { ReaderState, useReaderStore } from '@/modules/bookshelf/store/reader';
import { useReader } from '@/vendor/epubjs-react-native/src';

const EpubReaderHeader = ({ title }: { title: string }) => {
  const setIsAppBarVisible = useReaderStore((state: ReaderState) => state.setIsAppBarVisible);
  const setIsSettingsVisible = useReaderStore((state: ReaderState) => state.setIsSettingsVisible);

  const { bookmarks, isBookmarked, addBookmark, removeBookmark, getCurrentLocation } = useReader();

  useEffect(() => {
    return () => {
      setIsSettingsVisible(false);
      setIsAppBarVisible(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChangeBookmark = () => {
    const location = getCurrentLocation();
    if (!location) {
      return;
    }
    if (isBookmarked) {
      const bookmark = bookmarks.find(
        item =>
          item.location.start.cfi === location?.start.cfi &&
          item.location.end.cfi === location?.end.cfi
      );
      if (!bookmark) {
        return;
      }
      removeBookmark(bookmark);
    } else {
      addBookmark(location);
    }
  };

  return (
    <Appbar.Header mode="center-aligned" style={styles.appBar}>
      <Appbar.BackAction
        onPress={() => {
          router.back();
        }}
      />
      <Appbar.Content title={title} />
      <Appbar.Action
        icon={isBookmarked ? 'bookmark' : 'bookmark-outline'}
        animated={false}
        onPress={handleChangeBookmark}
      />
      <Appbar.Action
        icon={({ size, color }) => <FontAwesome name="gear" size={size} color={color} />}
        animated={false}
        onPress={() => setIsSettingsVisible(true)}
      />
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  appBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1000,
    width: '100%',
  },
});

export default EpubReaderHeader;
