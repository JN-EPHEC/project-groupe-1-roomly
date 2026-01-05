import { useRouter } from "expo-router";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { db } from "../../firebaseConfig";

type Coupon = {
  id: string;
  code: string;
  discountType: "fixed" | "percent";
  amount: number;
  minTotal?: number;
  active: boolean;
};

export default function CouponsAdmin() {
  const router = useRouter();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percent">(
    "fixed"
  );
  const [minTotal, setMinTotal] = useState("");

  const loadCoupons = async () => {
    const snap = await getDocs(collection(db, "coupons"));
    setCoupons(
      snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }))
    );
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const createCoupon = async () => {
    if (!code.trim() || !amount) {
      Alert.alert("Erreur", "Code et montant obligatoires");
      return;
    }

    await addDoc(collection(db, "coupons"), {
      code: code.trim().toUpperCase(),
      discountType,
      amount: Number(amount),
      minTotal: Number(minTotal || 0),
      active: true,
      createdAt: new Date(),
    });

    setCode("");
    setAmount("");
    setMinTotal("");

    loadCoupons();
  };

  const toggleActive = async (c: Coupon) => {
    await updateDoc(doc(db, "coupons", c.id), {
      active: !c.active,
    });
    loadCoupons();
  };

  const deleteCoupon = async (c: Coupon) => {
    await deleteDoc(doc(db, "coupons", c.id));
    loadCoupons();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Gestion des codes promos</Text>

      {/* FORMULAIRE */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Créer un code promo</Text>

        <TextInput
          placeholder="CODE"
          value={code}
          onChangeText={setCode}
          style={styles.input}
          autoCapitalize="characters"
        />

        <TextInput
          placeholder="Montant (ex: 10)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          style={styles.input}
        />

        <TextInput
          placeholder="Montant minimum (optionnel)"
          value={minTotal}
          onChangeText={setMinTotal}
          keyboardType="numeric"
          style={styles.input}
        />

        <View style={styles.row}>
          <Pressable
            style={[
              styles.typeBtn,
              discountType === "fixed" && styles.typeBtnActive,
            ]}
            onPress={() => setDiscountType("fixed")}
          >
            <Text
              style={[
                styles.typeTxt,
                discountType === "fixed" && styles.typeTxtActive,
              ]}
            >
              Réduction € fixe
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.typeBtn,
              discountType === "percent" && styles.typeBtnActive,
            ]}
            onPress={() => setDiscountType("percent")}
          >
            <Text
              style={[
                styles.typeTxt,
                discountType === "percent" && styles.typeTxtActive,
              ]}
            >
              %
            </Text>
          </Pressable>
        </View>

        <Pressable style={styles.saveBtn} onPress={createCoupon}>
          <Text style={styles.saveTxt}>Créer</Text>
        </Pressable>
      </View>

      {/* LISTE */}
      <Text style={styles.subtitle}>Codes existants</Text>

      {coupons.map((c) => (
        <View key={c.id} style={styles.couponCard}>
          <Text style={styles.code}>
            {c.code} {c.active ? "" : "(désactivé)"}
          </Text>
          <Text>
            {c.discountType === "fixed" ? "-" : "-"} {c.amount}
            {c.discountType === "fixed" ? "€" : "%"}
          </Text>

          {c.minTotal ? (
            <Text>Min: {c.minTotal}€</Text>
          ) : (
            <Text>Sans minimum</Text>
          )}

          <View style={styles.row}>
            <Pressable
              style={styles.smallBtn}
              onPress={() => toggleActive(c)}
            >
              <Text style={styles.smallBtnTxt}>
                {c.active ? "Désactiver" : "Activer"}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.smallBtn, { backgroundColor: "#e74c3c" }]}
              onPress={() => deleteCoupon(c)}
            >
              <Text style={[styles.smallBtnTxt, { color: "#fff" }]}>
                Supprimer
              </Text>
            </Pressable>
          </View>
        </View>
      ))}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#EEF3F8", padding: 15 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 15 },
  subtitle: { fontSize: 18, fontWeight: "700", marginTop: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cardTitle: { fontWeight: "700", marginBottom: 10 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  row: { flexDirection: "row", gap: 8 },
  typeBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#ccc",
    alignItems: "center",
    padding: 8,
  },
  typeBtnActive: { backgroundColor: "#3E7CB1", borderColor: "#3E7CB1" },
  typeTxt: { color: "#555" },
  typeTxtActive: { color: "#fff" },
  saveBtn: {
    marginTop: 10,
    backgroundColor: "#3E7CB1",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  saveTxt: { color: "#fff", fontWeight: "700" },
  couponCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
  },
  code: { fontWeight: "700", fontSize: 16 },
  smallBtn: {
    marginTop: 8,
    backgroundColor: "#ccc",
    padding: 8,
    borderRadius: 8,
    marginRight: 6,
  },
  smallBtnTxt: { fontWeight: "700" },
});
