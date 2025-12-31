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

export default function CGUScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </Pressable>
        <Text style={styles.title}>Conditions Générales d’Utilisation</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>1. Objet de Roomly</Text>
        <Text style={styles.paragraph}>
          Roomly est une plateforme permettant à des entreprises de proposer
          des espaces de travail et à des utilisateurs de réserver ces espaces.
          Les présentes Conditions Générales d’Utilisation (CGU) définissent le
          cadre d’utilisation de l’application par les entreprises et les
          utilisateurs.
        </Text>

        <Text style={styles.sectionTitle}>2. Création de compte</Text>
        <Text style={styles.paragraph}>
          Pour utiliser Roomly, vous devez créer un compte avec une adresse
          e-mail valide et un mot de passe. Vous êtes responsable de la
          confidentialité de vos identifiants et de toutes les actions
          réalisées avec votre compte.
        </Text>

        <Text style={styles.sectionTitle}>3. Réservations et annulations</Text>
        <Text style={styles.paragraph}>
          Toute réservation d’espace via Roomly peut être soumise à des
          conditions spécifiques définies par l’entreprise (politique
          d’annulation, horaires, règles internes…). L’utilisateur s’engage à
          respecter ces règles lors de l’utilisation de l’espace réservé.
        </Text>

        <Text style={styles.sectionTitle}>4. Comportement des utilisateurs</Text>
        <Text style={styles.paragraph}>
          Il est interdit d’utiliser Roomly ou les espaces réservés à des fins
          illégales, nuisibles ou contraires à l’ordre public. Roomly se
          réserve le droit de suspendre ou de supprimer tout compte en cas
          d’abus manifeste.
        </Text>

        <Text style={styles.sectionTitle}>5. Données personnelles</Text>
        <Text style={styles.paragraph}>
          Les données collectées via Roomly sont utilisées uniquement pour la
          gestion des comptes, des réservations et l’amélioration du service.
          Conformément à la réglementation en vigueur, vous pouvez demander
          l’accès, la rectification ou la suppression de vos données personnelles.
        </Text>

        <Text style={styles.sectionTitle}>6. Limitation de responsabilité</Text>
        <Text style={styles.paragraph}>
          Roomly met tout en œuvre pour assurer le bon fonctionnement de la
          plateforme, mais ne peut garantir l’absence totale d’erreurs ou
          d’interruptions. Roomly n’est pas responsable des dommages causés
          par une mauvaise utilisation de l’application ou des espaces mis à
          disposition par les entreprises.
        </Text>

        <Text style={styles.sectionTitle}>7. Modification des CGU</Text>
        <Text style={styles.paragraph}>
          Roomly peut modifier les présentes CGU à tout moment. La version
          mise à jour sera disponible dans l’application. En continuant
          d’utiliser Roomly après une modification, vous acceptez les nouvelles
          conditions.
        </Text>

        <Text style={styles.sectionTitle}>8. Contact</Text>
        <Text style={styles.paragraph}>
          Pour toute question concernant ces CGU ou vos données, vous pouvez
          contacter l’équipe Roomly dans le cadre du projet EPHEC.
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
    paddingTop: 50,
    paddingHorizontal: 16,
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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 13,
    color: "#444",
    lineHeight: 18,
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