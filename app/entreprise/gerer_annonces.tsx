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

const STATUS_ATTENTE = "en attente de validation";
const STATUS_VALIDE = "validé";
const STATUS_REFUSE = "refusé";

type FilterValue = "Tous" | "validé" | "en attente de validation" | "refusé";

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: "Tous", value: "Tous" },
  { label: "Validés", value: STATUS_VALIDE },
  { label: "En attente", value: STATUS_ATTENTE },
  { label: "Refusés", value: STATUS_REFUSE },
];

type Espace = {
  id: string;
  nom?: string;
  localisation?: string;
  prix?: number | string;
  images?: string[];
  status?: string;
  motifRefus?: string | null;
};

export default function GererAnnoncesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [espaces, setEspaces] = useState<Espace[]>([]);
  const [filter, setFilter] = useState<FilterValue>("Tous");

  // 🔄 Récupération des annonces de l'entreprise
  useEffect(() => {
    const fetchEspaces = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          setEspaces([]);
          setLoading(false);
          return;
        }

        const q = query(collection(db, "espaces"), where("uid", "==", uid));
        const snap = await getDocs(q);
        const list: Espace[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

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

  // 🗑️ Suppression complète d'une annonce (action entreprise)
  const supprimerAnnonce = (id: string, images: string[] | undefined) => {
    if (Platform.OS === "web") {
      const ok = window.confirm(
        "Voulez-vous vraiment supprimer définitivement cette annonce ?"
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

    Alert.alert(
      "Supprimer l’annonce",
      "Voulez-vous vraiment supprimer définitivement cette annonce ?",
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

  const espacesFiltres = espaces.filter((e) => {
    if (filter === "Tous") return true;
    return e.status === filter;
  });

  const renderStatusBadge = (status?: string) => {
    if (status === STATUS_VALIDE) {
      return (
        <View style={[styles.badge, styles.badgeValide]}>
          <Text style={styles.badgeText}>Validé</Text>
        </View>
      );
    }
    if (status === STATUS_ATTENTE) {
      return (
        <View style={[styles.badge, styles.badgeAttente]}>
          <Text style={styles.badgeText}>En attente de validation</Text>
        </View>
      );
    }
    if (status === STATUS_REFUSE) {
      return (
        <View style={[styles.badge, styles.badgeRefuse]}>
          <Text style={styles.badgeText}>Refusé</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Gérer mes annonces</Text>

        {/* FILTRES PAR STATUT */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.value}
              style={[
                styles.filterChip,
                filter === f.value && styles.filterChipActive,
              ]}
              onPress={() => setFilter(f.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === f.value && styles.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3E7CB1" />
        ) : espacesFiltres.length === 0 ? (
          <Text style={{ marginTop: 20 }}>Aucune annonce pour ce filtre.</Text>
        ) : (
          espacesFiltres.map((espace) => (
            <View key={espace.id} style={styles.card}>
              {/* Image */}
              <Image
                source={
                  espace.images?.[0]
                    ? { uri: espace.images[0] }
                    : require("../../assets/images/roomly-logo.png")
                }
                style={styles.image}
              />

              {/* Infos */}
              <View style={styles.info}>
                <Text style={styles.localisation}>
                  {espace.nom || espace.localisation || "Espace"}
                </Text>
                <Text style={styles.prix}>{espace.prix} €/h</Text>

                {/* Statut */}
                {renderStatusBadge(espace.status)}

                {/* Motif de refus */}
                {espace.status === STATUS_REFUSE && espace.motifRefus ? (
                  <Text style={styles.motifRefus}>
                    Motif du refus : {espace.motifRefus}
                  </Text>
                ) : null}
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

      <BottomNavBarEntreprise activeTab="annonces" />
    </View>
  );
}

/* ---------------- STYLES ---------------- */

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
    marginBottom: 16,
    color: "#000",
  },

  filterRow: {
    flexDirection: "row",
    width: "90%",
    marginBottom: 16,
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: "#3E7CB1",
    borderColor: "#3E7CB1",
  },
  filterChipText: {
    fontSize: 13,
    color: "#333",
  },
  filterChipTextActive: {
    color: "#fff",
    fontWeight: "600",
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

  badge: {
    alignSelf: "flex-start",
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeValide: {
    backgroundColor: "#27ae60",
  },
  badgeAttente: {
    backgroundColor: "#f39c12",
  },
  badgeRefuse: {
    backgroundColor: "#c0392b",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },

  motifRefus: {
    marginTop: 4,
    fontSize: 12,
    color: "#c0392b",
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
