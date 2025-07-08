import { StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';

import { router } from 'expo-router';

import FontAwesome from '@expo/vector-icons/FontAwesome';

import { ReaderState, useReaderStore } from '@/modules/bookshelf/store/reader';

const EpubReaderHeader = ({ title }: { title: string }) => {
  const setIsSettingsVisible = useReaderStore((state: ReaderState) => state.setIsSettingsVisible);

  return (
    <Appbar.Header style={styles.appBar}>
      <Appbar.Content title={title} />
      <Appbar.BackAction
        onPress={() => {
          router.back();
        }}
      />
      <Appbar.Action
        icon={({ size, color }) => <FontAwesome name="gear" size={size} color={color} />}
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
