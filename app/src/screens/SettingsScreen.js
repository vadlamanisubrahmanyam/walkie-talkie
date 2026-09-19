import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

export default function SettingsScreen({ userName, setUserName }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.label}>Display name</Text>
      <TextInput style={styles.input} value={userName} onChangeText={setUserName} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Connection mode</Text>
        <Text style={styles.cardBody}>
          Internet (Firebase relay) — active. WiFi-Direct offline mode is
          planned for a later branch, same as FamilyCircle's phase-2 work.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Build</Text>
        <Text style={styles.cardBody}>
          v0.1.5 — REST-based Storage upload (bypasses Firebase SDK's
          Blob/ArrayBuffer upload path, which isn't supported on React
          Native). If this text doesn't match what you expect, the device
          is running an older build — reinstall the latest APK.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 50, backgroundColor: "#fafafa" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  label: { fontSize: 13, color: "#555", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    backgroundColor: "#fff",
  },
  cardTitle: { fontWeight: "600", marginBottom: 6 },
  cardBody: { color: "#666", fontSize: 13, lineHeight: 18 },
});
