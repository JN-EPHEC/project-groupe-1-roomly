import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
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
import { auth, db } from "../../../firebaseConfig";

import * as ImagePicker from "expo-image-picker";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";
import { geocodeAddress } from "../../../utils/geocoding";

type TimeSlot = {
  id: string;
  dateISO: string;
  dayLabel: string;
  start: string;
  end: string;
};

export default function EditerEspace() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [description, setDescription] = useState("");
  const [localisation, setLocalisation] = useState("");
  const [capacite, setCapacite] = useState("");
  const [prix, setPrix] = useState("");
  const [materiel, setMateriel] = useState("");

  const [images, setImages] = useState<(string | null)[]>([]);
  const [oldImages, setOldImages] = useState<string[]>([]);
  const MAX_IMAGES = 4;

  // Disponibilités
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [dateInput, setDateInput] = useState("");
  const [startTimeInput, setStartTimeInput] = useState("");
  const [endTimeInput, setEndTimeInput] = useState("");

  const [initialLocalisation, setInitialLocalisation] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const refDoc = doc(db, "espaces", id as string);
        const snap = await getDoc(refDoc);

        if (snap.exists()) {
          const data: any = snap.data();

          setDescription(data.description || "");
          setLocalisation(data.localisation || "");
          setInitialLocalisation(data.localisation || "");
          setCapacite(data.capacite || "");
          setPrix(data.prix || "");
          setMateriel(data.materiel || "");

          setImages(data.images || []);
          setOldImages(data.images || []);
          setTimeSlots((data.timeSlots || []) as TimeSlot[]);
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ---------------- IMAGES ----------------
  const pickImage = async () => {
    if (images.length >= MAX_IMAGES) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert("Permission refusée");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const deleteImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const uploadImages = async () => {
    const storage = getStorage();
    const urls: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const img = images[i];

      // URL Firebase => on garde
      if (img && img.startsWith("https")) {
        urls.push(img);
        continue;
      }

      // supprimer ancienne image si remplacée
      if (oldImages[i]) {
        try {
          const match = oldImages[i].match(/\/o\/(.+?)\?/);
          if (match) {
            const fullPath = decodeURIComponent(match[1]);
            const oldRef = ref(storage, fullPath);
            await deleteObject(oldRef);
          }
        } catch (e) {
          console.log("Erreur suppression ancienne image :", e);
        }
      }

      // upload nouvelle image
      if (img) {
        const response = await fetch(img);
        const blob = await response.blob();

        const imageRef = ref(
          storage,
          `espaces/${auth.currentUser?.uid}_${Date.now()}_${i}.jpg`
        );
        await uploadBytes(imageRef, blob);

        const url = await getDownloadURL(imageRef);
        urls.push(url);
      }
    }

    return urls;
  };

  // ---------------- DISPONIBILITÉS ----------------
  const addTimeSlot = () => {
    if (!dateInput || !startTimeInput || !endTimeInput) {
      alert("Remplis la date et les heures (début et fin).");
      return;
    }

    const [dayStr, monthStr, yearStr] = dateInput.split("/");
    if (!dayStr || !monthStr || !yearStr) {
      alert("Format de date invalide. Utilise JJ/MM/AAAA.");
      return;
    }

    const date = new Date(
      Number(yearStr),
      Number(monthStr) - 1,
      Number(dayStr)
    );
    if (isNaN(date.getTime())) {
      alert("Date invalide.");
      return;
    }

    const dayNames = [
      "Dimanche",
      "Lundi",
      "Mardi",
      "Mercredi",
      "Jeudi",
      "Vendredi",
      "Samedi",
    ];
    const jour = dayNames[date.getDay()];

    const formattedDisplay = `${jour} ${dayStr.padStart(
      2,
      "0"
    )}/${monthStr.padStart(2, "0")}/${yearStr}`;

    const newSlot: TimeSlot = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      dateISO: date.toISOString(),
      dayLabel: formattedDisplay,
      start: startTimeInput,
      end: endTimeInput,
    };

    setTimeSlots((prev) => [...prev, newSlot]);
    setDateInput("");
    setStartTimeInput("");
    setEndTimeInput("");
  };

  const removeTimeSlot = (idSlot: string) => {
    setTimeSlots((prev) => prev.filter((s) => s.id !== idSlot));
  };

  // ---------------- SAUVEGARDE ----------------
  const sauvegarder = async () => {
    setLoading(true);
    try {
      const uploadedImages = await uploadImages();

      // Si localisation change => re-geocode
      let extraCoords: any = {};
      const locNow = (localisation || "").trim();
      const locBefore = (initialLocalisation || "").trim();

      if (locNow !== locBefore) {
        if (!locNow) {
          Alert.alert("Erreur", "La localisation ne peut pas être vide.");
          setLoading(false);
          return;
        }

        const coords = await geocodeAddress(locNow);
        if (!coords) {
          Alert.alert(
            "Localisation introuvable",
            "Google n’a pas trouvé cette adresse/ville. Essaie un format plus précis."
          );
          setLoading(false);
          return;
        }

        extraCoords = {
          latitude: coords.lat,
          longitude: coords.lng,
        };
      }

      await updateDoc(doc(db, "espaces", id as string), {
        description,
        localisation,
        ...extraCoords,
        capacite,
        prix,
        materiel,
        images: uploadedImages,
        timeSlots,
      });

      setInitialLocalisation(localisation);

      Alert.alert("OK", "Annonce mise à jour !");
      router.push("/entreprise/home_entreprise");
    } catch (e) {
      console.log(e);
      Alert.alert("Erreur", "Erreur lors de la sauvegarde.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3E7CB1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* BACK */}
        <Pressable
          style={{ width: "90%", marginTop: 40 }}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={26} color="#000" />
        </Pressable>

        <Text style={styles.title}>Modifier l’espace</Text>

        {/* IMAGES */}
        <View style={styles.imageRow}>
          {images.map((img, index) =>
            img ? (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: img }} style={styles.uploadedImage} />

                <Pressable
                  style={styles.deleteBtn}
                  onPress={() => deleteImage(index)}
                >
                  <Ionicons name="remove-circle" size={26} color="#C0392B" />
                </Pressable>
              </View>
            ) : null
          )}

          {images.length < MAX_IMAGES && (
            <Pressable style={styles.addImage} onPress={pickImage}>
              <Ionicons name="add-outline" size={40} color="#555" />
            </Pressable>
          )}
        </View>

        {/* FORM INFOS */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>Localisation</Text>
        <TextInput
          style={styles.input}
          value={localisation}
          onChangeText={setLocalisation}
          placeholder="Ex: 10 Rue ..., 1348 Ottignies"
        />

        <Text style={styles.label}>Capacité</Text>
        <TextInput
          style={styles.input}
          value={capacite}
          onChangeText={setCapacite}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Prix</Text>
        <TextInput style={styles.input} value={prix} onChangeText={setPrix} />

        <Text style={styles.label}>Matériel</Text>
        <TextInput
          style={styles.input}
          value={materiel}
          onChangeText={setMateriel}
        />

        {/* DISPONIBILITÉS */}
        <Text style={[styles.label, { marginTop: 10 }]}>
          Disponibilités de l’espace
        </Text>
        <Text style={styles.helperText}>
          Format date : JJ/MM/AAAA (ex : 15/02/2025){"\n"}Heures : 09:00
        </Text>

        <View style={styles.slotInputsRow}>
          <TextInput
            style={[styles.input, styles.slotInput]}
            placeholder="Date (JJ/MM/AAAA)"
            placeholderTextColor="#777"
            value={dateInput}
            onChangeText={setDateInput}
          />
        </View>

        <View style={styles.slotInputsRow}>
          <TextInput
            style={[styles.input, styles.slotInputHalf]}
            placeholder="Début (HH:MM)"
            placeholderTextColor="#777"
            value={startTimeInput}
            onChangeText={setStartTimeInput}
          />
          <TextInput
            style={[styles.input, styles.slotInputHalf]}
            placeholder="Fin (HH:MM)"
            placeholderTextColor="#777"
            value={endTimeInput}
            onChangeText={setEndTimeInput}
          />
        </View>

        <Pressable style={styles.addSlotBtn} onPress={addTimeSlot}>
          <Ionicons name="add-outline" size={20} color="#3E7CB1" />
          <Text style={styles.addSlotText}>Ajouter ce créneau</Text>
        </Pressable>

        {timeSlots.length > 0 && (
          <View style={styles.slotList}>
            {timeSlots.map((slot) => (
              <View key={slot.id} style={styles.slotRow}>
                <View>
                  <Text style={styles.slotMainText}>{slot.dayLabel}</Text>
                  <Text style={styles.slotSubText}>
                    {slot.start} - {slot.end}
                  </Text>
                </View>
                <Pressable onPress={() => removeTimeSlot(slot.id)}>
                  <Ionicons name="trash-outline" size={20} color="#C0392B" />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Pressable style={styles.button} onPress={sauvegarder}>
          <Text style={styles.buttonText}>Sauvegarder</Text>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },
  content: { alignItems: "center", paddingBottom: 80 },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EEF3F8",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 20,
    width: "90%",
  },

  imageRow: {
    width: "90%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },

  imageContainer: { width: "30%", aspectRatio: 1, position: "relative" },

  uploadedImage: { width: "100%", height: "100%", borderRadius: 12 },

  deleteBtn: { position: "absolute", top: -8, right: -8 },

  addImage: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: "#D9D9D9",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },

  label: { width: "90%", fontSize: 16, fontWeight: "600", marginBottom: 6 },

  input: {
    width: "90%",
    backgroundColor: "#D9D9D9",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 18,
  },

  button: {
    width: "65%",
    backgroundColor: "#3E7CB1",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: { color: "#fff", fontSize: 17, fontWeight: "700" },


  helperText: {
    width: "90%",
    fontSize: 12,
    color: "#555",
    marginBottom: 6,
  },

  slotInputsRow: { width: "90%" },
  slotInput: { width: "100%" },
  slotInputHalf: { width: "48%" },

  addSlotBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginLeft: "5%",
    marginBottom: 10,
  },
  addSlotText: { color: "#3E7CB1", marginLeft: 4, fontWeight: "600" },

  slotList: { width: "90%", marginBottom: 20 },
  slotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#DDD",
  },
  slotMainText: { fontSize: 14, fontWeight: "600", color: "#000" },
  slotSubText: { fontSize: 13, color: "#333" },
});
