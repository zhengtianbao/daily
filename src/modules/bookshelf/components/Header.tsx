import { StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';

import { router } from 'expo-router';

import FontAwesome from '@expo/vector-icons/FontAwesome';

const Header = ({ title, action }: { title: string; action: () => void }) => {
  return (
    <Appbar.Header style={styles.appBar}>
      <Appbar.Content title={title} />
      <Appbar.BackAction
        onPress={() => {
          router.back();
        }}
      />
      <Appbar.Action
        icon={({ size, color }) => <FontAwesome name="gear" size={size} color={color} />}
        onPress={action}
      />
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  appBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1000,
    width: '100%',
  },
});

export default Header;
