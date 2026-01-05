// app/user/details_espace/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import BottomNavBar from "../../../components/BottomNavBar";
import { auth, db } from "../../../firebaseConfig";

const { width } = Dimensions.get("window");

const isBoostActive = (espace: any): boolean => {
  if (!espace?.boostUntil) return false;
  const d = espace.boostUntil.toDate
    ? espace.boostUntil.toDate()
    : new Date(espace.boostUntil);
  return d.getTime() > Date.now();
};

export default function DetailsEspaceUtilisateur() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [espace, setEspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);

  useEffect(() => {
    const fetchEspace = async () => {
      try {
        if (!id) return;

        const refDoc = doc(db, "espaces", id as string);
        const snap = await getDoc(refDoc);
        if (snap.exists()) setEspace(snap.data());

        const reviewsRef = collection(db, "reviewsEspaces");
        const q = query(reviewsRef, where("espaceId", "==", id as string));
        const reviewsSnap = await getDocs(q);

        if (!reviewsSnap.empty) {
          let total = 0;
          reviewsSnap.forEach((d) => {
            const data = d.data() as any;
            if (typeof data.note === "number") {
              total += data.note;
            }
          });
          const count = reviewsSnap.size;
          setRatingCount(count);
          setAvgRating(total / count);
        } else {
          setRatingCount(0);
          setAvgRating(null);
        }
      } catch (err) {
        console.log("Erreur fetch espace utilisateur :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEspace();
  }, [id]);

  if (loading || !espace) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3E7CB1" />
      </View>
    );
  }

  const boosted = isBoostActive(espace);

  const handleContact = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const threadId = `${uid}_${id}`;

      await setDoc(
        doc(db, "threads", threadId),
        {
          userId: uid,
          espaceId: id,
          espaceNom: espace.nom || "Bureau Roomly",
          localisation: espace.localisation || "",
          imageUrl: espace.images?.[0] || null,
          lastMessageAt: new Date(),
        },
        { merge: true }
      );

      router.push("/user/messages_utilisateur");
    } catch (error) {
      console.log("Erreur handleContact:", error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* RETOUR */}
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#000" />
        </Pressable>

        {/* CAROUSEL D’IMAGES */}
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

        {/* BLOC DESCRIPTION */}
        <View style={styles.card}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.title}>Détails de l’espace</Text>
            {boosted && (
              <View style={styles.boostBadge}>
                <Text style={styles.boostBadgeText}>Top listing</Text>
              </View>
            )}
          </View>

          {/* ⭐ Note moyenne */}
          {avgRating !== null ? (
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Ionicons
                  key={i}
                  name={i <= Math.round(avgRating) ? "star" : "star-outline"}
                  size={18}
                  color="#F5A623"
                />
              ))}
              <Text style={styles.ratingText}>
                {avgRating.toFixed(1)}/5 ({ratingCount} avis)
              </Text>
            </View>
          ) : (
            <Text style={styles.ratingText}>Aucun avis pour le moment</Text>
          )}

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

          {/* BOUTON RÉSERVER */}
          <Pressable
            style={styles.reserveButton}
            onPress={() => router.push(`/user/reserver/${id}`)}
          >
            <Text style={styles.reserveText}>Réserver un créneau horaire</Text>
            <Ionicons name="calendar-outline" size={22} color="#fff" />
          </Pressable>

          {/* BOUTON CONTACTER */}
          <Pressable style={styles.contactButton} onPress={handleContact}>
            <Text style={styles.contactText}>Contacter</Text>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={22}
              color="#3E7CB1"
            />
          </Pressable>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <BottomNavBar activeTab="menu" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },

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

  carouselContainer: {
    width: "100%",
    height: 260,
    marginBottom: 20,
  },

  carouselImage: {
    width: width,
    height: 260,
    borderRadius: 14,
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
    marginBottom: 12,
    color: "#000",
    flex: 1,
  },

  boostBadge: {
    backgroundColor: "#8e44ad",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  boostBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 3,
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 13,
    color: "#555",
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

  reserveButton: {
    marginTop: 25,
    backgroundColor: "#3E7CB1",
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  reserveText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },

  contactButton: {
    marginTop: 20,
    borderWidth: 2,
    borderColor: "#3E7CB1",
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  contactText: {
    color: "#3E7CB1",
    fontSize: 17,
    fontWeight: "700",
  },
});
