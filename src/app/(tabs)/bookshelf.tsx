import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Appbar, Button, Menu, Modal, Portal, Searchbar, Snackbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatGrid } from 'react-native-super-grid';

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';

import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

import { Book, database } from '@/db/database';
import { getEpubMetadataFromFile } from '@/helpers/epub';

const BookPlaceholderImage = require('@/assets/images/cover-default-book.png');

const Bookshelf = () => {
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [isSnackbarVisible, setIsSnackbarVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const searchQueryFilteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    loadBooksFromDB();
  }, []);

  const loadBooksFromDB = async () => {
    try {
      const savedBooks = await database.getAllBooks();
      setBooks(savedBooks);
    } catch (error) {
      console.error('Error loading books:', error);
    }
  };

  const showSnackBar = (message: string) => {
    setToastMessage(message);
    setIsSnackbarVisible(true);
  };

  const importBook = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/epub+zip',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const metadata = await getEpubMetadataFromFile(result.assets[0].uri);
        const book: Book = {
          title: metadata.title || result.assets[0].name.replace('.epub', ''),
          author: metadata.author || 'Unknown',
          uri: result.assets[0].uri,
          cover: metadata.cover || null,
          updateDate: new Date(),
          lastreadDate: new Date(),
          currentLocation: null,
          progress: 0,
        };

        const id = await database.insertBook(book);
        if (id === 0) {
          showSnackBar('Book already exists!');
          return;
        }
        await loadBooksFromDB();
        showSnackBar('Book imported successfully!');
      }
    } catch (error) {
      console.error('Error importing book:', error);
      showSnackBar('Book import failed!');
    }
    setIsMenuVisible(false);
  };

  const removeBook = async (book: Book) => {
    try {
      await database.deleteBook(book.title);
      const fileInfo = await FileSystem.getInfoAsync(book.uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(book.uri);
      }
      await loadBooksFromDB();
      showSnackBar('Book removed successfully!');
    } catch (error) {
      console.error('Error removing book:', error);
      showSnackBar('Book remove failed!');
    }
    setIsModalVisible(false);
  };

  const onBookItemPressed = (item: Book) => {
    router.navigate({
      pathname: '/bookshelf/reader',
      params: { bookUri: item.uri, bookTitle: item.title },
    });
  };

  const onBookItemLongPressed = (item: Book) => {
    setSelectedBook(item);
    setIsModalVisible(true);
  };

  const BookItem = ({ item }: { item: Book }) => {
    return (
      <Pressable
        onPress={() => {
          onBookItemPressed(item);
        }}
        onLongPress={() => {
          onBookItemLongPressed(item);
        }}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
        <View style={styles.bookItem}>
          <View style={styles.bookCover}>
            {!item.cover ? (
              <Image source={BookPlaceholderImage} style={styles.bookCover} />
            ) : (
              <Image source={{ uri: item.cover }} style={styles.bookCover} />
            )}
          </View>
          <View style={styles.bookInfo}>
            <Text variant="labelSmall" numberOfLines={2} ellipsizeMode="tail">
              {item.title}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {!isSearchBarVisible ? (
        <Appbar.Header>
          <Appbar.Content title="Bookshelf" />
          <Appbar.Action icon="magnify" onPress={() => setIsSearchBarVisible(true)} />
          <Menu
            visible={isMenuVisible}
            onDismiss={() => setIsMenuVisible(false)}
            anchor={<Appbar.Action icon="dots-vertical" onPress={() => setIsMenuVisible(true)} />}>
            <Menu.Item
              leadingIcon={({ size, color }) => (
                <FontAwesome6 name="file-import" size={size} color={color} />
              )}
              onPress={importBook}
              title="Import book"
            />
          </Menu>
        </Appbar.Header>
      ) : (
        <Appbar.Header>
          <Searchbar
            placeholder="Search book"
            value={searchQuery}
            onChangeText={query => {
              setSearchQuery(query);
            }}
            onClearIconPress={() => {
              setSearchQuery('');
              setIsSearchBarVisible(false);
            }}
          />
        </Appbar.Header>
      )}

      <View style={styles.body}>
        <FlatGrid
          itemDimension={120}
          data={searchQueryFilteredBooks}
          style={styles.gridView}
          spacing={5}
          fixed
          renderItem={BookItem}
        />
      </View>

      <Snackbar
        visible={isSnackbarVisible}
        onDismiss={() => setIsSnackbarVisible(false)}
        duration={1000}>
        {toastMessage}
      </Snackbar>

      <Portal>
        <Modal
          visible={isModalVisible}
          onDismiss={() => setIsModalVisible(false)}
          contentContainerStyle={styles.modalContainerStyle}>
          <Text>{selectedBook?.title}</Text>
          <Button
            onPress={() => {
              removeBook(selectedBook!);
            }}>
            Delete book
          </Button>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  gridView: {
    flex: 1,
    marginTop: 10,
  },
  bookItem: {
    borderRadius: 8,
    width: 120,
    height: 200,
    alignItems: 'center',
  },
  bookCover: {
    width: 100,
    height: 160,
    backgroundColor: 'aliceblue',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    borderRadius: 5,
  },
  bookInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainerStyle: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
});

export default Bookshelf;
