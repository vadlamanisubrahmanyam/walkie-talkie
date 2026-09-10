import React, { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, StyleSheet, Alert } from "react-native";
import PTTButton from "../components/PTTButton";
import {
  startRecording,
  stopRecordingAndUpload,
  cancelRecording,
  playClip,
  requestPermissions,
} from "../services/audioService";
import { sendClip, listenToClips } from "../services/firestoreService";

export default function ChannelScreen({ route }) {
  const { channel, userName } = route.params;
  const [clips, setClips] = useState([]);
  const [busy, setBusy] = useState(false);
  const screenOpenedAt = useRef(Date.now());
  const seenClipIds = useRef(new Set());

  useEffect(() => {
    const unsubscribe = listenToClips(channel.id, (newClips) => {
      setClips(newClips);
      // Auto-play only clips that arrived after this screen opened and
      // weren't sent by me — avoids replaying your own transmission or
      // the whole history every time you open the screen.
      newClips.forEach((clip) => {
        const arrivedAt = clip.sentAt?.toMillis ? clip.sentAt.toMillis() : Date.now();
        if (
          !seenClipIds.current.has(clip.id) &&
          arrivedAt >= screenOpenedAt.current &&
          clip.senderName !== userName
        ) {
          playClip(clip.downloadUrl);
        }
        seenClipIds.current.add(clip.id);
      });
    });
    return unsubscribe;
  }, [channel.id]);

  const handleStart = async () => {
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert("Microphone permission needed", "Enable microphone access to talk.");
      return;
    }
    setBusy(true);
    try {
      await startRecording();
    } catch (e) {
      setBusy(false);
      Alert.alert("Couldn't start recording", e.message);
    }
  };

  const handleStop = async () => {
    try {
      const { downloadUrl, durationMs } = await stopRecordingAndUpload(channel.id);
      if (durationMs < 400) {
        // Too short to be an intentional message — likely an accidental tap.
        return;
      }
      await sendClip({ channelId: channel.id, senderName: userName, downloadUrl, durationMs });
    } catch (e) {
      Alert.alert("Send failed", e.message);
      await cancelRecording();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{channel.name}</Text>

      <FlatList
        style={styles.list}
        data={clips}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.clipRow}>
            <Text style={styles.clipSender}>{item.senderName}</Text>
            <Text style={styles.clipMeta}>
              {(item.durationMs / 1000).toFixed(1)}s
            </Text>
          </View>
        )}
        inverted={false}
      />

      <View style={styles.pttWrap}>
        <PTTButton onStart={handleStart} onStop={handleStop} disabled={busy && false} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa", paddingTop: 50 },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  list: { flex: 1, paddingHorizontal: 16 },
  clipRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  clipSender: { fontWeight: "600" },
  clipMeta: { color: "#888" },
  pttWrap: { alignItems: "center", paddingVertical: 28 },
});
