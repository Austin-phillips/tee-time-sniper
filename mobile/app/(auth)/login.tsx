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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // Navigation handled by auth context
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
          <Text className="mt-2 text-muted-foreground">
            Never miss a tee time again
          </Text>
        </View>

        <View className="rounded-2xl bg-white p-6 shadow-sm">
          <Text className="text-xl font-semibold mb-5">Sign In</Text>

          {error && (
            <View className="rounded-lg bg-red-50 px-4 py-3 mb-4">
              <Text className="text-sm text-destructive">{error}</Text>
            </View>
          )}

          <Text className="text-sm font-medium mb-1.5">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            className="h-12 rounded-lg border border-border bg-white px-4 text-base mb-4"
          />

          <View className="flex-row items-center justify-between mb-1.5">
            <Text className="text-sm font-medium">Password</Text>
            <Link href="/(auth)/forgot-password" asChild>
              <Pressable>
                <Text className="text-sm text-muted-foreground">
                  Forgot password?
                </Text>
              </Pressable>
            </Link>
          </View>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
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
              {loading ? "Signing in..." : "Sign In"}
            </Text>
          </Pressable>

          <View className="flex-row justify-center mt-5">
            <Text className="text-sm text-muted-foreground">
              Don't have an account?{" "}
            </Text>
            <Link href="/(auth)/signup" asChild>
              <Pressable>
                <Text className="text-sm font-medium text-primary">
                  Sign up
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
