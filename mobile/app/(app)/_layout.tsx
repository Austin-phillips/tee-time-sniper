import { Pressable } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AppLayout() {
  const router = useRouter();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#16a34a",
        headerStyle: { backgroundColor: "#ffffff" },
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: "My Alerts",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tee-times/index"
        options={{
          title: "Tee Times",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications/index"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="reader-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Hidden from tabs */}
      <Tabs.Screen
        name="notifications/[id]"
        options={{
          href: null,
          title: "Tee Times Found",
          headerLeft: () => (
            <Pressable onPress={() => router.navigate("/notifications")} style={{ marginLeft: 12 }}>
              <Ionicons name="arrow-back" size={24} color="#16a34a" />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="preferences/new"
        options={{
          href: null,
          title: "New Alert",
        }}
      />
      <Tabs.Screen
        name="preferences/[id]"
        options={{
          href: null,
          title: "Edit Alert",
        }}
      />
    </Tabs>
  );
}
