import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "../firebaseConfig";

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

  // fetch(uri).then(r => r.blob()) + uploadBytes() is unreliable on React
  // Native/Hermes — the Blob it produces often uploads as malformed data,
  // which Firebase Storage reports back as a generic "storage/unknown"
  // error with no useful detail. Reading the file as base64 and uploading
  // with uploadString() sidesteps RN's Blob implementation entirely and is
  // the standard, reliable pattern for Expo + Firebase Storage.
  const base64Data = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const filename = `clips/${channelId}/${Date.now()}.m4a`;
  const storageRef = ref(storage, filename);
  await uploadString(storageRef, base64Data, "base64", { contentType: "audio/m4a" });
  const downloadUrl = await getDownloadURL(storageRef);

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
