import React, { useState } from "react";
import { View, Text, FlatList, Pressable, TextInput, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { createChannel, joinChannelByCode } from "../services/firestoreService";
import { isFirebaseConfigured } from "../firebaseConfig";
import { validateChannelName, validateInviteCode } from "../utils/validation";
import { withTimeout } from "../utils/withTimeout";

// v1: channel list is stored locally (AsyncStorage) since there is no user
// auth yet — each device just remembers which channel ids/names it has
// joined. Swap for a proper per-user query once auth is added.
export default function ChannelsScreen({ navigation, joinedChannels, setJoinedChannels, userName }) {
  const [newChannelName, setNewChannelName] = useState("");
  const [createError, setCreateError] = useState(null);
  const [creating, setCreating] = useState(false);

  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState(null);
  const [joining, setJoining] = useState(false);

  // Turns a raw Firebase/JS error into something a non-developer can act on.
  function friendlyError(e) {
    if (!isFirebaseConfigured()) {
      return "Firebase isn't set up yet — add your project keys to src/firebaseConfig.js.";
    }
    if (e?.code === "permission-denied") {
      return "Firestore rules blocked this — check firestore.rules is deployed.";
    }
    if (e?.message?.includes("Network")) {
      return "No connection — check WiFi/mobile data and try again.";
    }
    return e?.message || "Something went wrong. Please try again.";
  }

  const handleCreate = async () => {
    const check = validateChannelName(newChannelName);
    if (!check.valid) {
      setCreateError(check.error);
      return;
    }
    setCreateError(null);
    setCreating(true);
    try {
      const { id, inviteCode } = await withTimeout(
        createChannel(check.value, userName),
        15000,
        "Timed out talking to Firebase — check your connection and try again."
      );
      const channel = { id, name: check.value, inviteCode };
      setJoinedChannels([...joinedChannels, channel]);
      setNewChannelName("");
      Alert.alert("Channel created", `Invite code: ${inviteCode}\n\nShare this code so others can join.`, [
        { text: "OK", onPress: () => navigation.navigate("Channel", { channel, userName }) },
      ]);
    } catch (e) {
      setCreateError(friendlyError(e));
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    const check = validateInviteCode(joinCode);
    if (!check.valid) {
      setJoinError(check.error);
      return;
    }
    setJoinError(null);
    setJoining(true);
    try {
      const channelId = await withTimeout(
        joinChannelByCode(check.value, userName),
        15000,
        "Timed out talking to Firebase — check your connection and try again."
      );
      const channel = { id: channelId, name: check.value, inviteCode: check.value };
      setJoinedChannels([...joinedChannels, channel]);
      setJoinCode("");
      navigation.navigate("Channel", { channel, userName });
    } catch (e) {
      setJoinError(friendlyError(e));
    } finally {
      setJoining(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Channels</Text>

      <FlatList
        data={joinedChannels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.channelRow}
            onPress={() => navigation.navigate("Channel", { channel: item, userName })}
          >
            <Text style={styles.channelName}>{item.name}</Text>
            <Text style={styles.channelMeta}>Invite: {item.inviteCode}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No channels yet — create or join one below.</Text>}
      />

      <View style={styles.formBlock}>
        <Text style={styles.formLabel}>Create a channel</Text>
        <TextInput
          style={[styles.input, createError && styles.inputError]}
          placeholder="Channel name (e.g. Family)"
          value={newChannelName}
          onChangeText={(t) => {
            setNewChannelName(t);
            if (createError) setCreateError(null);
          }}
          editable={!creating}
          maxLength={30}
        />
        {createError ? <Text style={styles.errorText}>{createError}</Text> : null}
        <Pressable
          style={[styles.button, creating && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={creating}
        >
          {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create</Text>}
        </Pressable>
      </View>

      <View style={styles.formBlock}>
        <Text style={styles.formLabel}>Join by invite code</Text>
        <TextInput
          style={[styles.input, joinError && styles.inputError]}
          placeholder="e.g. 7QK4LM"
          autoCapitalize="characters"
          value={joinCode}
          onChangeText={(t) => {
            setJoinCode(t);
            if (joinError) setJoinError(null);
          }}
          editable={!joining}
          maxLength={6}
        />
        {joinError ? <Text style={styles.errorText}>{joinError}</Text> : null}
        <Pressable
          style={[styles.button, joining && styles.buttonDisabled]}
          onPress={handleJoin}
          disabled={joining}
        >
          {joining ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Join</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 50, backgroundColor: "#fafafa" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  channelRow: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 8,
  },
  channelName: { fontSize: 16, fontWeight: "600" },
  channelMeta: { fontSize: 12, color: "#777", marginTop: 2 },
  empty: { color: "#888", paddingVertical: 20, textAlign: "center" },
  formBlock: { marginTop: 14 },
  formLabel: { fontSize: 13, color: "#555", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
    marginBottom: 4,
  },
  inputError: {
    borderColor: "#c0392b",
  },
  errorText: {
    color: "#c0392b",
    fontSize: 12,
    marginBottom: 6,
  },
  button: {
    backgroundColor: "#2e6e5e",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});
