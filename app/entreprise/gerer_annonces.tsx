// app/entreprise/gerer_annonces.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
} from "firebase/firestore";
import { deleteObject, getStorage, ref } from "firebase/storage";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import BottomNavBarEntreprise from "../../components/BottomNavBarEntreprise";
import { auth, db } from "../../firebaseConfig";

export default function GererAnnoncesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [espaces, setEspaces] = useState<any[]>([]);

  // 🔄 Récupération des annonces de l'entreprise
  useEffect(() => {
    const fetchEspaces = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          // pas d'utilisateur connecté → on arrête proprement
          setEspaces([]);
          setLoading(false);
          return;
        }

        const q = query(collection(db, "espaces"), where("uid", "==", uid));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        setEspaces(list);
      } catch (err) {
        console.log("Erreur Firestore (gerer_annonces) :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEspaces();
  }, []);

  // 🗑️ Suppression des images Storage
  const supprimerImages = async (images: string[] | undefined) => {
    if (!images || images.length === 0) return;

    const storage = getStorage();

    for (const url of images) {
      try {
        const match = url.match(/\/o\/(.+?)\?/);
        if (!match) continue;

        const fullPath = decodeURIComponent(match[1]); // ex: espaces/xxx.jpg
        await deleteObject(ref(storage, fullPath));
      } catch (err) {
        console.log("Erreur suppr image :", err);
      }
    }
  };

  // 🗑️ Suppression complète d'une annonce
  const supprimerAnnonce = (id: string, images: string[] | undefined) => {
    // 🌐 Web : vrai window.confirm()
    if (Platform.OS === "web") {
      const ok = window.confirm(
        "Voulez-vous vraiment supprimer cette annonce ?"
      );
      if (!ok) return;

      (async () => {
        try {
          await supprimerImages(images);
          await deleteDoc(doc(db, "espaces", id));
          setEspaces((prev) => prev.filter((e) => e.id !== id));
        } catch (e) {
          console.log("Erreur suppression (web) :", e);
          alert("Impossible de supprimer l’annonce.");
        }
      })();

      return;
    }

    // 📱 Mobile : Alert native avec 2 boutons
    Alert.alert(
      "Supprimer l’annonce",
      "Voulez-vous vraiment supprimer cette annonce ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await supprimerImages(images);
              await deleteDoc(doc(db, "espaces", id));
              setEspaces((prev) => prev.filter((e) => e.id !== id));
            } catch (e) {
              console.log("Erreur suppression (mobile) :", e);
              Alert.alert(
                "Erreur",
                "Impossible de supprimer l’annonce pour le moment."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Gérer mes annonces</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#3E7CB1" />
        ) : espaces.length === 0 ? (
          <Text style={{ marginTop: 20 }}>Aucune annonce publiée.</Text>
        ) : (
          espaces.map((espace) => (
            <View key={espace.id} style={styles.card}>
              {/* Image */}
              <Image
                source={{ uri: espace.images?.[0] }}
                style={styles.image}
              />

              {/* Infos */}
              <View style={styles.info}>
                <Text style={styles.localisation}>{espace.localisation}</Text>
                <Text style={styles.prix}>{espace.prix} €/h</Text>
              </View>

              {/* Boutons gestion */}
              <View style={styles.buttons}>
                <Pressable
                  style={styles.actionBtn}
                  onPress={() =>
                    router.push(`/entreprise/details_espace/${espace.id}`)
                  }
                >
                  <Ionicons name="eye-outline" size={22} color="#3E7CB1" />
                </Pressable>

                <Pressable
                  style={styles.actionBtn}
                  onPress={() =>
                    router.push(`/entreprise/editer_espace/${espace.id}`)
                  }
                >
                  <Ionicons name="create-outline" size={22} color="#F49B0B" />
                </Pressable>

                <Pressable
                  style={styles.actionBtn}
                  onPress={() => supprimerAnnonce(espace.id, espace.images)}
                >
                  <Ionicons name="trash-outline" size={22} color="#C0392B" />
                </Pressable>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <BottomNavBarEntreprise activeTab="settings" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF3F8",
  },

  content: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 100,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    width: "90%",
    marginBottom: 20,
    color: "#000",
  },

  card: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 14,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },

  image: {
    width: 85,
    height: 85,
    borderRadius: 10,
    backgroundColor: "#ccc",
  },

  info: {
    flex: 1,
    marginLeft: 10,
  },

  localisation: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },

  prix: {
    fontSize: 14,
    color: "#444",
    marginTop: 4,
  },

  buttons: {
    flexDirection: "row",
    alignItems: "center",
  },

  actionBtn: {
    padding: 6,
    marginLeft: 8,
  },
});
