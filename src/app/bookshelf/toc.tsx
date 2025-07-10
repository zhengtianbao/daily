import { View } from 'react-native';
import { Appbar } from 'react-native-paper';

import { router, useLocalSearchParams } from 'expo-router';

import TreeView, { node, tree } from '@/components/TreeView';
import { Section as SectionType, useReader } from '@/vendor/epubjs-react-native/src';

interface extendedNode extends node {
  id: string;
  href: string;
  parent: string;
}

const TableOfContents = () => {
  const { bookTitle } = useLocalSearchParams<{
    bookTitle: string;
  }>();
  const { toc, section, goToLocation } = useReader();

  const dfs = (sections: SectionType[]) => {
    const result: tree = [];
    sections.forEach(section => {
      const node: extendedNode = {
        id: section.id,
        href: section.href,
        parent: section.parent,
        label: section.label.trim(),
        children: [],
      };
      if (section.subitems.length > 0) {
        node.children = dfs(section.subitems);
      }
      result.push(node);
    });
    return result;
  };

  const tree = dfs(toc);

  let currentSectionNode: node = {
    label: '',
    children: [],
  };
  if (section) {
    currentSectionNode = {
      label: section.label.trim(),
      children: [],
    };
  }

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
      <TreeView
        tree={tree}
        currentItem={currentSectionNode}
        onItemPress={item => {
          if (item.href.includes('/')) {
            goToLocation(item.href.split('/')[1]);
          } else {
            goToLocation(item.href);
          }
          router.back();
        }}
      />
    </View>
  );
};

export default TableOfContents;
