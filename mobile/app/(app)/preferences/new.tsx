import { useState, useCallback } from "react";
import { View, ActivityIndicator } from "react-native";
import { useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { PreferenceForm } from "@/components/preference-form";

interface Course {
  id: string;
  name: string;
}

export default function NewPreferenceScreen() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [formKey, setFormKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setFormKey((k) => k + 1);

      async function fetchData() {
        const [{ data: allCourses }, { data: existingPrefs }] =
          await Promise.all([
            supabase.from("courses").select("id, name").order("name"),
            supabase.from("preferences").select("course_id"),
          ]);

        const usedCourseIds = new Set(
          (existingPrefs ?? []).map((p: { course_id: string }) => p.course_id)
        );
        const available = (allCourses ?? []).filter(
          (c: Course) => !usedCourseIds.has(c.id)
        );

        setCourses(available);
        setLoading(false);
      }
      fetchData();
    }, [])
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return <PreferenceForm key={formKey} courses={courses} userId={user!.id} />;
}
