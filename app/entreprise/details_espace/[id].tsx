import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { deleteObject, getStorage, ref } from "firebase/storage";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { db } from "../../../firebaseConfig";

const { width } = Dimensions.get("window");

type TimeSlot = {
  id?: string;
  dateISO?: string;
  dayLabel?: string;
  start?: string;
  end?: string;
};

export default function DetailsEspace() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [espace, setEspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEspace = async () => {
      try {
        if (!id) return;
        const refDoc = doc(db, "espaces", id as string);
        const snap = await getDoc(refDoc);
        if (snap.exists()) setEspace(snap.data());
      } catch (err) {
        console.log("Erreur fetch espace :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEspace();
  }, [id]);

  // ---------------- SUPPRESSION IMAGES ----------------
  const supprimerImagesStorage = async () => {
    if (!espace?.images || !Array.isArray(espace.images)) return;

    const storage = getStorage();

    for (const url of espace.images) {
      if (!url) continue;

      try {
        const match = url.match(/\/o\/(.+?)\?/);
        if (!match) continue;

        const fullPath = decodeURIComponent(match[1]);
        const imageRef = ref(storage, fullPath);
        await deleteObject(imageRef);
      } catch (err) {
        console.log("Erreur suppression image :", err);
      }
    }
  };

  // ---------------- SUPPRESSION ANNONCE ----------------
  const supprimerAnnonce = () => {
    if (Platform.OS === "web") {
      const ok = window.confirm("Voulez-vous vraiment supprimer cet espace ?");
      if (!ok) return;

      (async () => {
        try {
          if (!id) return;
          await supprimerImagesStorage();
          await deleteDoc(doc(db, "espaces", id as string));

          alert("Annonce supprimée !");
          router.replace("/entreprise/home_entreprise");
        } catch (e) {
          console.log("Erreur suppression annonce :", e);
          alert("Erreur lors de la suppression.");
        }
      })();

      return;
    }

    Alert.alert(
      "Supprimer l’annonce",
      "Voulez-vous vraiment supprimer cet espace ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              if (!id) return;

              await supprimerImagesStorage();
              await deleteDoc(doc(db, "espaces", id as string));

              Alert.alert("Succès", "Annonce supprimée.", [
                {
                  text: "OK",
                  onPress: () =>
                    router.replace("/entreprise/home_entreprise"),
                },
              ]);
            } catch (e) {
              console.log("Erreur suppression annonce :", e);
              Alert.alert("Erreur", "Une erreur est survenue.");
            }
          },
        },
      ]
    );
  };

  if (loading || !espace) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3E7CB1" />
      </View>
    );
  }

  const slots: TimeSlot[] = (espace.timeSlots || []) as TimeSlot[];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Bouton retour */}
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#000" />
        </Pressable>

        {/* CAROUSEL IMAGES */}
        {espace.images && espace.images.length > 0 && (
          <View style={styles.carouselContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              contentContainerStyle={{ alignItems: "center" }}
            >
              {espace.images.map((img: string, index: number) => (
                <Image
                  key={index}
                  source={{ uri: img }}
                  style={styles.carouselImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Bloc blanc */}
        <View style={styles.card}>
          <Text style={styles.title}>Détails de l’espace</Text>

          <Text style={styles.label}>Description</Text>
          <Text style={styles.text}>{espace.description}</Text>

          <Text style={styles.label}>Localisation</Text>
          <Text style={styles.text}>{espace.localisation}</Text>

          <Text style={styles.label}>Capacité</Text>
          <Text style={styles.text}>{espace.capacite} personnes</Text>

          <Text style={styles.label}>Prix</Text>
          <Text style={styles.text}>{espace.prix} €/h</Text>

          <Text style={styles.label}>Matériel disponible</Text>
          <Text style={styles.text}>{espace.materiel}</Text>

          {/* DISPONIBILITÉS */}
          <Text style={styles.label}>Disponibilités</Text>
          {slots.length === 0 ? (
            <Text style={styles.text}>Aucune disponibilité définie.</Text>
          ) : (
            slots.map((slot, index) => (
              <Text
                key={slot.id ?? `slot-${index}`}
                style={styles.text}
              >
                {slot.dayLabel} — {slot.start} - {slot.end}
              </Text>
            ))
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: "#3E7CB1" }]}
              onPress={() => router.push(`/entreprise/editer_espace/${id}`)}
            >
              <Text style={styles.actionText}>Modifier</Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, { backgroundColor: "#D9534F" }]}
              onPress={supprimerAnnonce}
            >
              <Text style={styles.actionText}>Supprimer</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF3F8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EEF3F8",
  },
  content: {
    paddingBottom: 40,
    width: "100%",
    alignItems: "center",
  },
  backButton: {
    width: "90%",
    marginTop: 50,
    marginBottom: 10,
  },
  card: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    color: "#000",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 14,
    marginBottom: 4,
    color: "#000",
  },
  text: {
    fontSize: 14,
    color: "#333",
  },
  actions: {
    marginTop: 25,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 0.48,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  actionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  // images
  carouselContainer: {
    width: "100%",
    height: 260,
    marginBottom: 20,
  },
  carouselImage: {
    width: width,
    height: 260,
  },
});
