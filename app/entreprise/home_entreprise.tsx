// app/entreprise/home_entreprise.tsx
import BottomNavBarEntreprise from "@/components/BottomNavBarEntreprise";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function HomeEntrepriseScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image
          source={require("../../assets/images/roomly-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.buttonsContainer}>
          <Pressable style={styles.button} onPress={() => router.push("/entreprise/publier_espace")}>
            <Text style={styles.buttonText}>Publier un nouvel espace</Text>
          </Pressable>

          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Gérer mes annonces</Text>
          </Pressable>

          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>
              Passez en Premium pour{"\n"}mettre vos annonces en avant
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes bureaux</Text>
          <View style={styles.grid}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View key={index} style={styles.officeCard}>
                <View style={styles.officeImage} />
                <Text style={styles.officeText}>Localisation</Text>
                <Text style={styles.officeText}>Prix/h</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomNavBarEntreprise activeTab="menu"/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF3F8",
    alignItems: "center",
  },
  scrollContent: {
    paddingVertical: 20,
    alignItems: "center",
    paddingBottom: 100, // espace pour la navbar
  },
  logo: {
    width: 180,
    height: 80,
    marginTop: 30,
    marginBottom: 15,
  },
  buttonsContainer: {
    width: "85%",
    alignItems: "center",
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#D9D9D9",
    borderRadius: 14,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    color: "#000",
    textAlign: "center",
  },
  section: {
    width: "90%",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  officeCard: {
    width: "47%",
    marginBottom: 18,
  },
  officeImage: {
    width: "100%",
    height: 100,
    backgroundColor: "#D9D9D9",
    borderRadius: 10,
    marginBottom: 4,
  },
  officeText: {
    color: "#000",
    fontSize: 13,
  },
});

