// app/admin/profil_entreprise/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
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

type EntrepriseData = {
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

export default function AdminProfilEntreprise() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState<EntrepriseData | null>(null);

  const [nbEspaces, setNbEspaces] = useState(0);
  const [nbEspacesValides, setNbEspacesValides] = useState(0);
  const [nbReservations, setNbReservations] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) return;

        // 1) user doc
        const refUser = doc(db, "users", id);
        const snap = await getDoc(refUser);
        if (snap.exists()) {
          setEntreprise(snap.data() as EntrepriseData);
        } else {
          setEntreprise(null);
        }

        // 2) espaces de cette entreprise
        const qEspaces = query(
          collection(db, "espaces"),
          where("uid", "==", id)
        );
        const snapEspaces = await getDocs(qEspaces);
        const espacesData = snapEspaces.docs.map((d) => d.data() as any);

        setNbEspaces(espacesData.length);
        setNbEspacesValides(
          espacesData.filter((e) => e.status === "validé").length
        );

        // 3) réservations liées à cette entreprise
        const qResa = query(
          collection(db, "reservations"),
          where("entrepriseId", "==", id)
        );
        const snapResa = await getDocs(qResa);
        setNbReservations(snapResa.size);
      } catch (e) {
        console.log("Erreur profil entreprise admin:", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const inscritDepuis = useMemo(() => {
    if (!entreprise?.createdAt) return "-";
    try {
      const d = entreprise.createdAt.toDate
        ? entreprise.createdAt.toDate()
        : new Date(entreprise.createdAt);
      return d.toLocaleDateString("fr-BE");
    } catch {
      return "-";
    }
  }, [entreprise?.createdAt]);

  const handleEmail = () => {
    if (!entreprise?.email) return;
    const url = `mailto:${entreprise.email}`;
    Linking.openURL(url).catch(() => {});
  };

  const handlePhone = () => {
    if (!entreprise?.phone) return;
    const url = `tel:${entreprise.phone}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleWebsite = () => {
    if (!entreprise?.website) return;
    let url = entreprise.website.trim();
    if (!url.startsWith("http")) {
      url = "https://" + url;
    }
    Linking.openURL(url).catch(() => {});
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3E7CB1" />
      </View>
    );
  }

  if (!entreprise) {
    return (
      <View style={styles.loading}>
        <Text>Aucune entreprise trouvée.</Text>
      </View>
    );
  }

  const logo =
    entreprise.companyLogoUrl || undefined;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* HEADER */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color="#000" />
          </Pressable>

          <Text style={styles.headerTitle}>Profil entreprise</Text>

          <Image
            source={require("../../../assets/images/roomly-logo.png")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>

        {/* CARTE IDENTITÉ */}
        <View style={styles.card}>
          <View style={styles.identityRow}>
            {logo ? (
              <Image source={{ uri: logo }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="business-outline" size={32} color="#555" />
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.companyName}>
                {entreprise.companyName || "Entreprise"}
              </Text>
              {entreprise.email ? (
                <Text style={styles.email}>{entreprise.email}</Text>
              ) : null}
              {entreprise.contactName ? (
                <Text style={styles.smallText}>
                  Contact : {entreprise.contactName}
                </Text>
              ) : null}
            </View>
          </View>

          {entreprise.companyDescription ? (
            <Text style={styles.description}>
              {entreprise.companyDescription}
            </Text>
          ) : null}
        </View>

        {/* STATS RAPIDES */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Résumé d’activité</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{nbEspaces}</Text>
              <Text style={styles.statLabel}>Espaces créés</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{nbEspacesValides}</Text>
              <Text style={styles.statLabel}>Espaces validés</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{nbReservations}</Text>
              <Text style={styles.statLabel}>Réservations</Text>
            </View>
          </View>
          <Text style={styles.metaText}>Inscrit depuis : {inscritDepuis}</Text>
        </View>

        {/* COORDONNÉES */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Coordonnées</Text>

          {entreprise.phone ? (
            <View style={styles.row}>
              <Ionicons name="call-outline" size={20} color="#184E77" />
              <Text style={styles.rowText}>{entreprise.phone}</Text>
            </View>
          ) : null}

          {entreprise.email ? (
            <View style={styles.row}>
              <Ionicons name="mail-outline" size={20} color="#184E77" />
              <Text style={styles.rowText}>{entreprise.email}</Text>
            </View>
          ) : null}

          {entreprise.website ? (
            <View style={styles.row}>
              <Ionicons name="globe-outline" size={20} color="#184E77" />
              <Text style={styles.rowText}>{entreprise.website}</Text>
            </View>
          ) : null}
        </View>

        {/* ADRESSE / TVA */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Adresse & facturation</Text>

          {entreprise.addressStreet || entreprise.addressCity ? (
            <View style={styles.row}>
              <Ionicons name="location-outline" size={20} color="#184E77" />
              <Text style={styles.rowText}>
                {entreprise.addressStreet}
                {entreprise.addressStreet && "\n"}
                {entreprise.addressPostalCode} {entreprise.addressCity}
                {entreprise.country ? `, ${entreprise.country}` : ""}
              </Text>
            </View>
          ) : null}

          {entreprise.vatNumber ? (
            <View style={styles.row}>
              <Ionicons name="reader-outline" size={20} color="#184E77" />
              <Text style={styles.rowText}>TVA : {entreprise.vatNumber}</Text>
            </View>
          ) : null}
        </View>

        {/* BOUTONS CONTACT */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Actions administrateur</Text>
          <View style={styles.actionsRow}>
            {entreprise.email && (
              <Pressable style={styles.actionBtn} onPress={handleEmail}>
                <Ionicons name="mail-outline" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Envoyer un email</Text>
              </Pressable>
            )}

            {entreprise.phone && (
              <Pressable style={styles.actionBtnSecondary} onPress={handlePhone}>
                <Ionicons name="call-outline" size={20} color="#184E77" />
                <Text style={styles.actionBtnSecondaryText}>
                  Appeler
                </Text>
              </Pressable>
            )}

            {entreprise.website && (
              <Pressable style={styles.actionBtnSecondary} onPress={handleWebsite}>
                <Ionicons name="globe-outline" size={20} color="#184E77" />
                <Text style={styles.actionBtnSecondaryText}>
                  Ouvrir le site
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#EEF3F8",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#EEF3F8",
  },
  content: {
    alignItems: "center",
    paddingBottom: 40,
  },
  headerRow: {
    width: "92%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 50,
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerLogo: {
    width: 70,
    height: 32,
  },
  card: {
    width: "92%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 14,
  },
  avatarPlaceholder: {
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  companyName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  email: {
    marginTop: 4,
    color: "#555",
  },
  smallText: {
    marginTop: 2,
    color: "#777",
    fontSize: 13,
  },
  description: {
    marginTop: 10,
    color: "#333",
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    color: "#555",
    textAlign: "center",
    marginTop: 4,
  },
  metaText: {
    marginTop: 10,
    fontSize: 12,
    color: "#777",
  },
  row: {
    flexDirection: "row",
    marginTop: 6,
  },
  rowText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  actionsRow: {
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#184E77",
    borderRadius: 24,
    paddingVertical: 10,
    marginBottom: 8,
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
  },
  actionBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#184E77",
    paddingVertical: 8,
    marginBottom: 8,
  },
  actionBtnSecondaryText: {
    color: "#184E77",
    fontWeight: "600",
    marginLeft: 6,
  },
});