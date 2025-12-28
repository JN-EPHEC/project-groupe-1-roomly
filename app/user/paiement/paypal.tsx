// app/user/paiement/paypal.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from "firebase/firestore";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { auth, db } from "../../../firebaseConfig";

export default function PayPalSandboxScreen() {
  const router = useRouter();
  const { espaceId, date, slots, total } = useLocalSearchParams();

  const [loading, setLoading] = useState(false);

  const espaceIdStr = String(espaceId);
  const formattedSlots: string[] = slots ? JSON.parse(slots as string) : [];
  const totalNumber = Number(total || 0);

  const montantLabel = `${totalNumber.toFixed(2)} €`;

  /* ------------------------------------------------------------------ */
  /*  Simulation PayPal : si “payer” → on crée la réservation           */
  /* ------------------------------------------------------------------ */
  const simulerPaiementReussi = async () => {
    try {
      setLoading(true);

      const espaceSnap = await getDoc(doc(db, "espaces", espaceIdStr));
      const espaceData = espaceSnap.data();

      // 1) Création réservation
      const docRef = await addDoc(collection(db, "reservations"), {
        espaceId: espaceIdStr,
        entrepriseId: espaceData?.uid || null,
        userId: auth.currentUser?.uid || "anonymous",
        date,
        slots: formattedSlots,
        total: totalNumber,
        createdAt: serverTimestamp(),
        paymentStatus: "paid",
        paymentProvider: "PayPal (sandbox simulé)",
      });

      // 2) Thread de discussion
      const threadsRef = collection(db, "threads");
      const q = query(
        threadsRef,
        where("userId", "==", auth.currentUser?.uid),
        where("entrepriseId", "==", espaceData?.uid),
        where("espaceId", "==", espaceIdStr)
      );

      const threadSnap = await getDocs(q);

      if (threadSnap.empty) {
        await addDoc(threadsRef, {
          userId: auth.currentUser?.uid,
          entrepriseId: espaceData?.uid,
          espaceId: espaceIdStr,
          espaceNom: espaceData?.nom || "Espace",
          lastMessage: "Nouvelle réservation effectuée (PayPal)",
          updatedAt: Date.now(),
          unreadEntreprise: true,
          unreadUser: false,
        });
      } else {
        const threadDoc = threadSnap.docs[0].ref;
        await updateDoc(threadDoc, {
          lastMessage: "Nouvelle réservation effectuée (PayPal)",
          updatedAt: Date.now(),
          unreadEntreprise: true,
        });
      }

      setLoading(false);
      router.replace(`/user/reservation_confirmee/${docRef.id}`);
    } catch (e) {
      console.log("Erreur PayPal sandbox :", e);
      setLoading(false);
      Alert.alert("Erreur", "Impossible de finaliser la réservation.");
    }
  };

  const annuler = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* “Page PayPal” simulée */}
      <View style={styles.card}>
        <Image
          source={require("../../../assets/images/roomly-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>PayPal – Sandbox</Text>
        <Text style={styles.subtitle}>
          Ceci simule un prestataire de paiement (PayPal) pour le projet Roomly.
        </Text>

        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Montant à payer</Text>
          <Text style={styles.amount}>{montantLabel}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0070BA" style={{ marginTop: 20 }} />
        ) : (
          <>
            <Pressable style={styles.payButton} onPress={simulerPaiementReussi}>
              <Text style={styles.payButtonText}>Payer avec PayPal (sandbox)</Text>
            </Pressable>

            <Pressable style={styles.cancelButton} onPress={annuler}>
              <Text style={styles.cancelButtonText}>Annuler et revenir</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8EDF3",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  logo: {
    width: 120,
    height: 50,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    textAlign: "center",
    color: "#555",
    fontSize: 13,
    marginBottom: 16,
  },
  amountBox: {
    backgroundColor: "#F6F7FB",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 18,
  },
  amountLabel: {
    fontSize: 13,
    color: "#666",
  },
  amount: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },
  payButton: {
    backgroundColor: "#FFC439",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: "100%",
    alignItems: "center",
    marginTop: 4,
  },
  payButtonText: {
    fontWeight: "700",
    fontSize: 16,
    color: "#111",
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: "100%",
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  cancelButtonText: {
    fontWeight: "600",
    fontSize: 15,
    color: "#444",
  },
});
