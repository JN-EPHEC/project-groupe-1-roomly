// app/user/reserver/[id].tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import BottomNavBar from "../../../components/BottomNavBar";
import { auth, db } from "../../../firebaseConfig";

export default function ReserverEspace() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [espace, setEspace] = useState<any>(null);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  const [reservations, setReservations] = useState<any[]>([]);

  /* ---------------------- LOAD ESPACE + RESERVATIONS ---------------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await getDoc(doc(db, "espaces", id as string));
        if (snap.exists()) setEspace(snap.data());

        const rSnap = await getDocs(collection(db, "reservations"));
        const list = rSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setReservations(list);
      } catch (e) {
        console.log("Erreur fetch :", e);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading || !espace) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3E7CB1" />
      </View>
    );
  }

  /* ----------- NORMALISATION DISPONIBILITÉS ----------- */
  const disponibilites = espace.timeSlots || [];

  const normalizedDispo = disponibilites.map((d: any) => {
    const date = new Date(d.dateISO);
    const formatted = date.toISOString().slice(0, 10);
    return {
      date: formatted,
      start: d.start,
      end: d.end,
    };
  });

  /* ----------- CALENDRIER ----------- */
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const first = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const availableDates = normalizedDispo.map((d: any) => d.date);

  const changeMonth = (direction: number) => {
    const newMonth = new Date(year, month + direction, 1);
    setCurrentMonth(newMonth);
    setSelectedDate(null);
    setSlots([]);
    setSelectedSlots([]);
  };

  /* ----------- SLOTS DÉJA RÉSERVÉS ----------- */
  const takenSlotsForDate = (date: string) => {
    return reservations
      .filter((r) => r.espaceId === id && r.date === date)
      .flatMap((r) => r.slots);
  };

  const buildSlotsForDate = (date: string): string[] => {
    const found = normalizedDispo.find((d: any) => d.date === date);
    if (!found) return [];

    const result: string[] = [];
    let start = parseInt(found.start.split(":")[0]);
    const end = parseInt(found.end.split(":")[0]);

    while (start < end) {
      result.push(`${start}:00 - ${start + 1}:00`);
      start++;
    }
    return result;
  };

  const selectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedSlots([]);
    setSlots(buildSlotsForDate(date));
  };

  const toggleSlot = (slot: string) => {
    if (selectedDate && takenSlotsForDate(selectedDate).includes(slot)) return;
    if (selectedSlots.includes(slot)) {
      setSelectedSlots((prev) => prev.filter((s) => s !== slot));
    } else {
      setSelectedSlots((prev) => [...prev, slot]);
    }
  };

  const totalPrice = selectedSlots.length * parseFloat(espace.prix || 0);

  /* ---------------------- ENREGISTRER + THREAD ---------------------- */
  const handleReservation = async () => {
    try {
      if (!selectedDate || selectedSlots.length === 0) return;

      const idStr = String(id);
      const total = selectedSlots.length * parseFloat(espace.prix || 0);

      const espaceSnap = await getDoc(doc(db, "espaces", idStr));
      const espaceData = espaceSnap.data();

      /* 🔥 Charger le user */
      const userSnap = await getDoc(doc(db, "users", auth.currentUser?.uid || ""));
      const userData = userSnap.exists() ? userSnap.data() : null;

      /* 🔥 Charger l’entreprise */
      const entrepriseSnap = await getDoc(doc(db, "users", espaceData?.uid || ""));
      const entrepriseData = entrepriseSnap.exists() ? entrepriseSnap.data() : null;

      /* ----------------- AJOUT RÉSERVATION ----------------- */
      const docRef = await addDoc(collection(db, "reservations"), {
        espaceId: idStr,
        entrepriseId: espaceData?.uid || null,
        userId: auth.currentUser?.uid || "anonymous",
        date: selectedDate,
        slots: selectedSlots,
        total,
        createdAt: serverTimestamp(),
      });

      /* ----------------- THREAD ----------------- */
      const threadsRef = collection(db, "threads");

      const q = query(
        threadsRef,
        where("userId", "==", auth.currentUser?.uid),
        where("entrepriseId", "==", espaceData?.uid),
        where("espaceId", "==", idStr)
      );

      const threadSnap = await getDocs(q);

      if (threadSnap.empty) {
        // 🚀 Nouveau thread
        await addDoc(threadsRef, {
          userId: auth.currentUser?.uid,
          userName: userData?.name || userData?.email || "Utilisateur",

          entrepriseId: espaceData?.uid,
          entrepriseNom: entrepriseData?.name || entrepriseData?.email || "Entreprise",

          espaceId: idStr,
          espaceNom: espaceData?.nom || "Espace",

          lastMessage: "Nouvelle réservation effectuée",
          updatedAt: Date.now(),

          unreadEntreprise: true,
          unreadUser: false,
        });
      } else {
        // ✏️ Mise à jour
        const threadDoc = threadSnap.docs[0].ref;
        await updateDoc(threadDoc, {
          lastMessage: "Nouvelle réservation effectuée",
          updatedAt: Date.now(),
          unreadEntreprise: true,
        });
      }

      router.push(`/user/reservation_confirmee/${docRef.id}`);
    } catch (e) {
      console.log("Erreur réservation :", e);
      alert("Erreur lors de la réservation");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        <Image
          source={require("../../../assets/images/roomly-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.title}>Disponibilités du local</Text>
          </View>

          <View style={{ width: 32 }} />
        </View>

        {/* CALENDRIER */}
        <View style={styles.calendarContainer}>

          {/* Navigation mois */}
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

          {/* Jours semaine */}
          <View style={styles.weekHeader}>
            {["lu", "ma", "me", "je", "ve", "sa", "di"].map((d) => (
              <Text key={d} style={styles.weekDay}>{d}</Text>
            ))}
          </View>

          {/* Grille des jours */}
          <View style={styles.daysGrid}>
            {Array.from({ length: first === 0 ? 6 : first - 1 }).map((_, i) => (
              <View key={i} style={styles.dayEmpty} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

              const isAvailable = availableDates.includes(dateStr);

              const allSlots = isAvailable ? buildSlotsForDate(dateStr) : [];
              const taken = takenSlotsForDate(dateStr);
              const isFullyBooked =
                isAvailable &&
                allSlots.length > 0 &&
                allSlots.every((s) => taken.includes(s));

              const isSelected = selectedDate === dateStr;

              return (
                <Pressable
                  key={day}
                  onPress={() => isAvailable && !isFullyBooked && selectDate(dateStr)}
                  style={[
                    styles.day,
                    !isAvailable && { backgroundColor: "#F4D1D1" }, // Pas proposé
                    isAvailable && !isFullyBooked && { backgroundColor: "#CDECCE" }, // Disponible
                    isFullyBooked && { backgroundColor: "#F4A7A7" }, // 🔴 Tout réservé
                    isSelected && !isFullyBooked && { backgroundColor: "#8ED0A4" },
                  ]}
                >
                  <Text style={styles.dayText}>{day}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* CRENEAUX */}
        {selectedDate && (
          <>
            <Text style={styles.subtitle}>Choisir une heure</Text>

            {slots.map((slot) => {
              const selected = selectedSlots.includes(slot);
              const taken =
                selectedDate &&
                takenSlotsForDate(selectedDate).includes(slot);

              return (
                <Pressable
                  key={slot}
                  onPress={() => !taken && toggleSlot(slot)}
                  style={[
                    styles.slot,
                    selected && { backgroundColor: "#CDECCE" },
                    taken && { backgroundColor: "#F4A7A7" },
                  ]}
                >
                  <Text style={styles.slotText}>
                    {slot} {taken ? "(indisponible)" : ""}
                  </Text>
                </Pressable>
              );
            })}
          </>
        )}

        {/* TOTAL */}
        {selectedSlots.length > 0 && (
          <Text style={styles.total}>
            Total : {totalPrice}€ pour {selectedSlots.length} h
          </Text>
        )}

        {/* CONFIRM */}
        <Pressable
          style={[
            styles.confirmButton,
            selectedSlots.length === 0 && { opacity: 0.4 },
          ]}
          disabled={selectedSlots.length === 0}
          onPress={() => {
            router.push({
              pathname: `/user/paiement/${id}`,
              params: {
                espaceId: id,
                date: selectedDate!,
                slots: JSON.stringify(selectedSlots),
                total: totalPrice,
              },
            } as any);
          }}
        >
          <Text style={styles.confirmText}>Procéder au paiement</Text>
        </Pressable>

        <View style={{ height: 120 }} />
      </ScrollView>

      <BottomNavBar activeTab="menu" />
    </View>
  );
}

/* ----------------------------- STYLES ----------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },
  content: { alignItems: "center", paddingBottom: 120 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },

  logo: {
    width: 160,
    height: 80,
    marginTop: 20,
    marginBottom: 10,
  },

  title: { fontSize: 20, fontWeight: "700"},

  calendarContainer: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },

  monthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  arrow: { fontSize: 28, paddingHorizontal: 10 },

  monthTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },

  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  weekDay: { width: 32, textAlign: "center", fontWeight: "600" },

  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
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
    marginVertical: 5,
  },

  dayText: { fontSize: 15 },

  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    width: "90%",
    marginBottom: 10,
  },

  slot: {
    width: "90%",
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
  },

  slotText: { fontSize: 15, textAlign: "center" },

  total: { fontSize: 18, fontWeight: "700", marginTop: 20 },

  confirmButton: {
    width: "85%",
    backgroundColor: "#3E7CB1",
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 25,
  },

  confirmText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
  },
  header: {
  width: "90%",
  flexDirection: "row",
  alignItems: "center",      // centre flèche + texte verticalement
  justifyContent: "space-between",
  marginTop: 10,
  marginBottom: 15,          // l’espace sous le titre
},

backButton: {
  width: 32,
  height: 32,
  justifyContent: "center",
  alignItems: "center",
},

backIcon: {
  fontSize: 22,
  fontWeight: "600",
},

headerCenter: {
  flex: 1,
  alignItems: "center",
},

});
