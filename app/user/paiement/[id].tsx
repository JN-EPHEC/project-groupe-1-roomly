// app/user/paiement/index.tsx
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

import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { auth, db } from "../../../firebaseConfig";

export default function PaiementScreen() {
  const router = useRouter();
  const { espaceId, date, slots, total } = useLocalSearchParams();

  const formattedSlots = JSON.parse(slots as string);

  /* --------------------- Mode démo : paiement + stockage --------------------- */

  const payerEnDemo = async () => {
  try {
    const espaceIdStr = String(espaceId); // 👈 obligatoire

    const espaceSnap = await getDoc(doc(db, "espaces", espaceIdStr));
    const espaceData = espaceSnap.data();

    const docRef = await addDoc(collection(db, "reservations"), {
      espaceId: espaceIdStr,
      entrepriseId: espaceData?.uid || null,   // 👈 OK
      userId: auth.currentUser?.uid || "anonymous",
      date,
      slots: formattedSlots,
      total: Number(total),
      createdAt: serverTimestamp(),
    });

    /****************************
 *  MISE À JOUR / CREATION THREAD
 ****************************/

// 1. Vérifier si un thread existe déjà entre user + entreprise + espace
const threadsRef = collection(db, "threads");
const q = query(
  threadsRef,
  where("userId", "==", auth.currentUser?.uid),
  where("entrepriseId", "==", espaceData?.uid),
  where("espaceId", "==", espaceId) // ou id selon ton fichier
);

const threadSnap = await getDocs(q);

if (threadSnap.empty) {
  // ⭐ 2. Créer un nouveau thread
  await addDoc(threadsRef, {
    userId: auth.currentUser?.uid,
    entrepriseId: espaceData?.uid,
    espaceId: espaceId, // ou id
    espaceNom: espaceData?.nom || "Espace",
    lastMessage: "Nouvelle réservation effectuée", 
    updatedAt: Date.now(),
    unreadEntreprise: true,   // affichage en bleu côté entreprise
    unreadUser: false,
  });
} else {
  // ⭐ 3. Thread existe déjà → mise à jour
  const threadDoc = threadSnap.docs[0].ref;
  await updateDoc(threadDoc, {
    lastMessage: "Nouvelle réservation effectuée",
    updatedAt: Date.now(),
    unreadEntreprise: true,
  });
}


    router.push(`/user/reservation_confirmee/${docRef.id}`);
  } catch (e) {
    console.log("Erreur paiement démo :", e);
    Alert.alert("Erreur", "Impossible de finaliser le paiement.");
  }
};


  return (
    <ScrollView style={styles.container}>
      
      {/* Logo */}
      <Image
        source={require("../../../assets/images/roomly-logo.png")}
        style={styles.logo}
      />

      {/* Back */}
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>‹   Confirmer et payer</Text>
      </Pressable>

      <View style={styles.separator} />

      {/* Récap réservation */}
      <Text style={styles.sectionTitle}>Votre réservation</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Date</Text>
        <Text style={styles.value}>
          {new Date(date as string).toLocaleDateString("fr-FR")}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Heure</Text>
        <Text style={styles.value}>{formattedSlots.join(", ")}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Prix total</Text>
        <Text style={styles.value}>{total} €</Text>
      </View>

      {/* Boutons de paiement */}
      <Pressable
        style={styles.gpay}
        onPress={() => console.log("Paiement Google Pay non implémenté")}
      >
        <Text style={styles.gpayText}>Payer avec  G Pay</Text>
      </Pressable>

      <Pressable
        style={styles.applePay}
        onPress={() => console.log("Paiement Apple Pay non implémenté")}
      >
        <Text style={styles.applePayText}>Payer avec  Pay</Text>
      </Pressable>

      {/* Bouton de paiement démo */}
      <Pressable
        style={styles.demoPay}
        onPress={payerEnDemo}
      >
        <Text style={styles.demoPayText}>Payer (mode démo)</Text>
      </Pressable>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#E8EDF3",
    paddingHorizontal: 20,
    paddingTop: 40,
  },

  logo: {
    width: 160,
    height: 70,
    alignSelf: "center",
    marginBottom: 20,
  },

  back: {
    fontSize: 20,
    fontWeight: "700",
  },

  separator: {
    height: 1,
    backgroundColor: "#000",
    marginVertical: 15,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  label: {
    fontSize: 16,
    color: "#333",
  },

  value: {
    fontSize: 16,
    fontWeight: "600",
  },

  gpay: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },

  gpayText: {
    fontSize: 17,
    fontWeight: "600",
  },

  applePay: {
    backgroundColor: "#000",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 15,
    alignItems: "center",
  },

  applePayText: {
    fontSize: 17,
    color: "#fff",
    fontWeight: "600",
  },

  demoPay: {
    backgroundColor: "#3E7CB1",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 30,
    alignItems: "center",
  },

  demoPayText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
