import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-10">
          <Text className="text-3xl font-bold text-primary">
            Tee Time Sniper
          </Text>
        </View>
        <View className="rounded-2xl bg-white p-6 shadow-sm">
          <Text className="text-xl font-semibold mb-3">Password Updated</Text>
          <Text className="text-sm text-muted-foreground mb-5">
            Your password has been reset successfully.
          </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text className="text-sm font-medium text-primary text-center">
                Back to sign in
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
        className="px-6"
      >
        <View className="items-center mb-10">
          <Text className="text-3xl font-bold text-primary">
            Tee Time Sniper
          </Text>
        </View>

        <View className="rounded-2xl bg-white p-6 shadow-sm">
          <Text className="text-xl font-semibold mb-5">Set New Password</Text>

          {error && (
            <View className="rounded-lg bg-red-50 px-4 py-3 mb-4">
              <Text className="text-sm text-destructive">{error}</Text>
            </View>
          )}

          <Text className="text-sm font-medium mb-1.5">New Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            secureTextEntry
            className="h-12 rounded-lg border border-border bg-white px-4 text-base mb-4"
          />

          <Text className="text-sm font-medium mb-1.5">Confirm Password</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            className="h-12 rounded-lg border border-border bg-white px-4 text-base mb-6"
          />

          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className={`items-center rounded-lg py-3 ${
              loading ? "bg-primary/50" : "bg-primary"
            }`}
          >
            <Text className="text-base font-semibold text-white">
              {loading ? "Updating..." : "Update Password"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
