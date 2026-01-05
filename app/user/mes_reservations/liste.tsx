import { router } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import BottomNavBar from "../../../components/BottomNavBar";
import { auth, db } from "../../../firebaseConfig";

type ReservationWithEspace = {
  id: string;
  date: string;
  slots: string[];
  total: number;
  status?: string;
  espace?: {
    nom?: string;
    adresse?: string;
    images?: string[];
  } | null;
};

type FilterMode = "all" | "upcoming" | "past" | "cancelled";

function getReservationStartDate(r: ReservationWithEspace): Date | null {
  if (!r.date || !r.slots || r.slots.length === 0) return null;
  const d = new Date(r.date);
  if (isNaN(d.getTime())) return null;

  const firstSlot = String(r.slots[0]);
  const startPart = firstSlot.split("-")[0].trim();
  const [hStr, mStr] = startPart.split(":");
  const h = Number(hStr);
  const m = Number(mStr || 0);
  if (isNaN(h) || isNaN(m)) return null;

  d.setHours(h, m, 0, 0);
  return d;
}

export default function MesReservations() {
  const [reservations, setReservations] = useState<ReservationWithEspace[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");

  useEffect(() => {
    let unsubscribe: any;

    const loadReservations = async (uid: string) => {
      try {
        setLoading(true);

        // ❌ plus de orderBy ici, juste le where
        const qRes = query(
          collection(db, "reservations"),
          where("userId", "==", uid)
        );

        const snap = await getDocs(qRes);
        const list: ReservationWithEspace[] = [];

        for (const r of snap.docs) {
          const data = r.data() as any;
          const espaceSnap = await getDoc(doc(db, "espaces", data.espaceId));
          const espaceData = espaceSnap.exists()
            ? (espaceSnap.data() as any)
            : null;

          list.push({
            id: r.id,
            date: data.date,
            slots: data.slots || [],
            total: Number(data.total || 0),
            status: data.status,
            espace: espaceData,
          });
        }

        // tri en JS par date décroissante
        list.sort((a, b) => {
          const da = getReservationStartDate(a)?.getTime() ?? 0;
          const dbb = getReservationStartDate(b)?.getTime() ?? 0;
          return dbb - da;
        });

        setReservations(list);
      } catch (e) {
        console.log("Erreur chargement réservations :", e);
      } finally {
        setLoading(false);
      }
    };

    unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        console.log("User pas connecté → pas de réservations");
        setLoading(false);
        return;
      }
      loadReservations(user.uid);
    });

    return () => unsubscribe && unsubscribe();
  }, []);

  const filteredReservations = reservations.filter((r) => {
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      r.espace?.nom?.toLowerCase().includes(term) ||
      r.date.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    const start = getReservationStartDate(r);
    const now = new Date();

    switch (filter) {
      case "upcoming":
        return !!start && start.getTime() >= now.getTime();
      case "past":
        return !!start && start.getTime() < now.getTime();
      case "cancelled":
        return r.status === "annulée";
      default:
        return true;
    }
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.push("/user/home_utilisateur")}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          <Image
            source={require("../../../assets/images/roomly-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Mes réservations</Text>

        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher (nom, date...)"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.filterRow}>
          {[
            { key: "all", label: "Toutes" },
            { key: "upcoming", label: "À venir" },
            { key: "past", label: "Passées" },
            { key: "cancelled", label: "Annulées" },
          ].map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(f.key as FilterMode)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading && (
          <View style={{ marginTop: 20 }}>
            <ActivityIndicator color="#3E7CB1" />
          </View>
        )}

        {filteredReservations.length === 0 && !loading && (
          <Text style={{ marginTop: 20 }}>
            Aucune réservation pour l’instant.
          </Text>
        )}

        {filteredReservations.map((r) => {
          const isCancelled = r.status === "annulée";

          return (
            <Pressable
              key={r.id}
              style={styles.card}
              onPress={() => router.push(`/user/mes_reservations/${r.id}`)}
            >
              {r.espace?.images?.[0] && (
                <Image
                  source={{ uri: r.espace.images[0] }}
                  style={styles.image}
                />
              )}

              <View style={{ flex: 1 }}>
                <View style={styles.cardHeaderRow}>
                  <Text
                    style={[
                      styles.espaceName,
                      isCancelled && {
                        textDecorationLine: "line-through",
                        color: "#999",
                      },
                    ]}
                  >
                    {r.espace?.nom || "Espace"}
                  </Text>

                  {isCancelled && (
                    <View style={styles.cancelBadge}>
                      <Text style={styles.cancelBadgeText}>Annulée</Text>
                    </View>
                  )}
                </View>

                <Text style={{ color: "#666" }}>
                  {r.espace?.adresse || ""}
                </Text>

                <Text style={styles.date}>{r.date}</Text>
                <Text style={styles.slots}>{r.slots.join(", ")}</Text>
                <Text
                  style={[
                    styles.total,
                    isCancelled && { color: "#999" },
                  ]}
                >
                  {r.total}€
                </Text>
              </View>
            </Pressable>
          );
        })}

        <View style={{ height: 120 }} />
      </ScrollView>

      <BottomNavBar activeTab="reservations" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },
  content: {
    paddingBottom: 120,
    width: "100%",
    alignItems: "center",
  },
  header: {
    width: "90%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 15,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  backIcon: {
    fontSize: 22,
  },
  logo: {
    width: 150,
    height: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10,
    width: "90%",
  },
  searchBox: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  searchInput: {
    fontSize: 14,
    paddingVertical: 4,
  },
  filterRow: {
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  filterChip: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
  },
  filterChipActive: {
    backgroundColor: "#3E7CB1",
    borderColor: "#3E7CB1",
  },
  filterChipText: {
    fontSize: 12,
    color: "#555",
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  card: {
    width: "90%",
    backgroundColor: "#fff",
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    marginBottom: 18,
  },
  image: {
    width: 90,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#ddd",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  espaceName: { fontSize: 16, fontWeight: "700", flex: 1 },
  cancelBadge: {
    backgroundColor: "#e74c3c",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  cancelBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  date: { marginTop: 4, fontSize: 13 },
  slots: { marginTop: 2, fontSize: 13 },
  total: { marginTop: 4, fontWeight: "700", fontSize: 15 },
});
