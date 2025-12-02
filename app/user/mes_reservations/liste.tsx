// app/user/mes_reservations/liste.tsx
import { router } from "expo-router";
import { collection, doc, getDoc, getDocs, query, where, } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View, } from "react-native";
import BottomNavBar from "../../../components/BottomNavBar";
import { auth, db } from "../../../firebaseConfig";

export default function MesReservations() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  let unsubscribe: any;

  const loadReservations = async (uid: string) => {
    const q = query(
      collection(db, "reservations"),
      where("userId", "==", uid)
    );

    const snap = await getDocs(q);
    const list: any[] = [];

    for (const r of snap.docs) {
      const data = r.data();
      const espaceSnap = await getDoc(doc(db, "espaces", data.espaceId));
      const espaceData = espaceSnap.exists() ? espaceSnap.data() : null;

      list.push({
        id: r.id,
        ...data,
        espace: espaceData,
      });
    }

    setReservations(list);
    setLoading(false);
  };

  unsubscribe = auth.onAuthStateChanged((user) => {
    if (!user) {
      console.log("User pas connecté → pas de réservations");
      setLoading(false);
      return;
    }

    console.log("User chargé :", user.uid);
    loadReservations(user.uid);
  });

  return () => unsubscribe && unsubscribe();
}, []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* HEADER : flèche + logo */}
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

        {loading && <Text>Chargement…</Text>}

        {reservations.length === 0 && !loading && (
          <Text style={{ marginTop: 20 }}>
            Aucune réservation pour l’instant.
          </Text>
        )}

        {reservations.map((r) => (
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
              <Text style={styles.espaceName}>{r.espace?.nom || "Espace"}</Text>
              <Text style={{ color: "#666" }}>{r.espace?.adresse || ""}</Text>

              <Text style={styles.date}>📅 {r.date}</Text>
              <Text style={styles.slots}>🕒 {r.slots.join(", ")}</Text>
              <Text style={styles.total}>💶 {r.total}€</Text>
            </View>
          </Pressable>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>

      <BottomNavBar activeTab="menu" />
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

  /* HEADER */
  header: {
    width: "90%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40, // pour éviter que le logo soit coupé
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
    marginBottom: 20,
    width: "90%",
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

  espaceName: { fontSize: 16, fontWeight: "700" },
  date: { marginTop: 4 },
  slots: { marginTop: 2 },
  total: { marginTop: 4, fontWeight: "700" },
});
