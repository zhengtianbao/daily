import { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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
  const [selectedBackground, setSelectedBackground] = useState('#CCE8CF');

  const paperTheme = useTheme();
  const styles = getStyles(paperTheme);

  const defaultTheme = { ...theme, body: { ...theme.body, background: selectedBackground } };

  const fonts = [
    'SpaceMono',
    'Roboto',
    'Menbere',
    'JetBrainsMono',
    'Manufacturing',
    'DancingScript',
  ];

  const backgroundColors = [
    '#CCE8CF', // 浅绿色
    '#F5F5DC', // 米白色
    '#FFF8DC', // 玉米丝色
    '#F0F8FF', // 爱丽丝蓝
    '#FDF5E6', // 老式花边色
    '#F5F5F5', // 白烟色
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

  const handleBackgroundSelected = (color: string) => {
    setSelectedBackground(color);
    changeTheme({
      ...theme,
      body: { ...theme.body, background: color },
      '* p': { 'font-family': selectedFont + ' !important' },
    });
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

        <View style={styles.rowContainer}>
          <Text variant="labelMedium" style={styles.label}>
            Background:{' '}
          </Text>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
            {backgroundColors.map((color, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleBackgroundSelected(color)}
                style={[
                  styles.backgroundColorCircle,
                  { backgroundColor: color },
                  selectedBackground === color && styles.selectedBackgroundCircle,
                ]}>
                {selectedBackground === color && <MaterialCommunityIcons name="check" size={20} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
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
    backgroundColorCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginHorizontal: 5,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedBackgroundCircle: {
      borderColor: theme.colors.primary,
      borderWidth: 3,
    },
  });

export default Settings;
