// app/user/reservation_confirmee/[id].tsx
import * as MailComposer from "expo-mail-composer";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import BottomNavBar from "../../../components/BottomNavBar";
import { auth, db } from "../../../firebaseConfig";

export default function ReservationConfirmee() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [reservation, setReservation] = useState<any>(null);
  const [espace, setEspace] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "reservations", id as string));
      if (!snap.exists()) return;

      const data = snap.data();
      setReservation(data);

      if (data.espaceId) {
        const espaceSnap = await getDoc(doc(db, "espaces", data.espaceId));
        if (espaceSnap.exists()) setEspace(espaceSnap.data());
      }
    };
    load();
  }, [id]);

  if (!reservation) {
    return (
      <View style={styles.loading}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  const userName = auth.currentUser?.displayName || "Client Roomly";
  const userEmail = auth.currentUser?.email || "";
  const espaceNom = espace?.nom || "Espace Roomly";
  const espaceAdresse = espace?.localisation || "Adresse communiquée par email";
  const accessDetails =
    espace?.accessDetails ||
    "Les informations d’accès détaillées vous seront envoyées par email avant votre réservation.";

  const totalTTC = Number(reservation.total || 0);
  const htva = +(totalTTC / 1.21).toFixed(2);
  const tva = +(totalTTC - htva).toFixed(2);

  const formatDateFR = (d: string) => {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString("fr-FR");
  };

  const resaDateFR = formatDateFR(reservation.date);

  /* ---------- TEMPLATE FACTURE ---------- */
  const buildInvoiceHTML_FigmaLike = () => {
    const today = new Date();
    const issueDate = today.toLocaleDateString("fr-FR");
    const invoiceNumber = `RML-${today.getFullYear()}${String(
      today.getMonth() + 1
    ).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}-${String(
      (id as string) || ""
    ).slice(0, 4)}`;

    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <title>Facture Roomly</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif; margin: 40px; color: #222; }
        h1 { text-align: center; margin-bottom: 30px; }
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
      <h1>Roomly</h1>

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

      <div class="mt-6 small">
        Merci d’avoir choisi Roomly !
      </div>
    </body>
    </html>
    `;
  };

  const generateInvoicePDF = async () => {
    try {
      const html = buildInvoiceHTML_FigmaLike();
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Partager la facture Roomly",
      });
    } catch (err) {
      console.log("Erreur génération facture :", err);
      alert("Erreur lors de la génération de la facture.");
    }
  };

  /* ---------- ENVOI MAIL DE CONFIRMATION ---------- */

  const sendConfirmationMail = async () => {
    if (!userEmail) {
      Alert.alert(
        "Adresse e-mail manquante",
        "Aucune adresse e-mail n’est liée à votre compte."
      );
      return;
    }

    const body = `
Bonjour ${userName},

Votre réservation Roomly a bien été confirmée.

Espace : ${espaceNom}
Adresse : ${espaceAdresse}
Date : ${resaDateFR}
Heures : ${reservation.slots.join(", ")}
Montant payé : ${totalTTC.toFixed(2)} €

Vous pouvez retrouver le détail de votre réservation et télécharger votre facture depuis l’app Roomly.

Merci pour votre confiance,
L’équipe Roomly
`;

    try {
      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          "Mail non disponible",
          "L’envoi d’e-mail n’est pas disponible sur cet appareil."
        );
        return;
      }

      await MailComposer.composeAsync({
        recipients: [userEmail],
        subject: "Confirmation de votre réservation Roomly",
        body,
      });
    } catch (e) {
      console.log("Erreur envoi mail :", e);
      Alert.alert("Erreur", "Impossible de préparer l’e-mail de confirmation.");
    }
  };

  /* ---------- RENDER ---------- */

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Logo */}
        <Image
          source={require("../../../assets/images/roomly-logo.png")}
          style={{ width: 150, height: 80 }}
          resizeMode="contain"
        />

        <Text style={styles.title}>Réservation confirmée !</Text>
        <Text style={styles.subtitle}>
          Votre bureau est réservé avec succès.
        </Text>

        {/* Lien pour télécharger la facture */}
        <Pressable onPress={generateInvoicePDF}>
          <Text style={styles.link}>Télécharger la facture</Text>
        </Pressable>

        {/* Bouton mail de confirmation */}
        <Pressable onPress={sendConfirmationMail}>
          <Text style={styles.link}>Envoyer un mail de confirmation</Text>
        </Pressable>

        {/* Bloc récapitulatif commande */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Récapitulatif de votre commande :</Text>
          <Text>📍 {espaceNom}</Text>
          <Text>📅 {resaDateFR}</Text>
          <Text>🕒 {reservation.slots.join(", ")}</Text>
          <Text>💶 Total : {totalTTC}€</Text>
        </View>

        {/* Bloc détails d’accès */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Détails de livraison / accès :</Text>
          <Text>📌 Adresse : {espaceAdresse}</Text>
          <Text style={{ marginTop: 4 }}>🔑 Instructions :</Text>
          <Text>{accessDetails}</Text>
        </View>

        {/* Boutons */}
        <Pressable
          style={[styles.mainButton]}
          onPress={() => router.push("/user/mes_reservations/liste")}
        >
          <Text style={styles.mainButtonText}>Voir mes réservations</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push("/user/home_utilisateur")}
        >
          <Text style={styles.secondaryButtonText}>Retour à l’accueil</Text>
        </Pressable>

        <View style={{ height: 120 }} />
      </ScrollView>

      <BottomNavBar activeTab="menu" />
    </View>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { paddingBottom: 120, alignItems: "center", width: "100%" },

  title: { fontSize: 24, fontWeight: "700", marginTop: 10 },
  subtitle: { marginTop: 8, marginBottom: 10 },

  link: {
    color: "#3E7CB1",
    fontWeight: "600",
    textDecorationLine: "underline",
    marginBottom: 10,
  },

  card: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },

  cardTitle: { fontWeight: "700", marginBottom: 10, fontSize: 16 },

  mainButton: {
    width: "85%",
    backgroundColor: "#3E7CB1",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 25,
  },

  mainButtonText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
  },

  secondaryButton: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#3E7CB1",
    paddingVertical: 14,
    borderRadius: 10,
    width: "85%",
  },

  secondaryButtonText: {
    color: "#3E7CB1",
    fontWeight: "700",
    textAlign: "center",
  },
});
