import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import BottomNavBar from "../../components/BottomNavBar";

export default function ConditionsAssuranceScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Logo */}
        <Image
          source={require("../../assets/images/roomly-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Text style={styles.backText}>‹   Mentions légales & assurance</Text>
        </Pressable>

        <View style={styles.separator} />

        {/* ================= MENTIONS LÉGALES ================= */}

        <Text style={styles.title}>Mentions légales</Text>

        <Text style={styles.paragraph}>
          Roomly est une plateforme de mise en relation permettant la
          réservation et la location ponctuelle d’espaces de travail entre
          entreprises et utilisateurs.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Dénomination légale :</Text> Roomly SRL
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Siège social :</Text> Avenue Louise 123,
          1050 Bruxelles — Belgique
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Numéro d’entreprise / TVA :</Text>{" "}
          BE0123.456.789
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>E-mail :</Text> contact@roomly.be
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Téléphone :</Text> +32 2 123 45 67
        </Text>

        <Text style={styles.paragraph}>
          Les entreprises publiant des annonces sur Roomly restent seules
          responsables des informations qu’elles diffusent ainsi que de la
          conformité, sécurité et accessibilité des espaces mis à disposition.
        </Text>

        <Text style={styles.paragraph}>
          Roomly agit en qualité d’intermédiaire technique et n’est pas partie
          au contrat de location conclu entre l’utilisateur et l’entreprise.
        </Text>

        <View style={styles.separator} />

        {/* ================= CONDITIONS D’ASSURANCE ================= */}

        <Text style={styles.title}>Conditions d’assurance Roomly</Text>

        <Text style={styles.paragraph}>
          Les présentes conditions résument le fonctionnement de l’assurance
          liée à la réservation d’un espace via Roomly. Elles ont pour objectif
          d’informer clairement l’utilisateur avant la finalisation du paiement.
        </Text>

        <Text style={styles.subtitle}>1. Objet de la couverture</Text>
        <Text style={styles.paragraph}>
          L’assurance couvre les dommages matériels causés à l’espace de travail
          réservé, ainsi qu’au mobilier mis à disposition par l’entreprise
          (bureaux, chaises, écrans, etc.), lorsque ces dommages résultent d’un
          usage normal et raisonnable des lieux pendant la durée de la
          réservation.
        </Text>

        <Text style={styles.subtitle}>2. Exclusions principales</Text>
        <Text style={styles.paragraph}>
          L’assurance ne couvre notamment pas :
        </Text>
        <Text style={styles.bullet}>
          • Les dommages intentionnels ou frauduleux.
        </Text>
        <Text style={styles.bullet}>
          • Les dégradations résultant d’un usage manifestement inadapté des
          locaux (fête, activité non professionnelle, etc.).
        </Text>
        <Text style={styles.bullet}>
          • Les biens personnels de l’utilisateur (ordinateur, téléphone,
          sac, etc.).
        </Text>
        <Text style={styles.bullet}>
          • Les dommages survenus en dehors des créneaux horaires réservés.
        </Text>

        <Text style={styles.subtitle}>3. Obligations de l’utilisateur</Text>
        <Text style={styles.paragraph}>
          En acceptant les conditions d’assurance, l’utilisateur s’engage à :
        </Text>
        <Text style={styles.bullet}>
          • Respecter les règles internes de l’entreprise (accueil, sécurité,
          accès).
        </Text>
        <Text style={styles.bullet}>
          • Utiliser l’espace de manière prudente et professionnelle.
        </Text>
        <Text style={styles.bullet}>
          • Signaler immédiatement à l’entreprise tout incident ou dommage
          constaté pendant la réservation.
        </Text>

        <Text style={styles.subtitle}>4. Déclaration d’incident</Text>
        <Text style={styles.paragraph}>En cas de dommage :</Text>
        <Text style={styles.bullet}>
          • L’utilisateur informe l’entreprise sur place ou via les canaux de
          contact fournis.
        </Text>
        <Text style={styles.bullet}>
          • L’entreprise décrit l’incident à Roomly, qui pourra demander des
          informations ou preuves complémentaires (photos, description, etc.).
        </Text>

        <Text style={styles.paragraph}>
          Selon la nature de l’incident, une participation financière
          (franchise) peut être demandée à l’utilisateur.
        </Text>

        <Text style={styles.subtitle}>5. Limitation de responsabilité</Text>
        <Text style={styles.paragraph}>
          Roomly agit comme plateforme de mise en relation entre l’utilisateur
          et l’entreprise. La couverture d’assurance est limitée aux conditions
          définies par le contrat d’assurance souscrit par Roomly ou
          l’entreprise. En cas de litige, la responsabilité de Roomly est
          limitée aux montants effectivement couverts par ce contrat.
        </Text>

        <Text style={styles.subtitle}>6. Acceptation des conditions</Text>
        <Text style={styles.paragraph}>
          En cochant la case « J’ai lu et j’accepte les conditions d’assurance »
          sur l’écran de paiement, l’utilisateur reconnaît avoir pris
          connaissance des présentes conditions et les accepter pour la
          réservation en cours.
        </Text>

        <Text style={styles.footer}>
          Version MVP — ces conditions sont fournies à titre informatif dans le
          cadre du prototype Roomly.
        </Text>

        <View style={{ height: 120 }} />
      </ScrollView>

      <BottomNavBar activeTab="menu" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },
  content: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 140,
  },
  logo: {
    width: 160,
    height: 70,
    alignSelf: "center",
    marginBottom: 15,
  },
  backRow: {
    marginBottom: 10,
  },
  backText: {
    fontSize: 20,
    fontWeight: "700",
  },
  separator: {
    height: 1,
    backgroundColor: "#000",
    marginVertical: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 14,
    color: "#333",
    marginBottom: 6,
  },
  bullet: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
    paddingLeft: 10,
  },
  bold: {
    fontWeight: "700",
  },
  footer: {
    marginTop: 18,
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
});
