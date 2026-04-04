import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";

interface MatchedTeeTime {
  id: string;
  course_name: string;
  tee_time: string;
  players_available: number;
  price: number;
  booking_url: string;
  holes: number;
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function TeeTimeDateDetailScreen() {
  const { date, courseName } = useLocalSearchParams<{
    date: string;
    courseName: string;
  }>();
  const [teeTimes, setTeeTimes] = useState<MatchedTeeTime[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeeTimes = useCallback(async () => {
    if (!date || !courseName) return;

    setTeeTimes([]);
    setLoading(true);

    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;

    const { data } = await supabase
      .from("matched_tee_times")
      .select("*")
      .eq("course_name", courseName)
      .gte("tee_time", startOfDay)
      .lte("tee_time", endOfDay)
      .order("tee_time", { ascending: true });

    setTeeTimes(data ?? []);
    setLoading(false);
  }, [date, courseName]);

  useFocusEffect(
    useCallback(() => {
      fetchTeeTimes();
    }, [fetchTeeTimes])
  );

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
        data={teeTimes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        ListHeaderComponent={
          <View className="mb-5">
            <Text className="text-2xl font-bold">{courseName}</Text>
            <Text className="text-sm text-muted-foreground mt-0.5">
              {teeTimes.length} available tee time
              {teeTimes.length !== 1 ? "s" : ""}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="rounded-2xl border-2 border-dashed border-border p-10 items-center">
            <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
            <Text className="text-lg font-medium mb-2 mt-4">
              No tee times available
            </Text>
            <Text className="text-muted-foreground text-center">
              These tee times may have been booked or are no longer available.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="rounded-2xl bg-white p-4 shadow-sm mb-3">
            <Text className="text-base font-semibold">
              {formatTime(item.tee_time)}
            </Text>
            <View className="flex-row items-center mt-2 gap-3">
              <Text className="text-sm text-muted-foreground">
                {item.players_available}{" "}
                {item.players_available === 1 ? "player" : "players"}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {item.holes}h
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
