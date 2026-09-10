import React, { useState } from "react";
import { View, Text, FlatList, Pressable, TextInput, StyleSheet, Alert } from "react-native";
import { createChannel, joinChannelByCode } from "../services/firestoreService";

// v1: channel list is stored locally (AsyncStorage) since there is no user
// auth yet — each device just remembers which channel ids/names it has
// joined. Swap for a proper per-user query once auth is added.
export default function ChannelsScreen({ navigation, joinedChannels, setJoinedChannels, userName }) {
  const [newChannelName, setNewChannelName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const handleCreate = async () => {
    if (!newChannelName.trim()) return;
    const { id, inviteCode } = await createChannel(newChannelName.trim(), userName);
    const channel = { id, name: newChannelName.trim(), inviteCode };
    setJoinedChannels([...joinedChannels, channel]);
    setNewChannelName("");
    Alert.alert("Channel created", `Invite code: ${inviteCode}`);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    try {
      const channelId = await joinChannelByCode(joinCode.trim().toUpperCase(), userName);
      setJoinedChannels([...joinedChannels, { id: channelId, name: joinCode.trim(), inviteCode: joinCode.trim() }]);
      setJoinCode("");
    } catch (e) {
      Alert.alert("Couldn't join", e.message);
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
          style={styles.input}
          placeholder="Channel name (e.g. Family)"
          value={newChannelName}
          onChangeText={setNewChannelName}
        />
        <Pressable style={styles.button} onPress={handleCreate}>
          <Text style={styles.buttonText}>Create</Text>
        </Pressable>
      </View>

      <View style={styles.formBlock}>
        <Text style={styles.formLabel}>Join by invite code</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 7QK4LM"
          autoCapitalize="characters"
          value={joinCode}
          onChangeText={setJoinCode}
        />
        <Pressable style={styles.button} onPress={handleJoin}>
          <Text style={styles.buttonText}>Join</Text>
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
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#2e6e5e",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});
