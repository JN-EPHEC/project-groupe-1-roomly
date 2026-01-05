// app/entreprise/edit_profil_entreprise.tsx
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
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { auth, db, storage } from "../../firebaseConfig";

export default function EditProfilEntreprise() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Champs entreprise
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [sector, setSector] = useState("");
  const [website, setWebsite] = useState("");

  const [addressStreet, setAddressStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [vatNumber, setVatNumber] = useState("");

  const [description, setDescription] = useState("");

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [initialLogoUrl, setInitialLogoUrl] = useState<string | null>(null);

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
          setCompanyName(data.companyName || "");
          setContactName(data.contactName || "");
          setPhone(data.phone || "");
          setSector(data.sector || "");
          setWebsite(data.website || "");
          setAddressStreet(data.addressStreet || "");
          setPostalCode(data.addressPostalCode || "");
          setCity(data.addressCity || "");
          setCountry(data.country || "");
          setVatNumber(data.vatNumber || "");
          setDescription(data.companyDescription || "");
          const p = data.companyLogoUrl || null;
          setLogoUrl(p);
          setInitialLogoUrl(p);
        }
      } catch (e) {
        console.log("Erreur load profil entreprise:", e);
        Alert.alert(
          "Erreur",
          "Impossible de charger les informations de l’entreprise."
        );
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
        "Nous avons besoin de l’accès aux photos pour changer le logo."
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
      setLogoUrl(result.assets[0].uri);
    }
  };

  const save = async () => {
    if (!companyName.trim()) {
      Alert.alert("Erreur", "Le nom de l’entreprise ne peut pas être vide.");
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert("Erreur", "Utilisateur non connecté.");
      return;
    }

    try {
      setSaving(true);

      let finalLogoURL = initialLogoUrl || null;

      if (
        logoUrl &&
        logoUrl !== initialLogoUrl &&
        !logoUrl.startsWith("http")
      ) {
        const response = await fetch(logoUrl);
        const blob = await response.blob();

        const storageRef = ref(storage, `logos_entreprises/${uid}.jpg`);
        await uploadBytes(storageRef, blob);
        finalLogoURL = await getDownloadURL(storageRef);
      }

      await updateDoc(doc(db, "users", uid), {
        type: "entreprise",
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        phone: phone.trim(),
        sector: sector.trim(),
        website: website.trim(),
        addressStreet: addressStreet.trim(),
        addressPostalCode: postalCode.trim(),
        addressCity: city.trim(),
        country: country.trim(),
        vatNumber: vatNumber.trim(),
        companyDescription: description.trim(),
        companyLogoUrl: finalLogoURL,
      });

      Alert.alert("Succès", "Profil entreprise mis à jour !");
      router.back();
    } catch (e) {
      console.log("Erreur update profil entreprise:", e);
      Alert.alert(
        "Erreur",
        "Impossible de mettre à jour le profil entreprise."
      );
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
    companyName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "E";

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={26} color="#000" />
          </Pressable>
          <Text style={styles.title}>Modifier le profil entreprise</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* LOGO */}
        <View style={styles.avatarSection}>
          <Pressable onPress={pickImage} style={styles.avatarWrapper}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </Pressable>
          <Text style={styles.avatarHint}>Changer le logo de l’entreprise</Text>
        </View>

        {/* FORMULAIRE */}
        <View style={styles.form}>
          <Text style={styles.label}>Nom de l’entreprise</Text>
          <TextInput
            style={styles.input}
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="Nom légal / commercial"
          />

          <Text style={styles.label}>Personne de contact</Text>
          <TextInput
            style={styles.input}
            value={contactName}
            onChangeText={setContactName}
            placeholder="Nom et prénom"
          />

          <Text style={styles.label}>Téléphone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Numéro de téléphone"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Secteur d’activité</Text>
          <TextInput
            style={styles.input}
            value={sector}
            onChangeText={setSector}
            placeholder="Coworking, consulting…"
          />

          <Text style={styles.label}>Site web</Text>
          <TextInput
            style={styles.input}
            value={website}
            onChangeText={setWebsite}
            placeholder="https://..."
            autoCapitalize="none"
          />

          <Text style={styles.label}>Rue et numéro</Text>
          <TextInput
            style={styles.input}
            value={addressStreet}
            onChangeText={setAddressStreet}
            placeholder="Rue, n°"
          />

          <Text style={styles.label}>Code postal</Text>
          <TextInput
            style={styles.input}
            value={postalCode}
            onChangeText={setPostalCode}
            placeholder="Code postal"
          />

          <Text style={styles.label}>Ville</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="Ville"
          />

          <Text style={styles.label}>Pays</Text>
          <TextInput
            style={styles.input}
            value={country}
            onChangeText={setCountry}
            placeholder="Pays"
          />

          <Text style={styles.label}>Numéro de TVA</Text>
          <TextInput
            style={styles.input}
            value={vatNumber}
            onChangeText={setVatNumber}
            placeholder="BE0..."
          />

          <Text style={styles.label}>Description de l’entreprise</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Courte présentation"
            multiline
          />

          <Pressable style={styles.saveButton} onPress={save} disabled={saving}>
            <Text style={styles.saveText}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Text>
          </Pressable>
        </View>

        {/* marge bas pour éviter que le bouton colle au bord / clavier */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },

  scrollContent: {
    paddingBottom: 40,
  },

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