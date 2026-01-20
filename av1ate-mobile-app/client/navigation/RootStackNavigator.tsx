import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "@/screens/HomeScreen";
import UpdateHoursScreen from "@/screens/UpdateHoursScreen";
import MaintenanceListScreen from "@/screens/MaintenanceListScreen";
import MaintenanceDetailScreen from "@/screens/MaintenanceDetailScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import AddAircraftScreen from "@/screens/AddAircraftScreen";
import PaywallScreen from "@/screens/PaywallScreen";
import FeedbackScreen from "@/screens/FeedbackScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { HeaderTitle } from "@/components/HeaderTitle";

export type RootStackParamList = {
  Home: undefined;
  UpdateHours: undefined;
  MaintenanceList: undefined;
  MaintenanceDetail: { id: string };
  Settings: undefined;
  AddAircraft: undefined;
  Paywall: undefined;
  Feedback: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Aircraft Health" />,
        }}
      />
      <Stack.Screen
        name="UpdateHours"
        component={UpdateHoursScreen}
        options={{
          headerTitle: "Update Hours",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="MaintenanceList"
        component={MaintenanceListScreen}
        options={{
          headerTitle: "Maintenance",
        }}
      />
      <Stack.Screen
        name="MaintenanceDetail"
        component={MaintenanceDetailScreen}
        options={{
          headerTitle: "Item Details",
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerTitle: "Settings",
        }}
      />
      <Stack.Screen
        name="AddAircraft"
        component={AddAircraftScreen}
        options={{
          headerTitle: "Add Aircraft",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{
          headerTitle: "Unlock AV1ATE",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="Feedback"
        component={FeedbackScreen}
        options={{
          headerTitle: "Feedback",
        }}
      />
    </Stack.Navigator>
  );
}
