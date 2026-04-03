import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  SafeAreaView,
} from "react-native";

interface Course {
  id: string;
  name: string;
}

export function CourseSelect({
  courses,
  value,
  onChange,
  disabled,
}: {
  courses: Course[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedCourse = courses.find((c) => c.id === value);

  return (
    <>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        className={`h-12 flex-row items-center justify-between rounded-lg border px-4 ${
          disabled
            ? "border-border bg-gray-100"
            : "border-border bg-white"
        }`}
      >
        <Text
          className={`text-base ${
            selectedCourse ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {selectedCourse?.name ?? "Select a course..."}
        </Text>
        {!disabled && (
          <Text className="text-muted-foreground text-base">▾</Text>
        )}
      </Pressable>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between border-b border-border px-5 py-4">
            <Text className="text-lg font-semibold">Select Course</Text>
            <Pressable onPress={() => setOpen(false)}>
              <Text className="text-base font-medium text-primary">Cancel</Text>
            </Pressable>
          </View>
          <FlatList
            data={courses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isSelected = item.id === value;
              return (
                <Pressable
                  onPress={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                  className={`border-b border-border px-5 py-4 ${
                    isSelected ? "bg-primary/10" : ""
                  }`}
                >
                  <Text
                    className={`text-base ${
                      isSelected ? "font-semibold text-primary" : "text-foreground"
                    }`}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}
