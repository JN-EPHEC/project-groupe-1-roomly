// app/admin/profil_utilisateur/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { db } from "../../../firebaseConfig";

type UserData = {
  name?: string;
  email?: string;
  type?: string;
  phone?: string;
  job?: string;
  city?: string;
  createdAt?: any;
  avatarUrl?: string;
};

export default function AdminProfilUtilisateur() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const snap = await getDoc(doc(db, "users", id as string));
        if (snap.exists()) {
          const data: any = snap.data();
          setUser({
            name: data.name || data.displayName || "",
            email: data.email || data.userEmail || "",
            type: data.type,
            phone: data.phone || data.telephone || "",
            job: data.job || data.metier || "",
            city: data.city || data.ville || "",
            createdAt: data.createdAt || null,
            avatarUrl: data.photoURL || data.avatarUrl || "",
          });
        } else {
          setUser(null);
        }
      } catch (e) {
        console.log("Erreur chargement user (admin) :", e);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [id]);

  const formatDate = (ts: any) => {
    if (!ts) return "-";
    try {
      if (ts.toDate) {
        const d = ts.toDate();
        return d.toLocaleDateString("fr-FR");
      }
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("fr-FR");
      }
      return "-";
    } catch {
      return "-";
    }
  };

  const handleContact = () => {
    if (!user?.email) return;
    const url = `mailto:${user.email}`;
    Linking.openURL(url).catch((err) =>
      console.log("Erreur ouverture mailto :", err)
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3E7CB1" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Pressable
          style={{ position: "absolute", top: 50, left: 20 }}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={26} color="#000" />
        </Pressable>
        <Text>Utilisateur introuvable.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* HEADER */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color="#000" />
          </Pressable>

          <Text style={styles.headerTitle}>Profil utilisateur</Text>

          <Image
            source={require("../../../assets/images/roomly-logo.png")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>

        {/* CARTE PROFIL */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            {user.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={40} color="#fff" />
              </View>
            )}

            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.name}>{user.name || "Utilisateur"}</Text>
              <Text style={styles.email}>{user.email || "-"}</Text>

              {user.type ? (
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{user.type}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* INFOS DETAILLEES */}
        <View style={styles.infoCard}>
          {/* Téléphone */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconCircle}>
              <Ionicons name="call-outline" size={20} color="#184E77" />
            </View>
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoLabel}>Téléphone</Text>
              <Text style={styles.infoValue}>{user.phone || "-"}</Text>
            </View>
          </View>

          {/* Métier */}
          <View style={styles.separator} />
          <View style={styles.infoRow}>
            <View style={styles.infoIconCircle}>
              <Ionicons name="briefcase-outline" size={20} color="#184E77" />
            </View>
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoLabel}>Métier</Text>
              <Text style={styles.infoValue}>{user.job || "-"}</Text>
            </View>
          </View>

          {/* Ville */}
          <View style={styles.separator} />
          <View style={styles.infoRow}>
            <View style={styles.infoIconCircle}>
              <Ionicons name="location-outline" size={20} color="#184E77" />
            </View>
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoLabel}>Ville</Text>
              <Text style={styles.infoValue}>{user.city || "-"}</Text>
            </View>
          </View>

          {/* Inscrit depuis */}
          <View style={styles.separator} />
          <View style={styles.infoRow}>
            <View style={styles.infoIconCircle}>
              <Ionicons name="calendar-outline" size={20} color="#184E77" />
            </View>
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoLabel}>Inscrit depuis</Text>
              <Text style={styles.infoValue}>
                {formatDate(user.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* BOUTON CONTACT */}
        {user.email ? (
          <Pressable style={styles.contactButton} onPress={handleContact}>
            <Ionicons name="mail-outline" size={20} color="#fff" />
            <Text style={styles.contactButtonText}>
              Contacter par email
            </Text>
          </Pressable>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

/* ------------ STYLES ------------ */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EEF3F8",
  },
  content: {
    alignItems: "center",
    paddingBottom: 40,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    marginTop: 40,
    marginBottom: 20,
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 10,
  },
  headerLogo: {
    width: 80,
    height: 32,
  },

  profileCard: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 999,
  },
  avatarPlaceholder: {
    backgroundColor: "#3E7CB1",
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  email: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
  },
  typeBadge: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#184E77",
  },
  typeBadgeText: {
    fontSize: 11,
    color: "#184E77",
    fontWeight: "600",
  },

  infoCard: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  infoIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E3EDF7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoTextBlock: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: "#555",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: "#EEE",
    marginLeft: 44,
  },

  contactButton: {
    width: "80%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#184E77",
    borderRadius: 999,
    paddingVertical: 14,
    marginTop: 10,
  },
  contactButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
