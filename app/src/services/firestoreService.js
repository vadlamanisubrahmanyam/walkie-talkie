import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

// --- Channels -----------------------------------------------------------
// A channel is a closed group, same mental model as a FamilyCircle circle:
// created with a name, joined only via an explicit invite code.

function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createChannel(name, ownerName) {
  const inviteCode = generateInviteCode();
  const ref = await addDoc(collection(db, "channels"), {
    name,
    inviteCode,
    ownerName,
    createdAt: serverTimestamp(),
  });
  await setDoc(doc(db, "channels", ref.id, "members", ownerName), {
    joinedAt: serverTimestamp(),
  });
  // Lookup doc so joinChannelByCode can resolve a code -> channelId without
  // querying/scanning the channels collection.
  await setDoc(doc(db, "channelsByCode", inviteCode), { channelId: ref.id });
  return { id: ref.id, inviteCode };
}

export async function joinChannelByCode(inviteCode, memberName) {
  // NOTE: for a small closed-group app, scanning channels by invite code
  // client-side is fine at this scale. If the channel list grows large,
  // move this lookup into a Cloud Function keyed on inviteCode instead.
  const snap = await getDoc(doc(db, "channelsByCode", inviteCode));
  if (!snap.exists()) {
    throw new Error("Invite code not found");
  }
  const channelId = snap.data().channelId;
  await setDoc(doc(db, "channels", channelId, "members", memberName), {
    joinedAt: serverTimestamp(),
  });
  return channelId;
}

// --- Voice clips ("transmissions") --------------------------------------

export async function sendClip({ channelId, senderName, downloadUrl, durationMs }) {
  await addDoc(collection(db, "channels", channelId, "clips"), {
    senderName,
    downloadUrl,
    durationMs,
    sentAt: serverTimestamp(),
  });
}

// Live-listens for new clips in a channel, most recent last.
// Caller is responsible for only auto-playing clips newer than "now".
export function listenToClips(channelId, callback) {
  const q = query(
    collection(db, "channels", channelId, "clips"),
    orderBy("sentAt", "desc"),
    limit(30)
  );
  return onSnapshot(q, (snapshot) => {
    const clips = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(clips.reverse());
  });
}
