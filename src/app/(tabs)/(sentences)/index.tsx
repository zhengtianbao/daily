import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Appbar, Button, Modal, Portal, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import library from '@/assets/data/library.json';

const SentencesScreen = () => {
  const [libraryIndex, setLibraryIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const hideModal = () => setShowModal(false);
  const randomLibrary = () => {
    setLibraryIndex(Math.floor(Math.random() * library.length));
  };

  useEffect(() => {
    randomLibrary();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Sentences" />
      </Appbar.Header>
      <Portal>
        <Modal
          visible={showModal}
          onDismiss={hideModal}
          contentContainerStyle={styles.modalContainer}>
          <Pressable onPress={() => setShowTranslation(true)}>
            <Text variant="bodyLarge">{library[libraryIndex].en}</Text>
          </Pressable>
          {showTranslation && <Text variant="bodyLarge">{library[libraryIndex].cn}</Text>}
          <View style={styles.buttonRow}>
            <Button onPress={() => setShowTranslation(true)}>translate</Button>
            <Button
              onPress={() => {
                randomLibrary();
                setShowTranslation(false);
              }}>
              next
            </Button>
            <Button onPress={hideModal}>got it</Button>
          </View>
        </Modal>
      </Portal>
      <Button onPress={() => setShowModal(true)}>
        <Text variant="displayLarge">pick</Text>
      </Button>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    justifyContent: 'center',
    padding: 10,
    backgroundColor: 'white',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    margin: 10,
  },
});

export default SentencesScreen;
