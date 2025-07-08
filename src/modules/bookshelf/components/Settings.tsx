import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, IconButton, Modal, Portal, ProgressBar, Text } from 'react-native-paper';

import { ReaderState, useReaderStore } from '@/modules/bookshelf/store/reader';
import { useReader } from '@/vendor/epubjs-react-native/src';

const Settings = () => {
  const isSettingsVisible = useReaderStore((state: ReaderState) => state.isSettingsVisible);
  const setIsSettingsVisible = useReaderStore((state: ReaderState) => state.setIsSettingsVisible);
  const { changeFontSize, changeTheme, theme } = useReader();
  const [selectedFont, setSelectedFont] = useState('');
  const [selectedFontSize, setSelectedFontSize] = useState(20);

  const defaultTheme = { ...theme, body: { ...theme.body, background: '#CCE8CF' } };

  const fonts = [
    'SpaceMono',
    'Roboto',
    'Menbere',
    'JetBrainsMono',
    'Manufacturing',
    'DancingScript',
  ];

  const handleFontSelected = (fontName: string) => {
    setSelectedFont(fontName);
    changeTheme({
      ...defaultTheme,
      '* p': { 'font-family': fontName + ' !important' },
    });
  };

  const handleFontSizeChange = (delta: number) => {
    const newSize = selectedFontSize + delta;
    if (newSize >= 10 && newSize <= 30) {
      setSelectedFontSize(newSize);
      changeFontSize(newSize.toString() + 'px');
    }
  };

  return (
    <Portal>
      <Modal
        visible={isSettingsVisible}
        onDismiss={() => setIsSettingsVisible(false)}
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
                  onPress={() => handleFontSelected(font)}
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
                disabled={selectedFontSize <= 10}
                onPress={() => handleFontSizeChange(-2)}
                style={[
                  styles.sizeButton,
                  selectedFontSize <= 10 && styles.disabledButton,
                ]}></IconButton>

              <View style={styles.progressWrapper}>
                <ProgressBar
                  progress={(selectedFontSize - 10) / 20}
                  color="#2196F3"
                  style={styles.progressBar}
                />
              </View>

              <IconButton
                icon="format-annotation-plus"
                size={20}
                mode="outlined"
                disabled={selectedFontSize >= 30}
                onPress={() => handleFontSizeChange(2)}
                style={[
                  styles.sizeButton,
                  selectedFontSize >= 30 && styles.disabledButton,
                ]}></IconButton>
            </View>
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modal: {
    backgroundColor: 'white',
    padding: 10,
    width: '90%',
    alignSelf: 'center',
    borderRadius: 10,
  },
  contentContainer: {
    padding: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
  },
  textInput: {
    height: 20,
    width: '80%',
  },
  iconButton: {
    height: 20,
    width: '10%',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 5,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6200ee',
  },
  tabText: {
    fontSize: 14,
    color: '#333',
  },
  activeTabText: {
    color: '#6200ee',
    fontWeight: 'bold',
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
  },
});

export default Settings;
