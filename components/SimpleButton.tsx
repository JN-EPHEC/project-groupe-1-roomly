import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

export default function SimpleButton() {
  const [clicked, setClicked] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.button, clicked ? styles.on : styles.off]}
      onPress={() => setClicked(!clicked)}
    >
      <Text style={styles.text}>{clicked ? "ON" : "OFF"}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: "center",
  },
  on: {
    backgroundColor: "green",
  },
  off: {
    backgroundColor: "red",
  },
  text: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
