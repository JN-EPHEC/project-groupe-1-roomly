// components/BottomNavBarEntreprise.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type BottomNavBarProps = {
  activeTab: "menu" | "message" | "favoris" | "settings" | "profile";
};

export default function BottomNavBarEntreprise({ activeTab }: BottomNavBarProps) {
  const router = useRouter();

  const tabs = [
    { key: "menu", name: "home-outline", label: "Accueil", route: "/entreprise/home_entreprise" },
    { key: "message", name: "chatbubble-outline", label: "Messages", route: "/entreprise/messages_entreprise" },
    { key: "favoris", name: "heart-outline", label: "Favoris", route: "/entreprise/favoris" },
    { key: "settings", name: "build-outline", label: "Services", route: "/entreprise/services" },
    { key: "profile", name: "person-outline", label: "Profil", route: "/entreprise/profile" },
  ];

  return (
    <View style={styles.navContainer}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Pressable key={tab.key} style={styles.tab} onPress={() => router.push(tab.route as any)}>
            <Ionicons
              name={tab.name as any}
              size={28}
              color={isActive ? "#F49B0B" : "#3E7CB1"}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#EEF3F8",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: "#D0D0D0",
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    color: "#3E7CB1",
    marginTop: 3,
  },
  labelActive: {
    color: "#F49B0B",
    fontWeight: "600",
  },
});
