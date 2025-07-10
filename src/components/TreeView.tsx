import { useMemo, useState } from 'react';
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
  isCurrentItem: boolean;
}

interface TreeViewProps {
  tree: tree;
  onItemPress: (node: node) => void;
  currentItem: node;
}

const TreeView = ({ tree, onItemPress, currentItem }: TreeViewProps) => {
  function generateId(node: node, depth: number, parentId?: string): string {
    return parentId ? `${parentId}-${node.label}-${depth}` : `${node.label}-${depth}`;
  }

  function containsCurrentItem(node: node, current: node): boolean {
    if (node.label === current.label) return true;
    if (node.children?.length > 0) {
      return node.children.some(child => containsCurrentItem(child, current));
    }
    return false;
  }

  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    const initialExpanded = new Set<string>();

    const addExpandedPaths = (nodes: tree, depth: number = 1, parentId?: string) => {
      nodes.forEach(node => {
        const id = generateId(node, depth, parentId);
        if (containsCurrentItem(node, currentItem)) {
          initialExpanded.add(id);
        }
        if (node.children?.length > 0) {
          addExpandedPaths(node.children, depth + 1, id);
        }
      });
    };

    addExpandedPaths(tree);
    return initialExpanded;
  });

  const flattenTree = (nodes: tree, depth: number = 1, parentId?: string): FlatListItem[] => {
    const result: FlatListItem[] = [];

    nodes.forEach(node => {
      const id = generateId(node, depth, parentId);
      const hasChildren = Boolean(node.children?.length);
      const isCurrentItem = node.label === currentItem.label;
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

  const flatData = useMemo(() => {
    return flattenTree(tree);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, expandedItems, currentItem]);

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

  const renderItem = ({ item }: { item: FlatListItem }) => {
    const { node, depth, isExpanded, hasChildren, isCurrentItem } = item;

    const itemStyle = [styles.item, isCurrentItem && styles.selectedItem];
    const textStyle = [styles.content, isCurrentItem && styles.selectedText];

    return (
      <TouchableOpacity
        onPress={() => (hasChildren ? handleToggle(item.id) : onItemPress(node))}
        activeOpacity={0.7}>
        <View style={itemStyle}>
          <View style={{ width: depth * 10 }} />
          <View style={styles.icon}>
            {hasChildren && (
              <Icon
                source={() => (
                  <FontAwesome name={isExpanded ? 'caret-down' : 'caret-right'} size={20} />
                )}
                size={20}
              />
            )}
          </View>
          <Text style={textStyle}>{node.label}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return <FlatList data={flatData} renderItem={renderItem} keyExtractor={item => item.id} />;
};

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    flex: 1,
  },
  selectedText: {
    color: '#1976d2',
  },
});

export default TreeView;
