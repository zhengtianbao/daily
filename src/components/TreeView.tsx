import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-paper';

import FontAwesome from '@expo/vector-icons/FontAwesome';

export interface node {
  [x: string]: any;
  label: string;
  children: node[];
}

export type tree = node[];

const MenuItem = ({
  depth,
  item,
  onItemPress,
}: {
  depth: number;
  item: node;
  onItemPress: (node: node) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasChildren = item.children && item.children.length > 0;

  const handleToggle = () => {
    setIsExpanded(prev => !prev);
  };

  return (
    <View>
      {hasChildren && isExpanded && (
        <TouchableOpacity onPress={handleToggle}>
          <View style={styles.item}>
            <View style={{ width: depth * 10 }} />
            <View style={styles.icon}>
              <Icon source={() => <FontAwesome name="caret-down" size={20} />} size={20} />
            </View>
            <Text style={styles.content}>{item.label}</Text>
          </View>
        </TouchableOpacity>
      )}
      {hasChildren && !isExpanded && (
        <TouchableOpacity onPress={handleToggle}>
          <View style={styles.item}>
            <View style={{ width: depth * 10 }} />
            <View style={styles.icon}>
              <Icon source={() => <FontAwesome name="caret-right" size={24} />} size={24} />
            </View>
            <Text style={styles.content}>{item.label}</Text>
          </View>
        </TouchableOpacity>
      )}
      {!hasChildren && (
        <TouchableOpacity
          onPress={() => {
            onItemPress(item);
          }}>
          <View style={styles.item}>
            <View style={{ width: depth * 10 }} />
            <View style={styles.icon} />
            <Text style={styles.content}>{item.label}</Text>
          </View>
        </TouchableOpacity>
      )}

      {hasChildren && isExpanded && (
        <MenuList depth={depth + 1} list={item.children} onItemPress={onItemPress} />
      )}
    </View>
  );
};

const MenuList = ({
  depth,
  list,
  onItemPress,
}: {
  depth: number;
  list: tree;
  onItemPress: (node: node) => void;
}) => {
  return (
    <View>
      {list.map((item, index) => (
        <MenuItem key={index} depth={depth} item={item} onItemPress={onItemPress} />
      ))}
    </View>
  );
};

const TreeView = ({ tree, onItemPress }: { tree: tree; onItemPress: (node: node) => void }) => {
  return (
    <ScrollView>
      <MenuList depth={1} list={tree} onItemPress={onItemPress} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  icon: {
    width: 24,
  },
  content: {
    fontWeight: 'bold',
    fontSize: 20,
    lineHeight: 30,
  },
});

export default TreeView;
