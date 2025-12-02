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
import BottomNavBarEntreprise from "../../components/BottomNavBarEntreprise";
import { auth, db } from "../../firebaseConfig";

export default function MessagesEntreprise() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadThreads = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        // Récupérer toutes les conversations où l’entreprise est impliquée
        const q = query(
          collection(db, "threads"),
          where("entrepriseId", "==", uid)
        );

        const snap = await getDocs(q);

        const list: any[] = [];

        for (const d of snap.docs) {
          const data = d.data();

          // Charger nom de l’utilisateur
          let userName = "Utilisateur";
          if (data.userId) {
            const userSnap = await getDoc(doc(db, "users", data.userId));
            if (userSnap.exists()) {
              const u = userSnap.data();
              userName = u.name || u.displayName || u.email || "Utilisateur";
            }
          }

          // Récupérer la dernière phrase de la conversation
          let lastMessage = "";
          if (data.lastMessage) lastMessage = data.lastMessage;

          list.push({
            id: d.id,
            userName,
            lastMessage,
            userId: data.userId,
            bureauName: data.espaceNom,
            unread: data.unreadEntreprise || false,
            updatedAt: data.updatedAt || 0,
          });
        }

        // Trier conversations par date DESC
        list.sort((a, b) => b.updatedAt - a.updatedAt);

        setThreads(list);
      } catch (e) {
        console.log("Erreur loading threads:", e);
      } finally {
        setLoading(false);
      }
    };

    loadThreads();
  }, []);

  const filtered = threads.filter(
    (t) =>
      t.userName.toLowerCase().includes(search.toLowerCase()) ||
      t.bureauName?.toLowerCase().includes(search.toLowerCase())
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
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#666"
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
              onPress={() => router.push(`/entreprise/messages/${t.id}`)}
              style={[
                styles.messageCard,
                t.unread && styles.unreadMessage,
              ]}
            >
              <View style={styles.row}>
                <View style={styles.avatar} />
                <View style={styles.messageInfo}>
                  <Text style={styles.username}>{t.userName}</Text>
                  <Text style={styles.subtitle}>
                    {t.bureauName || "Bureau inconnu"}
                  </Text>
                  <Text
                    style={{
                      color: "#333",
                      marginTop: 4,
                      fontSize: 13,
                    }}
                  >
                    {t.lastMessage || "Démarrer la conversation"}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNavBarEntreprise activeTab="message" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF3F8",
  },
  scrollContent: {
    alignItems: "center",
    paddingVertical: 20,
    paddingBottom: 120,
  },
  logo: {
    width: 160,
    height: 80,
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D9D9D9",
    borderRadius: 20,
    width: "85%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#000",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#000",
    width: "90%",
    marginBottom: 12,
  },
  messageCard: {
    width: "90%",
    backgroundColor: "#D9D9D9",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  unreadMessage: {
    backgroundColor: "#BFD9F1",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 45,
    backgroundColor: "#000",
    marginRight: 12,
  },
  messageInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
    color: "#555",
  },
});