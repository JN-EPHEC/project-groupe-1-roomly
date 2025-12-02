// app/user/messages_utilisateur.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import BottomNavBar from "../../components/BottomNavBar";
import { auth, db } from "../../firebaseConfig";

export default function MessagesUtilisateur() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadThreads = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        // 🔍 Tous les threads de cet utilisateur
        const q = query(
          collection(db, "threads"),
          where("userId", "==", uid)
        );

        const snap = await getDocs(q);

        const list: any[] = [];

        for (const d of snap.docs) {
          const data = d.data();

          // Charger nom entreprise
          let entrepriseName = "Entreprise";
          if (data.entrepriseId) {
            const entSnap = await getDoc(doc(db, "users", data.entrepriseId));
            if (entSnap.exists()) {
              const e = entSnap.data();
              entrepriseName = e.name || e.email || "Entreprise";
            }
          }

          list.push({
            id: d.id,
            entrepriseName,
            espaceName: data.espaceNom,
            lastMessage: data.lastMessage || "",
            unread: data.unreadUser || false,
            updatedAt: data.updatedAt || 0,
          });
        }

        // Trier par date DESC
        list.sort((a, b) => b.updatedAt - a.updatedAt);

        setThreads(list);
      } catch (e) {
        console.log("Erreur chargement threads:", e);
      } finally {
        setLoading(false);
      }
    };

    loadThreads();
  }, []);

  const filtered = threads.filter(
    (t) =>
      t.entrepriseName.toLowerCase().includes(search.toLowerCase()) ||
      t.espaceName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Logo */}
        <Image
          source={require("../../assets/images/roomly-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#555" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <Text style={styles.title}>Messages ({filtered.length})</Text>

        {loading ? (
          <Text style={{ marginTop: 20 }}>Chargement...</Text>
        ) : filtered.length === 0 ? (
          <Text style={{ marginTop: 20 }}>Aucune conversation.</Text>
        ) : (
          filtered.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => router.push(`/user/messages/${t.id}`)}
              style={[styles.messageCard, t.unread && styles.unread]}
            >
              <View style={styles.row}>
                <View style={styles.avatar} />

                <View style={styles.messageInfo}>
                  <Text style={styles.username}>{t.entrepriseName}</Text>
                  <Text style={styles.subtitle}>{t.espaceName}</Text>
                  <Text style={styles.preview}>{t.lastMessage}</Text>
                </View>
              </View>
            </Pressable>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNavBar activeTab="message" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },
  scrollContent: { paddingVertical: 20, alignItems: "center" },
  logo: { width: 160, height: 80, marginBottom: 15 },
  searchContainer: {
    flexDirection: "row",
    width: "85%",
    backgroundColor: "#D9D9D9",
    padding: 10,
    borderRadius: 20,
    marginBottom: 15,
  },
  searchInput: { flex: 1, marginLeft: 10 },
  title: { width: "90%", fontSize: 22, fontWeight: "700", marginBottom: 15 },
  messageCard: {
    width: "90%",
    backgroundColor: "#D9D9D9",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  unread: { backgroundColor: "#BFD9F1" },
  row: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 45, height: 45, borderRadius: 50, backgroundColor: "#000", marginRight: 12 },
  messageInfo: { flex: 1 },
  username: { fontSize: 16, fontWeight: "700" },
  subtitle: { fontSize: 13, color: "#666" },
  preview: { marginTop: 4, color: "#333" },
});
