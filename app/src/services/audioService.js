import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { app } from "../firebaseConfig";

let recording = null;

export async function requestPermissions() {
  const { status } = await Audio.requestPermissionsAsync();
  return status === "granted";
}

export async function startRecording() {
  if (recording) {
    // Defensive cleanup: if a previous Recording object was never properly
    // unloaded (e.g. an earlier error path), expo-av's native layer still
    // thinks a recording is active and prepareToRecordAsync() below will
    // throw "Only one Recording object can be prepared at a given time."
    try {
      await recording.stopAndUnloadAsync();
    } catch (e) {
      // Already stopped/unloaded natively — safe to ignore.
    }
    recording = null;
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: false,
    staysActiveInBackground: false,
  });
  recording = new Audio.Recording();
  await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  await recording.startAsync();
}

// Stops recording, uploads the clip to Storage, returns { downloadUrl, durationMs }.
export async function stopRecordingAndUpload(channelId) {
  if (!recording) throw new Error("No active recording");

  const finalStatus = await recording.stopAndUnloadAsync();
  const uri = recording.getURI();
  const durationMs = finalStatus.durationMillis ?? 0;
  recording = null;

  // Both uploadBytes() and uploadString() were tried, and both fail here:
  // the Firebase JS SDK's Storage module internally builds a Blob from an
  // ArrayBuffer/Uint8Array before uploading, and React Native's Blob
  // polyfill explicitly doesn't support that constructor form ("Creating
  // blobs from 'ArrayBuffer' and 'ArrayBufferView' are not supported").
  // That's inside the SDK itself, not something we can work around by
  // changing how we read the file — so we bypass the SDK's storage module
  // entirely and upload straight to the Storage REST endpoint via
  // FileSystem.uploadAsync(), which streams the file from disk over a real
  // HTTP request and never constructs a JS Blob at all.
  const bucket = app.options.storageBucket;
  const objectPath = `clips/${channelId}/${Date.now()}.m4a`;
  const encodedPath = encodeURIComponent(objectPath);
  const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?name=${encodedPath}`;

  const uploadResult = await FileSystem.uploadAsync(uploadUrl, uri, {
    httpMethod: "POST",
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: { "Content-Type": "audio/m4a" },
  });

  if (uploadResult.status < 200 || uploadResult.status >= 300) {
    throw new Error(
      `Upload failed (HTTP ${uploadResult.status}). Check that storage.rules is deployed and allows this write.`
    );
  }

  const responseJson = JSON.parse(uploadResult.body);
  const downloadToken = responseJson.downloadTokens;
  const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media&token=${downloadToken}`;

  return { downloadUrl, durationMs };
}

export async function cancelRecording() {
  if (!recording) return;
  try {
    await recording.stopAndUnloadAsync();
  } catch (e) {
    // already stopped — ignore
  }
  recording = null;
}

export async function playClip(url) {
  const { sound } = await Audio.Sound.createAsync({ uri: url });
  await sound.playAsync();
  // Free the sound once playback finishes.
  sound.setOnPlaybackStatusUpdate((s) => {
    if (s.didJustFinish) sound.unloadAsync();
  });
}
