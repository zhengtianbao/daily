import { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

import { useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';

import { WordInfo, dictionary } from '@/db/dictionary';
import Assistant from '@/modules/bookshelf/components/Assistant';
import EpubReader from '@/modules/bookshelf/components/EpubReader';
import EpubReaderHeader from '@/modules/bookshelf/components/EpubReaderHeader';
import Settings from '@/modules/bookshelf/components/Settings';

const Reader = () => {
  const { bookUri, bookTitle } = useLocalSearchParams<{
    bookUri: string;
    bookTitle: string;
  }>();

  const [isAppBarVisible, setIsAppBarVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isAssistantVisible, setIsAssistantVisible] = useState(false);

  const [pressY, setPressY] = useState(0);
  const [selectedWord, setSelectedWord] = useState<WordInfo>();
  const [selectedWordSentence, setSelectedWordSentence] = useState<string | undefined>(undefined);

  const onWordSelected = async (
    selection: string,
    cfiRange: string,
    paragraph: string,
    sentence: string
  ) => {
    console.log('word selected:', selection);
    console.log('cfiRange:', cfiRange);
    console.log('paragraph:', paragraph);
    console.log('sentence:', sentence);
    if (selection.includes(' ')) {
      return;
    }
    try {
      const wordInfo = await dictionary.getWordInfoByWord(selection);
      // console.log('WordInfo: ', wordInfo);
      if (wordInfo) {
        setSelectedWord(wordInfo);
        setSelectedWordSentence(sentence);
        setIsAssistantVisible(true);
        Speech.speak(selection);
      }
    } catch (error) {
      console.error('Error fetching translation:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {isAppBarVisible && (
        <EpubReaderHeader
          title={bookTitle}
          action={() => setIsSettingsVisible(true)}></EpubReaderHeader>
      )}

      <EpubReader
        bookTitle={bookTitle}
        bookUri={bookUri}
        onSwipeUp={() => {
          setIsAppBarVisible(false);
        }}
        onSwipeDown={() => {
          setIsAppBarVisible(true);
        }}
        onSelected={onWordSelected}
        onLongPress={e => {
          if (e) {
            setPressY(e.absoluteY);
          }
        }}></EpubReader>

      {isSettingsVisible && (
        <Settings visible={isSettingsVisible} setVisible={setIsSettingsVisible}></Settings>
      )}

      {isAssistantVisible && (
        <Assistant
          visible={isAssistantVisible}
          setVisible={setIsAssistantVisible}
          pressY={pressY}
          selectedWord={selectedWord as WordInfo}
          selectedWordSentence={selectedWordSentence as string}></Assistant>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Reader;
