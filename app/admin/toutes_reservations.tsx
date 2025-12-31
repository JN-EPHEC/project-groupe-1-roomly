// app/admin/toutes_reservations.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
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

type Reservation = {
  id: string;
  date: string; // "2026-01-02"
  slots: string[];
  total: number;
  paymentStatus?: string;
  paymentProvider?: string;
  userEmail?: string;
  espaceNom?: string;
  entrepriseNom?: string;
};

export default function AdminToutesReservations() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState<"toutes" | "a_venir" | "passees">(
    "toutes"
  );
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const qRes = query(
          collection(db, "reservations"),
          orderBy("date", "desc")
        );
        const snap = await getDocs(qRes);

        const list: Reservation[] = [];

        for (const d of snap.docs) {
          const data: any = d.data();

          // Récup infos espace
          let espaceNom: string | undefined = undefined;
          if (data.espaceId) {
            try {
              const espaceSnap = await getDoc(doc(db, "espaces", data.espaceId));
              if (espaceSnap.exists()) {
                const eData: any = espaceSnap.data();
                espaceNom = eData.nom || eData.localisation || "Espace";
              }
            } catch {
              /* ignore */
            }
          }

          // Récup nom entreprise (optionnel)
          let entrepriseNom: string | undefined = undefined;
          if (data.entrepriseId) {
            try {
              const entSnap = await getDoc(
                doc(db, "users", data.entrepriseId)
              );
              if (entSnap.exists()) {
                const u: any = entSnap.data();
                entrepriseNom = u.name || u.companyName || "Entreprise";
              }
            } catch {
              /* ignore */
            }
          }

          list.push({
            id: d.id,
            date: data.date || "",
            slots: data.slots || [],
            total: data.total ?? 0,
            paymentStatus: data.paymentStatus,
            paymentProvider: data.paymentProvider,
            userEmail: data.userEmail,
            espaceNom,
            entrepriseNom,
          });
        }

        setReservations(list);
      } catch (e) {
        console.log("Erreur chargement réservations admin :", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Séparation à venir / passées (basé sur la date)
  const today = new Date();
  const normalizeDate = (dateStr: string) => {
    if (!dateStr) return null;
    // dateStr = "YYYY-MM-DD"
    const parts = dateStr.split("-");
    if (parts.length !== 3) return null;
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  };

  const filtered = reservations.filter((r) => {
    // filtre date
    if (filter !== "toutes") {
      const d = normalizeDate(r.date);
      const todayOnly = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      if (d) {
        if (filter === "a_venir" && d < todayOnly) return false;
        if (filter === "passees" && d >= todayOnly) return false;
      }
    }

    // filtre texte (utilisateur / espace / entreprise)
    if (userSearch.trim().length > 0) {
      const s = userSearch.toLowerCase();
      const target =
        (r.userEmail || "") +
        " " +
        (r.espaceNom || "") +
        " " +
        (r.entrepriseNom || "");
      if (!target.toLowerCase().includes(s)) return false;
    }

    return true;
  });

  const renderStatusBadge = (status?: string) => {
    if (!status) return null;
    const lower = status.toLowerCase();
    let bg = "#95a5a6";
    let label = status;

    if (lower === "paid" || lower === "payé") {
      bg = "#27ae60";
      label = "Payé";
    } else if (lower === "pending") {
      bg = "#f39c12";
      label = "En attente";
    } else if (lower === "canceled") {
      bg = "#c0392b";
      label = "Annulé";
    }

    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={styles.badgeText}>{label}</Text>
      </View>
    );
  };

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

        <Text style={styles.title}>Toutes les réservations</Text>

        {/* Filtres date */}
        <View style={styles.filterRow}>
          {[
            { label: "Toutes", value: "toutes" as const },
            { label: "À venir", value: "a_venir" as const },
            { label: "Passées", value: "passees" as const },
          ].map((f) => (
            <Pressable
              key={f.value}
              style={[
                styles.filterChip,
                filter === f.value && styles.filterChipActive,
              ]}
              onPress={() => setFilter(f.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === f.value && styles.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Recherche utilisateur / espace / entreprise */}
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par utilisateur, espace ou entreprise..."
          placeholderTextColor="#777"
          value={userSearch}
          onChangeText={setUserSearch}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#3E7CB1" />
        ) : filtered.length === 0 ? (
          <Text style={{ marginTop: 20 }}>
            Aucune réservation pour ce filtre / cette recherche.
          </Text>
        ) : (
          filtered.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.date}>{r.date}</Text>
                {r.slots?.length > 0 && (
                  <Text style={styles.slots}>{r.slots.join(", ")}</Text>
                )}

                <Text style={styles.espace}>
                  {r.espaceNom || "Espace non trouvé"}
                </Text>

                {r.entrepriseNom && (
                  <Text style={styles.sub}>
                    Entreprise : {r.entrepriseNom}
                  </Text>
                )}

                {r.userEmail && (
                  <Text style={styles.sub}>Client : {r.userEmail}</Text>
                )}

                <Text style={styles.total}>{r.total} €</Text>

                <View style={{ flexDirection: "row", marginTop: 4 }}>
                  {renderStatusBadge(r.paymentStatus)}
                  {r.paymentProvider && (
                    <Text style={styles.provider}>{r.paymentProvider}</Text>
                  )}
                </View>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
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
    marginBottom: 14,
  },
  filterRow: {
    flexDirection: "row",
    width: "90%",
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#3E7CB1",
    borderColor: "#3E7CB1",
  },
  filterChipText: {
    fontSize: 13,
    color: "#333",
  },
  filterChipTextActive: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "600",
  },
  searchInput: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
    fontSize: 14,
  },
  card: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  date: { fontSize: 15, fontWeight: "700", color: "#000" },
  slots: { marginTop: 2, fontSize: 13, color: "#555" },
  espace: { marginTop: 6, fontSize: 15, fontWeight: "600", color: "#184E77" },
  sub: { fontSize: 13, color: "#555", marginTop: 2 },
  total: { marginTop: 6, fontSize: 15, fontWeight: "700", color: "#000" },
  provider: {
    marginLeft: 8,
    fontSize: 12,
    color: "#555",
    alignSelf: "center",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
});
