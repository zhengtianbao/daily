import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-paper';

import FontAwesome from '@expo/vector-icons/FontAwesome';

export interface node {
  [x: string]: any;
  label: string;
  children: node[];
}

export type tree = node[];

interface FlatListItem {
  id: string;
  node: node;
  depth: number;
  isExpanded: boolean;
  hasChildren: boolean;
  isCurrentItem: boolean | undefined;
}

const TreeView = ({
  tree,
  onItemPress,
  currentItem,
}: {
  tree: tree;
  onItemPress: (node: node) => void;
  currentItem?: node;
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [flatData, setFlatData] = useState<FlatListItem[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const hasScrolledToCurrentItem = useRef(false);

  const generateId = (node: node, depth: number, parentId?: string): string => {
    return parentId ? `${parentId}-${node.label}-${depth}` : `${node.label}-${depth}`;
  };

  const containsCurrentItem = (node: node): boolean => {
    if (!currentItem) return false;
    if (node.label === currentItem.label) return true;
    if (node.children && node.children.length > 0) {
      return node.children.some(child => containsCurrentItem(child));
    }
    return false;
  };

  const flattenTree = (nodes: tree, depth: number = 1, parentId?: string): FlatListItem[] => {
    const result: FlatListItem[] = [];

    nodes.forEach(node => {
      const id = generateId(node, depth, parentId);
      const hasChildren = node.children && node.children.length > 0;
      const isCurrentItem = currentItem && node.label === currentItem.label;

      if (currentItem && containsCurrentItem(node)) {
        expandedItems.add(id);
      }

      const isExpanded = expandedItems.has(id);

      result.push({
        id,
        node,
        depth,
        isExpanded,
        hasChildren,
        isCurrentItem,
      });

      if (isExpanded && hasChildren) {
        result.push(...flattenTree(node.children, depth + 1, id));
      }
    });

    return result;
  };

  const updateFlatData = () => {
    const newFlatData = flattenTree(tree);
    setFlatData(newFlatData);

    if (currentItem && (isInitialLoad || !hasScrolledToCurrentItem.current)) {
      const currentIndex = newFlatData.findIndex(item => item.isCurrentItem);
      if (currentIndex !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: currentIndex,
            animated: true,
            viewPosition: 0.3,
          });
          hasScrolledToCurrentItem.current = true;
          setIsInitialLoad(false);
        }, 100);
      }
    }
  };

  const handleToggle = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  useEffect(() => {
    updateFlatData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, currentItem, expandedItems]);

  useEffect(() => {
    hasScrolledToCurrentItem.current = false;
  }, [currentItem]);

  const renderItem = ({ item }: { item: FlatListItem }) => {
    const { node, depth, isExpanded, hasChildren, isCurrentItem } = item;

    const itemStyle = [styles.item, isCurrentItem && styles.selectedItem];

    const textStyle = [styles.content, isCurrentItem && styles.selectedText];

    return (
      <View>
        {hasChildren && isExpanded && (
          <TouchableOpacity onPress={() => handleToggle(item.id)}>
            <View style={itemStyle}>
              <View style={{ width: depth * 10 }} />
              <View style={styles.icon}>
                <Icon source={() => <FontAwesome name="caret-down" size={20} />} size={20} />
              </View>
              <Text style={textStyle}>{node.label}</Text>
            </View>
          </TouchableOpacity>
        )}
        {hasChildren && !isExpanded && (
          <TouchableOpacity onPress={() => handleToggle(item.id)}>
            <View style={itemStyle}>
              <View style={{ width: depth * 10 }} />
              <View style={styles.icon}>
                <Icon source={() => <FontAwesome name="caret-right" size={24} />} size={24} />
              </View>
              <Text style={textStyle}>{node.label}</Text>
            </View>
          </TouchableOpacity>
        )}
        {!hasChildren && (
          <TouchableOpacity onPress={() => onItemPress(node)}>
            <View style={itemStyle}>
              <View style={{ width: depth * 10 }} />
              <View style={styles.icon} />
              <Text style={textStyle}>{node.label}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const getItemLayout = (data: any, index: number) => ({
    length: 50,
    offset: 50 * index,
    index,
  });

  return (
    <FlatList
      ref={flatListRef}
      data={flatData}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      getItemLayout={getItemLayout}
      onScrollToIndexFailed={info => {
        const wait = new Promise(resolve => setTimeout(resolve, 500));
        wait.then(() => {
          flatListRef.current?.scrollToIndex({
            index: info.index,
            animated: true,
            viewPosition: 0.3,
          });
        });
      }}
    />
  );
};

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  selectedItem: {
    backgroundColor: '#e3f2fd',
  },
  icon: {
    width: 24,
  },
  content: {
    fontWeight: 'bold',
    fontSize: 20,
    lineHeight: 30,
  },
  selectedText: {
    color: '#1976d2',
  },
});

export default TreeView;
