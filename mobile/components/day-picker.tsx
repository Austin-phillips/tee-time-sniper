import { View, Pressable, Text } from "react-native";

const DAYS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

export function DayPicker({
  selected,
  onChange,
}: {
  selected: number[];
  onChange: (days: number[]) => void;
}) {
  function toggle(day: number) {
    if (selected.includes(day)) {
      onChange(selected.filter((d) => d !== day));
    } else {
      onChange([...selected, day]);
    }
  }

  return (
    <View className="flex-row gap-2">
      {DAYS.map(({ label, value }) => {
        const isSelected = selected.includes(value);
        return (
          <Pressable
            key={value}
            onPress={() => toggle(value)}
            className={`h-10 flex-1 items-center justify-center rounded-lg border ${
              isSelected
                ? "border-primary bg-primary"
                : "border-border bg-white"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                isSelected ? "text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
