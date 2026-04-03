import { useState, useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { PreferenceForm } from "@/components/preference-form";

interface Course {
  id: string;
  name: string;
}

export default function EditPreferenceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [preference, setPreference] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [{ data: pref }, { data: allCourses }] = await Promise.all([
        supabase.from("preferences").select("*").eq("id", id).single(),
        supabase.from("courses").select("id, name").order("name"),
      ]);

      if (!pref) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setPreference(pref);
      setCourses(allCourses ?? []);
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (notFound) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-lg font-medium text-muted-foreground">
          Alert not found
        </Text>
      </View>
    );
  }

  return (
    <PreferenceForm
      key={id}
      courses={courses}
      initial={preference}
      userId={user!.id}
    />
  );
}
