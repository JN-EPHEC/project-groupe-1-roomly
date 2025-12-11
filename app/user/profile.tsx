// app/user/profile.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { deleteUser } from "firebase/auth";
import { deleteDoc, doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import BottomNavBar from "../../components/BottomNavBar";
import { auth, db } from "../../firebaseConfig";

type UserData = {
  name?: string;
  email?: string;
  type?: string;
  phone?: string;
  city?: string;
  jobTitle?: string;
  bio?: string;
  photoURL?: string;
  createdAt?: any;
};

export default function UserProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);

  // accordéons
  const [openSecurity, setOpenSecurity] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);
  const [openAbout, setOpenAbout] = useState(false);

  useEffect(() => {
    const current = auth.currentUser;
    if (!current) {
      router.replace("/public/login");
      return;
    }

    const unsub = onSnapshot(doc(db, "users", current.uid), (snap) => {
      if (snap.exists()) {
        setUserData(snap.data() as UserData);
      } else {
        setUserData({
          email: current.email || "",
          name: current.displayName || "",
          type: "utilisateur",
        });
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace("/public/login");
    } catch (e) {
      Alert.alert("Erreur", "Impossible de se déconnecter.");
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Supprimer le compte",
      "Cette action est définitive. Toutes vos données Roomly seront supprimées. Continuer ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const current = auth.currentUser;
              if (!current) return;

              const uid = current.uid;

              await deleteDoc(doc(db, "users", uid));
              await deleteUser(current);

              router.replace("/public/login");
            } catch (e: any) {
              console.log("Erreur suppression compte:", e);
              if (e?.code === "auth/requires-recent-login") {
                Alert.alert(
                  "Action impossible",
                  "Reconnectez-vous avant de supprimer votre compte."
                );
              } else {
                Alert.alert(
                  "Erreur",
                  "Impossible de supprimer le compte pour l’instant."
                );
              }
            }
          },
        },
      ]
    );
  };

  const initials = useMemo(() => {
    const n = userData?.name || userData?.email || "";
    if (!n) return "U";
    const parts = n.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [userData]);

  const createdAtText = useMemo(() => {
    const c = userData?.createdAt;
    if (!c) return "-";
    const d = c?.toDate?.() instanceof Date ? c.toDate() : null;
    return d ? d.toLocaleDateString("fr-FR") : "-";
  }, [userData]);

  if (loading || !userData) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3E7CB1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* CONTENU SCROLLABLE */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.topRow}>
          <Text style={styles.screenTitle}>Mon profil</Text>
          <Image
            source={require("../../assets/images/roomly-logo.png")}
            style={styles.logo}
          />
        </View>

        {/* CARTE PROFIL */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            {userData.photoURL ? (
              <Image source={{ uri: userData.photoURL }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}

            <Pressable
              style={styles.editAvatarBtn}
              onPress={() => router.push("/user/edit_profile")}
            >
              <Ionicons name="pencil" size={14} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.nameText}>{userData.name || "Utilisateur"}</Text>
            <Text style={styles.emailText}>{userData.email || "-"}</Text>

            <Pressable
              style={styles.editProfileBtn}
              onPress={() => router.push("/user/edit_profile")}
            >
              <Text style={styles.editProfileText}>Modifier le profil</Text>
            </Pressable>
          </View>
        </View>

        {/* INFOS PRINCIPALES */}
        <View style={styles.sectionCard}>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color="#3E7CB1" />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Téléphone</Text>
              <Text style={styles.rowSubtitle}>
                {userData.phone || "Non renseigné"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={20} color="#3E7CB1" />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Métier</Text>
              <Text style={styles.rowSubtitle}>{userData.jobTitle || "-"}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#3E7CB1" />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Ville</Text>
              <Text style={styles.rowSubtitle}>{userData.city || "-"}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#3E7CB1" />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Inscrit depuis</Text>
              <Text style={styles.rowSubtitle}>{createdAtText}</Text>
            </View>
          </View>
        </View>

        {/* SECTION PARAMÈTRES EN ACCORDÉON */}
        <View style={styles.settingsCard}>
          {/* SÉCURITÉ */}
          <Pressable
            style={styles.settingsRow}
            onPress={() => setOpenSecurity((v) => !v)}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="lock-closed-outline" size={20} color="#3E7CB1" />
              <Text style={styles.rowTitle}>Sécurité</Text>
            </View>
            <Ionicons
              name={openSecurity ? "chevron-up" : "chevron-down"}
              size={18}
              color="#999"
            />
          </Pressable>

          {openSecurity && (
            <View style={styles.subMenu}>
              <Pressable style={styles.subMenuItem}>
                <Text style={styles.subMenuText}>Changer le mot de passe</Text>
              </Pressable>

              <View style={styles.subDivider} />

              <Pressable style={styles.subMenuItem}>
                <Text style={styles.subMenuText}>Réinitialiser le mot de passe</Text>
              </Pressable>

              <View style={styles.subDivider} />

              <Pressable style={styles.subMenuItem}>
                <Text style={styles.subMenuText}>Sessions actives</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.divider} />

          {/* NOTIFICATIONS */}
          <Pressable
            style={styles.settingsRow}
            onPress={() => setOpenNotifications((v) => !v)}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="notifications-outline" size={20} color="#3E7CB1" />
              <Text style={styles.rowTitle}>Notifications</Text>
            </View>
            <Ionicons
              name={openNotifications ? "chevron-up" : "chevron-down"}
              size={18}
              color="#999"
            />
          </Pressable>

          {openNotifications && (
            <View style={styles.subMenu}>
              <Pressable style={styles.subMenuItem}>
                <Text style={styles.subMenuText}>
                  Alertes de nouvelles réservations
                </Text>
              </Pressable>

              <View style={styles.subDivider} />

              <Pressable
                style={styles.subMenuItem}
                onPress={() =>
                  Alert.alert(
                    "Rappels",
                    "Rappels avant le début de la réservation (à implémenter)."
                  )
                }
              >
                <Text style={styles.subMenuText}>
                  Rappels avant la réservation
                </Text>
              </Pressable>
            </View>
          )}

          <View style={styles.divider} />

          {/* HISTORIQUE */}
          <Pressable
            style={styles.settingsRow}
            onPress={() => setOpenHistory((v) => !v)}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="time-outline" size={20} color="#3E7CB1" />
              <Text style={styles.rowTitle}>Historique</Text>
            </View>
            <Ionicons
              name={openHistory ? "chevron-up" : "chevron-down"}
              size={18}
              color="#999"
            />
          </Pressable>

          {openHistory && (
            <View style={styles.subMenu}>
              <Pressable
                style={styles.subMenuItem}
                onPress={() =>
                  Alert.alert(
                    "Réservations passées",
                    "Ici on pourrait ouvrir l'historique de réservations."
                  )
                }
              >
                <Text style={styles.subMenuText}>
                  Historique des réservations
                </Text>
              </Pressable>

              <View style={styles.subDivider} />

              <Pressable
                style={styles.subMenuItem}
                onPress={() =>
                  Alert.alert(
                    "Données",
                    "Téléchargement de vos données Roomly (RGPD)."
                  )
                }
              >
                <Text style={styles.subMenuText}>Télécharger mes données</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.divider} />

          {/* À PROPOS */}
          <Pressable
            style={styles.settingsRow}
            onPress={() => setOpenAbout((v) => !v)}
          >
            <View style={styles.rowLeft}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#3E7CB1"
              />
              <Text style={styles.rowTitle}>À propos de Roomly</Text>
            </View>
            <Ionicons
              name={openAbout ? "chevron-up" : "chevron-down"}
              size={18}
              color="#999"
            />
          </Pressable>

          {openAbout && (
            <View style={styles.subMenu}>
              <Pressable
                style={styles.subMenuItem}
                onPress={() =>
                  Alert.alert(
                    "À propos",
                    "Roomly — projet EPHEC permettant de réserver des bureaux inutilisés."
                  )
                }
              >
                <Text style={styles.subMenuText}>Notre mission</Text>
              </Pressable>

              <View style={styles.subDivider} />

              <Pressable
                style={styles.subMenuItem}
                onPress={() =>
                  Alert.alert(
                    "Conditions",
                    "Conditions d’utilisation & politique de confidentialité (à implémenter)."
                  )
                }
              >
                <Text style={styles.subMenuText}>
                  Conditions & confidentialité
                </Text>
              </Pressable>

              <View style={styles.subDivider} />

              <Pressable
                style={styles.subMenuItem}
                onPress={() =>
                  Alert.alert("Version", "Roomly v1.0 — prototype MVP.")
                }
              >
                <Text style={styles.subMenuText}>
                  Version de l’application
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* BOUTONS EN BAS */}
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </Pressable>

        <Pressable style={styles.deleteBtn} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Supprimer mon compte</Text>
        </Pressable>
      </ScrollView>

      {/* NAVBAR FIXE */}
      <BottomNavBar activeTab="profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },

  loading: { flex: 1, justifyContent: "center", alignItems: "center" },

  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120, // laisse la place pour la navbar
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  screenTitle: { fontSize: 22, fontWeight: "700" },

  logo: { width: 110, height: 40, resizeMode: "contain" },

  profileCard: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
    marginBottom: 20,
  },

  avatarWrapper: { marginRight: 16, position: "relative" },

  avatar: { width: 72, height: 72, borderRadius: 36 },

  avatarFallback: {
    backgroundColor: "#3E7CB1",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: { color: "#fff", fontWeight: "700", fontSize: 26 },

  editAvatarBtn: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F49B0B",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  profileInfo: { flex: 1 },

  nameText: { fontSize: 18, fontWeight: "700" },
  emailText: { fontSize: 13, color: "#666", marginBottom: 6 },

  editProfileBtn: {
    borderWidth: 1,
    borderColor: "#3E7CB1",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },

  editProfileText: {
    color: "#3E7CB1",
    fontWeight: "600",
    fontSize: 13,
  },

  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },

  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },

  rowText: { marginLeft: 12 },

  rowTitle: { fontSize: 14, fontWeight: "600" },
  rowSubtitle: { fontSize: 12, color: "#666" },

  divider: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 6,
  },

  settingsCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 20,
  },

  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },

  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  subMenu: {
    paddingLeft: 36,
    paddingVertical: 6,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    marginBottom: 10,
  },

  subMenuItem: {
    paddingVertical: 10,
  },

  subMenuText: {
    fontSize: 14,
    color: "#333",
  },

  subDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 4,
  },

  logoutBtn: {
    backgroundColor: "#E74C3C",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 24,
    alignSelf: "center",
    marginTop: 4,
  },

  logoutText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  deleteBtn: {
    marginTop: 10,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#BB0000",
  },

  deleteText: {
    color: "#BB0000",
    fontWeight: "600",
    fontSize: 14,
  },
});
