// app/admin/utilisateurs.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    collection,
    getDocs,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { db } from "../../firebaseConfig";

type UserItem = {
  id: string;
  type?: string;
  name?: string;
  companyName?: string;
  email?: string;
};

export default function AdminUtilisateurs() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roleFilter, setRoleFilter] = useState<"tous" | "utilisateur" | "entreprise" | "admin">("tous");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const list: UserItem[] = snap.docs.map((d) => {
          const data: any = d.data();
          return {
            id: d.id,
            type: data.type,
            name: data.name || data.displayName || "",
            companyName: data.companyName || "",
            email: data.email || data.userEmail || "",
          };
        });
        setUsers(list);
      } catch (e) {
        console.log("Erreur chargement users (admin) :", e);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    // filtre rôle
    if (roleFilter !== "tous") {
      if ((u.type || "").toLowerCase() !== roleFilter) return false;
    }

    // filtre recherche (nom / entreprise / email)
    if (search.trim().length > 0) {
      const s = search.toLowerCase();
      const target =
        (u.name || "") +
        " " +
        (u.companyName || "") +
        " " +
        (u.email || "") +
        " " +
        (u.type || "");
      if (!target.toLowerCase().includes(s)) return false;
    }

    return true;
  });

  const getDisplayName = (u: UserItem) => {
    if (u.type === "entreprise" && u.companyName) return u.companyName;
    if (u.name) return u.name;
    return u.email || u.id;
  };

  const onPressUser = (u: UserItem) => {
    if (u.type === "entreprise") {
      router.push(`/admin/profil_entreprise/${u.id}`);
    } else {
      // par défaut → profil utilisateur
      router.push(`/admin/profil_utilisateur/${u.id}`);
    }
  };

  const renderRoleBadge = (type?: string) => {
    if (!type) return null;
    const t = type.toLowerCase();
    let bg = "#bdc3c7";
    let label = type;

    if (t === "utilisateur") {
      bg = "#2980b9";
      label = "Utilisateur";
    } else if (t === "entreprise") {
      bg = "#8e44ad";
      label = "Entreprise";
    } else if (t === "admin") {
      bg = "#c0392b";
      label = "Admin";
    }

    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={styles.badgeText}>{label}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Back */}
        <Pressable
          style={{ width: "90%", marginTop: 40, marginBottom: 10 }}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={26} color="#000" />
        </Pressable>

        <Text style={styles.title}>Utilisateurs & entreprises</Text>

        {/* Filtres rôles */}
        <View style={styles.filterRow}>
          {[
            { label: "Tous", value: "tous" as const },
            { label: "Utilisateurs", value: "utilisateur" as const },
            { label: "Entreprises", value: "entreprise" as const },
            { label: "Admins", value: "admin" as const },
          ].map((f) => (
            <Pressable
              key={f.value}
              style={[
                styles.filterChip,
                roleFilter === f.value && styles.filterChipActive,
              ]}
              onPress={() => setRoleFilter(f.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  roleFilter === f.value && styles.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Recherche */}
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par nom, entreprise ou email..."
          placeholderTextColor="#777"
          value={search}
          onChangeText={setSearch}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#3E7CB1" />
        ) : filteredUsers.length === 0 ? (
          <Text style={{ marginTop: 20 }}>
            Aucun utilisateur pour ce filtre / cette recherche.
          </Text>
        ) : (
          filteredUsers.map((u) => (
            <Pressable
              key={u.id}
              style={styles.card}
              onPress={() => onPressUser(u)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{getDisplayName(u)}</Text>
                {u.email ? (
                  <Text style={styles.email}>{u.email}</Text>
                ) : null}
                {u.type === "entreprise" && u.companyName ? (
                  <Text style={styles.company}>
                    Société : {u.companyName}
                  </Text>
                ) : null}
              </View>
              {renderRoleBadge(u.type)}
              <Ionicons
                name="chevron-forward"
                size={20}
                color="#555"
                style={{ marginLeft: 8 }}
              />
            </Pressable>
          ))
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },
  content: {
    alignItems: "center",
    paddingBottom: 80,
  },
  title: {
    width: "90%",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 14,
  },
  filterRow: {
    flexDirection: "row",
    width: "90%",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 8,
    marginBottom: 6,
  },
  filterChipActive: {
    backgroundColor: "#3E7CB1",
    borderColor: "#3E7CB1",
  },
  filterChipText: {
    fontSize: 13,
    color: "#333",
  },
  filterChipTextActive: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "600",
  },
  searchInput: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
    fontSize: 14,
  },
  card: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  email: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
  },
  company: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
});
