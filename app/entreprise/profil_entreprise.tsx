// app/entreprise/profil_entreprise.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
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
import BottomNavBarEntreprise from "../../components/BottomNavBarEntreprise";
import { auth, db } from "../../firebaseConfig";

type EntrepriseData = {
  type?: string;
  companyName?: string;
  companyLogoUrl?: string;
  companyDescription?: string;
  sector?: string;

  email?: string;
  phone?: string;
  contactName?: string;
  website?: string;

  addressStreet?: string;
  addressPostalCode?: string;
  addressCity?: string;
  country?: string;
  vatNumber?: string;

  createdAt?: any;
};

export default function EntrepriseProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EntrepriseData | null>(null);

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
        setData(snap.data() as EntrepriseData);
      } else {
        setData({
          type: "entreprise",
          email: current.email || "",
          companyName: current.displayName || "",
        });
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const initials = useMemo(() => {
    const name = data?.companyName || data?.email || "";
    if (!name) return "E";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [data]);

  const createdAtText = useMemo(() => {
    const c = data?.createdAt;
    if (!c) return "-";
    const d = c?.toDate?.() instanceof Date ? c.toDate() : null;
    return d ? d.toLocaleDateString("fr-FR") : "-";
  }, [data]);

  const hasExtraBlock = useMemo(() => {
    if (!data) return false;
    return (
      !!data.companyDescription ||
      !!data.addressStreet ||
      !!data.addressCity ||
      !!data.website
    );
  }, [data]);

  if (loading || !data) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3E7CB1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.topRow}>
          <Text style={styles.screenTitle}>Mon profil entreprise</Text>
          <Image
            source={require("../../assets/images/roomly-logo.png")}
            style={styles.logo}
          />
        </View>

        {/* CARTE PROFIL */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            {data.companyLogoUrl ? (
              <Image
                source={{ uri: data.companyLogoUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.nameText}>
              {data.companyName || "Entreprise"}
            </Text>
            <Text style={styles.emailText}>{data.email || "-"}</Text>

            <Pressable
              style={styles.editProfileBtn}
              onPress={() => router.push("/entreprise/edit_profil_entreprise")}
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
                {data.phone || "Non renseigné"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#3E7CB1" />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Personne de contact</Text>
              <Text style={styles.rowSubtitle}>
                {data.contactName || "Non renseigné"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={20} color="#3E7CB1" />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Secteur</Text>
              <Text style={styles.rowSubtitle}>{data.sector || "-"}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#3E7CB1" />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Ville</Text>
              <Text style={styles.rowSubtitle}>
                {data.addressCity || "-"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="reader-outline" size={20} color="#3E7CB1" />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Numéro de TVA</Text>
              <Text style={styles.rowSubtitle}>
                {data.vatNumber || "Non renseigné"}
              </Text>
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

        {/* DESCRIPTION / ADRESSE / SITE WEB */}
        {hasExtraBlock && (
          <View style={styles.sectionCard}>
            {data.companyDescription ? (
              <>
                <View style={styles.infoRow}>
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color="#3E7CB1"
                  />
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>Description</Text>
                    <Text style={styles.rowSubtitle}>
                      {data.companyDescription}
                    </Text>
                  </View>
                </View>
                <View style={styles.divider} />
              </>
            ) : null}

            {(data.addressStreet || data.addressCity) && (
              <>
                <View style={styles.infoRow}>
                  <Ionicons
                    name="business-outline"
                    size={20}
                    color="#3E7CB1"
                  />
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>Adresse</Text>
                    <Text style={styles.rowSubtitle}>
                      {data.addressStreet}
                      {data.addressStreet && "\n"}
                      {data.addressPostalCode} {data.addressCity}
                      {data.country ? `, ${data.country}` : ""}
                    </Text>
                  </View>
                </View>
                <View style={styles.divider} />
              </>
            )}

            {data.website && (
              <View style={styles.infoRow}>
                <Ionicons name="globe-outline" size={20} color="#3E7CB1" />
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Site web</Text>
                  <Text style={styles.rowSubtitle}>{data.website}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* BLOCS PARAMÈTRES (sécurité / notifs / historique / à propos) */}
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
                <Text style={styles.subMenuText}>
                  Réinitialiser le mot de passe
                </Text>
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
                    "Rappels avant le début des réservations (à implémenter)."
                  )
                }
              >
                <Text style={styles.subMenuText}>
                  Rappels pour les futures réservations
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
                    "Réservations",
                    "Ici on pourrait afficher l’historique des réservations liées à vos espaces."
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
                <Text style={styles.subMenuText}>
                  Télécharger les données de l’entreprise
                </Text>
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
                    "Roomly — projet EPHEC permettant de valoriser les bureaux inutilisés."
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
      </ScrollView>

      <BottomNavBarEntreprise activeTab="profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },

  loading: { flex: 1, justifyContent: "center", alignItems: "center" },

  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
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

  rowText: { marginLeft: 12, flex: 1 },

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
});