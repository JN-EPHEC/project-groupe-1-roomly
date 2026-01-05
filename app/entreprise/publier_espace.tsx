// app/entreprise/publier_espace.tsx
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
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
import BottomNavBarEntreprise from "../../components/BottomNavBarEntreprise";

import { useRouter } from "expo-router";
import { addDoc, collection } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { auth, db } from "../../firebaseConfig";
import { geocodeAddress } from "../../utils/geocoding";

type TimeSlot = {
  id: string;
  dateISO: string;
  dayLabel: string;
  start: string;
  end: string;
};

export default function PublierEspaceScreen() {
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [localisation, setLocalisation] = useState("");
  const [capacite, setCapacite] = useState("");
  const [prix, setPrix] = useState("");
  const [materiel, setMateriel] = useState("");
  const [accessDetails, setAccessDetails] = useState("");

  const [images, setImages] = useState<(string | null)[]>([null, null, null]);

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [dateInput, setDateInput] = useState("");
  const [startTimeInput, setStartTimeInput] = useState("");
  const [endTimeInput, setEndTimeInput] = useState("");

  const [publishing, setPublishing] = useState(false);

  // calendrier simple pour choisir la date des créneaux
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // ---------------------- IMAGES ----------------------
  const pickImage = async (index: number) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return alert("Permission refusée");

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const newImages = [...images];
      newImages[index] = result.assets[0].uri;
      setImages(newImages);
    }
  };

  const uploadImages = async () => {
    const storage = getStorage();
    const urls: string[] = [];

    for (let i = 0; i < images.length; i++) {
      if (images[i]) {
        const response = await fetch(images[i]!);
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

  // ------------------ DISPONIBILITÉS ------------------
  const addTimeSlot = () => {
    if (!dateInput || !startTimeInput || !endTimeInput)
      return alert("Remplis la date et les heures.");

    const [dayStr, monthStr, yearStr] = dateInput.split("/");
    const date = new Date(+yearStr, +monthStr - 1, +dayStr);
    if (isNaN(date.getTime())) return alert("Date invalide.");

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
    const formattedDisplay = `${jour} ${dayStr}/${monthStr}/${yearStr}`;

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

  const removeTimeSlot = (id: string) => {
    setTimeSlots((prev) => prev.filter((s) => s.id !== id));
  };

  // ------ calendrier pour choisir la dateInput ------
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const first = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const changeMonth = (direction: number) => {
    const newMonth = new Date(year, month + direction, 1);
    setCurrentMonth(newMonth);
  };

  const handleSelectCalendarDay = (day: number) => {
    const dayStr = String(day).padStart(2, "0");
    const monthStr = String(month + 1).padStart(2, "0");
    const yearStr = String(year);
    const formatted = `${dayStr}/${monthStr}/${yearStr}`;
    setDateInput(formatted);
    setShowCalendar(false);
  };

  // ------------------ PUBLIER ------------------
  const publierAnnonce = async () => {
    try {
      if (!auth.currentUser) return alert("Vous devez être connecté.");
      if (!localisation.trim()) return alert("La localisation est obligatoire.");

      setPublishing(true);

      const urls = await uploadImages();

      const coords = await geocodeAddress(localisation);
      if (!coords) {
        Alert.alert(
          "Localisation introuvable",
          "Google n’a pas trouvé cette adresse/ville. Essaie un format plus précis (ex: '25 Rue X, Bruxelles')."
        );
        return;
      }

      await addDoc(collection(db, "espaces"), {
        uid: auth.currentUser.uid,
        nom: description.substring(0, 20) || "Espace",
        description,
        localisation,
        latitude: coords.lat,
        longitude: coords.lng,
        capacite,
        prix,
        materiel,
        accessDetails,
        images: urls,
        timeSlots,
        createdAt: new Date(),
        popularity: 0,
        type: "bureau",
        status: "en attente de validation",

        // 🔹 champs boost initialisés
        boostType: null,
        boostUntil: null,
      });

      Alert.alert("OK", "Annonce publiée !");
      router.push("/entreprise/home_entreprise");
    } catch (e) {
      console.log("❌ Erreur publication:", e);
      Alert.alert("Erreur", "Erreur lors de la publication.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image
          source={require("../../assets/images/roomly-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.sectionTitle}>Ajouter des images</Text>

        <View style={styles.imageRow}>
          {images.map((img, index) => (
            <Pressable
              key={index}
              style={styles.imagePlaceholder}
              onPress={() => pickImage(index)}
            >
              {img ? (
                <Image source={{ uri: img }} style={styles.uploadedImage} />
              ) : (
                <Ionicons name="add-outline" size={40} color="#555" />
              )}
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.inputLarge}
          value={description}
          onChangeText={setDescription}
          placeholder="..."
          multiline
        />

        <Text style={styles.label}>Localisation</Text>
        <TextInput
          style={styles.input}
          value={localisation}
          onChangeText={setLocalisation}
          placeholder="Ex: 10 Rue de l'EPHEC, 1348 Ottignies"
        />

        <Text style={styles.label}>Capacité</Text>
        <TextInput
          style={styles.input}
          value={capacite}
          onChangeText={setCapacite}
          keyboardType="numeric"
          placeholder="1 - 100"
        />

        <Text style={styles.label}>Prix (€/h)</Text>
        <TextInput
          style={styles.input}
          value={prix}
          onChangeText={setPrix}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Matériel</Text>
        <TextInput
          style={styles.inputLarge}
          value={materiel}
          onChangeText={setMateriel}
          multiline
        />

        <Text style={styles.label}>Détails d’accès / instructions</Text>
        <TextInput
          style={styles.inputLarge}
          value={accessDetails}
          onChangeText={setAccessDetails}
          placeholder={
            "Code d’accès, étage, personne de contact...\n(ex : Code porte 1234, 4e étage...)"
          }
          multiline
        />

        {/* HEADER dispo + bouton calendrier */}
        <View
          style={{
            width: "90%",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 10,
            marginBottom: 4,
          }}
        >
          <Text style={styles.sectionTitle}>Disponibilités</Text>
          <Pressable onPress={() => setShowCalendar((v) => !v)}>
            <Text style={styles.calendarLink}>
              {showCalendar ? "Fermer le calendrier" : "Choisir via le calendrier"}
            </Text>
          </Pressable>
        </View>

        {/* Champ date + heures (toujours là) */}
        <View style={styles.slotInputsRow}>
          <TextInput
            style={[styles.input, styles.slotInput]}
            placeholder="Date (JJ/MM/AAAA)"
            value={dateInput}
            onChangeText={setDateInput}
          />
        </View>

        {/* Calendrier visible seulement si showCalendar = true */}
        {showCalendar && (
          <View style={styles.calendarContainer}>
            <View style={styles.monthRow}>
              <Pressable onPress={() => changeMonth(-1)}>
                <Text style={styles.arrow}>«</Text>
              </Pressable>

              <Text style={styles.monthTitle}>
                {currentMonth.toLocaleString("fr-FR", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>

              <Pressable onPress={() => changeMonth(1)}>
                <Text style={styles.arrow}>»</Text>
              </Pressable>
            </View>

            <View style={styles.weekHeader}>
              {["lu", "ma", "me", "je", "ve", "sa", "di"].map((d) => (
                <Text key={d} style={styles.weekDay}>
                  {d}
                </Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {Array.from({ length: first === 0 ? 6 : first - 1 }).map(
                (_, i) => (
                  <View key={i} style={styles.dayEmpty} />
                )
              )}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                return (
                  <Pressable
                    key={day}
                    style={styles.day}
                    onPress={() => handleSelectCalendarDay(day)}
                  >
                    <Text style={styles.dayText}>{day}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.slotInputsRow}>
          <TextInput
            style={[styles.input, styles.slotInputHalf]}
            placeholder="Début (HH:MM)"
            value={startTimeInput}
            onChangeText={setStartTimeInput}
          />
          <TextInput
            style={[styles.input, styles.slotInputHalf]}
            placeholder="Fin (HH:MM)"
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

        <Pressable
          style={[styles.publishButton, publishing && { opacity: 0.6 }]}
          onPress={publierAnnonce}
          disabled={publishing}
        >
          {publishing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.publishText}>Publier</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </Pressable>

        <View style={{ height: 120 }} />
      </ScrollView>

      <BottomNavBarEntreprise activeTab="annonces" />
    </View>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },
  scrollContent: { paddingTop: 20, paddingBottom: 140, alignItems: "center" },
  logo: { width: 200, height: 90, marginBottom: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  label: { width: "90%", fontSize: 16, fontWeight: "600", marginBottom: 6 },
  input: {
    width: "90%",
    backgroundColor: "#D9D9D9",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  inputLarge: {
    width: "90%",
    minHeight: 110,
    backgroundColor: "#D9D9D9",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  publishButton: {
    width: "65%",
    backgroundColor: "#3E7CB1",
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  publishText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 18,
    marginRight: 8,
  },
  imageRow: {
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  imagePlaceholder: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: "#D9D9D9",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  uploadedImage: { width: "100%", height: "100%" },
  addSlotBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "5%",
    marginBottom: 10,
  },
  addSlotText: { color: "#3E7CB1", marginLeft: 4, fontWeight: "600" },
  slotInputsRow: { width: "90%" },
  slotInputHalf: { width: "48%" },
  slotInput: { width: "100%" },
  slotList: { width: "90%", marginBottom: 20 },
  slotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#DDD",
  },
  slotMainText: { fontSize: 14, fontWeight: "600" },
  slotSubText: { fontSize: 13, color: "#333" },

  // calendrier
  calendarLink: {
    color: "#3E7CB1",
    fontWeight: "600",
    fontSize: 13,
  },
  calendarContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  monthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  arrow: { fontSize: 22, paddingHorizontal: 8 },
  monthTitle: { fontSize: 16, fontWeight: "700" },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  weekDay: { width: 32, textAlign: "center", fontWeight: "600" },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
  },
  dayEmpty: {
    width: "14.28%",
    aspectRatio: 1,
  },
  day: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginVertical: 3,
  },
  dayText: { fontSize: 14 },
});
