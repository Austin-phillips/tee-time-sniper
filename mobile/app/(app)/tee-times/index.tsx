import { useState, useCallback } from "react";
import {
  View,
  Text,
  SectionList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
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

interface CourseSummary {
  courseName: string;
  date: string;
  timeRange: string;
  count: number;
  priceRange: string;
  holes: number;
}

interface DateSection {
  title: string;
  date: string;
  data: CourseSummary[];
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatPriceRange(prices: number[]): string {
  const validPrices = prices.filter((p) => p > 0);
  if (validPrices.length === 0) return "";
  const min = Math.min(...validPrices);
  const max = Math.max(...validPrices);
  if (min === max) return `$${min}`;
  return `$${min} - $${max}`;
}

export default function TeeTimesScreen() {
  const router = useRouter();
  const [sections, setSections] = useState<DateSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTeeTimes = useCallback(async () => {
    const { data } = await supabase
      .from("matched_tee_times")
      .select("*")
      .gte("tee_time", new Date().toISOString())
      .order("tee_time", { ascending: true });

    // Group by date, then by course
    const byDateCourse = new Map<string, Map<string, MatchedTeeTime[]>>();
    for (const item of data ?? []) {
      const dateKey = item.tee_time.split("T")[0];
      if (!byDateCourse.has(dateKey)) {
        byDateCourse.set(dateKey, new Map());
      }
      const courseMap = byDateCourse.get(dateKey)!;
      const list = courseMap.get(item.course_name) ?? [];
      list.push(item);
      courseMap.set(item.course_name, list);
    }

    const sectionData: DateSection[] = [];
    const sortedDates = [...byDateCourse.keys()].sort();

    for (const dateKey of sortedDates) {
      const courseMap = byDateCourse.get(dateKey)!;
      const summaries: CourseSummary[] = [];

      for (const [courseName, times] of courseMap) {
        const sorted = times.sort(
          (a, b) => new Date(a.tee_time).getTime() - new Date(b.tee_time).getTime()
        );
        summaries.push({
          courseName,
          date: dateKey,
          timeRange: `${formatTime(sorted[0].tee_time)} - ${formatTime(sorted[sorted.length - 1].tee_time)}`,
          count: times.length,
          priceRange: formatPriceRange(times.map((t) => t.price)),
          holes: times[0].holes,
        });
      }

      sectionData.push({
        title: formatDateHeader(dateKey),
        date: dateKey,
        data: summaries,
      });
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
        keyExtractor={(item) => `${item.date}-${item.courseName}`}
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
              Available tee times by date
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
          <View className="bg-gray-50 pt-4 pb-2">
            <Text className="text-lg font-bold text-gray-800">{title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/tee-times/[date]",
                params: { date: item.date, courseName: item.courseName },
              })
            }
          >
            <View className="rounded-2xl bg-white p-4 shadow-sm mb-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold flex-1">
                  {item.courseName}
                </Text>
                <View className="bg-green-100 rounded-full px-2.5 py-0.5">
                  <Text className="text-xs font-medium text-green-700">
                    {item.holes}h
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center mt-2 gap-3">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="time-outline" size={14} color="#6b7280" />
                  <Text className="text-sm text-muted-foreground">
                    {item.timeRange}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center mt-1.5 gap-3">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                  <Text className="text-sm text-muted-foreground">
                    {item.count} tee time{item.count !== 1 ? "s" : ""}
                  </Text>
                </View>
                {item.priceRange !== "" && (
                  <View className="flex-row items-center gap-1">
                    <Ionicons
                      name="pricetag-outline"
                      size={14}
                      color="#6b7280"
                    />
                    <Text className="text-sm text-muted-foreground">
                      {item.priceRange}
                    </Text>
                  </View>
                )}
              </View>
              <View className="flex-row items-center justify-end mt-1">
                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
