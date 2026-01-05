// components/PrivacyPreferences.tsx
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";
import { auth, db } from "../firebaseConfig";

export default function PrivacyPreferences() {
  const [marketingEmails, setMarketingEmails] = useState(true);
  const [productUpdates, setProductUpdates] = useState(true);
  const [analytics, setAnalytics] = useState(true);
  const [sendingDeletion, setSendingDeletion] = useState(false);

  const currentUser = auth.currentUser;

  const handleRequestDeletion = async () => {
    if (!currentUser) {
      Alert.alert(
        "Non connecté",
        "Vous devez être connecté pour demander la suppression de vos données."
      );
      return;
    }

    try {
      setSendingDeletion(true);

      // 🔹 on enregistre une demande de suppression dans Firestore
      await addDoc(collection(db, "dataDeletionRequests"), {
        userId: currentUser.uid,
        email: currentUser.email || null,
        createdAt: serverTimestamp(),
        status: "en_attente",
        // indicatif : quelles préférences étaient actives au moment de la demande
        preferencesSnapshot: {
          marketingEmails,
          productUpdates,
          analytics,
        },
      });

      Alert.alert(
        "Demande envoyée",
        "Votre demande de suppression de données personnelles a été enregistrée. L’équipe Roomly traitera cette demande conformément au RGPD."
      );
    } catch (e) {
      console.log("Erreur demande suppression données :", e);
      Alert.alert(
        "Erreur",
        "Impossible d’enregistrer la demande pour le moment."
      );
    } finally {
      setSendingDeletion(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Confidentialité & préférences</Text>

      <Text style={styles.subtitle}>
        Gérez ici vos préférences de confidentialité et vos communications.
      </Text>

      {/* BLOC PREFERENCES */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Préférences de communication</Text>

        <View style={styles.prefRow}>
          <View style={styles.prefTextBlock}>
            <Text style={styles.prefLabel}>E-mails marketing</Text>
            <Text style={styles.prefDescription}>
              Recevoir des offres et promotions Roomly.
            </Text>
          </View>
          <Switch
            value={marketingEmails}
            onValueChange={setMarketingEmails}
          />
        </View>

        <View style={styles.separator} />

        <View style={styles.prefRow}>
          <View style={styles.prefTextBlock}>
            <Text style={styles.prefLabel}>Mises à jour produit</Text>
            <Text style={styles.prefDescription}>
              Recevoir des infos sur les nouvelles fonctionnalités.
            </Text>
          </View>
          <Switch value={productUpdates} onValueChange={setProductUpdates} />
        </View>

        <View style={styles.separator} />

        <View style={styles.prefRow}>
          <View style={styles.prefTextBlock}>
            <Text style={styles.prefLabel}>Statistiques anonymisées</Text>
            <Text style={styles.prefDescription}>
              Autoriser l’utilisation de vos données d’usage de manière
              anonymisée pour améliorer Roomly.
            </Text>
          </View>
          <Switch value={analytics} onValueChange={setAnalytics} />
        </View>
      </View>

      {/* BLOC RGPD / SUPPRESSION DES DONNÉES */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Données personnelles (RGPD)</Text>
        <Text style={styles.infoText}>
          Conformément au RGPD, vous pouvez demander la suppression de vos
          données personnelles. Cette demande sera traitée par l’équipe Roomly
          et peut entraîner la suppression de votre compte et de votre
          historique.
        </Text>

        <Pressable
          style={[
            styles.deleteButton,
            sendingDeletion && { opacity: 0.6 },
          ]}
          onPress={handleRequestDeletion}
          disabled={sendingDeletion}
        >
          <Text style={styles.deleteButtonText}>
            {sendingDeletion
              ? "Envoi de la demande..."
              : "Demander la suppression de mes données"}
          </Text>
        </Pressable>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF3F8",
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 14,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  prefTextBlock: {
    flex: 1,
    paddingRight: 10,
  },
  prefLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  prefDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#444",
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: "#C0392B",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
