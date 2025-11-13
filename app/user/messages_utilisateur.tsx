import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import BottomNavBar from "../../components/BottomNavBar";

export default function MessagesScreen() {
  const [search, setSearch] = useState("");

  const messages = [
    { id: 1, user: "Nom utilisateur", bureau: "Nom du bureau + localisation du bureau", time: "Il y a 1h", unread: true },
    { id: 2, user: "Daniel", bureau: "Bureau central + Bruxelles", time: "Il y a 1h", unread: true },
    { id: 3, user: "Nom utilisateur", bureau: "Nom du bureau + localisation du bureau", time: "Il y a 1h", unread: false },
    { id: 4, user: "Nom utilisateur", bureau: "Nom du bureau + localisation du bureau", time: "Il y a 1h", unread: false },
    { id: 5, user: "Nom utilisateur", bureau: "Nom du bureau + localisation du bureau", time: "Il y a 1h", unread: false },
  ];

  // 🔍 Filtrage en fonction du texte tapé dans la barre
  const filteredMessages = messages.filter((msg) =>
    msg.user.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo */}
        <Image
          source={require("../../assets/images/roomly-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#555" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#666"
          />
        </View>

        {/* Titre */}
        <Text style={styles.title}>Messages ({filteredMessages.length})</Text>

        {/* Liste des messages */}
        {filteredMessages.map((msg) => (
          <View
            key={msg.id}
            style={[styles.messageCard, msg.unread && styles.unreadMessage]}
          >
            <View style={styles.row}>
              <View style={styles.avatar} />
              <View style={styles.messageInfo}>
                <Text style={styles.username}>{msg.user}</Text>
                <Text style={styles.subtitle}>{msg.bureau}</Text>
              </View>
              <Text style={styles.time}>{msg.time}</Text>
            </View>

            <Image
              source={require("../../assets/images/bureau_exemple.jpg")}
              style={styles.officeImage}
              resizeMode="cover"
            />
          </View>
        ))}

        <View style={{ height: 80 }} /> {/* espace bas pour la nav bar */}
      </ScrollView>

      {/* ✅ Barre de navigation en bas */}
      <BottomNavBar activeTab="message" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF3F8",
    alignItems: "center",
  },
  scrollContent: {
    alignItems: "center",
    paddingVertical: 20,
    paddingBottom: 120,
  },
  logo: {
    width: 160,
    height: 80,
    marginTop: 20,
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D9D9D9",
    borderRadius: 20,
    width: "85%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#000",
    width: "90%",
    marginBottom: 12,
  },
  messageCard: {
    backgroundColor: "#D9D9D9",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    width: "90%",
  },
  unreadMessage: {
    backgroundColor: "#BFD9F1",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 50,
    backgroundColor: "#000",
    marginRight: 10,
  },
  messageInfo: {
    flex: 1,
    justifyContent: "center",
  },
  username: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  subtitle: {
    fontSize: 13,
    color: "#333",
  },
  time: {
    fontSize: 12,
    color: "#444",
  },
  officeImage: {
    width: 90,
    height: 60,
    borderRadius: 6,
    marginTop: 8,
    marginLeft: 50,
  },
});
