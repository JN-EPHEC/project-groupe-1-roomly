// app/entreprise/reservations.tsx
import BottomNavBarEntreprise from "@/components/BottomNavBarEntreprise";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { auth, db } from "../../firebaseConfig";

export default function ReservationsEntreprise() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReservations = async () => {
      try {
        const uid = auth.currentUser?.uid;

        // 1. Récupérer toutes les réservations liées à cette entreprise
        const q = query(
          collection(db, "reservations"),
          where("entrepriseId", "==", uid)
        );

        const snap = await getDocs(q);
        const reservationsList: any[] = [];

        // 2. Pour chaque réservation -> récupérer le nom de l'espace
        for (const d of snap.docs) {
          const data = d.data();

          // Récupération du nom de l’espace
          const espaceSnap = await getDoc(doc(db, "espaces", data.espaceId));
          const espace = espaceSnap.exists() ? espaceSnap.data() : { nom: "Espace supprimé" };

          for (const d of snap.docs) {
  const data = d.data();

  // Nom de l’espace
  const espaceSnap = await getDoc(doc(db, "espaces", data.espaceId));
  const espace = espaceSnap.exists() ? espaceSnap.data() : { nom: "Espace supprimé" };

  // Nom du user
  let userName = "Utilisateur";
  if (data.userId) {
    const userSnap = await getDoc(doc(db, "users", data.userId));
    if (userSnap.exists()) {
      const u = userSnap.data();
      userName = u.name || u.email || "Utilisateur";
    }
  }

  reservationsList.push({
    id: d.id,
    ...data,
    espaceNom: espace.nom || "Espace sans nom",
    userName,
  });
}
        }

        // 3. Trier par date (récentes en premier)
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Toutes les réservations</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#3E7CB1" />
        ) : reservations.length === 0 ? (
          <Text style={styles.empty}>Aucune réservation trouvée.</Text>
        ) : (
          reservations.map((r) => (
            <View key={r.id} style={styles.card}>
              <Text style={styles.espaceName}>📍 {r.espaceNom}</Text>

              <View style={styles.row}>
                <Text style={styles.label}>Date :</Text>
                <Text style={styles.value}>
                  {new Date(r.date).toLocaleDateString("fr-FR")}
                </Text>
              </View>
              <View style={styles.row}>
  <Text style={styles.label}>Réservé par :</Text>
  <Text style={[styles.value, { color: "#3E7CB1" }]}>{r.userName}</Text>
</View>

              <View style={styles.row}>
                <Text style={styles.label}>Créneaux :</Text>
                <Text style={styles.value}>{r.slots.join(", ")}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Prix total :</Text>
                <Text style={styles.value}>{r.total} €</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Etat :</Text>
                <Text style={[styles.value, { color: new Date(r.date) >= new Date() ? "green" : "grey" }]}>
                  {new Date(r.date) >= new Date() ? "À venir" : "Passée"}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <BottomNavBarEntreprise activeTab="menu" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },
  content: { padding: 20 },

  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },

  empty: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
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
  scrollContent: { 
    padding: 20 ,
    paddingBottom: 120,
  },
});
