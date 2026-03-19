import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export default function TabLayout() {
  const tabBg = useThemeColor({ light: '#fff', dark: '#151718' }, 'background');
  const active = '#0a7ea4';
  const inactive = useThemeColor({ light: '#888', dark: '#9BA1A6' }, 'icon');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: tabBg, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.07)', height: 72, paddingBottom: 10 },
        tabBarActiveTintColor: active,
        tabBarInactiveTintColor: inactive,
        tabBarLabelStyle: { fontSize: 13, fontWeight: '700', marginTop: -2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <View style={{ marginTop: 4 }}>
              <View style={{ width: 26, height: 26, justifyContent: 'center', alignItems: 'center' }}>
                {/* Home icon */}
                <View style={[styles.homeIconRoof, { borderBottomColor: color }]} />
                <View style={[styles.homeIconBase, { borderColor: color }]} />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => (
            <View style={{ marginTop: 4 }}>
              <View style={{ width: 26, height: 26, justifyContent: 'center', alignItems: 'center' }}>
                {/* Chart icon */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
                  <View style={{ width: 6, height: 10, backgroundColor: color, borderRadius: 2 }} />
                  <View style={{ width: 6, height: 16, backgroundColor: color, borderRadius: 2 }} />
                  <View style={{ width: 6, height: 22, backgroundColor: color, borderRadius: 2 }} />
                </View>
              </View>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  homeIconRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: -1,
  },
  homeIconBase: {
    width: 18,
    height: 12,
    borderWidth: 2,
    borderTopWidth: 0,
    borderRadius: 2,
  },
});
