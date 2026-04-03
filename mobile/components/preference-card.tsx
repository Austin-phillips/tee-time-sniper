import { View, Text, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTime(time: string) {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

interface Preference {
  id: string;
  course_id: string;
  days_of_week: number[];
  earliest_time: string;
  latest_time: string;
  num_players: number;
  look_ahead_days: number;
  active: boolean;
}

export function PreferenceCard({
  preference,
  courseName,
  onRefresh,
}: {
  preference: Preference;
  courseName: string;
  onRefresh: () => void;
}) {
  const router = useRouter();

  async function toggleActive() {
    await supabase
      .from("preferences")
      .update({ active: !preference.active })
      .eq("id", preference.id);
    onRefresh();
  }

  function handleDelete() {
    Alert.alert("Delete Alert", "Are you sure you want to delete this alert?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await supabase
            .from("preferences")
            .delete()
            .eq("id", preference.id);
          onRefresh();
        },
      },
    ]);
  }

  const days = preference.days_of_week
    .sort((a, b) => a - b)
    .map((d) => DAY_LABELS[d])
    .join(", ");

  return (
    <View
      className={`rounded-2xl border border-border bg-white p-5 ${
        !preference.active ? "opacity-50" : ""
      }`}
    >
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-semibold flex-1 mr-2" numberOfLines={1}>
          {courseName}
        </Text>
        <View
          className={`rounded-full px-2.5 py-0.5 ${
            preference.active ? "bg-primary/10" : "bg-muted"
          }`}
        >
          <Text
            className={`text-xs font-medium ${
              preference.active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {preference.active ? "Active" : "Paused"}
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-y-3 mb-4">
        <View className="w-1/2">
          <Text className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Days
          </Text>
          <Text className="text-sm font-medium">{days}</Text>
        </View>
        <View className="w-1/2">
          <Text className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Time Window
          </Text>
          <Text className="text-sm font-medium">
            {formatTime(preference.earliest_time)} -{" "}
            {formatTime(preference.latest_time)}
          </Text>
        </View>
        <View className="w-1/2">
          <Text className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Players
          </Text>
          <Text className="text-sm font-medium">{preference.num_players}</Text>
        </View>
        <View className="w-1/2">
          <Text className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Look-ahead
          </Text>
          <Text className="text-sm font-medium">
            {preference.look_ahead_days} days
          </Text>
        </View>
      </View>

      <View className="flex-row gap-2">
        <Pressable
          onPress={toggleActive}
          className="flex-1 items-center rounded-lg border border-border py-2"
        >
          <Text className="text-sm font-medium">
            {preference.active ? "Pause" : "Resume"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push(`/(app)/preferences/${preference.id}`)}
          className="flex-1 items-center rounded-lg border border-border py-2"
        >
          <Text className="text-sm font-medium">Edit</Text>
        </Pressable>
        <Pressable
          onPress={handleDelete}
          className="flex-1 items-center rounded-lg bg-destructive py-2"
        >
          <Text className="text-sm font-medium text-white">Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}
