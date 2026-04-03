import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "@/lib/supabase";
import { CourseSelect } from "./course-select";
import { DayPicker } from "./day-picker";

interface Course {
  id: string;
  name: string;
}

interface PreferenceData {
  id?: string;
  course_id: string;
  days_of_week: number[];
  earliest_time: string;
  latest_time: string;
  num_players: number;
  look_ahead_days: number;
  holes: number;
  active: boolean;
}

function timeStringToDate(time: string): Date {
  const [h, m] = time.split(":");
  const d = new Date();
  d.setHours(parseInt(h), parseInt(m), 0, 0);
  return d;
}

function dateToTimeString(date: Date): string {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

const PLAYER_OPTIONS = [1, 2, 3, 4];
const LOOK_AHEAD_OPTIONS = [3, 5, 7, 14];
const HOLES_OPTIONS = [
  { value: 0, label: "Both" },
  { value: 9, label: "9" },
  { value: 18, label: "18" },
];

export function PreferenceForm({
  courses,
  initial,
  userId,
}: {
  courses: Course[];
  initial?: PreferenceData;
  userId: string;
}) {
  const router = useRouter();
  const isEdit = !!initial?.id;

  const [courseId, setCourseId] = useState(initial?.course_id ?? "");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    initial?.days_of_week ?? [0, 6]
  );
  const [earliestTime, setEarliestTime] = useState(
    timeStringToDate(initial?.earliest_time?.slice(0, 5) ?? "06:00")
  );
  const [latestTime, setLatestTime] = useState(
    timeStringToDate(initial?.latest_time?.slice(0, 5) ?? "10:00")
  );
  const [numPlayers, setNumPlayers] = useState(initial?.num_players ?? 2);
  const [lookAheadDays, setLookAheadDays] = useState(
    initial?.look_ahead_days ?? 7
  );
  const [holes, setHoles] = useState(initial?.holes ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);

    if (!courseId) {
      setError("Please select a course.");
      return;
    }
    if (daysOfWeek.length === 0) {
      setError("Please select at least one day.");
      return;
    }

    setLoading(true);

    const payload = {
      user_id: userId,
      course_id: courseId,
      days_of_week: daysOfWeek.sort((a, b) => a - b),
      earliest_time: dateToTimeString(earliestTime) + ":00",
      latest_time: dateToTimeString(latestTime) + ":00",
      num_players: numPlayers,
      look_ahead_days: lookAheadDays,
      holes,
      active: true,
    };

    let result;
    if (isEdit) {
      result = await supabase
        .from("preferences")
        .update(payload)
        .eq("id", initial!.id!);
    } else {
      result = await supabase.from("preferences").insert(payload);
    }

    setLoading(false);
    if (result.error) {
      setError(result.error.message);
    } else {
      router.replace("/(app)/dashboard");
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView
        className="flex-1 bg-gray-50 px-5"
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {error && (
          <View className="rounded-lg bg-red-50 px-4 py-3 mt-5 mb-1">
            <Text className="text-sm text-destructive">{error}</Text>
          </View>
        )}

        {/* Card 1: Course */}
        <View className="rounded-2xl bg-white p-5 shadow-sm mt-5">
          <Text className="text-sm font-medium mb-2">Course</Text>
          <CourseSelect
            courses={courses}
            value={courseId}
            onChange={setCourseId}
            disabled={isEdit}
          />
        </View>

        {/* Card 2: Days of Week */}
        <View className="rounded-2xl bg-white p-5 shadow-sm mt-4">
          <Text className="text-sm font-medium mb-2">Days of Week</Text>
          <DayPicker selected={daysOfWeek} onChange={setDaysOfWeek} />
        </View>

        {/* Card 3: Time Window */}
        <View className="rounded-2xl bg-white p-5 shadow-sm mt-4">
          <Text className="text-sm font-medium mb-3">Time Window</Text>
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground mb-1">
                Earliest
              </Text>
              <DateTimePicker
                value={earliestTime}
                mode="time"
                minuteInterval={15}
                onChange={(_, date) => date && setEarliestTime(date)}
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground mb-1">
                Latest
              </Text>
              <DateTimePicker
                value={latestTime}
                mode="time"
                minuteInterval={15}
                onChange={(_, date) => date && setLatestTime(date)}
              />
            </View>
          </View>
        </View>

        {/* Card 4: Players */}
        <View className="rounded-2xl bg-white p-5 shadow-sm mt-4">
          <Text className="text-sm font-medium mb-2">Players</Text>
          <View className="flex-row gap-2">
            {PLAYER_OPTIONS.map((n) => {
              const isSelected = numPlayers === n;
              return (
                <Pressable
                  key={n}
                  onPress={() => setNumPlayers(n)}
                  className={`h-10 flex-1 items-center justify-center rounded-lg border ${
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-border bg-white"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      isSelected
                        ? "text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {n}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Card 5: Holes */}
        <View className="rounded-2xl bg-white p-5 shadow-sm mt-4">
          <Text className="text-sm font-medium mb-2">Holes</Text>
          <View className="flex-row gap-2">
            {HOLES_OPTIONS.map((opt) => {
              const isSelected = holes === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setHoles(opt.value)}
                  className={`h-10 flex-1 items-center justify-center rounded-lg border ${
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-border bg-white"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      isSelected
                        ? "text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Card 6: Look-Ahead Days */}
        <View className="rounded-2xl bg-white p-5 shadow-sm mt-4">
          <Text className="text-sm font-medium mb-2">Look-Ahead Days</Text>
          <View className="flex-row gap-2">
            {LOOK_AHEAD_OPTIONS.map((n) => {
              const isSelected = lookAheadDays === n;
              return (
                <Pressable
                  key={n}
                  onPress={() => setLookAheadDays(n)}
                  className={`h-10 flex-1 items-center justify-center rounded-lg border ${
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-border bg-white"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      isSelected
                        ? "text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {n}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 mt-6">
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className={`flex-1 items-center rounded-lg py-3 ${
              loading ? "bg-primary/50" : "bg-primary"
            }`}
          >
            <Text className="text-base font-semibold text-white">
              {loading
                ? "Saving..."
                : isEdit
                  ? "Update Alert"
                  : "Create Alert"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.back()}
            className="flex-1 items-center rounded-lg border border-border py-3 bg-white"
          >
            <Text className="text-base font-medium">Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
