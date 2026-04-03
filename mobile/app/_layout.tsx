import { useEffect } from "react";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { registerForPushNotifications } from "@/lib/notifications";
import "../global.css";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function PushRegistration() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      registerForPushNotifications();
    }
  }, [user]);

  return null;
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <PushRegistration />
      <Slot />
    </AuthProvider>
  );
}
