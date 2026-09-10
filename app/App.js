import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";

import ChannelsScreen from "./src/screens/ChannelsScreen";
import ChannelScreen from "./src/screens/ChannelScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  // v1 has no auth — a display name typed in Settings stands in for identity,
  // matching the low-friction "family circle" onboarding model.
  const [userName, setUserName] = useState("Me");
  const [joinedChannels, setJoinedChannels] = useState([]);

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator>
        <Stack.Screen name="Channels" options={{ title: "Channels" }}>
          {(props) => (
            <ChannelsScreen
              {...props}
              joinedChannels={joinedChannels}
              setJoinedChannels={setJoinedChannels}
              userName={userName}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Channel" component={ChannelScreen} options={({ route }) => ({ title: route.params.channel.name })} />
        <Stack.Screen name="Settings" options={{ title: "Settings" }}>
          {(props) => <SettingsScreen {...props} userName={userName} setUserName={setUserName} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
