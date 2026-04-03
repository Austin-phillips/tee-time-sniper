import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";

import { PreferenceCard } from "@/components/preference-card";

interface Preference {
  id: string;
  course_id: string;
  days_of_week: number[];
  earliest_time: string;
  latest_time: string;
  num_players: number;
  look_ahead_days: number;
  holes: number;
  active: boolean;
}

interface Course {
  id: string;
  name: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [courseMap, setCourseMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const [{ data: prefs }, { data: courses }] = await Promise.all([
      supabase
        .from("preferences")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("courses").select("id, name"),
    ]);

    setPreferences(prefs ?? []);
    setCourseMap(
      new Map((courses ?? []).map((c: Course) => [c.id, c.name]))
    );
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  function handleRefresh() {
    setRefreshing(true);
    fetchData();
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
        data={preferences}
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
          <View className="flex-row items-center justify-between mb-5">
            <View>
              <Text className="text-2xl font-bold">My Alerts</Text>
              <Text className="text-sm text-muted-foreground mt-0.5">
                Manage your tee time notifications
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/(app)/preferences/new")}
              className="bg-primary rounded-lg px-4 py-2.5"
            >
              <Text className="text-sm font-semibold text-white">
                + Add Alert
              </Text>
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          <View className="rounded-2xl border-2 border-dashed border-border p-10 items-center">
            <Text className="text-lg font-medium mb-2">No alerts yet</Text>
            <Text className="text-muted-foreground text-center mb-5">
              Create your first alert to get notified when tee times open up at
              your favorite courses.
            </Text>
            <Pressable
              onPress={() => router.push("/(app)/preferences/new")}
              className="bg-primary rounded-lg px-5 py-3"
            >
              <Text className="text-base font-semibold text-white">
                Create Your First Alert
              </Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <View className="mb-4">
            <PreferenceCard
              preference={item}
              courseName={courseMap.get(item.course_id) ?? "Unknown Course"}
              onRefresh={fetchData}
            />
          </View>
        )}
      />
    </View>
  );
}
