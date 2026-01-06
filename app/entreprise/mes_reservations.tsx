// app/entreprise/reservations.tsx
import BottomNavBarEntreprise from "@/components/BottomNavBarEntreprise";
import { Ionicons } from "@expo/vector-icons";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { auth, db } from "../../firebaseConfig";

const COMMISSION_RATE = 0.1; // 10% Roomly

export default function ReservationsEntreprise() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ---- état pour la notation ----
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingReservation, setRatingReservation] = useState<any | null>(null);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState("");
  const [savingRating, setSavingRating] = useState(false);

  // ---- état pour signalement / blocage ----
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReservation, setReportReservation] = useState<any | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [blockUser, setBlockUser] = useState(true);
  const [savingReport, setSavingReport] = useState(false);

  useEffect(() => {
    const loadReservations = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          setReservations([]);
          return;
        }

        // Réservations de cette entreprise
        const q = query(
          collection(db, "reservations"),
          where("entrepriseId", "==", uid)
        );

        const snap = await getDocs(q);
        const reservationsList: any[] = [];

        for (const d of snap.docs) {
          const data = d.data();

          // Nom de l’espace
          const espaceSnap = await getDoc(doc(db, "espaces", data.espaceId));
          const espace = espaceSnap.exists()
            ? espaceSnap.data()
            : { nom: "Espace supprimé" };

          // Nom du user
          let userName = "Utilisateur";
          if (data.userId) {
            const userSnap = await getDoc(doc(db, "users", data.userId));
            if (userSnap.exists()) {
              const u = userSnap.data() as any;
              userName = u.name || u.email || "Utilisateur";
            }
          }

          reservationsList.push({
            id: d.id,
            ...data,
            espaceNom: (espace as any).nom || "Espace sans nom",
            userName,
          });
        }

        // du plus récent au plus ancien
        reservationsList.sort((a, b) => (a.date < b.date ? 1 : -1));

        setReservations(reservationsList);
      } catch (e) {
        console.log("Erreur chargement réservations:", e);
      } finally {
        setLoading(false);
      }
    };

    loadReservations();
  }, []);

  // --------- helpers ---------
  const isPastReservation = (dateStr: string) => {
    const today = new Date();
    const d = new Date(dateStr);
    return d < today;
  };

  const openRatingModal = (reservation: any) => {
    setRatingReservation(reservation);
    setRatingValue(5);
    setRatingComment(reservation.entrepriseRatingComment || "");
    setRatingModalVisible(true);
  };

  const closeRatingModal = () => {
    if (savingRating) return;
    setRatingModalVisible(false);
    setRatingReservation(null);
    setRatingComment("");
  };

  const handleSubmitRating = async () => {
    if (!ratingReservation) return;

    try {
      setSavingRating(true);

      const resRef = doc(db, "reservations", ratingReservation.id);

      // note sur la réservation
      await updateDoc(resRef, {
        entrepriseRating: ratingValue,
        entrepriseRatingComment: ratingComment || null,
      });

      // maj locale
      setReservations((prev) =>
        prev.map((r) =>
          r.id === ratingReservation.id
            ? {
                ...r,
                entrepriseRating: ratingValue,
                entrepriseRatingComment: ratingComment || null,
              }
            : r
        )
      );

      // mise à jour moyenne de l’utilisateur
      if (ratingReservation.userId) {
        const userRef = doc(db, "users", ratingReservation.userId);
        const userSnap = await getDoc(userRef);
        const data = (userSnap.exists() ? userSnap.data() : {}) as any;

        const currentAvg = data.averageRating || 0;
        const currentCount = data.ratingsCount || 0;

        const newCount = currentCount + 1;
        const newAvg =
          (currentAvg * currentCount + ratingValue) / Math.max(newCount, 1);

        await updateDoc(userRef, {
          averageRating: newAvg,
          ratingsCount: newCount,
        });
      }

      Alert.alert("Merci", "Votre note a bien été enregistrée.");
      closeRatingModal();
    } catch (e) {
      console.log("Erreur enregistrement note:", e);
      Alert.alert(
        "Erreur",
        "Impossible d’enregistrer la note pour le moment."
      );
      setSavingRating(false);
    } finally {
      setSavingRating(false);
    }
  };

  // --------- annulation par l’entreprise (seulement si résa à venir) ---------
  const handleCancelByEntreprise = (reservation: any) => {
    const isPast = isPastReservation(reservation.date);
    if (isPast) {
      Alert.alert(
        "Action impossible",
        "Vous ne pouvez pas annuler une réservation déjà passée."
      );
      return;
    }
    if (reservation.status === "annulée") {
      Alert.alert(
        "Déjà annulée",
        "Cette réservation a déjà été annulée."
      );
      return;
    }

    const total = Number(reservation.total) || 0;

    Alert.alert(
      "Annuler la réservation ?",
      "Cette action annulera la réservation et enregistrera un remboursement intégral pour le client (MVP).",
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: async () => {
            try {
              const refundAmount = total;

              await updateDoc(doc(db, "reservations", reservation.id), {
                status: "annulée",
                cancelledBy: "entreprise",
                cancelledAt: new Date(),
                paymentStatus: "refunded_full",
                refundAmount,
              });

              // mise à jour locale
              setReservations((prev) =>
                prev.map((r) =>
                  r.id === reservation.id
                    ? {
                        ...r,
                        status: "annulée",
                        cancelledBy: "entreprise",
                        paymentStatus: "refunded_full",
                        refundAmount,
                      }
                    : r
                )
              );
            } catch (e) {
              console.log("Erreur annulation par entreprise :", e);
              Alert.alert(
                "Erreur",
                "Impossible d’annuler la réservation pour le moment."
              );
            }
          },
        },
      ]
    );
  };

  // --------- signalement / blocage utilisateur ---------
  const openReportModal = (reservation: any) => {
    setReportReservation(reservation);
    setReportReason("");
    setBlockUser(true);
    setReportModalVisible(true);
  };

  const closeReportModal = () => {
    if (savingReport) return;
    setReportModalVisible(false);
    setReportReservation(null);
    setReportReason("");
    setBlockUser(true);
  };

  const handleSubmitReport = async () => {
    if (!reportReservation) return;
    if (!reportReason.trim()) {
      Alert.alert("Motif requis", "Merci d’indiquer un motif de signalement.");
      return;
    }

    try {
      setSavingReport(true);
      const reporterId = auth.currentUser?.uid || null;
      const reportedUserId = reportReservation.userId || null;

      // 1) enregistrement du signalement
      await addDoc(collection(db, "abuseReports"), {
        reservationId: reportReservation.id,
        reportedUserId,
        reporterEntrepriseId: reporterId,
        reason: reportReason.trim(),
        createdAt: serverTimestamp(),
        status: "nouveau",
      });

      // 2) blocage éventuel de l’utilisateur
      if (blockUser && reportedUserId) {
        const userRef = doc(db, "users", reportedUserId);
        await updateDoc(userRef, {
          isBlocked: true,
          blockedAt: new Date(),
          blockedBy: reporterId || "entreprise",
        });
      }

      Alert.alert(
        "Signalement envoyé",
        blockUser
          ? "L’utilisateur a été signalé et bloqué."
          : "L’utilisateur a été signalé."
      );
      closeReportModal();
    } catch (e) {
      console.log("Erreur signalement utilisateur :", e);
      Alert.alert(
        "Erreur",
        "Impossible d’enregistrer le signalement pour le moment."
      );
      setSavingReport(false);
    } finally {
      setSavingReport(false);
    }
  };

  // --------- synthèse paiements / commissions ---------
  const totals = reservations.reduce(
    (acc, r) => {
      const total = Number(r.total) || 0;
      const commission = total * COMMISSION_RATE;
      const net = total - commission;

      acc.gross += total;
      acc.commission += commission;
      acc.net += net;
      return acc;
    },
    { gross: 0, commission: 0, net: 0 }
  );

  const formatAmount = (v: number) => v.toFixed(2).replace(".", ",");

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>
          Historique des paiements & réservations
        </Text>

        {/* Synthèse paiements / frais */}
        {!loading && reservations.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Synthèse financière</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total brut encaissé</Text>
              <Text style={styles.summaryValue}>
                {formatAmount(totals.gross)} €
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Commissions Roomly (10%)</Text>
              <Text style={styles.summaryValue}>
                {formatAmount(totals.commission)} €
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Revenus nets perçus</Text>
              <Text style={styles.summaryValueNet}>
                {formatAmount(totals.net)} €
              </Text>
            </View>
          </View>
        )}

        {/* Sous-titre historique détaillé */}
        {!loading && reservations.length > 0 && (
          <Text style={styles.sectionSubtitle}>Détail des transactions</Text>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#3E7CB1" />
        ) : reservations.length === 0 ? (
          <Text style={styles.empty}>Aucune réservation trouvée.</Text>
        ) : (
          reservations.map((r) => {
            const isPast = isPastReservation(r.date);
            const isRated = typeof r.entrepriseRating === "number";

            const total = Number(r.total) || 0;
            const commission = total * COMMISSION_RATE;
            const net = total - commission;
            const isCancelled = r.status === "annulée";

            let etatLabel = "";
            let etatColor = "green";

            if (isCancelled) {
              etatLabel = "Annulée (remboursement intégral)";
              etatColor = "#c0392b";
            } else if (isPast) {
              etatLabel = "Passée";
              etatColor = "grey";
            } else {
              etatLabel = "À venir";
              etatColor = "green";
            }

            return (
              <View key={r.id} style={styles.card}>
                {/* Réf transaction */}
                <Text style={styles.transactionRef}>
                  Réf. transaction : {r.id}
                </Text>

                <Text style={styles.espaceName}>📍 {r.espaceNom}</Text>

                <View style={styles.row}>
                  <Text style={styles.label}>Date :</Text>
                  <Text style={styles.value}>
                    {new Date(r.date).toLocaleDateString("fr-FR")}
                  </Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Réservé par :</Text>
                  <Text style={[styles.value, { color: "#3E7CB1" }]}>
                    {r.userName}
                  </Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Créneaux :</Text>
                  <Text style={styles.value}>{r.slots.join(", ")}</Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Montant total :</Text>
                  <Text style={styles.value}>{formatAmount(total)} €</Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Commission Roomly (10%) :</Text>
                  <Text style={styles.valueCommission}>
                    - {formatAmount(commission)} €
                  </Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Revenu net :</Text>
                  <Text style={styles.valueNet}>{formatAmount(net)} €</Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>État :</Text>
                  <Text style={[styles.value, { color: etatColor }]}>
                    {etatLabel}
                  </Text>
                </View>

                {r.paymentStatus && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Statut paiement :</Text>
                    <Text style={styles.value}>{r.paymentStatus}</Text>
                  </View>
                )}

                {/* Bouton d'annulation (uniquement si non annulée ET à venir) */}
                {!isCancelled && !isPast && (
                  <Pressable
                    style={styles.cancelBtn}
                    onPress={() => handleCancelByEntreprise(r)}
                  >
                    <Text style={styles.cancelText}>
                      Annuler la réservation (remb. intégral)
                    </Text>
                  </Pressable>
                )}

                {/* Bloc notation : uniquement si réservation passée */}
                {isPast && (
                  <View style={{ marginTop: 8 }}>
                    {isRated ? (
                      <View style={styles.ratingSummaryRow}>
                        <View style={{ flexDirection: "row", marginRight: 6 }}>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Ionicons
                              key={i}
                              name={
                                i <= (r.entrepriseRating || 0)
                                  ? "star"
                                  : "star-outline"
                              }
                              size={16}
                              color="#F49B0B"
                              style={{ marginRight: 2 }}
                            />
                          ))}
                        </View>
                        <Text style={styles.ratingSummaryText}>
                          Note donnée : {r.entrepriseRating}/5
                        </Text>
                      </View>
                    ) : (
                      <Pressable
                        style={styles.rateBtn}
                        onPress={() => openRatingModal(r)}
                      >
                        <Ionicons
                          name="star-outline"
                          size={18}
                          color="#fff"
                          style={{ marginRight: 6 }}
                        />
                        <Text style={styles.rateBtnText}>
                          Noter cet utilisateur
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}

                {/* Bouton signaler / bloquer l'utilisateur */}
                <View style={{ marginTop: 8 }}>
                  <Pressable
                    style={styles.reportBtn}
                    onPress={() => openReportModal(r)}
                  >
                    <Ionicons
                      name="alert-circle-outline"
                      size={18}
                      color="#c0392b"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.reportBtnText}>
                      Signaler / bloquer cet utilisateur
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* MODAL DE NOTATION */}
      <Modal
        visible={ratingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeRatingModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Noter l’utilisateur</Text>
            {ratingReservation && (
              <Text style={styles.modalSubtitle}>
                Réservation du{" "}
                {new Date(ratingReservation.date).toLocaleDateString("fr-FR")}{" "}
                – {ratingReservation.userName}
              </Text>
            )}

            <Text style={styles.modalLabel}>Note</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Pressable
                  key={i}
                  onPress={() => setRatingValue(i)}
                  style={{ paddingHorizontal: 4 }}
                >
                  <Ionicons
                    name={i <= ratingValue ? "star" : "star-outline"}
                    size={26}
                    color="#F49B0B"
                  />
                </Pressable>
              ))}
            </View>

            <Text style={styles.modalLabel}>Commentaire (optionnel)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Ajoutez un commentaire sur la collaboration..."
              placeholderTextColor="#777"
              value={ratingComment}
              onChangeText={setRatingComment}
              multiline
            />

            <View style={styles.modalButtonsRow}>
              <Pressable
                style={[
                  styles.modalBtnSecondary,
                  savingRating && { opacity: 0.6 },
                ]}
                onPress={closeRatingModal}
                disabled={savingRating}
              >
                <Text style={styles.modalBtnSecondaryText}>Annuler</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalBtnPrimary,
                  savingRating && { opacity: 0.7 },
                ]}
                onPress={handleSubmitRating}
                disabled={savingRating}
              >
                {savingRating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalBtnPrimaryText}>Enregistrer</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL DE SIGNALEMENT / BLOCAGE */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeReportModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Signaler un utilisateur</Text>
            {reportReservation && (
              <Text style={styles.modalSubtitle}>
                Utilisateur : {reportReservation.userName}
                {"\n"}
                Réservation du{" "}
                {new Date(reportReservation.date).toLocaleDateString("fr-FR")}
              </Text>
            )}

            <Text style={styles.modalLabel}>Motif du signalement</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Décrivez le comportement abusif..."
              placeholderTextColor="#777"
              value={reportReason}
              onChangeText={setReportReason}
              multiline
            />

            <Pressable
              style={styles.reportCheckboxRow}
              onPress={() => setBlockUser((b) => !b)}
            >
              <View
                style={[
                  styles.reportCheckboxBox,
                  blockUser && styles.reportCheckboxBoxChecked,
                ]}
              >
                {blockUser && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
              </View>
              <Text style={styles.reportCheckboxText}>
                Bloquer cet utilisateur sur Roomly
              </Text>
            </Pressable>

            <View style={styles.modalButtonsRow}>
              <Pressable
                style={[
                  styles.modalBtnSecondary,
                  savingReport && { opacity: 0.6 },
                ]}
                onPress={closeReportModal}
                disabled={savingReport}
              >
                <Text style={styles.modalBtnSecondaryText}>Annuler</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalBtnPrimaryDanger,
                  savingReport && { opacity: 0.7 },
                ]}
                onPress={handleSubmitReport}
                disabled={savingReport}
              >
                {savingReport ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalBtnPrimaryText}>Envoyer</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNavBarEntreprise activeTab="menu" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },

  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },

  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },

  empty: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
  },

  /* Synthèse paiements */
  summaryCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#444",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
  },
  summaryValueNet: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0B8A42",
  },

  sectionSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  transactionRef: {
    fontSize: 11,
    color: "#777",
    marginBottom: 4,
  },

  espaceName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#3E7CB1",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  label: { fontSize: 14, color: "#444" },
  value: { fontSize: 14, fontWeight: "600" },
  valueCommission: { fontSize: 14, fontWeight: "600", color: "#BB0000" },
  valueNet: { fontSize: 14, fontWeight: "700", color: "#0B8A42" },

  /* bouton noter */
  rateBtn: {
    marginTop: 6,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3E7CB1",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  rateBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },

  ratingSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingSummaryText: {
    fontSize: 13,
    color: "#444",
  },

  /* bouton annulation entreprise */
  cancelBtn: {
    marginTop: 8,
    alignSelf: "stretch",
    backgroundColor: "#e74c3c",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },

  /* bouton signalement */
  reportBtn: {
    marginTop: 4,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#c0392b",
    backgroundColor: "#FDEDEC",
  },
  reportBtnText: {
    color: "#c0392b",
    fontWeight: "600",
    fontSize: 13,
  },

  /* modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
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
    fontSize: 13,
    color: "#555",
    marginBottom: 10,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  commentInput: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 70,
    textAlignVertical: "top",
    fontSize: 13,
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  modalBtnSecondary: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  modalBtnSecondaryText: {
    fontSize: 14,
    color: "#444",
  },
  modalBtnPrimary: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#3E7CB1",
  },
  modalBtnPrimaryDanger: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#c0392b",
  },
  modalBtnPrimaryText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },

  /* checkbox blocage */
  reportCheckboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  reportCheckboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#c0392b",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    backgroundColor: "#fff",
  },
  reportCheckboxBoxChecked: {
    backgroundColor: "#c0392b",
  },
  reportCheckboxText: {
    fontSize: 13,
    color: "#333",
  },
});
