// app/user/edit_profile.tsx
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { auth, db, storage } from "../../firebaseConfig";

export default function EditProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Champs du profil
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [bio, setBio] = useState("");

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [initialPhotoUrl, setInitialPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          setLoading(false);
          return;
        }

        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          const data = snap.data() as any;
          setFullName(data.name || "");
          setPhone(data.phone || "");
          setCity(data.city || "");
          setJobTitle(data.jobTitle || "");
          setBio(data.bio || "");
          const p = data.photoURL || null;
          setPhotoUrl(p);
          setInitialPhotoUrl(p);
        }
      } catch (e) {
        console.log("Erreur load profile:", e);
        Alert.alert("Erreur", "Impossible de charger le profil.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission refusée",
        "Nous avons besoin de l’accès aux photos pour changer votre avatar."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhotoUrl(result.assets[0].uri);
    }
  };

  const save = async () => {
    if (!fullName.trim()) {
      Alert.alert("Erreur", "Le nom ne peut pas être vide.");
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert("Erreur", "Utilisateur non connecté.");
      return;
    }

    try {
      setSaving(true);

      let finalPhotoURL = initialPhotoUrl || null;

      // Nouvelle image locale → upload dans Storage
      if (
        photoUrl &&
        photoUrl !== initialPhotoUrl &&
        !photoUrl.startsWith("http")
      ) {
        const response = await fetch(photoUrl);
        const blob = await response.blob();

        const storageRef = ref(storage, `profiles/${uid}.jpg`);
        await uploadBytes(storageRef, blob);
        finalPhotoURL = await getDownloadURL(storageRef);
      }

      await updateDoc(doc(db, "users", uid), {
        name: fullName.trim(),
        phone: phone.trim(),
        city: city.trim(),
        jobTitle: jobTitle.trim(),
        bio: bio.trim(),
        photoURL: finalPhotoURL,
      });

      Alert.alert("Succès", "Profil mis à jour !");
      router.back();
    } catch (e) {
      console.log("Erreur update profile:", e);
      Alert.alert("Erreur", "Impossible de mettre à jour le profil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3E7CB1" />
      </View>
    );
  }

  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U";

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color="#000" />
        </Pressable>
        <Text style={styles.title}>Modifier le profil</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* AVATAR */}
      <View style={styles.avatarSection}>
        <Pressable onPress={pickImage} style={styles.avatarWrapper}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={styles.avatarEditBadge}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </Pressable>
        <Text style={styles.avatarHint}>Changer la photo de profil</Text>
      </View>

      {/* FORMULAIRE */}
      <View style={styles.form}>
        <Text style={styles.label}>Nom complet</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Votre nom"
        />

        <Text style={styles.label}>Téléphone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Numéro de téléphone"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Ville</Text>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder="Ex : Bruxelles"
        />

        <Text style={styles.label}>Métier / rôle</Text>
        <TextInput
          style={styles.input}
          value={jobTitle}
          onChangeText={setJobTitle}
          placeholder="Ex : Freelance développeur"
        />

        <Text style={styles.label}>À propos de moi</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={bio}
          onChangeText={setBio}
          placeholder="Courte description"
          multiline
        />

        <Pressable style={styles.saveButton} onPress={save} disabled={saving}>
          <Text style={styles.saveText}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 50,
  },
  backButton: { width: 32 },
  title: { flex: 1, textAlign: "center", fontSize: 20, fontWeight: "700" },

  avatarSection: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarPlaceholder: {
    backgroundColor: "#3E7CB1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#3E7CB1",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#EEF3F8",
  },
  avatarHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#666",
  },

  form: { padding: 18 },
  label: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  textArea: {
    height: 90,
    textAlignVertical: "top",
  },

  saveButton: {
    backgroundColor: "#3E7CB1",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  saveText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
