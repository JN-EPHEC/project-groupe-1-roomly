// app/public/mentions_legales_assurance.tsx
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

export default function MentionsLegalesAssuranceScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header avec retour */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </Pressable>
          <Text style={styles.title}>Mentions légales & assurance</Text>
        </View>

        {/* Mentions légales */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mentions légales</Text>

          <Text style={styles.textLine}>
            <Text style={styles.bold}>Dénomination :</Text> Roomly SRL
          </Text>
          <Text style={styles.textLine}>
            <Text style={styles.bold}>Siège social :</Text> Avenue Louise 123,
            1050 Bruxelles, Belgique
          </Text>
          <Text style={styles.textLine}>
            <Text style={styles.bold}>Numéro d’entreprise :</Text>{" "}
            BE0123.456.789
          </Text>
          <Text style={styles.textLine}>
            <Text style={styles.bold}>E-mail :</Text> contact@roomly.be
          </Text>
          <Text style={styles.textLine}>
            <Text style={styles.bold}>Téléphone :</Text> +32 2 123 45 67
          </Text>

          <Text style={[styles.textLine, { marginTop: 10 }]}>
            Roomly met en relation des utilisateurs et des entreprises pour la
            location ponctuelle d’espaces de travail. Les entreprises restent
            seules responsables de la conformité de leurs espaces et des
            informations fournies dans leurs annonces.
          </Text>
        </View>

        {/* Conditions d’assurance */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Conditions d’assurance</Text>

          <Text style={styles.textLine}>
            Les réservations effectuées via Roomly sont couvertes par
            l’assurance responsabilité civile de l’entreprise mettant l’espace à
            disposition, dans les limites prévues par son contrat.
          </Text>

          <Text style={styles.textLine}>
            L’utilisateur s’engage à :
          </Text>
          <Text style={styles.bullet}>
            • utiliser l’espace uniquement pour des activités professionnelles
            calmes (travail de bureau, réunions, etc.) ;
          </Text>
          <Text style={styles.bullet}>
            • respecter les consignes de sécurité et le règlement intérieur de
            l’entreprise ;
          </Text>
          <Text style={styles.bullet}>
            • signaler immédiatement tout incident matériel ou corporel à
            l’entreprise et à Roomly.
          </Text>

          <Text style={[styles.textLine, { marginTop: 10 }]}>
            Ne sont généralement pas couverts : les dommages causés
            intentionnellement, l’usage non conforme de l’espace, les activités
            illégales ou dangereuses, ainsi que les effets personnels de
            l’utilisateur (ordinateur, téléphone, etc.).
          </Text>

          <Text style={[styles.textLine, { marginTop: 10 }]}>
            En finalisant une réservation sur Roomly, l’utilisateur confirme
            avoir pris connaissance de ces conditions d’assurance et les
            accepter.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backBtn: {
    marginRight: 8,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    flexShrink: 1,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  textLine: {
    fontSize: 13,
    color: "#333",
    marginTop: 4,
  },
  bullet: {
    fontSize: 13,
    color: "#333",
    marginTop: 2,
    marginLeft: 8,
  },
  bold: {
    fontWeight: "700",
  },
});
