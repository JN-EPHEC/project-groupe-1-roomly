// app/admin/espaces_en_attente.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    collection,
    doc,
    getDocs,
    query,
    updateDoc,
    where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { db } from "../../firebaseConfig";

const STATUS_ATTENTE = "en attente de validation";
const STATUS_VALIDE = "validé";
const STATUS_REFUSE = "refusé";

type Espace = {
  id: string;
  nom?: string;
  localisation?: string;
  prix?: number | string;
  images?: string[];
  status?: string;
};

export default function EspacesEnAttenteScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [espaces, setEspaces] = useState<Espace[]>([]);

  // état pour la popup de refus
  const [refuseModalVisible, setRefuseModalVisible] = useState(false);
  const [refuseReason, setRefuseReason] = useState("");
  const [selectedEspace, setSelectedEspace] = useState<Espace | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(
          collection(db, "espaces"),
          where("status", "==", STATUS_ATTENTE)
        );
        const snap = await getDocs(q);
        const list: Espace[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setEspaces(list);
      } catch (e) {
        console.log("Erreur load espaces_en_attente:", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const validerEspace = async (id: string) => {
    try {
      await updateDoc(doc(db, "espaces", id), {
        status: STATUS_VALIDE,
        motifRefus: null,
      });
      setEspaces((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      console.log("Erreur validation espace:", e);
      Alert.alert("Erreur", "Impossible de valider cet espace.");
    }
  };

  const ouvrirRefus = (espace: Espace) => {
    setSelectedEspace(espace);
    setRefuseReason("");
    setRefuseModalVisible(true);
  };

  const confirmerRefus = async () => {
    if (!selectedEspace) return;
    if (!refuseReason.trim()) {
      Alert.alert("Motif requis", "Merci d’indiquer une raison du refus.");
      return;
    }

    try {
      await updateDoc(doc(db, "espaces", selectedEspace.id), {
        status: STATUS_REFUSE,
        motifRefus: refuseReason.trim(),
      });

      setEspaces((prev) => prev.filter((e) => e.id !== selectedEspace.id));
      setRefuseModalVisible(false);
      setSelectedEspace(null);
      setRefuseReason("");
    } catch (e) {
      console.log("Erreur refus espace:", e);
      Alert.alert("Erreur", "Impossible de refuser cet espace pour le moment.");
    }
  };

  const openDetails = (id: string) => {
    router.push(`/entreprise/details_espace/${id}`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>
        <Text style={styles.title}>Espaces en attente</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#3E7CB1" />
        ) : espaces.length === 0 ? (
          <Text style={{ marginTop: 20 }}>
            Aucun espace en attente de validation.
          </Text>
        ) : (
          espaces.map((espace) => (
            <View key={espace.id} style={styles.card}>
              {/* Zone cliquable → détails */}
              <Pressable
                style={styles.infoZone}
                onPress={() => openDetails(espace.id)}
              >
                {espace.images?.[0] ? (
                  <Image
                    source={{ uri: espace.images[0] }}
                    style={styles.image}
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>Aucune image</Text>
                  </View>
                )}

                <View style={styles.texts}>
                  <Text style={styles.nom} numberOfLines={1}>
                    {espace.nom || "Espace sans nom"}
                  </Text>
                  <Text style={styles.localisation} numberOfLines={1}>
                    {espace.localisation || "Localisation inconnue"}
                  </Text>
                  <Text style={styles.prix}>{espace.prix} €/h</Text>

                  <View style={[styles.badge, styles.badgePending]}>
                    <Text style={styles.badgeText}>
                      En attente de validation
                    </Text>
                  </View>
                </View>
              </Pressable>

              {/* Boutons actions */}
              <View style={styles.actionsRow}>
                <Pressable
                  style={[styles.actionBtn, styles.btnRefuser]}
                  onPress={() => ouvrirRefus(espace)}
                >
                  <Ionicons name="close-circle-outline" size={18} color="#fff" />
                  <Text style={styles.actionText}>Refuser</Text>
                </Pressable>

                <Pressable
                  style={[styles.actionBtn, styles.btnValider]}
                  onPress={() => validerEspace(espace.id)}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={styles.actionText}>Valider</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* MODAL REFUS */}
      <Modal
        visible={refuseModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRefuseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Motif du refus</Text>
            <Text style={styles.modalSubtitle}>
              L’entreprise verra ce message dans la gestion de ses annonces.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Photos insuffisantes, description trop courte..."
              value={refuseReason}
              onChangeText={setRefuseReason}
              multiline
            />

            <View style={styles.modalButtonsRow}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setRefuseModalVisible(false)}
              >
                <Text style={styles.modalBtnTextCancel}>Annuler</Text>
              </Pressable>

              <Pressable
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={confirmerRefus}
              >
                <Text style={styles.modalBtnTextConfirm}>Confirmer le refus</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF3F8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 10,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },

  infoZone: {
    flexDirection: "row",
    alignItems: "center",
  },

  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#ccc",
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    fontSize: 11,
    color: "#777",
  },

  texts: {
    flex: 1,
    marginLeft: 10,
  },
  nom: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  localisation: {
    fontSize: 13,
    color: "#555",
    marginBottom: 4,
  },
  prix: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3E7CB1",
  },

  badge: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgePending: {
    backgroundColor: "#f39c12",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  btnRefuser: {
    backgroundColor: "#c0392b",
  },
  btnValider: {
    backgroundColor: "#27ae60",
  },
  actionText: {
    color: "#fff",
    fontSize: 13,
    marginLeft: 4,
    fontWeight: "600",
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalBox: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#555",
    marginBottom: 10,
  },
  modalInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlignVertical: "top",
    marginBottom: 14,
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  modalBtnCancel: {
    backgroundColor: "#eee",
  },
  modalBtnConfirm: {
    backgroundColor: "#c0392b",
  },
  modalBtnTextCancel: {
    color: "#333",
    fontWeight: "600",
  },
  modalBtnTextConfirm: {
    color: "#fff",
    fontWeight: "600",
  },
});
