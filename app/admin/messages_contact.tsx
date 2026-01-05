// app/admin/messages_contact.tsx
import { useRouter } from "expo-router";
import {
    collection,
    doc,
    getDocs,
    orderBy,
    query,
    updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { db } from "../../firebaseConfig";
import { logAdminAction } from "../../utils/adminLogs";

type Ticket = {
  id: string;
  email: string;
  message: string;
  status: "ouvert" | "en cours" | "résolu" | string;
  fromType?: "utilisateur" | "entreprise" | string;
  createdAt?: any;
  lastUpdatedAt?: any;
};

export default function MessagesContactAdmin() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [avgFirstResponseHours, setAvgFirstResponseHours] = useState<number | null>(null);

  const loadTickets = async () => {
    try {
      const q = query(
        collection(db, "supportTickets"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const list: Ticket[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setTickets(list);

      // Calcul temps moyen de "première réponse" = différence createdAt / lastUpdatedAt
      const deltas: number[] = [];
      for (const t of list) {
        if (!t.createdAt || !t.lastUpdatedAt) continue;

        const created = t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
        const updated = t.lastUpdatedAt.toDate
          ? t.lastUpdatedAt.toDate()
          : new Date(t.lastUpdatedAt);

        const diffMs = updated.getTime() - created.getTime();
        if (diffMs > 0) {
          deltas.push(diffMs / (1000 * 60 * 60)); // en heures
        }
      }

      if (deltas.length > 0) {
        const sum = deltas.reduce((a, b) => a + b, 0);
        setAvgFirstResponseHours(Number((sum / deltas.length).toFixed(1)));
      } else {
        setAvgFirstResponseHours(null);
      }
    } catch (e) {
      console.log("Erreur chargement tickets admin :", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadTickets();
  };

  const formatDate = (ts: any) => {
    if (!ts) return "-";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString("fr-BE");
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "ouvert":
        return "Ouvert";
      case "en cours":
        return "En cours";
      case "résolu":
        return "Résolu";
      default:
        return status || "—";
    }
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case "ouvert":
        return {
          backgroundColor: "#FFF3CD",
          color: "#856404",
        };
      case "en cours":
        return {
          backgroundColor: "#CCE5FF",
          color: "#004085",
        };
      case "résolu":
        return {
          backgroundColor: "#D4EDDA",
          color: "#155724",
        };
      default:
        return {
          backgroundColor: "#E2E3E5",
          color: "#383D41",
        };
    }
  };

  const handleChangeStatus = async (ticketId: string, newStatus: string) => {
    try {
      const oldTicket = tickets.find((t) => t.id === ticketId) || null;

      setUpdatingId(ticketId);
      await updateDoc(doc(db, "supportTickets", ticketId), {
        status: newStatus,
        lastUpdatedAt: new Date(),
      });

      // 🔹 Log dans l’historique admin
      await logAdminAction({
        actionType: "ticket_status_change",
        targetType: "supportTicket",
        targetId: ticketId,
        description: `Changement statut ticket ${ticketId} : ${
          oldTicket?.status || "inconnu"
        } → ${newStatus}`,
        meta: {
          email: oldTicket?.email || null,
          fromStatus: oldTicket?.status || null,
          toStatus: newStatus,
        },
      });

      await loadTickets();
    } catch (e) {
      console.log("Erreur update statut ticket :", e);
      Alert.alert("Erreur", "Impossible de mettre à jour le statut.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* HEADER SIMPLE */}
        <Text style={styles.title}>Tickets support</Text>
        <Text style={styles.subtitle}>
          Messages reçus depuis les formulaires de contact (utilisateurs et entreprises).
        </Text>

        {/* 🔹 Bloc temps moyen de réponse */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Temps moyen de première réponse</Text>
          <Text style={styles.statsValue}>
            {avgFirstResponseHours !== null
              ? `${avgFirstResponseHours} h`
              : "Pas encore de données"}
          </Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#3E7CB1" />
          </View>
        ) : tickets.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>Aucun ticket pour le moment.</Text>
          </View>
        ) : (
          tickets.map((t) => {
            const st = statusStyle(t.status);
            return (
              <View key={t.id} style={styles.ticketCard}>
                <View style={styles.headerRow}>
                  <Text style={styles.ticketId} numberOfLines={1}>
                    Ticket #{t.id}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: st.backgroundColor },
                    ]}
                  >
                    <Text
                      style={[styles.statusText, { color: st.color }]}
                    >
                      {statusLabel(t.status)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.metaText}>
                  Type :{" "}
                  <Text style={styles.metaValue}>
                    {t.fromType === "entreprise" ? "Entreprise" : "Utilisateur"}
                  </Text>
                </Text>
                <Text style={styles.metaText}>
                  E-mail : <Text style={styles.metaValue}>{t.email}</Text>
                </Text>
                <Text style={styles.metaText}>
                  Créé le :{" "}
                  <Text style={styles.metaValue}>
                    {formatDate(t.createdAt)}
                  </Text>
                </Text>

                <Text style={styles.messageLabel}>Message :</Text>
                <Text style={styles.messageText}>{t.message}</Text>

                <View style={styles.actionsRow}>
                  <Pressable
                    style={[
                      styles.actionBtn,
                      { backgroundColor: "#CCE5FF" },
                      t.status === "en cours" && styles.actionBtnDisabled,
                    ]}
                    disabled={updatingId === t.id || t.status === "en cours"}
                    onPress={() => handleChangeStatus(t.id, "en cours")}
                  >
                    <Text style={styles.actionBtnText}>Marquer en cours</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.actionBtn,
                      { backgroundColor: "#D4EDDA" },
                      t.status === "résolu" && styles.actionBtnDisabled,
                    ]}
                    disabled={updatingId === t.id || t.status === "résolu"}
                    onPress={() => handleChangeStatus(t.id, "résolu")}
                  >
                    <Text style={styles.actionBtnText}>Marquer résolu</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />

        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>Retour</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },
  content: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#555",
    marginBottom: 16,
  },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#D6E4F0",
  },
  statsTitle: {
    fontSize: 13,
    color: "#555",
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E6091",
  },
  center: {
    marginTop: 30,
    alignItems: "center",
  },
  emptyText: {
    color: "#555",
    fontSize: 14,
    textAlign: "center",
  },
  ticketCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  ticketId: {
    fontWeight: "700",
    fontSize: 14,
    maxWidth: "60%",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  metaText: {
    fontSize: 12,
    color: "#555",
  },
  metaValue: {
    fontWeight: "600",
    color: "#222",
  },
  messageLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  messageText: {
    fontSize: 13,
    color: "#333",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    marginHorizontal: 3,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  backBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#1E6091",
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  backBtnText: {
    color: "#1E6091",
    fontSize: 15,
    fontWeight: "600",
  },
});
