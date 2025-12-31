// app/public/nda.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function NDAScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color="#000" />
        </Pressable>
        <Text style={styles.title}>Clause de non-divulgation</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>
          1. Objet de la clause de non-divulgation
        </Text>
        <Text style={styles.paragraph}>
          La présente clause de non-divulgation (&quot;NDA&quot;) encadre la
          confidentialité des informations échangées dans le cadre de
          l’utilisation de la plateforme Roomly, notamment lors de la
          réservation et de l’occupation d’espaces de travail proposés par des
          entreprises partenaires.
        </Text>

        <Text style={styles.sectionTitle}>2. Informations confidentielles</Text>
        <Text style={styles.paragraph}>
          Sont considérées comme confidentielles, sans que cette liste soit
          exhaustive : les informations relatives aux entreprises et à leurs
          locaux (plans, accès, procédures internes, identités des employés),
          les informations techniques ou commerciales, ainsi que toute donnée
          non publique portée à la connaissance de l’utilisateur via Roomly.
        </Text>

        <Text style={styles.sectionTitle}>3. Obligations de l’utilisateur</Text>
        <Text style={styles.paragraph}>
          L’utilisateur s’engage à :
        </Text>
        <Text style={styles.bullet}>
          • ne pas divulguer les informations confidentielles à des tiers ;
        </Text>
        <Text style={styles.bullet}>
          • ne pas utiliser ces informations à d’autres fins que la réservation
          et l’utilisation des espaces via Roomly ;
        </Text>
        <Text style={styles.bullet}>
          • prendre des mesures raisonnables pour protéger la confidentialité
          des informations reçues.
        </Text>

        <Text style={styles.sectionTitle}>
          4. Exceptions à la confidentialité
        </Text>
        <Text style={styles.paragraph}>
          L’obligation de confidentialité ne s’applique pas aux informations
          qui :
        </Text>
        <Text style={styles.bullet}>• sont déjà publiques ;</Text>
        <Text style={styles.bullet}>
          • ont été obtenues légalement auprès d’un tiers non soumis à
          confidentialité ;
        </Text>
        <Text style={styles.bullet}>
          • doivent être divulguées en vertu d’une obligation légale ou d’une
          décision d’une autorité compétente.
        </Text>

        <Text style={styles.sectionTitle}>
          5. Durée de l’obligation de confidentialité
        </Text>
        <Text style={styles.paragraph}>
          L’obligation de confidentialité reste applicable pendant toute la
          durée d’utilisation de la plateforme Roomly et pour une période de
          3 ans à compter de la dernière réservation effectuée par
          l’utilisateur.
        </Text>

        <Text style={styles.sectionTitle}>6. Sanctions</Text>
        <Text style={styles.paragraph}>
          En cas de non-respect de la présente clause, Roomly et/ou les
          entreprises partenaires se réservent le droit de :
        </Text>
        <Text style={styles.bullet}>
          • suspendre ou clôturer le compte de l’utilisateur ;
        </Text>
        <Text style={styles.bullet}>
          • engager toute action légale utile pour obtenir réparation du
          préjudice subi.
        </Text>

        <Text style={styles.sectionTitle}>7. Acceptation</Text>
        <Text style={styles.paragraph}>
          En cochant la case dédiée lors de la création de compte, l’utilisateur
          confirme avoir lu et accepté la présente clause de non-divulgation,
          qui fait partie intégrante des Conditions Générales d’Utilisation de
          Roomly.
        </Text>

        <Pressable style={styles.closeButton} onPress={() => router.back()}>
                  <Text style={styles.closeText}>J’ai compris</Text>
                </Pressable>
      </ScrollView>
    </View> 
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: "#EEF3F8",
  },
  backButton: { width: 32 },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 13,
    color: "#333",
    lineHeight: 18,
  },
  bullet: {
    fontSize: 13,
    color: "#333",
    lineHeight: 18,
    marginLeft: 10,
  },
  closeButton: {
    marginTop: 24,
    alignSelf: "center",
    backgroundColor: "#184E77",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  closeText: {
    color: "#fff",
    fontWeight: "600",
  },
});
