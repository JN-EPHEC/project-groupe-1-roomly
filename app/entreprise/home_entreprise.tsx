// app/entreprise/home_entreprise.tsx
import BottomNavBarEntreprise from "@/components/BottomNavBarEntreprise";
import { useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { auth, db } from "../../firebaseConfig";

export default function HomeEntreprise() {
  const router = useRouter();

  const [reservations, setReservations] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [kpis, setKpis] = useState({ today: 0, monthly: 0, occupancy: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const uid = auth.currentUser?.uid;

        // 1. Charger toutes les réservations des espaces appartenant à l’entreprise
        const espacesSnap = await getDocs(
          query(collection(db, "espaces"), where("uid", "==", uid))
        );
        const espaceIds = espacesSnap.docs.map((d) => d.id);

        if (espaceIds.length === 0) {
          setLoading(false);
          return;
        }

        const rSnap = await getDocs(collection(db, "reservations"));
        const rawReservations = rSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
const all: any[] = [];

for (const r of rawReservations as any) {
  if (!espaceIds.includes(r.espaceId)) continue;

  // Charger le nom du user
  let userName = "Utilisateur";
  if (r.userId) {
    const userSnap = await getDoc(doc(db, "users", r.userId));
    if (userSnap.exists()) {
      const data = userSnap.data();
      userName = data.name || data.email || "Utilisateur";
    }
  }

  all.push({
    ...r,
    userName,
  });
}

        // Trier date ascendante
        all.sort((a: any, b: any) => (a.date > b.date ? 1 : -1));

        setReservations(all);

        // 2. Reservations à venir
        const future = all.filter((r: any) => new Date(r.date) >= new Date());
        setUpcoming(future.slice(0, 5));

        // 3. KPIs calculés
        const todayStr = new Date().toISOString().slice(0, 10);
        const todayCount = all.filter((r: any) => r.date === todayStr).length;

        // Revenus du mois (à la date de création de la réservation)
const month = new Date().getMonth();
const monthlyRev = all
  .filter((r: any) => {
    if (!r.createdAt) return false;
    const created = r.createdAt.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
    return created.getMonth() === month;
  })
  .reduce((sum, r: any) => sum + (r.total || 0), 0);

        // Taux d’occupation simplifié : (réservations / 30 jours)
        const occupancy = Math.min(100, Math.round((all.length / 30) * 100));

        setKpis({
          today: todayCount,
          monthly: monthlyRev,
          occupancy,
        });
      } catch (err) {
        console.log("Erreur:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

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
            <Text style={styles.kpiLabel}>Réservations aujourd'hui</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{kpis.monthly} €</Text>
            <Text style={styles.kpiLabel}>Revenus du mois</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{kpis.occupancy}%</Text>
            <Text style={styles.kpiLabel}>Taux d'occupation</Text>
          </View>
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
    Réservé par : <Text style={{ color: "#3E7CB1" }}>{r.userName}</Text>
  </Text>

  <Text>Bureau : {r.espaceId}</Text>
  <Text>Créneaux : {r.slots.join(", ")}</Text>
  <Text>Total : {r.total} €</Text>
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
    Réservé par : <Text style={{ color: "#3E7CB1" }}>{r.userName}</Text>
  </Text>

  <Text>Créneaux : {r.slots.join(", ")}</Text>
  <Text>Total : {r.total} €</Text>
</View>
          ))
        )}

        {/* ------------------ BOUTONS ACTION ------------------ */}
        <View style={styles.buttonsContainer}>
          <Pressable
            style={styles.button}
            onPress={() => router.push("/entreprise/publier_espace")}
          >
            <Text style={styles.buttonText}>Publier un nouvel espace</Text>
          </Pressable>

          <Pressable
            style={styles.button}
            onPress={() => router.push("/entreprise/gerer_annonces")}
          >
            <Text style={styles.buttonText}>Gérer mes annonces</Text>
          </Pressable>

          <Pressable
            style={styles.button}
            onPress={() => router.push("/entreprise/mes_reservations")}>
            <Text style={styles.buttonText}>Toutes les réservations</Text>
          </Pressable>
        </View>

      </ScrollView>

      <BottomNavBarEntreprise activeTab="menu" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },

  scrollContent: { 
    padding: 20 ,
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
    marginBottom: 20,
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

  /* Buttons */
  buttonsContainer: {
    marginTop: 20,
    gap: 16,
  },
  button: {
    backgroundColor: "#D9D9D9",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
  },
});
