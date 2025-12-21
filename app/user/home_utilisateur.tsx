// app/user/home_utilisateur.tsx
import { router } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import BottomNavBar from "../../components/BottomNavBar";
import RoomlyMap from "../../components/RoomlyMap";
import { auth, db } from "../../firebaseConfig";

type Espace = {
  id: string;
  nom?: string;
  prix?: string | number;
  localisation?: string;
  images?: string[];
  createdAt?: any;
  latitude?: number;
  longitude?: number;
};

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export default function HomeUtilisateur() {
  const [nextReservation, setNextReservation] = useState<any>(null);

  const [espaces, setEspaces] = useState<Espace[]>([]);
  const [filteredEspaces, setFilteredEspaces] = useState<Espace[]>([]);

  const [activeFilter, setActiveFilter] = useState("Tous");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  /* ------------------ LOAD DATA ------------------ */
  useEffect(() => {
    const loadData = async () => {
      try {
        const userId = auth.currentUser?.uid;

        /* ---- 1) Prochaine réservation ---- */
        if (userId) {
          const qResa = query(
            collection(db, "reservations"),
            where("userId", "==", userId),
            orderBy("date", "asc"),
            limit(1)
          );

          const snap = await getDocs(qResa);
          if (!snap.empty) {
            const r = snap.docs[0].data();

            const espaceSnap = await getDoc(doc(db, "espaces", r.espaceId));
            const espace = espaceSnap.exists() ? espaceSnap.data() : null;

            setNextReservation({
              id: snap.docs[0].id,
              ...r,
              espace,
            });
          } else {
            setNextReservation(null);
          }
        }

        /* ---- 2) Espaces disponibles ---- */
        const eSnap = await getDocs(collection(db, "espaces"));
        const list = eSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

        setEspaces(list);
        setFilteredEspaces(list);
      } catch (e) {
        console.log("Erreur load home:", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /* ------------------ APPLY FILTERS ------------------ */
  const applyFilters = async (newFilter: string, newSearch: string) => {
    let result = [...espaces];

    /* ---------- 1) POPULAIRES (top 2) ---------- */
    if (newFilter === "Populaires") {
      const rSnap = await getDocs(collection(db, "reservations"));
      const reservations = rSnap.docs.map((d) => d.data() as any);

      const hoursMap: Record<string, number> = {};
      for (const r of reservations) {
        if (!r.espaceId) continue;
        const totalHours = r.slots?.length || 0;
        if (!hoursMap[r.espaceId]) hoursMap[r.espaceId] = 0;
        hoursMap[r.espaceId] += totalHours;
      }

      result = result
        .map((e) => ({
          ...e,
          popularityHours: hoursMap[e.id] || 0,
        }))
        .sort((a: any, b: any) => b.popularityHours - a.popularityHours)
        .slice(0, 2);
    }

    /* ---------- 2) NOUVEAUX LIEUX (moins de 72h) ---------- */
    if (newFilter === "Nouveaux lieux") {
      result = result.filter((e: any) => {
        if (!e.createdAt) return false;
        const date = e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.createdAt);
        return Date.now() - date.getTime() < 72 * 3600 * 1000;
      });
    }

    /* ---------- 3) RECHERCHE ---------- */
    if (newSearch.trim().length > 0) {
      const s = newSearch.toLowerCase();
      result = result.filter((e) =>
        ((e.localisation || "") + " " + (e.nom || "")).toLowerCase().includes(s)
      );
    }

    setFilteredEspaces(result);
  };

  const changeFilter = async (f: string) => {
    setActiveFilter(f);
    await applyFilters(f, search);
  };

  const handleSearch = (txt: string) => {
    setSearch(txt);
    applyFilters(activeFilter, txt);
  };

  /* ------------------ MAP POINTS ------------------ */
  const mapPoints = useMemo(() => {
    return filteredEspaces
      .filter((e) => typeof e.latitude === "number" && typeof e.longitude === "number")
      .map((e) => ({
        id: e.id,
        lat: e.latitude as number,
        lng: e.longitude as number,
        nom: e.nom || "Espace",
        prix: e.prix,
        localisation: e.localisation || "",
      }));
  }, [filteredEspaces]);

  const initialRegion: Region = useMemo(() => {
    if (mapPoints.length > 0) {
      return {
        latitude: mapPoints[0].lat,
        longitude: mapPoints[0].lng,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }
    return {
      latitude: 50.8466,
      longitude: 4.3528,
      latitudeDelta: 0.2,
      longitudeDelta: 0.2,
    };
  }, [mapPoints]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#3E7CB1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* LOGO */}
        <Image
          source={require("../../assets/images/roomly-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* TITRE */}
        <Text style={styles.hello}>
          Bonjour {auth.currentUser?.displayName || "utilisateur"} !
        </Text>

        {/* PROCHAINE RÉSERVATION */}
        {nextReservation ? (
          <View style={styles.nextResaBox}>
            <Text style={styles.sectionTitleCenter}>Ta prochaine réservation</Text>

            {nextReservation.espace?.images?.[0] && (
              <Image
                source={{ uri: nextReservation.espace.images[0] }}
                style={styles.nextImage}
              />
            )}

            <Text style={styles.espaceName}>{nextReservation.espace?.nom}</Text>
            <Text style={styles.date}>Date: {nextReservation.date}</Text>
            <Text style={styles.slots}>Heure: {nextReservation.slots.join(", ")}</Text>
            <Text style={styles.price}>Prix: {nextReservation.total}€</Text>

            <Pressable
              style={styles.detailsBtn}
              onPress={() => router.push(`/user/mes_reservations/${nextReservation.id}`)}
            >
              <Text style={styles.detailsBtnText}>Voir les détails</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.nextResaBox}>
            <Text style={styles.sectionTitleCenter}>Aucune réservation à venir</Text>
            <Text style={{ marginBottom: 10 }}>Réserve ton premier bureau ci-dessous !</Text>
          </View>
        )}

        {/* BOUTON MES RÉSERVATIONS */}
        <Pressable
          style={styles.mainButton}
          onPress={() => router.push("/user/mes_reservations/liste")}
        >
          <Text style={styles.mainButtonText}>Voir mes réservations</Text>
        </Pressable>

        {/* BUREAUX */}
        <Text style={styles.sectionTitleLeft}>Bureaux disponibles</Text>

        <TextInput
          placeholder="Rechercher une localisation..."
          placeholderTextColor="#777"
          style={styles.searchInput}
          value={search}
          onChangeText={handleSearch}
        />

        {/* FILTRES */}
        <View style={styles.filterRow}>
          {["Tous", "Nouveaux lieux", "Populaires"].map((f) => (
            <Pressable
              key={f}
              style={[styles.filter, activeFilter === f && styles.filterActive]}
              onPress={() => changeFilter(f)}
            >
              <Text
                style={{
                  fontWeight: activeFilter === f ? "700" : "400",
                  color: activeFilter === f ? "#fff" : "#000",
                }}
              >
                {f}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* LISTE ESPACES */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
          style={{ width: "100%" }}
        >
          {filteredEspaces.map((e) => (
            <Pressable
              key={e.id}
              style={styles.espaceCardHorizontal}
              onPress={() => router.push(`/user/details_espace/${e.id}`)}
            >
              {e.images?.[0] ? (
                <Image source={{ uri: e.images[0] }} style={styles.espaceImageHorizontal} />
              ) : (
                <Image
                  source={require("../../assets/images/roomly-logo.png")}
                  style={styles.espaceImageHorizontal}
                />
              )}

              <Text style={styles.espaceCardTitle} numberOfLines={1}>
                {e.nom || "Espace"}
              </Text>
              <Text style={styles.priceSmall}>{e.prix} €/h</Text>
              <Text style={styles.locationSmall} numberOfLines={1}>
                {e.localisation || ""}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* MAP */}
        <View style={{ height: 16 }} />
        <Text style={styles.sectionTitleLeft}>Trouver sur la carte</Text>

        <View style={styles.mapWrapper}>
  <RoomlyMap
    initialRegion={initialRegion}
    points={mapPoints}
    onPressPoint={(id: string) => router.push(`/user/details_espace/${id}`)}
  />
</View>

        <View style={{ height: 140 }} />
      </ScrollView>

      <BottomNavBar activeTab="menu" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },
  content: { alignItems: "center", width: "100%" },

  logo: {
    width: "80%",
    height: 80,
    marginTop: 25,
    marginBottom: 10,
    alignSelf: "center",
  },

  hello: { fontSize: 22, fontWeight: "700", marginBottom: 10 },

  nextResaBox: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 15,
    alignItems: "center",
  },

  sectionTitleCenter: {
    width: "90%",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },

  sectionTitleLeft: {
    width: "90%",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  nextImage: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    marginBottom: 10,
  },

  espaceName: { fontSize: 18, fontWeight: "700" },
  date: { marginTop: 5 },
  slots: { marginTop: 3 },
  price: { marginTop: 3, fontWeight: "700" },

  detailsBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#3E7CB1",
    borderRadius: 10,
  },
  detailsBtnText: { color: "#fff", fontWeight: "700" },

  mainButton: {
    width: "85%",
    backgroundColor: "#3E7CB1",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  mainButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  searchInput: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 12,
  },

  filterRow: {
    flexDirection: "row",
    justifyContent: "center",
    width: "90%",
    marginBottom: 15,
  },
  filter: {
    backgroundColor: "#ddd",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  filterActive: {
    backgroundColor: "#3E7CB1",
  },

  horizontalScroll: {
    paddingLeft: 15,
    paddingRight: 10,
  },

  espaceCardHorizontal: {
    width: 170,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    marginRight: 12,
  },

  espaceImageHorizontal: {
    width: "100%",
    height: 100,
    borderRadius: 10,
    marginBottom: 8,
  },

  espaceCardTitle: { fontWeight: "700", marginBottom: 3 },
  priceSmall: { fontWeight: "700", color: "#3E7CB1" },
  locationSmall: { marginTop: 4, color: "#555", fontSize: 12 },

  mapWrapper: {
    width: "90%",
    height: 220,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#dcdcdc",
    marginBottom: 20,
  },

  mapEmptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.75)",
  },
});
