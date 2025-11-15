// app/user/home_utilisateur.tsx
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import BottomNavBar from "../../components/BottomNavBar";
import { db } from "../../firebaseConfig";

export default function HomeUtilisateur() {
  const [espaces, setEspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 🔥 Charger les bureaux depuis Firestore
  useEffect(() => {
    const fetchEspaces = async () => {
      try {
        const snap = await getDocs(collection(db, "espaces"));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setEspaces(list);
      } catch (e) {
        console.log("Erreur Firestore :", e);
      } finally {
        setLoading(false);
      }
    };

    fetchEspaces();
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

        {/* FILTRES */}
        <View style={styles.filtersRow}>
          <Pressable style={styles.filterBtn}><Text style={styles.filterText}>Nouveaux lieux</Text></Pressable>
          <Pressable style={styles.filterBtn}><Text style={styles.filterText}>Populaires</Text></Pressable>
        </View>

        <View style={styles.filtersRow}>
          <Pressable style={styles.filterBtnSmall}><Text style={styles.filterText}>Tous</Text></Pressable>
          <Pressable style={styles.filterBtnSmall}><Text style={styles.filterText}>Réunions</Text></Pressable>
          <Pressable style={styles.filterBtnSmall}><Text style={styles.filterText}>Bureaux</Text></Pressable>
        </View>

        {/* === BUREAUX DISPONIBLES === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bureaux disponibles</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#3E7CB1" />
          ) : espaces.length === 0 ? (
            <Text>Aucun bureau disponible pour l'instant.</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {espaces.map((espace) => (
                <Pressable
                  key={espace.id}
                  style={styles.officeCard}
                  onPress={() => router.push(`/user/details_espace/${espace.id}`)}
                >
                  <Image
                    source={{ uri: espace.images?.[0] }}
                    style={styles.officeImage}
                  />

                  <Text style={styles.officeText}>{espace.localisation}</Text>
                  <Text style={styles.officeText}>{espace.prix} €/h</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* MAP */}
        <Text style={styles.mapTitle}>Trouver sur la carte</Text>
        <View style={styles.mapPlaceholder}>
          <Text style={{ color: "#666" }}>Carte interactive ici</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* NAVIGATION BAS */}
      <BottomNavBar activeTab="menu" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },

  scrollContent: {
    paddingTop: 40,
    paddingBottom: 120,
    alignItems: "center",
  },

  logo: { width: 180, height: 90, marginBottom: 20 },

  /* FILTRES */
  filtersRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 10,
    width: "95%",
  },

  filterBtn: {
    backgroundColor: "#D9D9D9",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 15,
  },

  filterBtnSmall: {
    backgroundColor: "#D9D9D9",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },

  filterText: { fontSize: 14, color: "#000" },

  /* BUREAUX */
  section: { width: "90%", marginTop: 20 },

  sectionTitle: { fontSize: 20, fontWeight: "700", marginBottom: 15 },

  horizontalList: { gap: 15 },

  officeCard: {
    width: 120,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },

  officeImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: "#D9D9D9",
    marginBottom: 5,
  },

  officeText: { fontSize: 13, color: "#333" },

  /* MAP */
  mapTitle: {
    fontSize: 20,
    fontWeight: "700",
    width: "90%",
    marginTop: 10,
    marginBottom: 10,
  },

  mapPlaceholder: {
    width: "90%",
    height: 200,
    backgroundColor: "#D9D9D9",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
