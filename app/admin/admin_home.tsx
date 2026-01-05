// app/admin/admin_home.tsx
import { useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { auth } from "../../firebaseConfig";

export default function AdminHome() {
  const router = useRouter();
  const email = auth.currentUser?.email ?? "admin@roomly.be";

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* HEADER */}
        <View style={styles.headerRow}>
          <Image
            source={require("../../assets/images/roomly-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Admin</Text>
          </View>
        </View>

        <Text style={styles.title}>Espace administrateur</Text>
        <Text style={styles.subtitle}>
          Connecté en tant que{" "}
          <Text style={{ fontWeight: "600" }}>{email}</Text>
        </Text>

        {/* CARTE PRINCIPALE */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Actions principales</Text>

          <Pressable
            style={styles.actionBtn}
            onPress={() => router.push("/admin/espaces_en_attente")}
          >
            <Text style={styles.actionTitle}>Espaces à valider</Text>
            <Text style={styles.actionSubtitle}>
              Voir et approuver les nouveaux espaces proposés.
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionBtnSecondary}
            onPress={() => router.push("./toutes_reservations")}
          >
            <Text style={styles.actionTitle}>Toutes les réservations</Text>
            <Text style={styles.actionSubtitle}>
              Vue globale de l’occupation des espaces.
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionBtnSecondary}
            onPress={() => router.push("./statistiques")}
          >
            <Text style={styles.actionTitle}>Statistiques</Text>
            <Text style={styles.actionSubtitle}>
              Statistiques globales
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionBtnSecondary}
            onPress={() => router.push("./utilisateurs")}
          >
            <Text style={styles.actionTitle}>Utilisateurs & Entreprises</Text>
            <Text style={styles.actionSubtitle}>
              Voir et rechercher tous les comptes Roomly.
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionBtnSecondary}
            onPress={() => router.push("./coupon")}
          >
            <Text style={styles.actionTitle}>Codes promos</Text>
            <Text style={styles.actionSubtitle}>
              Créer et gérer les codes promotionnels.
            </Text>
          </Pressable>

          {/* Tickets support */}
          <Pressable
            style={styles.actionBtnSecondary}
            onPress={() => router.push("./messages_contact")}
          >
            <Text style={styles.actionTitle}>Tickets support</Text>
            <Text style={styles.actionSubtitle}>
              Voir et traiter les tickets des utilisateurs et entreprises.
            </Text>
          </Pressable>

          {/* 🔹 Nouveau : modération des avis */}
          <Pressable
            style={styles.actionBtnSecondary}
            onPress={() => router.push("./moderation_avis")}
          >
            <Text style={styles.actionTitle}>Modération des avis</Text>
            <Text style={styles.actionSubtitle}>
              Consulter, masquer ou supprimer les avis et commentaires.
            </Text>
          </Pressable>
          <Pressable
            style={styles.actionBtnSecondary}
            onPress={() => router.push("./historique_admin")}
          >
            <Text style={styles.actionTitle}>Historique admin</Text>
            <Text style={styles.actionSubtitle}>
              Journal complet des actions administratives.
            </Text>
          </Pressable>
        </View>

        {/* BOUTON RETOUR UTILISATEUR */}
        <Pressable
          style={styles.backBtn}
          onPress={() => router.replace("/public/login")}
        >
          <Text style={styles.backBtnText}>Retour</Text>
        </Pressable>
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

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { width: 130, height: 50 },
  badge: {
    backgroundColor: "#1E6091",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  badgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  title: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 20,
    marginBottom: 4,
    color: "#0B2038",
  },
  subtitle: {
    fontSize: 14,
    color: "#4A4A4A",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
  },

  actionBtn: {
    backgroundColor: "#1E6091",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  actionBtnSecondary: {
    backgroundColor: "#4472C4",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  actionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  actionSubtitle: {
    color: "#E4ECF6",
    fontSize: 13,
  },

  backBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#1E6091",
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  backBtnText: {
    color: "#1E6091",
    fontSize: 15,
    fontWeight: "600",
  },
});
