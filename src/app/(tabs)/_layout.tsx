import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

const TabsNavigation = () => {
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}>
        <Tabs.Screen
          name="(sentences)"
          options={{
            title: 'Sentences',
            tabBarIcon: ({ color }) => <FontAwesome name="heart" size={20} color={color} />,
          }}
        />
        <Tabs.Screen
          name="bookshelf"
          options={{
            title: 'bookshelf',
            tabBarIcon: ({ color }) => <FontAwesome name="book" size={20} color={color} />,
          }}
        />
      </Tabs>
    </>
  );
};

export default TabsNavigation;
