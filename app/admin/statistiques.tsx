// app/admin/statistiques.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

type Stats = {
  nbEspaces: number;
  nbEspacesValides: number;
  nbEspacesAttente: number;
  nbEspacesRefuses: number;
  nbReservations: number;
  nbReservationsPayees: number;
  revenuTotal: number;
  nbResaAVenir: number;
  nbResaPassees: number;
  nbUtilisateurs: number;
  nbEntreprises: number;
};

type ReservationItem = {
  date: string;
  total: number;
  paymentStatus?: string;
  userEmail?: string;
};

type MonthlyInscriptions = {
  monthKey: string; // ex: "2026-01"
  label: string;    // ex: "01/2026"
  count: number;
};

export default function AdminStatistiques() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [userFilter, setUserFilter] = useState("");

  // 🔹 nouveaux utilisateurs par mois
  const [monthlyInscriptions, setMonthlyInscriptions] = useState<MonthlyInscriptions[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // ---------------- ESPACES ----------------
        const espacesSnap = await getDocs(collection(db, "espaces"));
        let nbEspaces = 0;
        let nbEspacesValides = 0;
        let nbEspacesAttente = 0;
        let nbEspacesRefuses = 0;

        espacesSnap.forEach((d) => {
          nbEspaces++;
          const data: any = d.data();
          const s = (data.status || "").toLowerCase();
          if (s === STATUS_VALIDE) nbEspacesValides++;
          else if (s === STATUS_ATTENTE) nbEspacesAttente++;
          else if (s === STATUS_REFUSE) nbEspacesRefuses++;
        });

        // ---------------- RÉSERVATIONS ----------------
        const resaSnap = await getDocs(collection(db, "reservations"));
        let nbReservations = 0;
        let nbReservationsPayees = 0;
        let revenuTotal = 0;
        let nbResaAVenir = 0;
        let nbResaPassees = 0;

        const today = new Date();
        const todayOnly = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );

        const normalizeDate = (dateStr: string) => {
          if (!dateStr) return null;
          const parts = dateStr.split("-");
          if (parts.length !== 3) return null;
          const year = Number(parts[0]);
          const month = Number(parts[1]) - 1;
          const day = Number(parts[2]);
          const d = new Date(year, month, day);
          return isNaN(d.getTime()) ? null : d;
        };

        const resaItems: ReservationItem[] = [];

        resaSnap.forEach((d) => {
          nbReservations++;
          const data: any = d.data();
          const status = (data.paymentStatus || "").toLowerCase();
          const total = Number(data.total || 0);

          if (status === "paid" || status === "payé") {
            nbReservationsPayees++;
            revenuTotal += total;
          }

          const dDate = normalizeDate(data.date || "");
          if (dDate) {
            if (dDate >= todayOnly) nbResaAVenir++;
            else nbResaPassees++;
          }

          resaItems.push({
            date: data.date || "",
            total,
            paymentStatus: data.paymentStatus,
            userEmail: data.userEmail,
          });
        });

        // ---------------- UTILISATEURS ----------------
        const usersSnap = await getDocs(collection(db, "users"));
        let nbUtilisateurs = 0;
        let nbEntreprises = 0;

        // Compteur par mois (clé "YYYY-MM")
        const monthlyCounts: Record<string, number> = {};

        usersSnap.forEach((d) => {
          const data: any = d.data();
          const type = data.type || "";
          if (type === "utilisateur") nbUtilisateurs++;
          if (type === "entreprise") nbEntreprises++;

          // Comptage des inscriptions par mois si createdAt présent
          if (data.createdAt) {
            const date: Date = data.createdAt.toDate
              ? data.createdAt.toDate()
              : new Date(data.createdAt);

            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = date.getMonth() + 1; // 0-11 -> 1-12
              const key = `${year}-${String(month).padStart(2, "0")}`;

              if (!monthlyCounts[key]) monthlyCounts[key] = 0;
              monthlyCounts[key] += 1;
            }
          }
        });

        // Transformation en tableau trié pour affichage
        const monthlyEntries: MonthlyInscriptions[] = Object.keys(monthlyCounts)
          .sort() // tri chrono "2025-10" < "2025-11" < "2026-01"
          .map((key) => {
            const [yearStr, monthStr] = key.split("-");
            return {
              monthKey: key,
              label: `${monthStr}/${yearStr}`, // "01/2026"
              count: monthlyCounts[key],
            };
          });

        setMonthlyInscriptions(monthlyEntries);
        setReservations(resaItems);

        setStats({
          nbEspaces,
          nbEspacesValides,
          nbEspacesAttente,
          nbEspacesRefuses,
          nbReservations,
          nbReservationsPayees,
          revenuTotal,
          nbResaAVenir,
          nbResaPassees,
          nbUtilisateurs,
          nbEntreprises,
        });
      } catch (e) {
        console.log("Erreur chargement stats admin :", e);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // -------- Stats filtrées par utilisateur (email) --------
  let userStats:
    | { nbReservations: number; nbReservationsPayees: number; revenuTotal: number }
    | null = null;

  if (userFilter.trim().length > 0) {
    const email = userFilter.trim().toLowerCase();
    const filtered = reservations.filter((r) =>
      (r.userEmail || "").toLowerCase().includes(email)
    );

    let nbReservations = 0;
    let nbReservationsPayees = 0;
    let revenuTotal = 0;

    filtered.forEach((r) => {
      nbReservations++;
      const status = (r.paymentStatus || "").toLowerCase();
      if (status === "paid" || status === "payé") {
        nbReservationsPayees++;
        revenuTotal += r.total;
      }
    });

    userStats = { nbReservations, nbReservationsPayees, revenuTotal };
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Back */}
        <Pressable
          style={{ width: "90%", marginTop: 40, marginBottom: 10 }}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={26} color="#000" />
        </Pressable>

        <Text style={styles.title}>Statistiques</Text>

        {loading || !stats ? (
          <ActivityIndicator size="large" color="#3E7CB1" />
        ) : (
          <>
            {/* Bloc Espaces */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Espaces</Text>
              <Text className="test" style={styles.line}>
                Total : <Text style={styles.value}>{stats.nbEspaces}</Text>
              </Text>
              <Text style={styles.line}>
                Validés :{" "}
                <Text style={styles.value}>{stats.nbEspacesValides}</Text>
              </Text>
              <Text style={styles.line}>
                En attente :{" "}
                <Text style={styles.value}>{stats.nbEspacesAttente}</Text>
              </Text>
              <Text style={styles.line}>
                Refusés :{" "}
                <Text style={styles.value}>{stats.nbEspacesRefuses}</Text>
              </Text>
            </View>

            {/* Bloc Réservations */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Réservations (global)</Text>
              <Text style={styles.line}>
                Total :{" "}
                <Text style={styles.value}>{stats.nbReservations}</Text>
              </Text>
              <Text style={styles.line}>
                Payées :{" "}
                <Text style={styles.value}>{stats.nbReservationsPayees}</Text>
              </Text>
              <Text style={styles.line}>
                À venir :{" "}
                <Text style={styles.value}>{stats.nbResaAVenir}</Text>
              </Text>
              <Text style={styles.line}>
                Passées :{" "}
                <Text style={styles.value}>{stats.nbResaPassees}</Text>
              </Text>
              <Text style={[styles.line, { marginTop: 8 }]}>
                Revenu total (payé) :{" "}
                <Text style={[styles.value, { fontSize: 18 }]}>
                  {stats.revenuTotal.toFixed(2)} €
                </Text>
              </Text>
            </View>

            {/* Bloc Utilisateurs */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Utilisateurs</Text>
              <Text style={styles.line}>
                Utilisateurs (clients) :{" "}
                <Text style={styles.value}>{stats.nbUtilisateurs}</Text>
              </Text>
              <Text style={styles.line}>
                Entreprises :{" "}
                <Text style={styles.value}>{stats.nbEntreprises}</Text>
              </Text>
            </View>

            {/* 🔹 Bloc nouveaux utilisateurs par mois */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Nouveaux utilisateurs par mois</Text>
              {monthlyInscriptions.length === 0 ? (
                <Text style={styles.line}>
                  Aucune donnée d’inscription (champ{" "}
                  <Text style={{ fontWeight: "700" }}>createdAt</Text>{" "}
                  manquant sur la collection users).
                </Text>
              ) : (
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, styles.tableCellMonth]}>
                      Mois
                    </Text>
                    <Text style={[styles.tableCell, styles.tableCellCount]}>
                      Nouveaux utilisateurs
                    </Text>
                  </View>

                  {monthlyInscriptions.map((entry) => (
                    <View key={entry.monthKey} style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCellMonth]}>
                        {entry.label}
                      </Text>
                      <Text style={[styles.tableCell, styles.tableCellCount]}>
                        {entry.count}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Stats par utilisateur */}
            <Text style={styles.sectionTitle}>Statistiques par utilisateur</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Entrer une adresse email (ou une partie)"
              placeholderTextColor="#777"
              value={userFilter}
              onChangeText={setUserFilter}
            />

            {userFilter.trim().length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Utilisateur : {userFilter}</Text>
                <Text style={styles.line}>
                  Réservations :{" "}
                  <Text style={styles.value}>
                    {userStats?.nbReservations ?? 0}
                  </Text>
                </Text>
                <Text style={styles.line}>
                  Réservations payées :{" "}
                  <Text style={styles.value}>
                    {userStats?.nbReservationsPayees ?? 0}
                  </Text>
                </Text>
                <Text style={[styles.line, { marginTop: 8 }]}>
                  Revenu total (payé) :{" "}
                  <Text style={[styles.value, { fontSize: 16 }]}>
                    {(userStats?.revenuTotal ?? 0).toFixed(2)} €
                  </Text>
                </Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },
  content: {
    alignItems: "center",
    paddingBottom: 80,
  },
  title: {
    width: "90%",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },
  card: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  line: {
    fontSize: 14,
    marginTop: 2,
    color: "#333",
  },
  value: {
    fontWeight: "700",
    color: "#184E77",
  },
  sectionTitle: {
    width: "90%",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 6,
  },
  searchInput: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 12,
    fontSize: 14,
  },

  // tableau inscriptions / mois
  table: {
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E1E5EF",
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E5EF",
  },
  tableHeader: {
    backgroundColor: "#DDE7F5",
  },
  tableCell: {
    fontSize: 13,
  },
  tableCellMonth: {
    flex: 1,
    fontWeight: "600",
  },
  tableCellCount: {
    width: 120,
    textAlign: "right",
    fontWeight: "700",
  },
});
