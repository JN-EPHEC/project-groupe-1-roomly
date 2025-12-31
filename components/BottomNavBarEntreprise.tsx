// components/BottomNavBarEntreprise.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type BottomNavBarProps = {
  activeTab: "menu" | "message" | "annonces" | "profile";
};

export default function BottomNavBarEntreprise({ activeTab }: BottomNavBarProps) {
  const router = useRouter();

  const tabs = [
    {
      key: "menu",
      icon: "home-outline",
      label: "Accueil",
      route: "/entreprise/home_entreprise",
    },
    {
      key: "message",
      icon: "chatbubble-outline",
      label: "Messages",
      route: "/entreprise/messages_entreprise",
    },
    {
      key: "annonces",
      icon: "build-outline",
      label: "Annonces",
      route: "/entreprise/gerer_annonces",
    },
    {
      key: "profile",
      icon: "person-outline",
      label: "Profil",
      route: "/entreprise/profil_entreprise",
    },
  ];

  return (
    <View style={styles.navContainer}>
      {tabs.map((tab) => {
        const active = tab.key === activeTab;

        return (
          <Pressable key={tab.key} style={styles.tab} onPress={() => router.push(tab.route as any)}>
            <Ionicons
              name={tab.icon as any}
              size={28}
              color={active ? "#F49B0B" : "#3E7CB1"}
            />
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
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
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: "#D0D0D0",
  },
  tab: {
    alignItems: "center",
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
