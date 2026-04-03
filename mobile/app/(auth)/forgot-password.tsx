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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "teetimesniper://reset-password",
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSubmitted(true);
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-10">
          <Text className="text-3xl font-bold text-primary">
            Tee Time Sniper
          </Text>
        </View>
        <View className="rounded-2xl bg-white p-6 shadow-sm">
          <Text className="text-xl font-semibold mb-3">Check Your Email</Text>
          <Text className="text-sm text-muted-foreground mb-5">
            If an account exists for {email}, you'll receive a password reset
            link shortly.
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
          <Text className="text-xl font-semibold mb-3">Reset Password</Text>
          <Text className="text-sm text-muted-foreground mb-5">
            Enter your email address and we'll send you a link to reset your
            password.
          </Text>

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
              {loading ? "Sending..." : "Send Reset Link"}
            </Text>
          </Pressable>

          <View className="flex-row justify-center mt-5">
            <Text className="text-sm text-muted-foreground">
              Remember your password?{" "}
            </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text className="text-sm font-medium text-primary">
                  Sign in
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
