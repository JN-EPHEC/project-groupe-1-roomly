// app/user/mes_tickets.tsx
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import BottomNavBar from "../../components/BottomNavBar";
import { auth, db } from "../../firebaseConfig";

type Ticket = {
  id: string;
  email: string;
  message: string;
  status: string;
  fromType: string;
  createdAt?: any;
  lastUpdatedAt?: any;
};

export default function MesTicketsUtilisateur() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "supportTickets"),
      where("userId", "==", uid),
      where("fromType", "==", "utilisateur"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: Ticket[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setTickets(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Mes tickets support</Text>
        <Text style={styles.subtitle}>
          Suivez l’état de vos demandes envoyées à l’équipe Roomly.
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#1E6091" style={{ marginTop: 30 }} />
        ) : tickets.length === 0 ? (
          <Text style={styles.emptyText}>
            Vous n’avez pas encore créé de ticket support.
          </Text>
        ) : (
          tickets.map((t) => (
            <View key={t.id} style={styles.ticketCard}>
              <Text style={styles.message} numberOfLines={3}>
                {t.message}
              </Text>
              <Text style={styles.meta}>Statut : {t.status}</Text>
              {t.createdAt && (
                <Text style={styles.meta}>
                  Créé le :{" "}
                  {t.createdAt.toDate
                    ? t.createdAt.toDate().toLocaleString()
                    : ""}
                </Text>
              )}
              {t.lastUpdatedAt && (
                <Text style={styles.meta}>
                  Dernière mise à jour :{" "}
                  {t.lastUpdatedAt.toDate
                    ? t.lastUpdatedAt.toDate().toLocaleString()
                    : ""}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <BottomNavBar activeTab="menu" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },
  content: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 120 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#555", marginBottom: 20 },
  emptyText: { marginTop: 40, color: "#777", textAlign: "center" },
  ticketCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  message: { fontSize: 14, marginBottom: 6 },
  meta: { fontSize: 12, color: "#555" },
});
