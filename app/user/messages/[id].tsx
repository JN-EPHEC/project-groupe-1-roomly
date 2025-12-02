import { useLocalSearchParams, useRouter } from "expo-router";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { auth, db } from "../../../firebaseConfig";

export default function ConversationUtilisateur() {
  const { id } = useLocalSearchParams(); 
  const router = useRouter();

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [threadInfo, setThreadInfo] = useState<any>(null);

  const scrollRef = useRef<ScrollView>(null);

  // Charger infos du thread
  useEffect(() => {
    const loadThread = async () => {
      const snap = await getDoc(doc(db, "threads", id as string));
      if (!snap.exists()) return;

      const data = snap.data();

      // Charger le nom de l’entreprise
      let entrepriseNom = "Entreprise";
      if (data.entrepriseId) {
        const eSnap = await getDoc(doc(db, "users", data.entrepriseId));
        if (eSnap.exists()) {
          const u = eSnap.data();
          entrepriseNom = u.name || u.email || entrepriseNom;
        }
      }

      setThreadInfo({
        ...data,
        entrepriseNom,
      });
    };

    loadThread();
  }, [id]);

  // Messages en temps réel
  useEffect(() => {
    const q = query(
      collection(db, `threads/${id}/messages`),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(list);

      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    updateDoc(doc(db, "threads", id as string), { unreadUser: false });

    return () => unsub();
  }, [id]);

  // Envoyer message
  const send = async () => {
    if (!input.trim()) return;

    await addDoc(collection(db, `threads/${id}/messages`), {
      senderId: auth.currentUser?.uid,
      text: input,
      createdAt: Date.now(),
    });

    await updateDoc(doc(db, "threads", id as string), {
      lastMessage: input,
      updatedAt: Date.now(),
      unreadEntreprise: true,
    });

    setInput("");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >

      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{threadInfo?.entrepriseNom}</Text>
          <Text style={styles.headerSubtitle}>{threadInfo?.espaceNom}</Text>
        </View>

        <View style={{ width: 32 }} />
      </View>

      {/* MESSAGES */}
      <ScrollView ref={scrollRef} style={styles.messagesList}>
        {messages.map((m) => {
          const isMe = m.senderId === auth.currentUser?.uid;
          const time = new Date(m.createdAt).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <View
              key={m.id}
              style={[
                styles.bubble,
                isMe ? styles.myBubble : styles.theirBubble,
                isMe ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" },
              ]}
            >
              <Text style={isMe ? styles.myText : styles.theirText}>
                {m.text}
              </Text>
              <Text style={styles.time}>{time}</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* INPUT */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Écrire un message..."
          value={input}
          onChangeText={setInput}
        />
        <Pressable style={styles.sendBtn} onPress={send}>
          <Text style={styles.sendText}>Envoyer</Text>
        </Pressable>
      </View>

    </KeyboardAvoidingView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },

  header: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },

  backButton: { width: 32, alignItems: "center" },
  backText: { fontSize: 24, fontWeight: "600" },

  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerSubtitle: { fontSize: 13, color: "#777" },

  messagesList: { flex: 1, padding: 12 },

  bubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 12,
  },

  myBubble: { backgroundColor: "#3E7CB1" },
  theirBubble: { backgroundColor: "#D9D9D9" },

  myText: { color: "white" },
  theirText: { color: "black" },

  time: {
    fontSize: 10,
    color: "#444",
    marginTop: 4,
    alignSelf: "flex-end",
  },

  inputRow: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },

  input: {
    flex: 1,
    backgroundColor: "#eee",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  sendBtn: {
    backgroundColor: "#3E7CB1",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 8,
  },

  sendText: { color: "white", fontWeight: "700" },
});
