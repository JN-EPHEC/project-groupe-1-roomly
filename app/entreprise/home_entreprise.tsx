// app/entreprise/home_entreprise.tsx
import BottomNavBarEntreprise from "@/components/BottomNavBarEntreprise";
import { useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { auth, db } from "../../firebaseConfig";

export default function HomeEntreprise() {
  const router = useRouter();

  const [reservations, setReservations] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [kpis, setKpis] = useState({ today: 0, monthly: 0, occupancy: 0 });
  const [loading, setLoading] = useState(true);

  // Contact support (entreprise -> admin)
  const [contactEmail, setContactEmail] = useState(
    auth.currentUser?.email ?? ""
  );
  const [contactMessage, setContactMessage] = useState("");
  const [sendingContact, setSendingContact] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const uid = auth.currentUser?.uid;

        const espacesSnap = await getDocs(
          query(collection(db, "espaces"), where("uid", "==", uid))
        );
        const espaceIds = espacesSnap.docs.map((d) => d.id);

        if (espaceIds.length === 0) {
          setLoading(false);
          return;
        }

        const rSnap = await getDocs(collection(db, "reservations"));
        const rawReservations = rSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        const all: any[] = [];

        for (const r of rawReservations as any) {
          if (!espaceIds.includes(r.espaceId)) continue;

          let userName = "Utilisateur";
          if (r.userId) {
            const userSnap = await getDoc(doc(db, "users", r.userId));
            if (userSnap.exists()) {
              const data = userSnap.data();
              userName =
                (data as any).name || (data as any).email || "Utilisateur";
            }
          }

          all.push({
            ...r,
            userName,
          });
        }

        all.sort((a: any, b: any) => (a.date > b.date ? 1 : -1));

        setReservations(all);

        const future = all.filter((r: any) => new Date(r.date) >= new Date());
        setUpcoming(future.slice(0, 5));

        const todayStr = new Date().toISOString().slice(0, 10);
        const todayCount = all.filter((r: any) => r.date === todayStr).length;

        const month = new Date().getMonth();
        const monthlyRev = all
          .filter((r: any) => {
            if (!r.createdAt) return false;
            const created = r.createdAt.toDate
              ? r.createdAt.toDate()
              : new Date(r.createdAt);
            return created.getMonth() === month;
          })
          .reduce((sum, r: any) => sum + (r.total || 0), 0);

        const occupancy = Math.min(100, Math.round((all.length / 30) * 100));

        setKpis({
          today: todayCount,
          monthly: monthlyRev,
          occupancy,
        });
      } catch (err) {
        console.log("Erreur:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSendContact = async () => {
  if (!contactEmail.trim() || !contactMessage.trim()) {
    Alert.alert("Oups", "Merci de remplir l’e-mail et le message.");
    return;
  }

  try {
    setSendingContact(true);

    // 🔹 ticket de support ENTREPRISE
    await addDoc(collection(db, "supportTickets"), {
      userId: auth.currentUser?.uid || null,
      email: contactEmail.trim(),
      message: contactMessage.trim(),
      fromType: "entreprise",
      status: "ouvert",
      createdAt: serverTimestamp(),
      lastUpdatedAt: serverTimestamp(),
    });

    setContactMessage("");
    Alert.alert(
      "Ticket créé",
      "Votre ticket support a été créé. Vous pouvez suivre son état dans 'Mes tickets'."
    );

    // 🔹 redirection vers la page de suivi entreprise
    router.push("/entreprise/mes_tickets");
  } catch (e) {
    console.log("Erreur contact entreprise :", e);
    Alert.alert("Erreur", "Impossible de créer le ticket pour le moment.");
  } finally {
    setSendingContact(false);
  }
};

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* LOGO */}
        <Image
          source={require("../../assets/images/roomly-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* ------------------ KPIs ------------------ */}
        <Text style={styles.sectionTitle}>Tableau de bord</Text>

        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{kpis.today}</Text>
            <Text style={styles.kpiLabel}>
              Réservations aujourd&apos;hui
            </Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{kpis.monthly} €</Text>
            <Text style={styles.kpiLabel}>Revenus du mois</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{kpis.occupancy}%</Text>
            <Text style={styles.kpiLabel}>Taux d&apos;occupation</Text>
          </View>
        </View>

        {/* ------------------ BOUTONS ACTION (remontés) ------------------ */}
        <View style={styles.buttonsContainer}>
          <Pressable
            style={styles.mainButton}
            onPress={() => router.push("/entreprise/publier_espace")}
          >
            <Text style={styles.mainButtonText}>Publier un nouvel espace</Text>
          </Pressable>

          <Pressable
            style={styles.mainButton}
            onPress={() => router.push("/entreprise/gerer_annonces")}
          >
            <Text style={styles.mainButtonText}>Gérer mes annonces</Text>
          </Pressable>

          <Pressable
            style={styles.mainButton}
            onPress={() => router.push("/entreprise/mes_reservations")}
          >
            <Text style={styles.mainButtonText}>Toutes les réservations</Text>
          </Pressable>
        </View>

        {/* ------------------ NOUVELLES RÉSERVATIONS ------------------ */}
        <Text style={styles.sectionTitle}>Nouvelles réservations</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#3E7CB1" />
        ) : reservations.length === 0 ? (
          <Text style={styles.emptyText}>Aucune réservation.</Text>
        ) : (
          reservations.slice(0, 3).map((r) => (
            <View key={r.id} style={styles.resaCard}>
              <Text style={styles.resaTitle}>📍 {r.date}</Text>

              <Text style={{ fontWeight: "600" }}>
                Réservé par :{" "}
                <Text style={{ color: "#3E7CB1" }}>{r.userName}</Text>
              </Text>

              <Text>Bureau : {r.espaceId}</Text>
              <Text>Créneaux : {r.slots.join(", ")}</Text>
              <Text>Total : {r.total} €</Text>
            </View>
          ))
        )}

        {/* ------------------ RÉSERVATIONS À VENIR ------------------ */}
        <Text style={styles.sectionTitle}>Prochaines réservations</Text>

        {upcoming.length === 0 ? (
          <Text style={styles.emptyText}>Aucune réservation à venir.</Text>
        ) : (
          upcoming.map((r) => (
            <View key={r.id} style={styles.resaCard}>
              <Text style={styles.resaTitle}>{r.date}</Text>

              <Text style={{ fontWeight: "600" }}>
                Réservé par :{" "}
                <Text style={{ color: "#3E7CB1" }}>{r.userName}</Text>
              </Text>

              <Text>Créneaux : {r.slots.join(", ")}</Text>
              <Text>Total : {r.total} €</Text>
            </View>
          ))
        )}

        {/* ------------------ SUPPORT & AIDE (contact + FAQ + tickets) ------------------ */}
        <Text style={styles.sectionTitle}>Support & aide</Text>

        <View style={styles.supportCard}>
          <Text style={styles.supportTitle}>Contacter Roomly</Text>
          <Text style={styles.supportText}>
            Une question sur vos espaces, vos réservations ou la facturation ?
            Envoyez-nous un message, l’équipe Roomly vous répondra par e-mail.
          </Text>

          <TextInput
            style={styles.contactInput}
            placeholder="Votre adresse e-mail"
            placeholderTextColor="#777"
            value={contactEmail}
            onChangeText={setContactEmail}
            keyboardType="email-address"
          />

          <TextInput
            style={styles.contactMessageInput}
            placeholder="Votre message..."
            placeholderTextColor="#777"
            value={contactMessage}
            onChangeText={setContactMessage}
            multiline
          />

          <Pressable
  style={[
    styles.contactButton,
    sendingContact && { opacity: 0.6 },
  ]}
  onPress={handleSendContact}
  disabled={sendingContact}
>
  {sendingContact ? (
    <ActivityIndicator color="#fff" />
  ) : (
    <Text style={styles.contactButtonText}>Créer un ticket support</Text>
  )}
</Pressable>


          <View style={styles.supportLinksRow}>
            <Pressable
              style={styles.faqLinkButton}
              onPress={() => router.push("/entreprise/faq_entreprise")}
            >
              <Text style={styles.faqLinkText}>FAQ entreprise</Text>
            </Pressable>

            <Pressable
              style={styles.faqLinkButton}
              onPress={() => router.push("/entreprise/mes_tickets")}
            >
              <Text style={styles.faqLinkText}>Mes tickets</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <BottomNavBarEntreprise activeTab="menu" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },

  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },

  logo: {
    width: 200,
    height: 80,
    alignSelf: "center",
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 15,
    marginBottom: 10,
  },

  /* KPI */
  kpiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  kpiCard: {
    width: "30%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
    color: "#3E7CB1",
  },
  kpiLabel: {
    textAlign: "center",
    fontSize: 12,
    color: "#555",
  },

  /* Reservations */
  resaCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  resaTitle: {
    fontWeight: "700",
    marginBottom: 4,
  },

  emptyText: {
    color: "#555",
    marginBottom: 10,
  },

  /* Boutons actions */
  buttonsContainer: {
    marginTop: 10,
    marginBottom: 10,
    width: "100%",
    alignItems: "center",
  },
  mainButton: {
    width: "85%",
    backgroundColor: "#3E7CB1",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  mainButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  /* Support & contact */
  supportCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 5,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  supportText: {
    fontSize: 13,
    color: "#555",
    marginBottom: 10,
  },
  contactInput: {
    backgroundColor: "#D9D9D9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 8,
  },
  contactMessageInput: {
    backgroundColor: "#D9D9D9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  contactButton: {
    backgroundColor: "#1E6091",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  contactButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  supportLinksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  faqLinkButton: {
    paddingVertical: 4,
  },
  faqLinkText: {
    color: "#1E6091",
    fontWeight: "600",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
