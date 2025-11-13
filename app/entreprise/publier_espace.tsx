import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import BottomNavBarEntreprise from "../../components/BottomNavBarEntreprise";

export default function PublierEspaceScreen() {
  const [description, setDescription] = useState("");
  const [localisation, setLocalisation] = useState("");
  const [capacite, setCapacite] = useState("");
  const [prix, setPrix] = useState("");
  const [materiel, setMateriel] = useState("");

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* LOGO */}
        <Image
          source={require("../../assets/images/roomly-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* AJOUT D'IMAGES */}
        <Text style={styles.sectionTitle}>Ajouter des images</Text>

        <View style={styles.imagesRow}>
          <View style={styles.imageBox}>
            <Ionicons name="add-outline" size={40} color="#555" />
          </View>
          <View style={styles.imageBox}>
            <Ionicons name="add-outline" size={40} color="#555" />
          </View>
          <View style={styles.imageBox}>
            <Ionicons name="add-outline" size={40} color="#555" />
          </View>
        </View>

        {/* FORM */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.inputLarge]}
          placeholder="..."
          placeholderTextColor="#777"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>Localisation</Text>
        <TextInput
          style={styles.input}
          placeholder="..."
          placeholderTextColor="#777"
          value={localisation}
          onChangeText={setLocalisation}
        />

        <Text style={styles.label}>Capacité</Text>
        <TextInput
          style={styles.input}
          placeholder="1 - 100"
          placeholderTextColor="#777"
          value={capacite}
          onChangeText={setCapacite}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Prix</Text>
        <TextInput
          style={styles.input}
          placeholder="-$"
          placeholderTextColor="#777"
          value={prix}
          onChangeText={setPrix}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Matériel à disposition :</Text>
        <TextInput
          style={[styles.inputLarge]}
          placeholder="- wifi{'\n'}- écran{'\n'}- ..."
          placeholderTextColor="#777"
          value={materiel}
          onChangeText={setMateriel}
          multiline
        />

        {/* BOUTON PUBLIER */}
        <Pressable style={styles.publishButton}>
          <Text style={styles.publishText}>Publier</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </Pressable>

        <View style={{ height: 120 }} />

      </ScrollView>

      <BottomNavBarEntreprise activeTab="settings" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF3F8",
    width: "100%",
  },

  scrollContent: {
    paddingTop: 20,
    paddingBottom: 140,
    alignItems: "center",
  },

  logo: {
    width: 180,
    height: 80,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    width: "90%",
    color: "#000",
    marginBottom: 10,
  },

  imagesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginBottom: 25,
  },

  imageBox: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: "#D9D9D9",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  label: {
    width: "90%",
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },

  input: {
    width: "90%",
    backgroundColor: "#D9D9D9",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
    marginBottom: 20,
  },

  inputLarge: {
    width: "90%",
    minHeight: 90,
    backgroundColor: "#D9D9D9",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
    marginBottom: 20,
    textAlignVertical: "top",
  },

  publishButton: {
    width: "60%",
    backgroundColor: "#3E7CB1",
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  publishText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
});
