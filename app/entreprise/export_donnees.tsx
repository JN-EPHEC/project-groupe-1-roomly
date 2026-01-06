import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
} from "firebase/firestore";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { auth, db } from "../../firebaseConfig";

export default function ExportDonneesEntreprise() {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [lastInfo, setLastInfo] = useState<string | null>(null);

  const handleExport = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser?.uid) {
      Alert.alert("Non connecté", "Vous devez être connecté en tant qu’entreprise.");
      return;
    }

    try {
      setExporting(true);
      setLastInfo(null);

      const uid = currentUser.uid;

      // 1) Compte entreprise
      const userSnap = await getDoc(doc(db, "users", uid));
      const compte = userSnap.exists() ? userSnap.data() : null;

      // 2) Espaces de cette entreprise
      const espacesSnap = await getDocs(
        query(collection(db, "espaces"), where("uid", "==", uid))
      );
      const espaces = espacesSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      // 3) Réservations sur ses espaces
      const resaSnap = await getDocs(
        query(collection(db, "reservations"), where("entrepriseId", "==", uid))
      );
      const reservations = resaSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      // 4) Threads de discussion (sans chargement des messages pour rester simple)
      const threadsSnap = await getDocs(
        query(collection(db, "threads"), where("entrepriseId", "==", uid))
      );
      const threads = threadsSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      const exportData = {
        generatedAt: new Date().toISOString(),
        entrepriseId: uid,
        compte,
        espaces,
        reservations,
        threads,
      };

      const json = JSON.stringify(exportData, null, 2);
const fileName = `roomly_export_${uid}_${Date.now()}.json`;
const fileUri = FileSystem.documentDirectory + fileName;

await FileSystem.writeAsStringAsync(fileUri, json, {
  encoding: "utf8",
});

      // Partage (AirDrop, mail, Fichiers, etc.)
      const sharingAvailable = await Sharing.isAvailableAsync();
      if (sharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/json",
          dialogTitle: "Exporter mes données Roomly",
        });
      } else {
        Alert.alert(
          "Export prêt",
          `Fichier généré : ${fileName}\nChemin : ${fileUri}`
        );
      }

      setLastInfo(`Export généré (${fileName})`);
    } catch (e) {
      console.log("Erreur export données entreprise :", e);
      Alert.alert(
        "Erreur",
        "Impossible de générer l’export de vos données pour le moment."
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header simple */}
        <Pressable
          style={styles.backRow}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text style={styles.backText}>Retour</Text>
        </Pressable>

        <Text style={styles.title}>Exporter mes données</Text>
        <Text style={styles.subtitle}>
          Téléchargez un fichier JSON contenant vos informations de compte,
          la liste de vos espaces, vos réservations et vos conversations
          (threads) associées.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contenu de l’export</Text>
          <Text style={styles.line}>• Compte entreprise (profil)</Text>
          <Text style={styles.line}>• Espaces publiés</Text>
          <Text style={styles.line}>• Réservations sur vos espaces</Text>
          <Text style={styles.line}>• Threads de messages (métadonnées)</Text>
        </View>

        <Pressable
          style={[styles.exportBtn, exporting && { opacity: 0.7 }]}
          onPress={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.exportText}>Télécharger mes données</Text>
          )}
        </Pressable>

        {lastInfo && (
          <Text style={styles.infoText}>{lastInfo}</Text>
        )}
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
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backText: {
    marginLeft: 6,
    fontSize: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#555",
    marginBottom: 18,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  line: {
    fontSize: 13,
    color: "#333",
    marginTop: 2,
  },
  exportBtn: {
    backgroundColor: "#1E6091",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  exportText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  infoText: {
    marginTop: 12,
    fontSize: 12,
    color: "#555",
  },
});
