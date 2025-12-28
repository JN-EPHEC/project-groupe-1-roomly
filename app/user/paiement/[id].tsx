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
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { auth, db } from "../../../firebaseConfig";

const PAYPAL_CLIENT_ID = process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID as string;

export default function PaiementScreen() {
  const router = useRouter();
  const { espaceId, date, slots, total } = useLocalSearchParams();

  const formattedSlots: string[] = JSON.parse(slots as string);
  const totalNumber = Number(total || 0);

  const [showPayPal, setShowPayPal] = useState(false);

  /* ------------------------------------------------------------------ */
  /*  LOGIQUE RÉSERVATION (Firestore + thread)                          */
  /* ------------------------------------------------------------------ */
  const finaliserReservation = async () => {
    try {
      const espaceIdStr = String(espaceId);

      const espaceSnap = await getDoc(doc(db, "espaces", espaceIdStr));
      const espaceData = espaceSnap.data();

      const currentUser = auth.currentUser;

      // 1) Création de la réservation
      const docRef = await addDoc(collection(db, "reservations"), {
        espaceId: espaceIdStr,
        entrepriseId: espaceData?.uid || null,
        userId: currentUser?.uid || "anonymous",
        userEmail: currentUser?.email || null,
        date,
        slots: formattedSlots,
        total: totalNumber,
        createdAt: serverTimestamp(),
        paymentStatus: "paid",
        paymentProvider: "PayPal (sandbox)",
      });

      // 2) Thread de discussion
      const threadsRef = collection(db, "threads");
      const q = query(
        threadsRef,
        where("userId", "==", currentUser?.uid),
        where("entrepriseId", "==", espaceData?.uid),
        where("espaceId", "==", espaceIdStr)
      );

      const threadSnap = await getDocs(q);

      if (threadSnap.empty) {
        await addDoc(threadsRef, {
          userId: currentUser?.uid,
          entrepriseId: espaceData?.uid,
          espaceId: espaceIdStr,
          espaceNom: espaceData?.nom || "Espace",
          lastMessage: "Nouvelle réservation effectuée",
          updatedAt: Date.now(),
          unreadEntreprise: true,
          unreadUser: false,
        });
      } else {
        const threadDoc = threadSnap.docs[0].ref;
        await updateDoc(threadDoc, {
          lastMessage: "Nouvelle réservation effectuée",
          updatedAt: Date.now(),
          unreadEntreprise: true,
        });
      }

      router.push(`/user/reservation_confirmee/${docRef.id}`);
    } catch (e) {
      console.log("Erreur finalisation réservation :", e);
      Alert.alert("Erreur", "Impossible de finaliser la réservation.");
    }
  };

  /* ------------------------------------------------------------------ */
  /*  HTML du bouton PayPal (sandbox) chargé dans WebView               */
  /* ------------------------------------------------------------------ */

  const paypalHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>PayPal Sandbox</title>
        <script src="https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=EUR"></script>
        <style>
          body { margin:0; padding:0; display:flex; justify-content:center; align-items:center; height:100vh; }
        </style>
      </head>
      <body>
        <div id="paypal-button-container"></div>
        <script>
          paypal.Buttons({
            createOrder: function(data, actions) {
              return actions.order.create({
                purchase_units: [{
                  amount: { value: '${totalNumber.toFixed(2)}' }
                }]
              });
            },
            onApprove: function(data, actions) {
              return actions.order.capture().then(function(details) {
                window.ReactNativeWebView.postMessage('SUCCESS');
              });
            },
            onCancel: function (data) {
              window.ReactNativeWebView.postMessage('CANCEL');
            },
            onError: function (err) {
              window.ReactNativeWebView.postMessage('ERROR');
            }
          }).render('#paypal-button-container');
        </script>
      </body>
    </html>
  `;

  /* ------------------------------------------------------------------ */
  /*  Vue plein écran PayPal sur mobile                                 */
  /* ------------------------------------------------------------------ */

  if (showPayPal && Platform.OS !== "web") {
    return (
      <View style={{ flex: 1 }}>
        <WebView
          originWhitelist={["*"]}
          source={{ html: paypalHtml }}
          onMessage={async (event) => {
            const msg = event.nativeEvent.data;
            if (msg === "SUCCESS") {
              setShowPayPal(false);
              await finaliserReservation();
            } else if (msg === "CANCEL") {
              setShowPayPal(false);
              Alert.alert("Paiement annulé");
            } else if (msg === "ERROR") {
              setShowPayPal(false);
              Alert.alert("Erreur", "Erreur lors du paiement PayPal.");
            }
          }}
        />
      </View>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Écran normal : récap + boutons                                    */
  /* ------------------------------------------------------------------ */

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
        <Text style={styles.value}>{totalNumber.toFixed(2)} €</Text>
      </View>

      {/* Boutons GPay / ApplePay (non implémentés) */}
      <Pressable
        style={styles.gpay}
        onPress={() => Alert.alert("Info", "Google Pay non implémenté (MVP).")}
      >
        <Text style={styles.gpayText}>Payer avec  G Pay</Text>
      </Pressable>

      <Pressable
        style={styles.applePay}
        onPress={() => Alert.alert("Info", "Apple Pay non implémenté (MVP).")}
      >
        <Text style={styles.applePayText}>Payer avec  Pay</Text>
      </Pressable>

      {/* PayPal sandbox */}
      <Pressable
        style={styles.paypal}
        onPress={() => {
          if (!PAYPAL_CLIENT_ID) {
            Alert.alert(
              "Configuration manquante",
              "EXPO_PUBLIC_PAYPAL_CLIENT_ID n’est pas défini dans le .env."
            );
            return;
          }
          if (Platform.OS === "web") {
            Alert.alert(
              "Non disponible",
              "Le paiement PayPal est démontré sur l’application mobile (Android/iOS)."
            );
            return;
          }
          setShowPayPal(true);
        }}
      >
        <Text style={styles.paypalText}>Payer avec PayPal (sandbox)</Text>
      </Pressable>

      {/* Bouton de secours : mode démo direct */}
      <Pressable
        style={styles.demoPay}
        onPress={finaliserReservation}
      >
        <Text style={styles.demoPayText}>Valider sans PayPal (mode démo)</Text>
      </Pressable>
    </ScrollView>
  );
}

/* ---------------------- STYLES ---------------------- */

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

  paypal: {
    backgroundColor: "#ffc439",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 25,
    alignItems: "center",
  },

  paypalText: {
    color: "#111",
    fontSize: 17,
    fontWeight: "700",
  },

  demoPay: {
    backgroundColor: "#3E7CB1",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
  },

  demoPayText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});