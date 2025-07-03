import { Tabs, usePathname } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

const TabsNavigation = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: usePathname() === '/bookshelf/bookReader' ? 'none' : 'flex',
        },
      }}>
      <Tabs.Screen
        name="(sentences)"
        options={{
          title: 'sentences',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookshelf"
        options={{
          title: 'bookshelf',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'book-sharp' : 'book-outline'} color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsNavigation;
