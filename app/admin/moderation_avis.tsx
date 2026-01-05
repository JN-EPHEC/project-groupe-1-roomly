// app/admin/moderation_avis.tsx
import { useRouter } from "expo-router";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { db } from "../../firebaseConfig";

type Avis = {
  id: string; // id de la réservation
  userId?: string | null;
  entrepriseId?: string | null;
  espaceId?: string | null;

  userName: string;
  entrepriseName: string;
  espaceNom: string;

  rating: number | null;
  comment: string;
  hiddenByAdmin: boolean;
  createdAt?: any;
};

export default function ModerationAvisAdmin() {
  const router = useRouter();
  const [avisList, setAvisList] = useState<Avis[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const toDate = (ts: any): Date | null => {
    if (!ts) return null;
    return ts.toDate ? ts.toDate() : new Date(ts);
  };

  const formatDate = (ts: any) => {
    const d = toDate(ts);
    if (!d) return "-";
    return d.toLocaleString("fr-BE");
  };

  const loadAvis = async () => {
    try {
      setLoading(true);

      // On récupère toutes les réservations et on filtre en JS
      const snap = await getDocs(collection(db, "reservations"));

      const list: Avis[] = [];
      for (const d of snap.docs) {
        const data = d.data() as any;

        // On ne garde que celles avec un commentaire d’avis
        if (!data.entrepriseRatingComment) continue;

        // Infos de base
        const rating = typeof data.entrepriseRating === "number"
          ? data.entrepriseRating
          : null;
        const comment = data.entrepriseRatingComment as string;
        const hiddenByAdmin = !!data.entrepriseRatingHiddenByAdmin;

        // Charger nom utilisateur
        let userName = "Utilisateur";
        if (data.userId) {
          const uSnap = await getDoc(doc(db, "users", data.userId));
          if (uSnap.exists()) {
            const u = uSnap.data() as any;
            userName = u.name || u.displayName || u.email || "Utilisateur";
          }
        }

        // Charger nom entreprise
        let entrepriseName = "Entreprise";
        if (data.entrepriseId) {
          const eSnap = await getDoc(doc(db, "users", data.entrepriseId));
          if (eSnap.exists()) {
            const e = eSnap.data() as any;
            entrepriseName = e.name || e.displayName || e.email || "Entreprise";
          }
        }

        // Charger nom de l’espace
        let espaceNom = "Espace";
        if (data.espaceId) {
          const espaceSnap = await getDoc(doc(db, "espaces", data.espaceId));
          if (espaceSnap.exists()) {
            const e = espaceSnap.data() as any;
            espaceNom = e.nom || "Espace";
          }
        }

        list.push({
          id: d.id,
          userId: data.userId,
          entrepriseId: data.entrepriseId,
          espaceId: data.espaceId,
          userName,
          entrepriseName,
          espaceNom,
          rating,
          comment,
          hiddenByAdmin,
          createdAt: data.createdAt,
        });
      }

      // Trier par date de création desc
      list.sort((a, b) => {
        const da = toDate(a.createdAt)?.getTime() || 0;
        const dbb = toDate(b.createdAt)?.getTime() || 0;
        return dbb - da;
      });

      setAvisList(list);
    } catch (e) {
      console.log("Erreur chargement avis admin :", e);
      Alert.alert("Erreur", "Impossible de charger les avis.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvis();
  }, []);

  const toggleHideAvis = async (avis: Avis) => {
    try {
      setUpdatingId(avis.id);
      await updateDoc(doc(db, "reservations", avis.id), {
        entrepriseRatingHiddenByAdmin: !avis.hiddenByAdmin,
      });

      setAvisList((prev) =>
        prev.map((a) =>
          a.id === avis.id ? { ...a, hiddenByAdmin: !avis.hiddenByAdmin } : a
        )
      );
    } catch (e) {
      console.log("Erreur modération avis :", e);
      Alert.alert("Erreur", "Impossible de mettre à jour la visibilité.");
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteAvis = async (avis: Avis) => {
    Alert.alert(
      "Supprimer l’avis",
      "Cette action supprimera la note et le commentaire de cette réservation. Continuer ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              setUpdatingId(avis.id);
              await updateDoc(doc(db, "reservations", avis.id), {
                entrepriseRating: null,
                entrepriseRatingComment: null,
                entrepriseRatingHiddenByAdmin: null,
              });

              setAvisList((prev) =>
                prev.filter((a) => a.id !== avis.id)
              );
            } catch (e) {
              console.log("Erreur suppression avis :", e);
              Alert.alert(
                "Erreur",
                "Impossible de supprimer cet avis pour le moment."
              );
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Modération des avis</Text>
        <Text style={styles.subtitle}>
          Avis et commentaires laissés par les entreprises sur les utilisateurs.
        </Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#3E7CB1" />
          </View>
        ) : avisList.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>Aucun avis à modérer.</Text>
          </View>
        ) : (
          avisList.map((a) => (
            <View key={a.id} style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.espaceName}>{a.espaceNom}</Text>
                {a.rating !== null && (
                  <Text style={styles.rating}>{a.rating.toFixed(1)}/5</Text>
                )}
              </View>

              <Text style={styles.meta}>
                Entreprise : <Text style={styles.metaBold}>{a.entrepriseName}</Text>
              </Text>
              <Text style={styles.meta}>
                Utilisateur : <Text style={styles.metaBold}>{a.userName}</Text>
              </Text>
              <Text style={styles.meta}>
                Créé le :{" "}
                <Text style={styles.metaBold}>{formatDate(a.createdAt)}</Text>
              </Text>

              <View style={styles.commentBlock}>
                <Text style={styles.commentLabel}>Commentaire :</Text>
                <Text
                  style={[
                    styles.commentText,
                    a.hiddenByAdmin && { textDecorationLine: "line-through", color: "#999" },
                  ]}
                >
                  {a.comment}
                </Text>
              </View>

              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.visibilityBadge,
                    a.hiddenByAdmin
                      ? { backgroundColor: "#F8D7DA" }
                      : { backgroundColor: "#D4EDDA" },
                  ]}
                >
                  <Text
                    style={[
                      styles.visibilityText,
                      a.hiddenByAdmin
                        ? { color: "#721C24" }
                        : { color: "#155724" },
                    ]}
                  >
                    {a.hiddenByAdmin ? "Masqué par l’admin" : "Visible"}
                  </Text>
                </View>
              </View>

              <View style={styles.actionsRow}>
                <Pressable
                  style={[
                    styles.actionBtn,
                    a.hiddenByAdmin
                      ? styles.btnMakeVisible
                      : styles.btnHide,
                    updatingId === a.id && { opacity: 0.6 },
                  ]}
                  disabled={updatingId === a.id}
                  onPress={() => toggleHideAvis(a)}
                >
                  <Text style={styles.actionText}>
                    {a.hiddenByAdmin ? "Rendre visible" : "Masquer l’avis"}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.actionBtn,
                    styles.btnDelete,
                    updatingId === a.id && { opacity: 0.6 },
                  ]}
                  disabled={updatingId === a.id}
                  onPress={() => deleteAvis(a)}
                >
                  <Text style={styles.actionText}>Supprimer</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 20 }} />

        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Retour</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },
  content: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#555",
    marginBottom: 16,
  },
  center: {
    marginTop: 30,
    alignItems: "center",
  },
  emptyText: {
    color: "#555",
    fontSize: 14,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  espaceName: {
    fontSize: 15,
    fontWeight: "700",
  },
  rating: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F49B0B",
  },
  meta: {
    fontSize: 12,
    color: "#555",
  },
  metaBold: {
    fontWeight: "600",
    color: "#222",
  },
  commentBlock: {
    marginTop: 8,
  },
  commentLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  commentText: {
    fontSize: 13,
    color: "#333",
  },
  badgeRow: {
    marginTop: 8,
    flexDirection: "row",
  },
  visibilityBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  visibilityText: {
    fontSize: 12,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    marginHorizontal: 3,
  },
  btnHide: {
    backgroundColor: "#FFF3CD",
  },
  btnMakeVisible: {
    backgroundColor: "#D4EDDA",
  },
  btnDelete: {
    backgroundColor: "#F8D7DA",
  },
  actionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
  },
  backBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#1E6091",
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  backBtnText: {
    color: "#1E6091",
    fontSize: 15,
    fontWeight: "600",
  },
});
