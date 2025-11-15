// app/user/reservation_confirmee/[id].tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import BottomNavBar from "../../../components/BottomNavBar";
import { db } from "../../../firebaseConfig";

export default function ReservationConfirmee() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [reservation, setReservation] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "reservations", id as string));
      if (snap.exists()) setReservation(snap.data());
    };
    load();
  }, [id]);

  if (!reservation) {
    return (
      <View style={styles.loading}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Logo */}
        <Image
          source={require("../../../assets/images/roomly-logo.png")}
          style={{ width: 150, height: 80 }}
          resizeMode="contain"
        />

        <Text style={styles.title}>Réservation confirmée !</Text>
        <Text style={styles.subtitle}>Votre bureau est réservé avec succès.</Text>

        <Pressable>
          <Text style={styles.link}>Télécharger la facture</Text>
        </Pressable>

        {/* Résumé commande */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Récapitulatif de votre commande :</Text>

          <Text>📍 {reservation.date}</Text>
          <Text>🕒 {reservation.slots.join(", ")}</Text>
          <Text>💶 Total : {reservation.total}€</Text>
        </View>

        {/* Boutons */}
        <Pressable
          style={[styles.mainButton]}
          onPress={() => router.push("/user/mes_reservations")}
        >
          <Text style={styles.mainButtonText}>Voir ma réservation</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push("/user/home_utilisateur")}
        >
          <Text style={styles.secondaryButtonText}>Retour à l’accueil</Text>
        </Pressable>

        <Pressable
          style={styles.dangerButton}
          onPress={() => alert("Annulation à coder")}
        >
          <Text style={styles.dangerButtonText}>Annuler ma réservation</Text>
        </Pressable>

        <View style={{ height: 120 }} />
      </ScrollView>

      <BottomNavBar activeTab="menu" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { paddingBottom: 120, alignItems: "center", width: "100%" },
  
  title: { fontSize: 24, fontWeight: "700", marginTop: 10 },
  subtitle: { marginTop: 8, marginBottom: 10 },

  link: {
    color: "#3E7CB1",
    fontWeight: "600",
    textDecorationLine: "underline",
    marginBottom: 10,
  },

  card: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },

  cardTitle: { fontWeight: "700", marginBottom: 10 },

  mainButton: {
    width: "85%",
    backgroundColor: "#3E7CB1",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
  },

  mainButtonText: { color: "#fff", fontWeight: "700", textAlign: "center" },

  secondaryButton: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#3E7CB1",
    paddingVertical: 14,
    borderRadius: 10,
    width: "85%",
  },

  secondaryButtonText: { color: "#3E7CB1", fontWeight: "700", textAlign: "center" },

  dangerButton: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#C0392B",
    paddingVertical: 14,
    borderRadius: 10,
    width: "85%",
  },

  dangerButtonText: { color: "#C0392B", fontWeight: "700", textAlign: "center" },
});
