import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { IconButton, Modal, Portal, Text, TextInput } from 'react-native-paper';

import { debounce } from 'lodash';

import { WordInfo } from '@/db/dictionary';
import { client as TmtClient } from '@/modules/bookshelf/services/translators/tencent';
import { getCompletionStream } from '@/services/openai/deepseek';

const Assistant = ({
  visible,
  setVisible,
  pressY,
  selectedWord,
  selectedWordSentence,
}: {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  pressY: number;
  selectedWord: WordInfo;
  selectedWordSentence: string;
}) => {
  const [wordInfoActiveTab, setWordInfoActiveTab] = useState('word');
  const [selectedWordSentenceTranslation, setSelectedWordSentenceTranslation] = useState<
    string | undefined
  >(undefined);
  const [prompt, setPrompt] = useState('请分析句子的语法');
  const [response, setResponse] = useState('');
  const responseScrollViewRef = useRef<ScrollView>(null);

  const { width, height } = useWindowDimensions();

  const translateSentence = useCallback(async () => {
    try {
      if (!selectedWordSentence) {
        return;
      }

      const translationsNew = await TmtClient.getTranslationFromAPI(
        selectedWordSentence,
        'en',
        'zh'
      );

      setSelectedWordSentenceTranslation(translationsNew.Response.TargetText);
    } catch (error) {
      console.log('Error fetching translation:', error);
    }
  }, [selectedWordSentence]);

  const debouncedTranslateSentence = debounce(translateSentence, 1000);

  const handleInputChange = (text: string) => {
    setPrompt(text);
  };

  const handleSubmit = async () => {
    setResponse('');
    try {
      const question = selectedWordSentence + prompt;
      await getCompletionStream(question, chunk => {
        setResponse(prev => prev + chunk);
      });
    } catch (error) {
      console.error('Error getting completion:', error);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={() => {
          setVisible(false);
          setWordInfoActiveTab('word');
        }}
        contentContainerStyle={[
          styles.wordInfoModal,
          {
            top: pressY < height / 2 ? pressY + 40 : 40,
            left: width * 0.1,
            width: width * 0.8,
          },
        ]}>
        {/* Tab Buttons */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, wordInfoActiveTab === 'word' && styles.activeTab]}
            onPress={() => setWordInfoActiveTab('word')}>
            <Text style={[styles.tabText, wordInfoActiveTab === 'word' && styles.activeTabText]}>
              单词翻译
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, wordInfoActiveTab === 'sentence' && styles.activeTab]}
            onPress={() => {
              debouncedTranslateSentence();
              setWordInfoActiveTab('sentence');
            }}>
            <Text
              style={[styles.tabText, wordInfoActiveTab === 'sentence' && styles.activeTabText]}>
              整句翻译
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, wordInfoActiveTab === 'ai' && styles.activeTab]}
            onPress={() => setWordInfoActiveTab('ai')}>
            <Text style={[styles.tabText, wordInfoActiveTab === 'ai' && styles.activeTabText]}>
              AI助手
            </Text>
          </TouchableOpacity>
        </View>

        {wordInfoActiveTab === 'word' && (
          <ScrollView style={styles.contentContainer}>
            <View>
              <View>
                <Text>{selectedWord?.word}</Text>
                <Text>{'[' + selectedWord?.phonetic + ']'}</Text>
              </View>
              <View>
                <Text>{selectedWord?.definition}</Text>
              </View>
              <View>
                <Text>{selectedWord?.translation}</Text>
              </View>
            </View>
          </ScrollView>
        )}
        {wordInfoActiveTab === 'sentence' && (
          <ScrollView style={styles.contentContainer}>
            <View>
              <View>
                <Text>{selectedWordSentence}</Text>
              </View>
              <View>
                <Text>{selectedWordSentenceTranslation}</Text>
              </View>
            </View>
          </ScrollView>
        )}
        {wordInfoActiveTab === 'ai' && (
          <>
            <ScrollView
              ref={responseScrollViewRef}
              onContentSizeChange={() =>
                responseScrollViewRef.current?.scrollToEnd({ animated: true })
              }
              style={styles.contentContainer}>
              <View>
                <Markdown>{response}</Markdown>
              </View>
            </ScrollView>
            <View style={styles.inputContainer}>
              <TextInput
                value={prompt}
                mode="outlined"
                style={styles.textInput}
                onChangeText={handleInputChange}
              />
              <IconButton
                icon="rocket"
                mode="contained-tonal"
                size={16}
                style={styles.iconButton}
                onPress={handleSubmit}
              />
            </View>
          </>
        )}
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wordInfoModal: {
    position: 'absolute',
    backgroundColor: 'white',
    padding: 10,
    width: '80%',
    height: '40%',
    borderRadius: 10,
    zIndex: 1000,
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
});

export default Assistant;
