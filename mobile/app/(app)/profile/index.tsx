import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpdatePassword() {
    setError(null);
    setMessage(null);
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Password updated.");
      setNewPassword("");
    }
    setLoading(false);
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
        <Text className="text-2xl font-bold mt-6 mb-1">Profile</Text>
        <Text className="text-sm text-muted-foreground mb-6">
          Manage your account settings
        </Text>

        {message && (
          <View className="rounded-lg bg-green-50 px-4 py-3 mb-4">
            <Text className="text-sm font-medium text-primary">{message}</Text>
          </View>
        )}
        {error && (
          <View className="rounded-lg bg-red-50 px-4 py-3 mb-4">
            <Text className="text-sm text-destructive">{error}</Text>
          </View>
        )}

        {/* Password Card */}
        <View className="rounded-2xl bg-white p-5 shadow-sm mb-5">
          <Text className="text-lg font-semibold mb-1">Change Password</Text>
          <Text className="text-sm text-muted-foreground mb-4">
            Update your account password
          </Text>

          <Text className="text-sm font-medium mb-1.5">New Password</Text>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="At least 6 characters"
            secureTextEntry
            className="h-12 rounded-lg border border-border bg-white px-4 text-base mb-4"
          />
          <Pressable
            onPress={handleUpdatePassword}
            disabled={loading}
            className={`items-center rounded-lg py-2.5 ${
              loading ? "bg-primary/50" : "bg-primary"
            }`}
          >
            <Text className="text-sm font-semibold text-white">
              Update Password
            </Text>
          </Pressable>
        </View>

        {/* Sign Out */}
        <Pressable
          onPress={signOut}
          className="items-center rounded-lg border border-destructive py-3"
        >
          <Text className="text-base font-medium text-destructive">
            Sign Out
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
