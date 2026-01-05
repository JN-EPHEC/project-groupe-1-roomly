// app/user/faq.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Image,
    LayoutAnimation,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    UIManager,
    View,
} from "react-native";
import BottomNavBar from "../../components/BottomNavBar";

// Pour activer les animations sur Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

const FAQ_DATA: FaqItem[] = [
  {
    id: "1",
    question: "Comment réserver un espace sur Roomly ?",
    answer:
      "Depuis le menu principal, choisis un espace dans la liste ou via la carte, puis clique sur \"Réserver un créneau horaire\". Sélectionne la date, les heures souhaitées et confirme la réservation.",
  },
  {
    id: "2",
    question: "Comment annuler ou modifier une réservation ?",
    answer:
      "Rends-toi dans \"Mes réservations\" via le menu principal. Sélectionne la réservation concernée pour voir les options disponibles (modification, annulation, etc.), selon les conditions de l’espace.",
  },
  {
    id: "3",
    question: "Comment fonctionne le paiement ?",
    answer:
      "Le prix est indiqué en €/h pour chaque espace. Au moment de la réservation, le montant total est calculé en fonction de la durée choisie. Le paiement se fait via les moyens proposés dans l’application (démo dans cette version).",
  },
  {
    id: "4",
    question: "Que signifie le badge \"Top listing\" sur un espace ?",
    answer:
      "Le badge \"Top listing\" indique qu’une entreprise a activé l’option premium pour mettre temporairement son espace en avant. Ces annonces apparaissent en tête de liste pendant la durée du boost.",
  },
  {
    id: "5",
    question: "Comment contacter Roomly en cas de problème ?",
    answer:
      "Depuis la page d’accueil utilisateur, tu peux utiliser le formulaire de contact. Indique ton adresse e-mail et ton message : l’équipe Roomly recevra directement ta demande côté administrateur.",
  },
  {
    id: "6",
    question: "Comment sont gérés les avis et les notes ?",
    answer:
      "Après une réservation, tu peux laisser un avis et une note sur l’espace utilisé. La note moyenne et le nombre d’avis sont visibles sur la page de détails de chaque espace.",
  },
];

export default function FaqScreen() {
  const router = useRouter();
  const [openIds, setOpenIds] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const isOpen = (id: string) => openIds.includes(id);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* HEADER */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </Pressable>

          <Image
            source={require("../../assets/images/roomly-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>FAQ</Text>
        <Text style={styles.subtitle}>
          Retrouve ici les réponses aux questions les plus fréquentes.
        </Text>

        {/* FAQ LIST */}
        {FAQ_DATA.map((item) => {
          const open = isOpen(item.id);
          return (
            <View key={item.id} style={styles.card}>
              <Pressable
                style={styles.questionRow}
                onPress={() => toggleItem(item.id)}
              >
                <Text style={styles.questionText}>{item.question}</Text>
                <Ionicons
                  name={open ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#1E6091"
                />
              </Pressable>

              {open && (
                <View style={styles.answerContainer}>
                  <Text style={styles.answerText}>{item.answer}</Text>
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.footerBox}>
          <Text style={styles.footerTitle}>Tu n’as pas trouvé ta réponse ?</Text>
          <Text style={styles.footerText}>
            Tu peux nous écrire directement via le formulaire de contact sur la
            page d’accueil. Nous te répondrons par e-mail.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <BottomNavBar activeTab="menu" />
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

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  logo: {
    width: 130,
    height: 50,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 4,
    color: "#0B2038",
  },
  subtitle: {
    fontSize: 14,
    color: "#4A4A4A",
    marginBottom: 18,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },

  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#0B2038",
    marginRight: 8,
  },

  answerContainer: {
    marginTop: 8,
  },
  answerText: {
    fontSize: 14,
    color: "#333",
  },

  footerBox: {
    marginTop: 20,
    backgroundColor: "#DDE7F7",
    borderRadius: 14,
    padding: 12,
  },
  footerTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
    color: "#0B2038",
  },
  footerText: {
    fontSize: 13,
    color: "#23395B",
  },
});
