// app/admin/historique_admin.tsx
import { useRouter } from "expo-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { db } from "../../firebaseConfig";

type AdminLog = {
  id: string;
  actionType: string;
  targetType?: string;
  targetId?: string | null;
  description?: string;
  adminEmail?: string | null;
  createdAt?: any;
  meta?: any;
};

export default function HistoriqueAdmin() {
  const router = useRouter();
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      const q = query(
        collection(db, "adminLogs"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const list: AdminLog[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setLogs(list);
    } catch (e) {
      console.log("Erreur chargement adminLogs :", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const formatDate = (ts: any) => {
    if (!ts) return "-";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString("fr-BE");
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Historique des actions admin</Text>
        <Text style={styles.subtitle}>
          Journal de toutes les modifications effectuées via le back-office.
        </Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#3E7CB1" />
          </View>
        ) : logs.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>Aucune action enregistrée.</Text>
          </View>
        ) : (
          logs.map((log) => (
            <View key={log.id} style={styles.logCard}>
              <View style={styles.logHeaderRow}>
                <Text style={styles.logActionType}>
                  {log.actionType || "Action"}
                </Text>
                <Text style={styles.logDate}>{formatDate(log.createdAt)}</Text>
              </View>

              {log.description ? (
                <Text style={styles.logDescription}>{log.description}</Text>
              ) : null}

              <Text style={styles.metaLine}>
                Cible :{" "}
                <Text style={styles.metaValue}>
                  {log.targetType || "—"}
                  {log.targetId ? ` (#${log.targetId})` : ""}
                </Text>
              </Text>

              <Text style={styles.metaLine}>
                Admin :{" "}
                <Text style={styles.metaValue}>
                  {log.adminEmail || "Inconnu"}
                </Text>
              </Text>
            </View>
          ))
        )}

        <View style={{ height: 30 }} />

        <Pressable style={styles.backBtn} onPress={() => router.back()}>
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
  center: {
    marginTop: 30,
    alignItems: "center",
  },
  emptyText: {
    color: "#555",
    fontSize: 14,
    textAlign: "center",
  },
  logCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  logHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  logActionType: {
    fontWeight: "700",
    fontSize: 14,
    color: "#1E6091",
  },
  logDate: {
    fontSize: 11,
    color: "#555",
  },
  logDescription: {
    fontSize: 13,
    color: "#222",
    marginBottom: 4,
  },
  metaLine: {
    fontSize: 12,
    color: "#555",
  },
  metaValue: {
    fontWeight: "600",
    color: "#222",
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
