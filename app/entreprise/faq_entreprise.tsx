// app/entreprise/faq_entreprise.tsx
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
import BottomNavBarEntreprise from "../../components/BottomNavBarEntreprise";

// Active les animations de layout sur Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

const FAQ_ENTREPRISE: FaqItem[] = [
  {
    id: "1",
    question: "Comment publier un nouvel espace sur Roomly ?",
    answer:
      "Depuis le menu principal entreprise, clique sur \"Publier un nouvel espace\". Ajoute les photos, la localisation, la capacité, le prix horaire et les créneaux de disponibilité, puis envoie l’annonce pour validation.",
  },
  {
    id: "2",
    question: "Comment modifier ou supprimer une annonce existante ?",
    answer:
      "Rends-toi dans \"Gérer mes annonces\". Tu peux y modifier les informations d’un espace (description, prix, créneaux, images) ou le supprimer définitivement.",
  },
  {
    id: "3",
    question: "Que signifie le statut \"en attente de validation\" ?",
    answer:
      "Lorsque tu publies ou modifies un espace, il repasse en \"en attente de validation\". L’administrateur Roomly vérifie ton annonce avant qu’elle soit de nouveau visible pour les utilisateurs.",
  },
  {
    id: "4",
    question: "Comment fonctionne l’option premium \"Top listing\" ?",
    answer:
      "Tu peux booster un espace pour 24h, 3 jours ou 7 jours. Pendant cette période, l’annonce est mise en avant dans la liste des espaces chez les utilisateurs, avec un badge \"Top listing\".",
  },
  {
    id: "5",
    question: "Comment suivre mes réservations et mes revenus ?",
    answer:
      "La page d’accueil entreprise affiche un tableau de bord avec les réservations du jour, les revenus du mois et un taux d’occupation. Tu peux aussi cliquer sur \"Toutes les réservations\" pour voir le détail.",
  },
  {
    id: "6",
    question: "Comment contacter Roomly en cas de problème ?",
    answer:
      "En bas de la page d’accueil entreprise, tu peux nous écrire via le formulaire de contact. Ton message sera transmis à l’équipe Roomly côté administrateur.",
  },
];

export default function FaqEntrepriseScreen() {
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

        <Text style={styles.title}>FAQ Entreprise</Text>
        <Text style={styles.subtitle}>
          Questions fréquentes pour la gestion de vos espaces et réservations.
        </Text>

        {/* LISTE FAQ */}
        {FAQ_ENTREPRISE.map((item) => {
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
          <Text style={styles.footerTitle}>Besoin d’aide supplémentaire ?</Text>
          <Text style={styles.footerText}>
            Utilise le formulaire de contact sur la page d’accueil entreprise pour
            nous envoyer un message. Nous reviendrons vers toi par e-mail.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <BottomNavBarEntreprise activeTab="menu" />
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
