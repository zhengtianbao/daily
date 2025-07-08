import { useEffect } from 'react';
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
import { useSettingsStore } from '@/modules/bookshelf/store/settings';
import { useReader } from '@/vendor/epubjs-react-native/src';

const Settings = ({ title }: { title: string }) => {
  const isSettingsVisible = useReaderStore((state: ReaderState) => state.isSettingsVisible);
  const setIsSettingsVisible = useReaderStore((state: ReaderState) => state.setIsSettingsVisible);
  const { settings, setSettings, initializeSettings } = useSettingsStore();
  const { changeFontSize, changeTheme, theme } = useReader();

  useEffect(() => {
    initializeSettings(title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const paperTheme = useTheme();
  const styles = getStyles(paperTheme);

  const fonts = [
    'SpaceMono',
    'Roboto',
    'Menbere',
    'JetBrainsMono',
    'Manufacturing',
    'DancingScript',
  ];

  const backgroundColors = ['#CCE8CF', '#F5F5DC', '#FFF8DC', '#F0F8FF', '#FDF5E6', '#F5F5F5'];

  const handleFontSelected = (fontName: string) => {
    setSettings({
      ...settings,
      fontFamily: fontName,
    });
    changeTheme({
      ...theme,
      '* p': { 'font-family': fontName + ' !important' },
    });
  };

  const handleFontSizeChange = (delta: number) => {
    const newSize = settings.fontSize + delta;
    if (newSize >= 10 && newSize <= 30) {
      setSettings({
        ...settings,
        fontSize: newSize,
      });
      changeFontSize(newSize.toString() + 'px');
    }
  };

  const handleBackgroundSelected = (color: string) => {
    setSettings({
      ...settings,
      backgroundColor: color,
    });
    changeTheme({
      ...theme,
      body: { ...theme.body, background: color },
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
                  settings.backgroundColor === color && styles.selectedBackgroundCircle,
                ]}>
                {settings.backgroundColor === color && (
                  <MaterialCommunityIcons name="check" size={20} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.rowContainer}>
          <Text variant="labelMedium" style={styles.label}>
            Font:{' '}
          </Text>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
            {fonts.map((font, index) => (
              <Button
                key={index}
                mode={settings.fontFamily === font ? 'contained' : 'outlined'}
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
              disabled={settings.fontSize <= 10}
              onPress={() => handleFontSizeChange(-2)}
              style={[
                styles.fontSizeChangeButton,
                settings.fontSize <= 10 && styles.disabledFontSizeChangeButton,
              ]}></IconButton>

            <View style={styles.progressBarWrapper}>
              <ProgressBar progress={(settings.fontSize - 10) / 20} style={styles.progressBar} />
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
              disabled={settings.fontSize >= 30}
              onPress={() => handleFontSizeChange(2)}
              style={[
                styles.fontSizeChangeButton,
                settings.fontSize >= 30 && styles.disabledFontSizeChangeButton,
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
      marginTop: 10,
      marginBottom: 10,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    label: {
      minWidth: 80,
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
