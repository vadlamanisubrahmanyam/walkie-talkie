import { Audio } from "expo-av";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebaseConfig";

let recording = null;

export async function requestPermissions() {
  const { status } = await Audio.requestPermissionsAsync();
  return status === "granted";
}

export async function startRecording() {
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

  await recording.stopAndUnloadAsync();
  const status = await recording.getStatusAsync();
  const uri = recording.getURI();
  const durationMs = status.durationMillis ?? 0;
  recording = null;

  const response = await fetch(uri);
  const blob = await response.blob();

  const filename = `clips/${channelId}/${Date.now()}.m4a`;
  const storageRef = ref(storage, filename);
  await uploadBytes(storageRef, blob);
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
