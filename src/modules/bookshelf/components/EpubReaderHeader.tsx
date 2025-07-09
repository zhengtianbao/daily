import { StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';

import { router } from 'expo-router';

import FontAwesome from '@expo/vector-icons/FontAwesome';

import { ReaderState, useReaderStore } from '@/modules/bookshelf/store/reader';

const EpubReaderHeader = ({ title }: { title: string }) => {
  const setIsAppBarVisible = useReaderStore((state: ReaderState) => state.setIsAppBarVisible);
  const setIsSettingsVisible = useReaderStore((state: ReaderState) => state.setIsSettingsVisible);

  return (
    <Appbar.Header mode="center-aligned" style={styles.appBar}>
      <Appbar.BackAction
        onPress={() => {
          setIsSettingsVisible(false);
          setIsAppBarVisible(false);
          router.back();
        }}
      />
      <Appbar.Action
        icon="format-list-bulleted-square"
        animated={false}
        onPress={() => {
          router.navigate({
            pathname: '/bookshelf/toc',
            params: { bookTitle: title },
          });
        }}
      />
      <Appbar.Content title={title} />
      <Appbar.Action icon="bookmark" animated={false} onPress={() => {}} />
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
