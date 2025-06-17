import { Book, database } from '@/store/database';
import { DOMParser } from '@xmldom/xmldom';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import JSZip from 'jszip';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Appbar, Button, Menu, Modal, Portal, Searchbar, Snackbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatGrid } from 'react-native-super-grid';

const BookPlaceholderImage = require('@/assets/images/cover-default-book.png');

interface BookInfo {
  title: string;
  author: string;
  uri: string;
  cover: string | null;
}

const Bookshelf = () => {
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

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
    setSnackbarVisible(true);
    setToastMessage(message);
  };

  const getBookInfoFromEpubFile = async (uri: string) => {
    let bookInfo: BookInfo = {
      title: '',
      author: '',
      uri: uri,
      cover: null,
    };

    const file = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });
    const zip = await JSZip.loadAsync(file, { base64: true });
    const containerXml = await zip.file('META-INF/container.xml')?.async('string');
    if (!containerXml) {
      console.log('container.xml not found');
      return bookInfo;
    }
    const containerDoc = new DOMParser().parseFromString(containerXml, 'application/xml');
    const rootfilePath = containerDoc.getElementsByTagName('rootfile')[0].getAttribute('full-path');
    const opfXml = await zip.file(rootfilePath!)?.async('string');
    if (!opfXml) {
      console.log('OPF file not found');
      return bookInfo;
    }
    const opfDoc = new DOMParser().parseFromString(opfXml, 'application/xml');

    const title = opfDoc.getElementsByTagName('dc:title')[0].textContent || '';
    if (title) {
      bookInfo.title = title;
    }
    const author = opfDoc.getElementsByTagName('dc:creator')[0].textContent || '';
    bookInfo.author = author;

    const metaElements = opfDoc.getElementsByTagName('meta');
    let coverId: string | null = null;
    for (let i = 0; i < metaElements.length; i++) {
      const meta = metaElements[i];
      if (meta.getAttribute('name') === 'cover') {
        coverId = meta.getAttribute('content');
        break;
      }
    }

    if (!coverId) {
      console.log('Cover ID not found');
      return bookInfo;
    }

    const itemElements = opfDoc.getElementsByTagName('item');
    let coverHref: string | null = null;
    let mediaType: string | null = null;

    for (let i = 0; i < itemElements.length; i++) {
      const item = itemElements[i];
      if (item.getAttribute('id') === coverId) {
        coverHref = item.getAttribute('href');
        mediaType = item.getAttribute('media-type');
        break;
      }
    }

    if (!coverHref || !mediaType) {
      console.log('Cover image href or media type not found');
      return bookInfo;
    }

    const opfBasePath = rootfilePath!.substring(0, rootfilePath!.lastIndexOf('/') + 1);
    const coverPath = opfBasePath + coverHref;

    const imageBlob = await zip.file(coverPath)?.async('base64');

    if (!imageBlob) {
      console.log('Cover image not found in zip');
      return bookInfo;
    }
    bookInfo.cover = `data:${mediaType};base64,${imageBlob}`;
    return bookInfo;
  };

  const importBook = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/epub+zip',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const book = await getBookInfoFromEpubFile(result.assets[0].uri);
        if (book.title === '') {
          book.title = result.assets[0].name.replace('.epub', '');
        }
        console.log(book.title, book.author, book.uri);
        const id = await database.insertBook({
          title: book.title,
          author: book.author,
          uri: book.uri,
          cover: book.cover,
          updateDate: new Date(),
          lastreadDate: new Date(),
          currentLocation: null,
          progress: 0,
        });
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
    setMenuVisible(false);
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
    setModalVisible(false);
  };

  const onBookPressed = (item: Book) => {
    router.navigate({
      pathname: '/bookshelf/bookReader',
      params: { bookUri: item.uri, bookTitle: item.title },
    });
  };

  const onBookLongPressed = (item: Book) => {
    console.log(item.title, 'long pressed');
    setModalVisible(true);
    setSelectedBook(item);
  };

  const BookItem = ({ item }: { item: Book }) => {
    return (
      <Pressable
        onPress={() => {
          onBookPressed(item);
        }}
        onLongPress={() => {
          onBookLongPressed(item);
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

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        {!searchVisible ? (
          <>
            <Appbar.Content title="Bookshelf" />
            <Appbar.Action icon="magnify" onPress={() => setSearchVisible(true)} />
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={<Appbar.Action icon="dots-vertical" onPress={() => setMenuVisible(true)} />}>
              <Menu.Item onPress={importBook} title="Import book" />
            </Menu>
          </>
        ) : (
          <Searchbar
            placeholder="Search book"
            value={searchQuery}
            onChangeText={query => {
              setSearchQuery(query);
            }}
            onClearIconPress={() => {
              setSearchQuery('');
              setSearchVisible(!searchVisible);
            }}
          />
        )}
      </Appbar.Header>

      <View style={styles.body}>
        <FlatGrid
          itemDimension={120}
          data={filteredBooks}
          style={styles.gridView}
          spacing={5}
          fixed
          renderItem={BookItem}
        />
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={1000}>
        {toastMessage}
      </Snackbar>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
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
