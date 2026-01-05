// app/user/confidentialite.tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import BottomNavBar from "../../components/BottomNavBar";
import PrivacyPreferences from "../../components/PrivacyPreferences";

export default function ConfidentialiteUtilisateur() {
  return (
    <View style={styles.container}>
      {/* Contenu confidentialité (scroll géré dans PrivacyPreferences) */}
      <PrivacyPreferences />

      {/* Navbar utilisateur */}
      <BottomNavBar activeTab="profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },
});
