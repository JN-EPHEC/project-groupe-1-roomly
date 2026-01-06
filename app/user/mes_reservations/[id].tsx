// app/user/mes_reservations/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import BottomNavBar from "../../../components/BottomNavBar";
import { auth, db } from "../../../firebaseConfig";

// PDF
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

/* ---------- CONST + HELPER POUR 24H AVANT ---------- */

const MS_24H = 24 * 60 * 60 * 1000;

// 🔗 base du lien de réservation à adapter si besoin (deep-link / site web)
const SHARE_BASE_URL = "https://roomly.app/reservation";

function getReservationStartDate(resa: any): Date | null {
  if (!resa?.date || !resa?.slots || resa.slots.length === 0) return null;

  const d = new Date(resa.date);
  if (isNaN(d.getTime())) return null;

  const firstSlot = String(resa.slots[0]);
  const startPart = firstSlot.split("-")[0].trim();
  const [hStr, mStr] = startPart.split(":");
  const h = Number(hStr);
  const m = Number(mStr || 0);
  if (isNaN(h) || isNaN(m)) return null;

  d.setHours(h, m, 0, 0);
  return d;
}

// fin de réservation = fin du dernier créneau
function getReservationEndDate(resa: any): Date | null {
  if (!resa?.date || !resa?.slots || resa.slots.length === 0) return null;

  const d = new Date(resa.date);
  if (isNaN(d.getTime())) return null;

  const lastSlot = String(resa.slots[resa.slots.length - 1]);
  const endPart = lastSlot.split("-")[1]?.trim();
  if (!endPart) return null;

  const [hStr, mStr] = endPart.split(":");
  const h = Number(hStr);
  const m = Number(mStr || 0);
  if (isNaN(h) || isNaN(m)) return null;

  d.setHours(h, m, 0, 0);
  return d;
}

export default function ReservationDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [reservation, setReservation] = useState<any>(null);
  const [espace, setEspace] = useState<any>(null);

  // ⭐ Avis utilisateur
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [loadingReview, setLoadingReview] = useState(true);
  const [existingReview, setExistingReview] = useState<any>(null);

  // 💶 IBAN pour remboursement manuel
  const [refundIban, setRefundIban] = useState("");

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "reservations", id as string));
      if (!snap.exists()) return;
      const data = snap.data();
      setReservation(data);

      if (data.refundIban) {
        setRefundIban(data.refundIban as string);
      }

      const espaceSnap = await getDoc(doc(db, "espaces", data.espaceId));
      if (espaceSnap.exists()) setEspace(espaceSnap.data());

      const reviewRef = doc(db, "reviewsEspaces", id as string);
      const reviewSnap = await getDoc(reviewRef);
      if (reviewSnap.exists()) {
        const rData = reviewSnap.data() as any;
        setExistingReview(rData);
        setRating(rData.note || 0);
        setComment(rData.comment || "");
      }
      setLoadingReview(false);
    };

    load();
  }, [id]);

  if (!reservation || !espace) {
    return (
      <View style={styles.loading}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  /* ---------- CALCUL 24H AVANT + RÉSA PASSÉE ---------- */

  const startDate = getReservationStartDate(reservation);
  const endDate = getReservationEndDate(reservation);
  const now = new Date();

  const diffMs = startDate ? startDate.getTime() - now.getTime() : -1;
  const canCancel = diffMs >= MS_24H && reservation.status !== "annulée";

  const isPastReservation =
    !!endDate && endDate.getTime() < now.getTime(); // terminé

  /* ---------- COUPON / RÉDUCTION ---------- */

  const totalFinal = Number(reservation.total || 0);
  const totalBefore = Number(
    reservation.totalBeforeDiscount ?? reservation.total ?? 0
  );
  const discountAmount =
    typeof reservation.discountAmount === "number"
      ? Number(reservation.discountAmount)
      : Math.max(0, totalBefore - totalFinal);

  const hasDiscount =
    !!reservation.couponCode &&
    discountAmount > 0 &&
    totalBefore > totalFinal + 0.001;

  /* ------------------------------------------------------------- */
  /* ---------------------- FACTURE PDF --------------------------- */
  /* ------------------------------------------------------------- */

  const userName = auth.currentUser?.displayName || "Client Roomly";
  const espaceNom = espace?.nom || "Espace Roomly";
  const espaceAdresse =
    espace?.localisation || "Adresse communiquée par email";
  const accessDetails =
    espace?.accessDetails ||
    "Les informations d’accès détaillées vous seront envoyées par email avant votre réservation.";

  const accessCode = reservation.accessCode || "—";

  const totalTTC = totalFinal;
  const htva = +(totalTTC / 1.21).toFixed(2);
  const tva = +(totalTTC - htva).toFixed(2);

  const formatDateFR = (d: string) => {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString("fr-FR");
  };

  const resaDateFR = formatDateFR(reservation.date);

  const buildInvoiceHTML_FigmaLike = () => {
    const today = new Date();
    const issueDate = today.toLocaleDateString("fr-FR");
    const invoiceNumber = `RML-${today.getFullYear()}${String(
      today.getMonth() + 1
    ).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}-${String(
      (id as string) || ""
    ).slice(0, 4)}`;

    const logoMain =
      "https://firebasestorage.googleapis.com/v0/b/roomly-ba.firebasestorage.app/o/roomly-logo.png?alt=media&token=02a83f18-938e-4940-817a-6262e058ac59";
    const logoSmall =
      "https://firebasestorage.googleapis.com/v0/b/roomly-ba.firebasestorage.app/o/roomly-logo-R.png?alt=media&token=c42480b3-b30f-4ff5-b03b-e0ea65d7e9e2";

    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <title>Facture Roomly</title>
      <style>
        .brand-logo { text-align:center; margin-bottom: 12px; }
        .brand-logo img { width: 160px; }
        body { font-family: -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif; margin: 40px; color: #222; }
        .header-block { margin-bottom: 25px; }
        .small { font-size: 12px; }
        .bold { font-weight: 600; }
        .section-title { font-size: 16px; font-weight: 600; margin: 30px 0 10px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; }
        th { background-color: #f2f2f2; text-align: left; }
        .right { text-align: right; }
      </style>
    </head>
    <body>
      <div class="brand-logo">
        <img src="${logoMain}" alt="Roomly" />
      </div>

      <div class="header-block small">
        <div><span class="bold">Roomly SRL</span></div>
        <div>Location de bureaux flexibles</div>
        <div>Avenue Louise 123, 1050 Bruxelles</div>
        <div>contact@roomly.be | +32 2 123 45 67</div>
        <div>TVA : BE0123.456.789</div>
      </div>

      <div class="header-block small">
        <div><span class="bold">FACTURE n° :</span> ${invoiceNumber}</div>
        <div><span class="bold">Date d’émission :</span> ${issueDate}</div>
      </div>

      <div class="header-block small">
        <div><span class="bold">Client :</span></div>
        <div>${userName}</div>
        <div>${espaceAdresse}</div>
      </div>

      <div class="section-title">Détails de la réservation</div>

      <table>
        <thead>
          <tr>
            <th>Designation</th>
            <th>Date</th>
            <th>Heures</th>
            <th class="right">Prix unitaire (€)</th>
            <th class="right">Quantité</th>
            <th class="right">Total (€)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Location – ${espaceNom}</td>
            <td>${resaDateFR}</td>
            <td>${reservation.slots.join(", ")}</td>
            <td class="right">${Number(reservation.prix || 0) || "-"}</td>
            <td class="right">${reservation.slots.length}</td>
            <td class="right">${totalTTC.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div class="section-title">Code d’accès au bâtiment</div>
      <div class="small">
        Code à saisir sur le boîtier à l’entrée :
        <span class="bold">${accessCode}</span>
      </div>

      <div class="section-title">Détails d’accès</div>
      <div class="small">
        ${accessDetails.replace(/\n/g, "<br/>")}
      </div>

      <div class="section-title">Récapitulatif</div>
      <table>
        <tbody>
          <tr>
            <td>Sous-total HTVA</td>
            <td class="right">${htva.toFixed(2)} €</td>
          </tr>
          <tr>
            <td>TVA (21%)</td>
            <td class="right">${tva.toFixed(2)} €</td>
          </tr>
          <tr>
            <td><span class="bold">Total TTC</span></td>
            <td class="right"><span class="bold">${totalTTC.toFixed(
              2
            )} €</span></td>
          </tr>
        </tbody>
      </table>

      <div class="section-title">Mode de paiement</div>
      <div class="small">
        Par carte bancaire via l’application Roomly.<br/>
        Paiement reçu le : ${issueDate}
      </div>

      <div class="section-title">Conditions</div>
      <div class="small">
        Cette facture vaut confirmation de la réservation.<br/>
        Toute annulation doit être effectuée au moins 24h avant la date de réservation.<br/>
        Pour toute question, contactez support@roomly.be.
      </div>

      <div class="small" style="margin-top:24px;">
        Merci d’avoir choisi Roomly !
      </div>
      <div style="position:absolute;bottom:20px;right:20px;opacity:0.15;">
        <img src="${logoSmall}" width="80" />
      </div>
    </body>
    </html>
    `;
  };

  const handleDownloadInvoice = async () => {
    try {
      const html = buildInvoiceHTML_FigmaLike();
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (e) {
      console.log("Erreur facture :", e);
      alert("Impossible de générer la facture.");
    }
  };

  /* -------------------- PARTAGE RÉSERVATION (MOBILE) -------------------- */

  const handleShareReservation = async () => {
    if (!reservation) return;

    const reservationId = String(id);
    const url = `${SHARE_BASE_URL}/${reservationId}`;
    const dateStr = formatDateFR(reservation.date);
    const espaceNomLocal = espace?.nom || "un espace Roomly";

    const message = `Voici le lien de ma réservation Roomly pour "${espaceNomLocal}" le ${dateStr} : ${url}`;

    if (Platform.OS === "web") {
      alert(
        `Le partage natif est disponible sur mobile.\n\nLien de la réservation :\n${url}`
      );
      return;
    }

    try {
      await Share.share({ message });
    } catch (e) {
      console.log("Erreur partage réservation :", e);
      alert("Impossible de partager la réservation pour le moment.");
    }
  };

  /* -------------------- ANNULATION + DEMANDE DE REMBOURSEMENT -------------------- */

  const handleCancelReservation = async () => {
    if (!canCancel) {
      alert(
        "Vous ne pouvez plus annuler cette réservation (moins de 24h avant le début)."
      );
      return;
    }

    if (!refundIban.trim()) {
      alert(
        "Veuillez renseigner votre IBAN (BE...) pour que l’entreprise puisse vous rembourser manuellement."
      );
      return;
    }

    try {
      await setDoc(
        doc(db, "reservations", id as string),
        {
          status: "annulée",
          cancelledAt: new Date(),
          paymentStatus: "refund_requested",
          refundIban: refundIban.trim(),
        },
        { merge: true }
      );

      setReservation((prev: any) => ({
        ...prev,
        status: "annulée",
        paymentStatus: "refund_requested",
        refundIban: refundIban.trim(),
      }));

      alert(
        "Réservation annulée. Un remboursement manuel sera effectué par l’entreprise sur l’IBAN fourni."
      );
    } catch (e) {
      console.log("Erreur annulation :", e);
      alert("Impossible d’annuler la réservation.");
    }
  };

  /* -------------------- SAUVEGARDE AVIS -------------------- */

  const handleSaveReview = async () => {
    if (!auth.currentUser?.uid) {
      alert("Vous devez être connecté pour laisser un avis.");
      return;
    }

    if (!isPastReservation) {
      alert(
        "Vous pourrez laisser un avis une fois votre réservation terminée."
      );
      return;
    }

    if (rating < 1 || rating > 5) {
      alert("Choisissez une note entre 1 et 5 étoiles.");
      return;
    }

    try {
      const reviewRef = doc(db, "reviewsEspaces", id as string);
      await setDoc(reviewRef, {
        reservationId: id,
        espaceId: reservation.espaceId,
        userId: auth.currentUser.uid,
        note: rating,
        comment: comment.trim(),
        createdAt: new Date(),
      });

      setExistingReview({
        note: rating,
        comment: comment.trim(),
      });

      alert("Merci pour votre avis !");
    } catch (e) {
      console.log("Erreur enregistrement avis :", e);
      alert("Impossible d’enregistrer votre avis.");
    }
  };

  /* -------------------------- RENDER ---------------------------- */

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* HEADER */}
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.push("/user/mes_reservations/liste")}
            >
              <Text style={styles.backIcon}>‹</Text>
            </Pressable>

            <Image
              source={require("../../../assets/images/roomly-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Détails de la réservation</Text>

          {espace.images?.[0] && (
            <Image source={{ uri: espace.images[0] }} style={styles.mainImage} />
          )}

          <Text style={styles.espaceName}>{espace.nom}</Text>
          <Text style={styles.address}>{espace.localisation}</Text>

          {/* Carte principale réservation */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Votre réservation</Text>
            <Text>Date : {reservation.date}</Text>
            <Text>Heure : {reservation.slots.join(", ")}</Text>

            {hasDiscount ? (
              <>
                <Text style={{ marginTop: 6 }}>
                  Total initial : {totalBefore.toFixed(2)}€
                </Text>
                <Text>
                  Réduction : -{discountAmount.toFixed(2)}€
                  {reservation.couponCode
                    ? `  (code ${reservation.couponCode})`
                    : ""}
                </Text>
                <Text style={{ fontWeight: "700", marginTop: 2 }}>
                  Total payé : {totalFinal.toFixed(2)}€
                </Text>
              </>
            ) : (
              <Text style={{ marginTop: 6 }}>
                Total payé : {totalFinal.toFixed(2)}€
              </Text>
            )}

            <Text style={{ marginTop: 8 }}>
              Code d’accès :{" "}
              <Text style={{ fontWeight: "700" }}>{accessCode}</Text>
            </Text>
            <Text style={{ marginTop: 6 }}>
              Détails d’accès :{" "}
              <Text style={{ fontWeight: "500" }}>{accessDetails}</Text>
            </Text>
          </View>

          {/* Bouton partage réservation */}
          <Pressable
            style={styles.shareButton}
            onPress={handleShareReservation}
          >
            <Text style={styles.shareButtonText}>
              Partager la réservation
            </Text>
          </Pressable>

          <View style={{ height: 20 }} />

          {/* Bloc IBAN pour remboursement */}
          {reservation.status !== "annulée" && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                Coordonnées pour remboursement
              </Text>
              <Text style={{ marginBottom: 6 }}>
                En cas d’annulation, l’entreprise utilisera cet IBAN pour vous
                rembourser manuellement.
              </Text>
              <TextInput
                style={styles.ibanInput}
                placeholder="IBAN (ex: BE12 3456 7890 1234)"
                value={refundIban}
                onChangeText={setRefundIban}
                autoCapitalize="characters"
              />
            </View>
          )}

          <View style={{ height: 10 }} />

          {/* Statut / bouton annulation */}
{reservation.status === "annulée" && reservation.cancelledBy === "entreprise" ? (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>Statut</Text>
    <Text style={{ color: "#c0392b", fontWeight: "700" }}>
      Réservation annulée par l’entreprise
    </Text>
    <Text style={{ marginTop: 4 }}>
      Un remboursement intégral a été enregistré pour cette réservation.
    </Text>
    {reservation.paymentStatus && (
      <Text style={{ marginTop: 4 }}>
        Statut paiement : {reservation.paymentStatus}
      </Text>
    )}
    {typeof reservation.refundAmount === "number" && (
      <Text style={{ marginTop: 4 }}>
        Montant remboursé : {Number(reservation.refundAmount).toFixed(2)} €
      </Text>
    )}
  </View>
) : reservation.status === "annulée" ? (
  // Annulation par l'utilisateur (ton comportement actuel)
  <View style={styles.card}>
    <Text style={styles.cardTitle}>Statut</Text>
    <Text style={{ color: "#c0392b", fontWeight: "700" }}>
      Réservation annulée
    </Text>
    {reservation.paymentStatus && (
      <Text style={{ marginTop: 4 }}>
        Statut paiement : {reservation.paymentStatus}
      </Text>
    )}
    {reservation.refundIban && (
      <Text style={{ marginTop: 4 }}>
        IBAN pour remboursement : {reservation.refundIban}
      </Text>
    )}
  </View>
) : (
  canCancel && (
    <Pressable
      style={styles.cancelButton}
      onPress={handleCancelReservation}
    >
      <Text style={styles.cancelButtonText}>
        Annuler la réservation
      </Text>
    </Pressable>
  )
)}

          <View style={{ height: 20 }} />

          {/* Lien facture */}
          <Pressable onPress={handleDownloadInvoice}>
            <Text style={styles.downloadLink}>Télécharger la facture</Text>
          </Pressable>

          <View style={{ height: 20 }} />

          {/* ------ AVIS UTILISATEUR SUR L'ESPACE ------ */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {existingReview ? "Votre avis" : "Laisser un avis"}
            </Text>

            {loadingReview ? (
              <Text>Chargement de vos avis...</Text>
            ) : !isPastReservation && !existingReview ? (
              <Text style={{ fontSize: 14, color: "#555" }}>
                Vous pourrez noter cet espace une fois votre réservation
                terminée. N’oubliez pas de revenir laisser votre avis !
              </Text>
            ) : (
              <>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Pressable key={i} onPress={() => setRating(i)}>
                      <Ionicons
                        name={i <= rating ? "star" : "star-outline"}
                        size={24}
                        color="#F5A623"
                      />
                    </Pressable>
                  ))}
                </View>

                <TextInput
                  placeholder="Ajouter un commentaire (optionnel)"
                  value={comment}
                  onChangeText={setComment}
                  style={styles.commentInput}
                  multiline
                />

                <Pressable
                  style={styles.saveReviewButton}
                  onPress={handleSaveReview}
                >
                  <Text style={styles.saveReviewText}>
                    {existingReview
                      ? "Mettre à jour mon avis"
                      : "Enregistrer mon avis"}
                  </Text>
                </Pressable>
              </>
            )}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        <BottomNavBar activeTab="reservations" />
      </View>
    </KeyboardAvoidingView>
  );
}

/* ---------------------- STYLES ---------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { paddingBottom: 120, width: "100%", alignItems: "center" },

  header: {
    width: "90%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  backIcon: { fontSize: 22 },

  logo: { width: 150, height: 60 },

  title: { fontSize: 22, fontWeight: "700", marginBottom: 10, width: "90%" },

  mainImage: {
    width: "90%",
    height: 170,
    borderRadius: 12,
    marginBottom: 8,
  },

  downloadLink: {
    color: "#3E7CB1",
    fontWeight: "600",
    textDecorationLine: "underline",
    marginBottom: 10,
  },

  espaceName: { fontSize: 20, fontWeight: "700" },
  address: { color: "#666", marginBottom: 8 },

  card: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },

  cardTitle: { fontWeight: "700", marginBottom: 10, fontSize: 16 },

  // Avis
  starsRow: {
    flexDirection: "row",
    marginBottom: 10,
    gap: 4,
  },
  commentInput: {
    marginTop: 6,
    minHeight: 60,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
  },
  saveReviewButton: {
    marginTop: 10,
    backgroundColor: "#3E7CB1",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  saveReviewText: {
    color: "#fff",
    fontWeight: "700",
  },

  // IBAN
  ibanInput: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#F4F4F4",
  },

  // Annulation
  cancelButton: {
    width: "90%",
    backgroundColor: "#e74c3c",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  // Partage réservation
  shareButton: {
    width: "90%",
    backgroundColor: "#3E7CB1",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  shareButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
