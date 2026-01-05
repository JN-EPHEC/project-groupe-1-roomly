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
  TextInput,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { auth, db } from "../../../firebaseConfig";

const PAYPAL_CLIENT_ID = process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID as string;

type CouponData = {
  id: string;
  code: string;
  discountType: "fixed" | "percent";
  amount: number;
  minTotal?: number;
  active?: boolean;
};

export default function PaiementScreen() {
  const router = useRouter();
  const { espaceId, date, slots, total } = useLocalSearchParams();

  const formattedSlots: string[] = JSON.parse(slots as string);
  const totalNumber = Number(total || 0); // total initial (sans remise)

  const [showPayPal, setShowPayPal] = useState(false);

  // --- Code promo ---
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    data: CouponData;
    discountAmount: number;
  } | null>(null);
  const [discountedTotal, setDiscountedTotal] = useState(totalNumber);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  /* ------------------------------------------------------------------ */
  /*  APPLIQUER LE CODE PROMO                                           */
  /* ------------------------------------------------------------------ */
  const handleApplyCoupon = async () => {
    const raw = couponCode.trim().toUpperCase();
    if (!raw) {
      setCouponMessage("Veuillez entrer un code promo.");
      setAppliedCoupon(null);
      setDiscountedTotal(totalNumber);
      return;
    }

    try {
      const qCoupons = query(
        collection(db, "coupons"),
        where("code", "==", raw)
      );
      const snap = await getDocs(qCoupons);

      if (snap.empty) {
        setCouponMessage("Code promo invalide.");
        setAppliedCoupon(null);
        setDiscountedTotal(totalNumber);
        return;
      }

      const docSnap = snap.docs[0];
      const data = docSnap.data() as CouponData;

      if (data.active === false) {
        setCouponMessage("Ce code promo n'est plus actif.");
        setAppliedCoupon(null);
        setDiscountedTotal(totalNumber);
        return;
      }

      const currentTotal = totalNumber;

      if (data.minTotal && currentTotal < data.minTotal) {
        setCouponMessage(
          `Montant minimum pour ce code : ${data.minTotal.toFixed(2)}€`
        );
        setAppliedCoupon(null);
        setDiscountedTotal(totalNumber);
        return;
      }

      let discountAmount = 0;
      if (data.discountType === "fixed") {
        discountAmount = Math.min(data.amount, currentTotal);
      } else {
        // percent
        discountAmount = (currentTotal * data.amount) / 100;
      }

      discountAmount = Number(discountAmount.toFixed(2));
      const newTotal = Number(Math.max(0, currentTotal - discountAmount).toFixed(2));

      setAppliedCoupon({ data, discountAmount });
      setDiscountedTotal(newTotal);
      setCouponMessage(
        `Code appliqué : -${discountAmount.toFixed(2)}€ (nouveau total ${
          newTotal.toFixed(2)
        }€)`
      );
    } catch (e) {
      console.log("Erreur code promo:", e);
      setCouponMessage("Erreur lors de la vérification du code.");
      setAppliedCoupon(null);
      setDiscountedTotal(totalNumber);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  LOGIQUE RÉSERVATION (Firestore + thread)                          */
  /* ------------------------------------------------------------------ */
  const finaliserReservation = async () => {
    try {
      const espaceIdStr = String(espaceId);

      const espaceSnap = await getDoc(doc(db, "espaces", espaceIdStr));
      const espaceData = espaceSnap.data();

      const currentUser = auth.currentUser;

      const finalTotal = discountedTotal;
      const discountAmount = appliedCoupon?.discountAmount || 0;

      // 1) Création de la réservation
      const docRef = await addDoc(collection(db, "reservations"), {
        espaceId: espaceIdStr,
        entrepriseId: espaceData?.uid || null,
        userId: currentUser?.uid || "anonymous",
        userEmail: currentUser?.email || null,
        date,
        slots: formattedSlots,
        // infos de prix
        total: finalTotal, // total payé après remise
        totalBeforeDiscount: totalNumber,
        discountAmount: discountAmount,
        couponCode: appliedCoupon?.data.code || null,
        createdAt: serverTimestamp(),
        paymentStatus: "paid",
        paymentProvider: "PayPal (sandbox)",
      });

      // 2) Thread de discussion
      const threadsRef = collection(db, "threads");
      const qThread = query(
        threadsRef,
        where("userId", "==", currentUser?.uid),
        where("entrepriseId", "==", espaceData?.uid),
        where("espaceId", "==", espaceIdStr)
      );

      const threadSnap = await getDocs(qThread);

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
                  amount: { value: '${discountedTotal.toFixed(2)}' }
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

  const discountAmount = appliedCoupon?.discountAmount || 0;

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
        {discountAmount > 0 ? (
          <Text style={styles.value}>
            {totalNumber.toFixed(2)} € →{" "}
            <Text style={{ color: "#1E8838", fontWeight: "700" }}>
              {discountedTotal.toFixed(2)} €
            </Text>
          </Text>
        ) : (
          <Text style={styles.value}>{totalNumber.toFixed(2)} €</Text>
        )}
      </View>

      {discountAmount > 0 && appliedCoupon && (
        <Text style={styles.discountInfo}>
          Code {appliedCoupon.data.code} : -{discountAmount.toFixed(2)}€
        </Text>
      )}

      {/* Code promo */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Code promo</Text>
      <View style={styles.couponRow}>
        <TextInput
          placeholder="Saisir un code"
          value={couponCode}
          onChangeText={setCouponCode}
          style={styles.couponInput}
          autoCapitalize="characters"
        />
        <Pressable style={styles.couponBtn} onPress={handleApplyCoupon}>
          <Text style={styles.couponBtnText}>Appliquer</Text>
        </Pressable>
      </View>
      {couponMessage && (
        <Text style={styles.couponMessage}>{couponMessage}</Text>
      )}

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
      <Pressable style={styles.demoPay} onPress={finaliserReservation}>
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

  discountInfo: {
    fontSize: 13,
    color: "#1E8838",
    marginBottom: 5,
  },

  // Code promo
  couponRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  couponInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 14,
  },
  couponBtn: {
    backgroundColor: "#3E7CB1",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  couponBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  couponMessage: {
    fontSize: 12,
    color: "#555",
    marginBottom: 10,
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
