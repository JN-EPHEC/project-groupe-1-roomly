// app/entreprise/home_entreprise.tsx
import BottomNavBarEntreprise from "@/components/BottomNavBarEntreprise";
import { useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
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

export default function HomeEntrepriseScreen() {
  const router = useRouter();
  const [espaces, setEspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEspaces = async () => {
      try {
        const q = query(
          collection(db, "espaces"),
          where("uid", "==", auth.currentUser?.uid)
        );
        const snap = await getDocs(q);
        const results = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setEspaces(results);
      } catch (error) {
        console.log("Erreur Firestore:", error);
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

        {/* BUTTONS */}
        <View style={styles.buttonsContainer}>
          <Pressable
            style={styles.button}
            onPress={() => router.push("/entreprise/publier_espace")}
          >
            <Text style={styles.buttonText}>Publier un nouvel espace</Text>
          </Pressable>

          <Pressable style={styles.button} onPress={() => router.push("/entreprise/gerer_annonces")}>
            <Text style={styles.buttonText}>Gérer mes annonces</Text>
          </Pressable>

          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>
              Passez en Premium pour{"\n"}mettre vos annonces en avant
            </Text>
          </Pressable>
        </View>

        {/* MES BUREAUX */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes bureaux</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#3E7CB1" />
          ) : espaces.length === 0 ? (
            <Text style={styles.emptyText}>Aucune annonce publiée.</Text>
          ) : (
            <View style={styles.grid}>
              {espaces.map((espace) => (
                <Pressable
                  key={espace.id}
                  style={styles.officeCard}
                  onPress={() =>router.push(`/entreprise/details_espace/${espace.id}`)
                  }
                >
                  <Image
                    source={{ uri: espace.images?.[0] }}
                    style={styles.officeImage}
                  />
                  <Text style={styles.officeText}>{espace.localisation}</Text>
                  <Text style={styles.officeText}>{espace.prix} €/h</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNavBarEntreprise activeTab="menu" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF3F8",
  },

  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 20, // ← PLUS LARGE
  },

  logo: {
    width: 200,
    height: 90,
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 20,
  },

  buttonsContainer: {
    width: "100%", // ← PREND TOUTE LA LARGEUR
    gap: 16,
    marginBottom: 40,
  },

  button: {
    backgroundColor: "#D9D9D9",
    borderRadius: 14,
    paddingVertical: 18,
    width: "100%", // ← LARGE
    alignItems: "center",
  },

  buttonText: {
    fontSize: 16,
    color: "#000",
    textAlign: "center",
  },

  section: {
    width: "100%", // ← LARGEUR TOTALE
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 10,
    color: "#555",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  officeCard: {
    width: "48%", // ← PLUS LARGE
    marginBottom: 24,
  },

  officeImage: {
    width: "100%",
    height: 130, // ← PLUS GRAND
    backgroundColor: "#D9D9D9",
    borderRadius: 12,
    marginBottom: 6,
  },

  officeText: {
    color: "#000",
    fontSize: 14,
  },
});
