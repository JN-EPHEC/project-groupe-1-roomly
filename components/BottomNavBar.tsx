// components/BottomNavBar.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

type BottomNavBarProps = {
  activeTab: "menu" | "message" | "favoris" | "settings" | "profile"; // les 5 icônes possibles
};

export default function BottomNavBar({ activeTab }: BottomNavBarProps) {
  const router = useRouter();

  const icons = [
    { key: "menu", name: "home-outline", route: "/user/home_utilisateur" },
    { key: "message", name: "chatbubble-outline", route: "/user/messages_utilisateur" },
    { key: "favoris", name: "heart-outline", route: "/user/favoris" },
    { key: "settings", name: "build-outline", route: "/user/services" },
    { key: "profile", name: "person-outline", route: "/user/profile" },
  ];

  return (
    <View style={styles.navContainer}>
      {icons.map((icon, index) => {
        const isActive = icon.key === activeTab;
        return (
          <Pressable key={index} onPress={() => router.push(icon.route as any)}>
            <Ionicons
              name={icon.name as keyof typeof Ionicons.glyphMap}
              size={30}
              color={isActive ? "#F49B0B" : "#3E7CB1"}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    paddingVertical: 10,
    backgroundColor: "#EEF3F8",
    borderTopWidth: 1,
    borderColor: "#D0D0D0",
    position: "absolute",
    bottom: 0,
  },
});
