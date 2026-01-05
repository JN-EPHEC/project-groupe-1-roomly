// app/entreprise/home_entreprise.tsx
import BottomNavBarEntreprise from "@/components/BottomNavBarEntreprise";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";
import { auth, db } from "../../firebaseConfig";

const screenWidth = Dimensions.get("window").width;
const COMMISSION_RATE = 0.1; // 10 % pour Roomly

// Config générique pour les charts
const chartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(62, 124, 177, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  propsForDots: {
    r: "3",
  },
};

export default function HomeEntreprise() {
  const router = useRouter();

  const [reservations, setReservations] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [kpis, setKpis] = useState({ today: 0, monthlyNet: 0, occupancy: 0 });
  const [commissionMonth, setCommissionMonth] = useState(0);
  const [loading, setLoading] = useState(true);

  // Stats graphiques
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [revenueSeries, setRevenueSeries] = useState<number[]>([]);
  const [reservationSeries, setReservationSeries] = useState<number[]>([]);
  const [showCharts, setShowCharts] = useState(false);

  // Contact support (entreprise -> admin)
  const [contactEmail, setContactEmail] = useState(
    auth.currentUser?.email ?? ""
  );
  const [contactMessage, setContactMessage] = useState("");
  const [sendingContact, setSendingContact] = useState(false);
  const [ticketCreated, setTicketCreated] = useState(false);

  // Export revenus
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const formatCurrency = (value: number) =>
  new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);


  useEffect(() => {
    const load = async () => {
      try {
        const uid = auth.currentUser?.uid;

        const espacesSnap = await getDocs(
          query(collection(db, "espaces"), where("uid", "==", uid))
        );
        const espaceIds = espacesSnap.docs.map((d) => d.id);

        if (espaceIds.length === 0) {
          setLoading(false);
          return;
        }

        const rSnap = await getDocs(collection(db, "reservations"));
        const rawReservations = rSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        const all: any[] = [];

        for (const r of rawReservations as any) {
          if (!espaceIds.includes(r.espaceId)) continue;

          let userName = "Utilisateur";
          if (r.userId) {
            const userSnap = await getDoc(doc(db, "users", r.userId));
            if (userSnap.exists()) {
              const data = userSnap.data();
              userName =
                (data as any).name || (data as any).email || "Utilisateur";
            }
          }

          all.push({
            ...r,
            userName,
          });
        }

        all.sort((a: any, b: any) => (a.date > b.date ? 1 : -1));

        setReservations(all);

        const future = all.filter((r: any) => new Date(r.date) >= new Date());
        setUpcoming(future.slice(0, 5));

        const todayStr = new Date().toISOString().slice(0, 10);
        const todayCount = all.filter((r: any) => r.date === todayStr).length;

        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();

        // CA brut du mois
        const monthlyGross = all
          .filter((r: any) => {
            if (!r.createdAt) return false;
            const created = r.createdAt.toDate
              ? r.createdAt.toDate()
              : new Date(r.createdAt);
            return (
              created.getMonth() === month && created.getFullYear() === year
            );
          })
          .reduce((sum, r: any) => sum + (r.total || 0), 0);

        const monthlyCommission = monthlyGross * COMMISSION_RATE;
        const monthlyNet = monthlyGross - monthlyCommission;

        const occupancy = Math.min(100, Math.round((all.length / 30) * 100));

        setKpis({
          today: todayCount,
          monthlyNet,
          occupancy,
        });
        setCommissionMonth(monthlyCommission);

        /* --------- Préparation des séries pour les graphiques --------- */

        // 7 derniers jours
        const labels: string[] = [];
        const revenuesPerDay: number[] = [];
        const reservationsPerDay: number[] = [];

        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const label = d.toLocaleDateString("fr-FR", {
            day: "2-digit",
          });
          const dayStr = d.toISOString().slice(0, 10);

          const dayReservations = all.filter((r: any) => r.date === dayStr);
          const dayGross = dayReservations.reduce(
            (sum: number, r: any) => sum + (r.total || 0),
            0
          );
          const dayNet = dayGross - dayGross * COMMISSION_RATE;

          labels.push(label);
          revenuesPerDay.push(dayNet);
          reservationsPerDay.push(dayReservations.length);
        }

        setChartLabels(labels);
        setRevenueSeries(revenuesPerDay);
        setReservationSeries(reservationsPerDay);
      } catch (err) {
        console.log("Erreur:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSendContact = async () => {
    if (!contactEmail.trim() || !contactMessage.trim()) {
      Alert.alert("Oups", "Merci de remplir l’e-mail et le message.");
      return;
    }

    try {
      setSendingContact(true);
      setTicketCreated(false);

      await addDoc(collection(db, "supportTickets"), {
        userId: auth.currentUser?.uid || null,
        email: contactEmail.trim(),
        message: contactMessage.trim(),
        fromType: "entreprise",
        status: "ouvert",
        createdAt: serverTimestamp(),
        lastUpdatedAt: serverTimestamp(),
      });

      setContactMessage("");
      setTicketCreated(true);

      Alert.alert(
        "Ticket créé",
        "Votre ticket support a été créé. Vous pouvez le consulter dans 'Mes tickets'."
      );
    } catch (e) {
      console.log("Erreur contact entreprise :", e);
      Alert.alert("Erreur", "Impossible de créer le ticket pour le moment.");
    } finally {
      setSendingContact(false);
    }
  };

  /* ----------- Réservations du mois courant (pour export) ----------- */
  const getCurrentMonthReservations = () => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    return reservations.filter((r: any) => {
      if (!r.createdAt) return false;
      const created = r.createdAt.toDate
        ? r.createdAt.toDate()
        : new Date(r.createdAt);
      return created.getMonth() === month && created.getFullYear() === year;
    });
  };

  /* ------------------ EXPORT CSV ------------------ */
  const handleExportMonthlyCsv = async () => {
    try {
      setExportingCsv(true);

      const monthReservations = getCurrentMonthReservations();

      if (monthReservations.length === 0) {
        Alert.alert("Aucune donnée", "Aucun revenu enregistré pour ce mois.");
        return;
      }

      const now = new Date();
      const fileName = `revenus_${now.getFullYear()}_${
        now.getMonth() + 1
      }.csv`;

      let csv =
        "Date;Espace ID;Utilisateur;Total brut (€);Commission Roomly (€);Net entreprise (€)\n";

      monthReservations.forEach((r: any) => {
        const d = new Date(r.date);
        const dateStr = d.toLocaleDateString("fr-FR");
        const espaceId = r.espaceId || "";
        const userName = r.userName || "";
        const brut = r.total ?? 0;
        const commission = brut * COMMISSION_RATE;
        const net = brut - commission;

        csv += `${dateStr};${espaceId};${userName};${brut.toFixed(
          2
        )};${commission.toFixed(2)};${net.toFixed(2)}\n`;
      });

      const fsAny = FileSystem as any;
      const baseDir: string | null =
        typeof fsAny.cacheDirectory === "string"
          ? fsAny.cacheDirectory
          : typeof fsAny.documentDirectory === "string"
          ? fsAny.documentDirectory
          : null;

      if (!baseDir) {
        Alert.alert(
          "Export CSV indisponible",
          "L’export CSV n’est pas disponible sur cette plateforme. Utilisez plutôt l’export PDF."
        );
        return;
      }

      const fileUri = baseDir + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csv);
      console.log("CSV généré :", fileUri);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: "Partager le rapport des revenus (CSV)",
        });
      } else {
        Alert.alert(
          "Fichier créé",
          `Le fichier CSV a été généré ici :\n${fileUri}`
        );
      }
    } catch (e) {
      console.log("Erreur export CSV :", e);
      Alert.alert(
        "Erreur",
        "Impossible de générer le rapport CSV pour le moment."
      );
    } finally {
      setExportingCsv(false);
    }
  };

  /* ------------------ EXPORT PDF ------------------ */
  const handleExportMonthlyPdf = async () => {
    try {
      setExportingPdf(true);

      const monthReservations = getCurrentMonthReservations();

      if (monthReservations.length === 0) {
        Alert.alert("Aucune donnée", "Aucun revenu enregistré pour ce mois.");
        return;
      }

      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      let totalGross = 0;
      let totalCommission = 0;
      let totalNet = 0;

      const rowsHtml = monthReservations
        .map((r: any) => {
          const d = new Date(r.date);
          const dateStr = d.toLocaleDateString("fr-FR");
          const espaceId = r.espaceId || "";
          const userName = r.userName || "";
          const brut = r.total ?? 0;
          const commission = brut * COMMISSION_RATE;
          const net = brut - commission;

          totalGross += brut;
          totalCommission += commission;
          totalNet += net;

          return `
            <tr>
              <td>${dateStr}</td>
              <td>${espaceId}</td>
              <td>${userName}</td>
              <td style="text-align:right;">${brut.toFixed(2)} €</td>
              <td style="text-align:right;">${commission.toFixed(2)} €</td>
              <td style="text-align:right;">${net.toFixed(2)} €</td>
            </tr>
          `;
        })
        .join("");

      const html = `
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 16px; }
              h1 { font-size: 20px; margin-bottom: 8px; }
              h2 { font-size: 16px; margin-bottom: 12px; color:#555; }
              table { width: 100%; border-collapse: collapse; margin-top: 12px; }
              th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 12px; }
              th { background-color: #f0f0f0; text-align:left; }
              tfoot td { font-weight: 700; }
            </style>
          </head>
          <body>
            <h1>Rapport des revenus mensuels</h1>
            <h2>Période : ${month.toString().padStart(2, "0")}/${year}</h2>

            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Espace ID</th>
                  <th>Utilisateur</th>
                  <th style="text-align:right;">Total brut (€)</th>
                  <th style="text-align:right;">Commission Roomly (€)</th>
                  <th style="text-align:right;">Net entreprise (€)</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3">Totaux du mois</td>
                  <td style="text-align:right;">${totalGross.toFixed(2)} €</td>
                  <td style="text-align:right;">${totalCommission.toFixed(
                    2
                  )} €</td>
                  <td style="text-align:right;">${totalNet.toFixed(2)} €</td>
                </tr>
              </tfoot>
            </table>
          </body>
        </html>
      `;

      const pdfFile = await Print.printToFileAsync({ html });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(pdfFile.uri, {
          mimeType: "application/pdf",
          dialogTitle: "Partager le rapport des revenus (PDF)",
        });
      } else {
        Alert.alert(
          "PDF créé",
          `Le fichier PDF a été généré ici :\n${pdfFile.uri}`
        );
      }
    } catch (e) {
      console.log("Erreur export PDF :", e);
      Alert.alert(
        "Erreur",
        "Impossible de générer le rapport PDF pour le moment."
      );
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* LOGO */}
        <Image
          source={require("../../assets/images/roomly-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* ------------------ KPIs ------------------ */}
        <Text style={styles.sectionTitle}>Tableau de bord</Text>

        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{kpis.today}</Text>
            <Text style={styles.kpiLabel}>Réservations aujourd&apos;hui</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>
              {kpis.monthlyNet.toFixed(1)} €
            </Text>
            <Text style={styles.kpiLabel}>Revenus nets du mois</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{kpis.occupancy}%</Text>
            <Text style={styles.kpiLabel}>Taux d&apos;occupation</Text>
          </View>
        </View>

        {/* Bouton pour afficher / masquer les graphiques */}
        <Pressable
          style={styles.toggleChartsBtn}
          onPress={() => setShowCharts((v) => !v)}
        >
          <Text style={styles.toggleChartsText}>
            {showCharts
              ? "Masquer les graphiques"
              : "Voir les graphiques détaillés"}
          </Text>
        </Pressable>

        {/* ------------------ STATISTIQUES GRAPHIQUES ------------------ */}
        {showCharts && (
          <>
            <Text style={styles.sectionTitle}>Statistiques graphiques</Text>

            <View style={styles.chartsCard}>
              {chartLabels.length === 0 ? (
                <Text style={styles.emptyText}>
                  Pas encore assez de données pour afficher des graphiques.
                </Text>
              ) : (
                <>
                  {/* Revenus nets des 7 derniers jours */}
                  <Text style={styles.chartTitle}>
                    Revenus nets (7 derniers jours)
                  </Text>
                  <LineChart
                    data={{
                      labels: chartLabels,
                      datasets: [{ data: revenueSeries }],
                    }}
                    width={screenWidth - 40}
                    height={180}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                  />

                  {/* Réservations / occupation des 7 derniers jours */}
                  <Text style={styles.chartTitle}>
                    Réservations par jour
                  </Text>
                  <BarChart
                    data={{
                      labels: chartLabels,
                      datasets: [{ data: reservationSeries }],
                    }}
                    width={screenWidth - 40}
                    height={180}
                    chartConfig={chartConfig}
                    yAxisLabel=""
                    yAxisSuffix=""
                    style={styles.chart}
                  />
                </>
              )}
            </View>
          </>
        )}

        {/* ------------------ RAPPORT DES REVENUS ------------------ */}
        <Text style={styles.sectionTitle}>Rapport des revenus</Text>
        <View style={styles.exportCard}>
          <Text style={styles.exportText}>
            Téléchargez le rapport des revenus du mois en cours au format CSV
            ou PDF.
          </Text>
          <Text style={styles.exportSubText}>
            Commission Roomly estimée ce mois :{" "}
            {commissionMonth.toFixed(2)} € (10 % des montants bruts).
          </Text>

          <View style={styles.exportButtonsRow}>
            <Pressable
              style={[styles.exportBtn, exportingCsv && { opacity: 0.6 }]}
              onPress={handleExportMonthlyCsv}
              disabled={exportingCsv || loading}
            >
              {exportingCsv ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.exportBtnText}>Exporter en CSV</Text>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.exportBtnSecondary,
                exportingPdf && { opacity: 0.6 },
              ]}
              onPress={handleExportMonthlyPdf}
              disabled={exportingPdf || loading}
            >
              {exportingPdf ? (
                <ActivityIndicator color="#3E7CB1" />
              ) : (
                <Text style={styles.exportBtnSecondaryText}>
                  Exporter en PDF
                </Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* ------------------ BOUTONS ACTION ------------------ */}
        <View style={styles.buttonsContainer}>
          <Pressable
            style={styles.mainButton}
            onPress={() => router.push("/entreprise/publier_espace")}
          >
            <Text style={styles.mainButtonText}>Publier un nouvel espace</Text>
          </Pressable>

          <Pressable
            style={styles.mainButton}
            onPress={() => router.push("/entreprise/gerer_annonces")}
          >
            <Text style={styles.mainButtonText}>Gérer mes annonces</Text>
          </Pressable>

          <Pressable
            style={styles.mainButton}
            onPress={() => router.push("/entreprise/mes_reservations")}
          >
            <Text style={styles.mainButtonText}>Toutes les réservations</Text>
          </Pressable>
        </View>

        {/* ------------------ NOUVELLES RÉSERVATIONS ------------------ */}
        <Text style={styles.sectionTitle}>Nouvelles réservations</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#3E7CB1" />
        ) : reservations.length === 0 ? (
          <Text style={styles.emptyText}>Aucune réservation.</Text>
        ) : (
          reservations.slice(0, 3).map((r) => (
            <View key={r.id} style={styles.resaCard}>
              <Text style={styles.resaTitle}>📍 {r.date}</Text>

              <Text style={{ fontWeight: "600" }}>
                Réservé par :{" "}
                <Text style={{ color: "#3E7CB1" }}>{r.userName}</Text>
              </Text>

              <Text>Bureau : {r.espaceId}</Text>
              <Text>Créneaux : {r.slots.join(", ")}</Text>
              <Text>Total brut : {r.total} €</Text>
            </View>
          ))
        )}

        {/* ------------------ RÉSERVATIONS À VENIR ------------------ */}
        <Text style={styles.sectionTitle}>Prochaines réservations</Text>

        {upcoming.length === 0 ? (
          <Text style={styles.emptyText}>Aucune réservation à venir.</Text>
        ) : (
          upcoming.map((r) => (
            <View key={r.id} style={styles.resaCard}>
              <Text style={styles.resaTitle}>{r.date}</Text>

              <Text style={{ fontWeight: "600" }}>
                Réservé par :{" "}
                <Text style={{ color: "#3E7CB1" }}>{r.userName}</Text>
              </Text>

              <Text>Créneaux : {r.slots.join(", ")}</Text>
              <Text>Total brut : {r.total} €</Text>
            </View>
          ))
        )}

        {/* ------------------ SUPPORT & AIDE ------------------ */}
        <Text style={styles.sectionTitle}>Support & aide</Text>

        <View style={styles.supportCard}>
          <Text style={styles.supportTitle}>Contacter Roomly</Text>
          <Text style={styles.supportText}>
            Une question sur vos espaces, vos réservations ou la facturation ?
            Envoyez-nous un message, l’équipe Roomly vous répondra par e-mail.
          </Text>

          <TextInput
            style={styles.contactInput}
            placeholder="Votre adresse e-mail"
            placeholderTextColor="#777"
            value={contactEmail}
            onChangeText={setContactEmail}
            keyboardType="email-address"
          />

          <TextInput
            style={styles.contactMessageInput}
            placeholder="Votre message..."
            placeholderTextColor="#777"
            value={contactMessage}
            onChangeText={setContactMessage}
            multiline
          />

          <Pressable
            style={[
              styles.contactButton,
              sendingContact && { opacity: 0.6 },
            ]}
            onPress={handleSendContact}
            disabled={sendingContact}
          >
            {sendingContact ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.contactButtonText}>
                Créer un ticket support
              </Text>
            )}
          </Pressable>

          {ticketCreated && (
            <Text style={styles.ticketSuccess}>
              ✅ Votre ticket a bien été envoyé. Consultez l’onglet "Mes
              tickets".
            </Text>
          )}

          <View style={styles.supportLinksRow}>
            <Pressable
              style={styles.faqLinkButton}
              onPress={() => router.push("/entreprise/faq_entreprise")}
            >
              <Text style={styles.faqLinkText}>FAQ entreprise</Text>
            </Pressable>

            <Pressable
              style={styles.faqLinkButton}
              onPress={() => router.push("/entreprise/mes_tickets")}
            >
              <Text style={styles.faqLinkText}>Mes tickets</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

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

  logo: {
    width: 200,
    height: 80,
    alignSelf: "center",
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 15,
    marginBottom: 10,
  },

  /* KPI */
  kpiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  kpiCard: {
    width: "30%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
    color: "#3E7CB1",
  },
  kpiLabel: {
    textAlign: "center",
    fontSize: 12,
    color: "#555",
  },

  /* Bouton toggle graphiques */
  toggleChartsBtn: {
    alignSelf: "center",
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3E7CB1",
    backgroundColor: "#EEF3F8",
  },
  toggleChartsText: {
    color: "#3E7CB1",
    fontWeight: "600",
    fontSize: 13,
  },

  /* Cartes de graphiques */
  chartsCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: 4,
  },
  chart: {
    marginVertical: 4,
    borderRadius: 12,
  },

  /* Rapport revenus */
  exportCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  exportText: {
    fontSize: 13,
    color: "#444",
    marginBottom: 4,
  },
  exportSubText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 10,
  },
  exportButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  exportBtn: {
    flex: 1,
    backgroundColor: "#3E7CB1",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  exportBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  exportBtnSecondary: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3E7CB1",
    backgroundColor: "#EEF3F8",
  },
  exportBtnSecondaryText: {
    color: "#3E7CB1",
    fontWeight: "700",
    fontSize: 14,
  },

  /* Reservations */
  resaCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  resaTitle: {
    fontWeight: "700",
    marginBottom: 4,
  },

  emptyText: {
    color: "#555",
    marginBottom: 10,
  },

  /* Boutons actions */
  buttonsContainer: {
    marginTop: 10,
    marginBottom: 10,
    width: "100%",
    alignItems: "center",
  },
  mainButton: {
    width: "85%",
    backgroundColor: "#3E7CB1",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  mainButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  /* Support & contact */
  supportCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 5,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  supportText: {
    fontSize: 13,
    color: "#555",
    marginBottom: 10,
  },
  contactInput: {
    backgroundColor: "#D9D9D9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 8,
  },
  contactMessageInput: {
    backgroundColor: "#D9D9D9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  contactButton: {
    backgroundColor: "#1E6091",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  contactButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  ticketSuccess: {
    marginTop: 8,
    fontSize: 12,
    color: "#0B5345",
  },
  supportLinksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  faqLinkButton: {
    paddingVertical: 4,
  },
  faqLinkText: {
    color: "#1E6091",
    fontWeight: "600",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
