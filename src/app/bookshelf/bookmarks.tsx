import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Appbar, IconButton, MD3Colors, Text } from 'react-native-paper';

import { router, useLocalSearchParams } from 'expo-router';

import { useReader } from '@/vendor/epubjs-react-native/src';

const BookMarks = () => {
  const { bookTitle } = useLocalSearchParams<{
    bookTitle: string;
  }>();
  const { bookmarks, removeBookmark, goToLocation } = useReader();
  return (
    <View>
      <Appbar.Header mode="center-aligned">
        <Appbar.BackAction
          onPress={() => {
            router.back();
          }}
        />
        <Appbar.Content title={bookTitle} />
      </Appbar.Header>
      <View>
        {bookmarks.map(bookmark => (
          <View key={bookmark.id} style={styles.bookmarkContainer}>
            <TouchableOpacity
              style={styles.bookmarkInfo}
              onPress={() => {
                console.log(bookmark.location.start.cfi);
                goToLocation(bookmark.location.start.cfi);
                router.back();
              }}>
              <View style={styles.bookmarkIcon}>
                <IconButton icon="bookmark" size={20} />

                <Text
                  style={{
                    ...styles.bookmarkLocationNumber,
                  }}
                  variant="labelSmall">
                  {bookmark.location.start.location}
                </Text>
              </View>

              <View style={styles.bookmarkInfoText}>
                <Text
                  numberOfLines={1}
                  style={{
                    marginBottom: 2,
                  }}>
                  Chapter: {bookmark.section?.label}
                </Text>

                <Text
                  numberOfLines={2}
                  style={{
                    fontStyle: 'italic',
                  }}>
                  &quot;{bookmark.text}&quot;
                </Text>
              </View>
            </TouchableOpacity>

            <IconButton
              icon="trash-can-outline"
              size={20}
              iconColor={MD3Colors.error50}
              onPress={() => {
                removeBookmark(bookmark);
              }}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bookmarkContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  bookmarkInfo: {
    flexDirection: 'row',
  },
  bookmarkInfoText: {
    width: '80%',
  },
  title: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookmarkIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkLocationNumber: {
    marginTop: -12,
  },
});

export default BookMarks;
