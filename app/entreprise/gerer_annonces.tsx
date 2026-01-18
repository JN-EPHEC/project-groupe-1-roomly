// app/entreprise/gerer_annonces.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
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
const STATUS_DESACTIVE = "desactive";

type FilterValue =
  | "Tous"
  | "validé"
  | "en attente de validation"
  | "refusé"
  | "desactive";

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: "Tous", value: "Tous" },
  { label: "Validés", value: STATUS_VALIDE },
  { label: "En attente", value: STATUS_ATTENTE },
  { label: "Refusés", value: STATUS_REFUSE },
  { label: "Désactivés", value: STATUS_DESACTIVE },
];

type BoostType = "24h" | "3j" | "7j";

const BOOST_PRICES: Record<BoostType, number> = {
  "24h": 1.99,
  "3j": 2.99,
  "7j": 4.99,
};

type Espace = {
  id: string;
  nom?: string;
  localisation?: string;
  prix?: number | string;
  images?: string[];
  status?: string;
  motifRefus?: string | null;
  description?: string; // AJOUTÉ

  boostType?: BoostType | null;
  boostUntil?: any | null;
};

const isBoostActive = (e: Espace): boolean => {
  if (!e.boostUntil) return false;
  const d = (e.boostUntil as any).toDate
    ? (e.boostUntil as any).toDate()
    : new Date(e.boostUntil as any);
  return d.getTime() > Date.now();
};

const getBoostRemainingLabel = (e: Espace): string | null => {
  if (!e.boostUntil) return null;
  const d = (e.boostUntil as any).toDate
    ? (e.boostUntil as any).toDate()
    : new Date(e.boostUntil as any);

  const diffMs = d.getTime() - Date.now();
  if (diffMs <= 0) return null;

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes - days * 60 * 24) / 60);
  const minutes = totalMinutes - days * 60 * 24 - hours * 60;

  if (days > 0) {
    return `Boost actif : ${days}j ${hours}h restantes`;
  }
  if (hours > 0) {
    return `Boost actif : ${hours}h ${minutes}min restantes`;
  }
  return `Boost actif : ${minutes}min restantes`;
};

export default function GererAnnoncesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [espaces, setEspaces] = useState<Espace[]>([]);
  const [filter, setFilter] = useState<FilterValue>("Tous");
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Modal boost
  const [boostModalVisible, setBoostModalVisible] = useState(false);
  const [selectedEspace, setSelectedEspace] = useState<Espace | null>(null);
  const [boostLoading, setBoostLoading] = useState(false);
  const [selectedBoostType, setSelectedBoostType] = useState<BoostType | null>(
    null
  );

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
          alert("Impossible de supprimer l'annonce.");
        }
      })();

      return;
    }

    Alert.alert(
      "Supprimer l'annonce",
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
                "Impossible de supprimer l'annonce pour le moment."
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
          <Text style={styles.badgeText}>En attente</Text>
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
    if (status === STATUS_DESACTIVE) {
      return (
        <View style={[styles.badge, styles.badgeDesactive]}>
          <Text style={styles.badgeText}>Désactivé</Text>
        </View>
      );
    }
    return null;
  };

  const toggleStatus = async (espace: Espace) => {
    const current = espace.status;

    // On limite l'action aux annonces validées ou déjà désactivées
    if (current !== STATUS_VALIDE && current !== STATUS_DESACTIVE) {
      Alert.alert(
        "Action impossible",
        "Vous ne pouvez (dés)activer que les annonces validées."
      );
      return;
    }

    const newStatus =
      current === STATUS_DESACTIVE ? STATUS_VALIDE : STATUS_DESACTIVE;

    try {
      setUpdatingStatusId(espace.id);

      await updateDoc(doc(db, "espaces", espace.id), {
        status: newStatus,
      });

      // Mise à jour locale
      setEspaces((prev) =>
        prev.map((e) =>
          e.id === espace.id ? { ...e, status: newStatus } : e
        )
      );
    } catch (e) {
      console.log("Erreur changement statut (désactivation):", e);
      Alert.alert(
        "Erreur",
        "Impossible de mettre à jour le statut pour le moment."
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const openBoostModal = (espace: Espace) => {
    setSelectedEspace(espace);
    setSelectedBoostType(null); // on repart toujours de l'étape 1
    setBoostModalVisible(true);
  };

  const closeBoostModal = () => {
    if (boostLoading) return;
    setBoostModalVisible(false);
    setSelectedEspace(null);
    setSelectedBoostType(null);
  };

  // Étape "payer" après choix de la durée
  const handlePayWithPaypalDemo = async () => {
    if (!selectedEspace || !selectedBoostType) return;

    try {
      setBoostLoading(true);

      const type = selectedBoostType;
      const days = type === "24h" ? 1 : type === "3j" ? 3 : 7;
      const now = new Date();
      const until = new Date(now.getTime() + days * 24 * 3600 * 1000);

      // Ici on simule le paiement PayPal (demo), puis on applique le boost
      await updateDoc(doc(db, "espaces", selectedEspace.id), {
        boostType: type,
        boostUntil: until,
      });

      setEspaces((prev) =>
        prev.map((e) =>
          e.id === selectedEspace.id
            ? { ...e, boostType: type, boostUntil: until }
            : e
        )
      );

      Alert.alert(
        "Boost activé",
        `Annonce boostée pour ${
          type === "24h" ? "24 heures" : type === "3j" ? "3 jours" : "7 jours"
        }.`
      );
      closeBoostModal();
    } catch (e) {
      console.log("Erreur boost :", e);
      Alert.alert("Erreur", "Impossible d'activer le boost pour le moment.");
      setBoostLoading(false);
    } finally {
      setBoostLoading(false);
    }
  };

  const getBoostLabelForType = (type: BoostType): string => {
    if (type === "24h") return "24 heures";
    if (type === "3j") return "3 jours";
    return "7 jours";
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
          espacesFiltres.map((espace) => {
            const boosted = isBoostActive(espace);
            const remainingLabel = boosted
              ? getBoostRemainingLabel(espace)
              : null;

            return (
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
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.titre}>
                      {espace.nom || espace.localisation || "Espace"}
                    </Text>
                    {boosted && (
                      <View style={styles.boostBadge}>
                        <Text style={styles.boostBadgeText}>Top listing</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.prix}>{espace.prix} €/h</Text>
                  
                  {/* Description (affichage limité) */}
                  {espace.description && (
                    <Text style={styles.descriptionText} numberOfLines={2}>
                      {espace.description}
                    </Text>
                  )}

                  {/* Statut */}
                  {renderStatusBadge(espace.status)}

                  {/* Temps restant du boost */}
                  {remainingLabel && (
                    <Text style={styles.remainingText}>{remainingLabel}</Text>
                  )}

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

                  {/* (Dés)activer */}
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => toggleStatus(espace)}
                    disabled={updatingStatusId === espace.id}
                  >
                    {updatingStatusId === espace.id ? (
                      <ActivityIndicator size="small" color="#3E7CB1" />
                    ) : (
                      <Ionicons
                        name={
                          espace.status === STATUS_DESACTIVE
                            ? "play-circle-outline" // réactiver
                            : "pause-circle-outline" // désactiver
                        }
                        size={22}
                        color="#3E7CB1"
                      />
                    )}
                  </Pressable>

                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => supprimerAnnonce(espace.id, espace.images)}
                  >
                    <Ionicons name="trash-outline" size={22} color="#C0392B" />
                  </Pressable>

                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => openBoostModal(espace)}
                  >
                    <Ionicons name="flash-outline" size={22} color="#8e44ad" />
                  </Pressable>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* MODAL BOOST */}
      {boostModalVisible && selectedEspace && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Booster l'annonce</Text>
            <Text style={styles.modalSubtitle}>
              {selectedEspace.nom ||
                selectedEspace.localisation ||
                "Espace"}
            </Text>

            {!selectedBoostType ? (
              <>
                <Text style={styles.modalHint}>
                  Choisissez la durée de mise en avant :
                </Text>

                <Pressable
                  style={styles.modalOption}
                  disabled={boostLoading}
                  onPress={() => setSelectedBoostType("24h")}
                >
                  <Text style={styles.modalOptionText}>
                    24 heures – {BOOST_PRICES["24h"].toFixed(2)} €
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.modalOption}
                  disabled={boostLoading}
                  onPress={() => setSelectedBoostType("3j")}
                >
                  <Text style={styles.modalOptionText}>
                    3 jours – {BOOST_PRICES["3j"].toFixed(2)} €
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.modalOption}
                  disabled={boostLoading}
                  onPress={() => setSelectedBoostType("7j")}
                >
                  <Text style={styles.modalOptionText}>
                    7 jours – {BOOST_PRICES["7j"].toFixed(2)} €
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.modalCancel, boostLoading && { opacity: 0.6 }]}
                  disabled={boostLoading}
                  onPress={closeBoostModal}
                >
                  <Text style={styles.modalCancelText}>Annuler</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.modalHint}>
                  Récapitulatif de votre boost :
                </Text>
                <Text style={styles.modalRecapText}>
                  Durée : {getBoostLabelForType(selectedBoostType)}
                </Text>
                <Text style={styles.modalRecapText}>
                  Prix : {BOOST_PRICES[selectedBoostType].toFixed(2)} €
                </Text>

                <Pressable
                  style={[
                    styles.modalPaypalBtn,
                    boostLoading && { opacity: 0.7 },
                  ]}
                  disabled={boostLoading}
                  onPress={handlePayWithPaypalDemo}
                >
                  {boostLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalPaypalText}>
                      Payer avec PayPal (demo)
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  style={styles.modalSecondary}
                  disabled={boostLoading}
                  onPress={() => setSelectedBoostType(null)}
                >
                  <Text style={styles.modalSecondaryText}>Retour</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalCancel, boostLoading && { opacity: 0.6 }]}
                  disabled={boostLoading}
                  onPress={closeBoostModal}
                >
                  <Text style={styles.modalCancelText}>Annuler</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      )}

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
    resizeMode: "cover", // AJOUTÉ: pour fill le cadrant
  },

  info: {
    flex: 1,
    marginLeft: 10,
  },

  titre: { // CHANGÉ: de localisation à titre
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginRight: 8,
  },

  descriptionText: { // NOUVEAU: pour afficher la description
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    marginBottom: 6,
    lineHeight: 14,
  },

  prix: {
    fontSize: 14,
    color: "#444",
    marginTop: 2,
    fontWeight: "600",
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
  badgeDesactive: {
    backgroundColor: "#7f8c8d",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },

  boostBadge: {
    backgroundColor: "#8e44ad",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  boostBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  remainingText: {
    marginTop: 4,
    fontSize: 12,
    color: "#8e44ad",
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

  /* Modal boost */
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  modalHint: {
    fontSize: 13,
    color: "#555",
    marginBottom: 12,
  },
  modalOption: {
    backgroundColor: "#EEF3F8",
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  modalOptionText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
  modalCancel: {
    marginTop: 6,
    paddingVertical: 10,
  },
  modalCancelText: {
    textAlign: "center",
    fontSize: 14,
    color: "#c0392b",
    fontWeight: "600",
  },
  modalRecapText: {
    fontSize: 14,
    marginBottom: 4,
  },
  modalPaypalBtn: {
    marginTop: 12,
    backgroundColor: "#0070ba",
    paddingVertical: 12,
    borderRadius: 10,
  },
  modalPaypalText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 14,
  },
  modalSecondary: {
    marginTop: 8,
    paddingVertical: 8,
  },
  modalSecondaryText: {
    textAlign: "center",
    fontSize: 13,
    color: "#555",
  },
});