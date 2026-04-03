import { useState, useCallback } from "react";
import {
  View,
  Text,
  SectionList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";

interface MatchedTeeTime {
  id: string;
  course_name: string;
  tee_time: string;
  players_available: number;
  price: number;
  booking_url: string;
}

interface Section {
  title: string;
  data: MatchedTeeTime[];
}

export default function TeeTimesScreen() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTeeTimes = useCallback(async () => {
    const { data } = await supabase
      .from("matched_tee_times")
      .select("*")
      .gte("tee_time", new Date().toISOString())
      .order("tee_time", { ascending: true });

    // Group by course_name
    const grouped = new Map<string, MatchedTeeTime[]>();
    for (const item of data ?? []) {
      const group = grouped.get(item.course_name) ?? [];
      group.push(item);
      grouped.set(item.course_name, group);
    }

    const sectionData: Section[] = [];
    for (const [title, items] of grouped) {
      sectionData.push({ title, data: items });
    }

    setSections(sectionData);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTeeTimes();
    }, [fetchTeeTimes])
  );

  function handleRefresh() {
    setRefreshing(true);
    fetchTeeTimes();
  }

  function formatDateTime(isoString: string) {
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
      <SectionList
        sections={sections}
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
            <Text className="text-2xl font-bold">Tee Times</Text>
            <Text className="text-sm text-muted-foreground mt-0.5">
              Currently available matching tee times
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="rounded-2xl border-2 border-dashed border-border p-10 items-center">
            <Ionicons name="golf-outline" size={48} color="#9ca3af" />
            <Text className="text-lg font-medium mb-2 mt-4">
              No matching tee times right now
            </Text>
            <Text className="text-muted-foreground text-center">
              When we find available tee times matching your alerts, they'll
              appear here.
            </Text>
          </View>
        }
        renderSectionHeader={({ section: { title } }) => (
          <View className="bg-gray-50 py-2 mt-2">
            <Text className="text-lg font-bold text-gray-800">{title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View className="rounded-2xl bg-white p-4 shadow-sm mb-3">
            <Text className="text-base font-semibold">
              {formatDateTime(item.tee_time)}
            </Text>
            <View className="flex-row items-center mt-2 gap-3">
              <Text className="text-sm text-muted-foreground">
                {item.players_available}{" "}
                {item.players_available === 1 ? "player" : "players"}
              </Text>
              {item.price > 0 && (
                <Text className="text-sm text-muted-foreground">
                  ${Number(item.price).toFixed(2)}
                </Text>
              )}
            </View>
            <Pressable
              onPress={() => Linking.openURL(item.booking_url)}
              className="bg-primary rounded-lg py-2.5 mt-3 items-center"
            >
              <Text className="text-sm font-semibold text-white">Book Now</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}
