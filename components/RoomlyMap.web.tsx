import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function RoomlyMap() {
  return (
    <View style={[StyleSheet.absoluteFillObject, styles.center]}>
      <Text style={{ color: "#555", textAlign: "center" }}>
        La carte n’est pas disponible sur la version Web.
        {"\n"}Ouvre l’app sur mobile (iOS / Android).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: "center", alignItems: "center", padding: 14 },
});
