// app/user/home_utilisateur.tsx
import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import BottomNavBar from "../../components/BottomNavBar";

export default function HomeUtilisateur() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image
          source={require("../../assets/images/roomly-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Publier un nouvel espace</Text>
        </Pressable>

        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Gérer mes annonces</Text>
        </Pressable>

        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>
            Passez en Premium pour mettre vos annonces en avant
          </Text>
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bureaux disponibles</Text>
          <View style={styles.grid}>
            {[...Array(6)].map((_, i) => (
              <View key={i} style={styles.officeCard}>
                <View style={styles.officeImagePlaceholder} />
                <Text style={styles.officeText}>Localisation</Text>
                <Text style={styles.officeText}>Prix/h</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomNavBar activeTab="menu"/>
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
    paddingVertical: 40,
    alignItems: "center",
    paddingBottom: 100, // pour ne pas cacher le contenu derrière la barre
  },
  logo: {
    width: 160,
    height: 80,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#D9D9D9",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 8,
    width: "85%",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 15,
    color: "#000",
    textAlign: "center",
  },
  section: {
    width: "90%",
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  officeCard: {
    width: "30%",
    marginBottom: 20,
    alignItems: "center",
  },
  officeImagePlaceholder: {
    width: 90,
    height: 90,
    backgroundColor: "#D9D9D9",
    borderRadius: 10,
    marginBottom: 5,
  },
  officeText: {
    fontSize: 13,
  },
});
