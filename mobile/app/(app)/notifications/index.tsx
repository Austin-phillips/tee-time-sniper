import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";

interface Notification {
  id: string;
  course_name: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    setNotifications(data ?? []);
    setLoading(false);
    setRefreshing(false);

    // Mark all unread as read
    const unreadIds = (data ?? [])
      .filter((n: Notification) => !n.read)
      .map((n: Notification) => n.id);

    if (unreadIds.length > 0) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .in("id", unreadIds);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  function handleRefresh() {
    setRefreshing(true);
    fetchNotifications();
  }

  function formatTimestamp(isoString: string) {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#16a34a"
          />
        }
        ListHeaderComponent={
          <View className="mb-5">
            <Text className="text-2xl font-bold">Notifications</Text>
            <Text className="text-sm text-muted-foreground mt-0.5">
              Your tee time alert history
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="rounded-2xl border-2 border-dashed border-border p-10 items-center">
            <Ionicons
              name="notifications-off-outline"
              size={48}
              color="#9ca3af"
            />
            <Text className="text-lg font-medium mb-2 mt-4">
              No notifications yet
            </Text>
            <Text className="text-muted-foreground text-center">
              When we find tee times matching your alerts, they'll show up here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/notifications/[id]",
                params: { id: item.id, courseName: item.course_name },
              })
            }
          >
            <View
              className={`rounded-2xl bg-white p-4 shadow-sm mb-3 ${
                !item.read ? "border-l-4 border-l-green-500" : ""
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-base font-semibold">{item.title}</Text>
                  <Text className="text-sm text-muted-foreground mt-1">
                    {item.body}
                  </Text>
                  <Text className="text-xs text-gray-400 mt-2">
                    {formatTimestamp(item.created_at)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
