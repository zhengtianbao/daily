import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  IconButton,
  MD3Theme,
  Modal,
  Portal,
  ProgressBar,
  Text,
  useTheme,
} from 'react-native-paper';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ReaderState, useReaderStore } from '@/modules/bookshelf/store/reader';
import { useReader } from '@/vendor/epubjs-react-native/src';

const Settings = () => {
  const isSettingsVisible = useReaderStore((state: ReaderState) => state.isSettingsVisible);
  const setIsSettingsVisible = useReaderStore((state: ReaderState) => state.setIsSettingsVisible);

  const { changeFontSize, changeTheme, theme } = useReader();
  const [selectedFont, setSelectedFont] = useState('');
  const [selectedFontSize, setSelectedFontSize] = useState(20);

  const paperTheme = useTheme();
  const styles = getStyles(paperTheme);

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
        contentContainerStyle={styles.modalContentContainer}>
        <View style={styles.rowContainer}>
          <Text variant="titleMedium">Settings</Text>
        </View>

        <View style={styles.rowContainer}>
          <Text variant="labelMedium" style={styles.label}>
            Font:{' '}
          </Text>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
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

        <View style={styles.rowContainer}>
          <Text variant="labelMedium" style={styles.label}>
            Font Size:{' '}
          </Text>
          <View style={styles.fontSizeProgressContainer}>
            <IconButton
              icon={({ size, color }) => (
                <MaterialCommunityIcons
                  name="format-font-size-decrease"
                  size={size}
                  color={color}
                />
              )}
              mode="outlined"
              disabled={selectedFontSize <= 10}
              onPress={() => handleFontSizeChange(-2)}
              style={[
                styles.fontSizeChangeButton,
                selectedFontSize <= 10 && styles.disabledFontSizeChangeButton,
              ]}></IconButton>

            <View style={styles.progressBarWrapper}>
              <ProgressBar progress={(selectedFontSize - 10) / 20} style={styles.progressBar} />
            </View>

            <IconButton
              icon={({ size, color }) => (
                <MaterialCommunityIcons
                  name="format-font-size-increase"
                  size={size}
                  color={color}
                />
              )}
              mode="outlined"
              disabled={selectedFontSize >= 30}
              onPress={() => handleFontSizeChange(2)}
              style={[
                styles.fontSizeChangeButton,
                selectedFontSize >= 30 && styles.disabledFontSizeChangeButton,
              ]}></IconButton>
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

const getStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    modalContentContainer: {
      width: '90%',
      alignSelf: 'center',
      backgroundColor: theme.colors.background,
      padding: 10,
      borderRadius: 10,
    },
    rowContainer: {
      margin: 5,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    label: {
      minWidth: 80,
    },
    fontButton: {
      marginHorizontal: 5,
    },
    fontSizeProgressContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    fontSizeChangeButton: {
      minWidth: 32,
      height: 32,
    },
    disabledFontSizeChangeButton: {
      opacity: 0.3,
    },
    progressBarWrapper: {
      flex: 1,
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
    },
  });

export default Settings;
