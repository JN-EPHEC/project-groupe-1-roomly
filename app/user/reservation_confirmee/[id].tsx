// app/user/reservation_confirmee/[id].tsx
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
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

  // ---------- TEMPLATE B : style "Figma" simplifié ----------
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
        .mt-2 { margin-top: 8px; }
        .mt-4 { margin-top: 16px; }
        .mt-6 { margin-top: 24px; }
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

  // ---------- TEMPLATE C : version moderne / minimaliste ----------
  const buildInvoiceHTML_Modern = () => {
    const today = new Date();
    const issueDate = today.toLocaleDateString("fr-FR");
    const invoiceNumber = `INV-${today.getFullYear()}-${String(
      (id as string) || ""
    ).slice(0, 6)}`;

    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <title>Facture Roomly</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif; margin: 32px; color: #1f2933; }
        .brand { font-size: 26px; font-weight: 700; color: #2B6CB0; margin-bottom: 4px; }
        .muted { color: #6b7b8f; font-size: 12px; }
        .row { display: flex; justify-content: space-between; margin-top: 18px; }
        .section-title { font-size: 15px; font-weight: 600; margin-top: 28px; margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { padding: 8px 6px; }
        th { text-align: left; border-bottom: 1px solid #e1e7ef; }
        tr:nth-child(even) td { background-color: #f8fafc; }
        .right { text-align: right; }
        .badge { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 11px; background: #ebf8ff; color: #2B6CB0; }
        .card { border-radius: 12px; border: 1px solid #e1e7ef; padding: 14px 16px; margin-top: 8px; }
      </style>
    </head>
    <body>
      <div class="brand">Roomly</div>
      <div class="muted">Facture de réservation de bureau</div>

      <div class="row">
        <div class="muted">
          <div><strong>Facture</strong> ${invoiceNumber}</div>
          <div>Émise le ${issueDate}</div>
        </div>
        <div class="muted" style="text-align:right;">
          <div><strong>${userName}</strong></div>
          <div>${espaceAdresse}</div>
        </div>
      </div>

      <div class="section-title">Réservation</div>
      <div class="card">
        <div><strong>${espaceNom}</strong></div>
        <div class="muted">Date : ${resaDateFR}</div>
        <div class="muted">Créneaux : ${reservation.slots.join(", ")}</div>
        <div style="margin-top:6px;"><span class="badge">Payée via Roomly</span></div>
      </div>

      <div class="section-title">Détails de facturation</div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="right">Quantité</th>
            <th class="right">Tarif (€)</th>
            <th class="right">Total (€)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Location – ${espaceNom}</td>
            <td class="right">${reservation.slots.length}</td>
            <td class="right">${Number(reservation.prix || 0) || "-"}</td>
            <td class="right">${totalTTC.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div class="section-title">Totals</div>
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
            <td><strong>Total TTC</strong></td>
            <td class="right"><strong>${totalTTC.toFixed(2)} €</strong></td>
          </tr>
        </tbody>
      </table>

      <div class="section-title">Accès & contact</div>
      <div class="card">
        <div class="muted">${accessDetails}</div>
      </div>

      <div class="section-title">Infos</div>
      <div class="muted">
        Cette facture confirme votre réservation. Pour toute question, contactez support@roomly.be.
      </div>
    </body>
    </html>
    `;
  };

  // ---------- Génération & partage PDF ----------
  const generateInvoicePDF = async () => {
    try {
      // 👉 CHOIX DU TEMPLATE ICI :
       const html = buildInvoiceHTML_FigmaLike(); // Template B
      // const html = buildInvoiceHTML_Modern();  // Template C

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
