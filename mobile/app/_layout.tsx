import { useEffect, useRef } from "react";
import { Slot, useRouter, useNavigationContainerRef } from "expo-router";
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

function NotificationNavigator() {
  const router = useRouter();
  const navigationRef = useNavigationContainerRef();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(() => {
        // Wait for navigation to be ready before navigating
        if (navigationRef.isReady()) {
          router.navigate("/tee-times");
        }
      });

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [router, navigationRef]);

  return null;
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <PushRegistration />
      <NotificationNavigator />
      <Slot />
    </AuthProvider>
  );
}
