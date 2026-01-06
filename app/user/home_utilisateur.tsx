// app/user/home_utilisateur.tsx
import { router } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
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
import BottomNavBar from "../../components/BottomNavBar";
import RoomlyMap from "../../components/RoomlyMap";
import { auth, db } from "../../firebaseConfig";

type Espace = {
  id: string;
  nom?: string;
  prix?: string | number;
  capacite?: string | number;
  localisation?: string;
  images?: string[];
  createdAt?: any;
  latitude?: number;
  longitude?: number;
  status?: string;
  boostType?: string | null;
  boostUntil?: any | null;
};

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const isBoostActive = (e: Espace): boolean => {
  if (!e.boostUntil) return false;
  const d = (e.boostUntil as any).toDate
    ? (e.boostUntil as any).toDate()
    : new Date(e.boostUntil as any);
  return d.getTime() > Date.now();
};

export default function HomeUtilisateur() {
  const [nextReservation, setNextReservation] = useState<any>(null);

  const [espaces, setEspaces] = useState<Espace[]>([]);
  const [filteredEspaces, setFilteredEspaces] = useState<Espace[]>([]);

  // 🔹 Recommandations
  const [recommendedEspaces, setRecommendedEspaces] = useState<Espace[]>([]);
  const [loadingReco, setLoadingReco] = useState(true);

  const [activeFilter, setActiveFilter] = useState<
    "Tous" | "Nouveaux lieux" | "Populaires"
  >("Tous");
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minCapacity, setMinCapacity] = useState("");

  const [loading, setLoading] = useState(true);

  // 🔹 vue liste / carte
  const [viewMode, setViewMode] = useState<"liste" | "carte">("liste");

  // 🔹 formulaire de contact / ticket support
  const [contactEmail, setContactEmail] = useState(
    auth.currentUser?.email || ""
  );
  const [contactMessage, setContactMessage] = useState("");
  const [sendingContact, setSendingContact] = useState(false);

  /* ------------------ RECOMMANDATIONS ------------------ */

  const loadRecommendations = async (
    userId: string | null | undefined,
    allEspaces: Espace[]
  ) => {
    try {
      setLoadingReco(true);

      if (!allEspaces || allEspaces.length === 0) {
        setRecommendedEspaces([]);
        return;
      }

      // Si pas connecté → simple recommandation par défaut (premiers espaces)
      if (!userId) {
        setRecommendedEspaces(allEspaces.slice(0, 5));
        return;
      }

      // Réservations de cet utilisateur
      const qResa = query(
        collection(db, "reservations"),
        where("userId", "==", userId)
      );
      const resaSnap = await getDocs(qResa);

      // Aucun historique → fallback simple
      if (resaSnap.empty) {
        setRecommendedEspaces(allEspaces.slice(0, 5));
        return;
      }

      // Compter le nombre de réservations par espace
      const counts: Record<string, number> = {};
      resaSnap.forEach((d) => {
        const data = d.data() as any;
        const eId = data.espaceId;
        if (!eId) return;
        counts[eId] = (counts[eId] || 0) + 1;
      });

      const sortedIds = Object.entries(counts)
        .sort((a, b) => b[1] - a[1]) // plus fréquent → en premier
        .slice(0, 5)
        .map(([espaceId]) => espaceId);

      const recoList: Espace[] = [];
      for (const espaceId of sortedIds) {
        const found = allEspaces.find((e) => e.id === espaceId);
        if (found) recoList.push(found);
      }

      // Si pour une raison quelconque aucune correspondance, fallback
      if (recoList.length === 0) {
        setRecommendedEspaces(allEspaces.slice(0, 5));
      } else {
        setRecommendedEspaces(recoList);
      }
    } catch (e) {
      console.log("Erreur chargement recommandations :", e);
      setRecommendedEspaces([]);
    } finally {
      setLoadingReco(false);
    }
  };

  /* ------------------ LOAD DATA ------------------ */
  useEffect(() => {
    const loadData = async () => {
      try {
        const userId = auth.currentUser?.uid;

        // 1) Prochaine réservation
        if (userId) {
          const qResa = query(
            collection(db, "reservations"),
            where("userId", "==", userId),
            orderBy("date", "asc"),
            limit(1)
          );

          const snap = await getDocs(qResa);
          if (!snap.empty) {
            const r = snap.docs[0].data();

            const espaceSnap = await getDoc(doc(db, "espaces", r.espaceId));
            const espace = espaceSnap.exists() ? espaceSnap.data() : null;

            setNextReservation({
              id: snap.docs[0].id,
              ...r,
              espace,
            });
          } else {
            setNextReservation(null);
          }
        }

        // 2) Espaces disponibles
        const eSnap = await getDocs(collection(db, "espaces"));
        const rawList = eSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        const list: Espace[] = rawList.filter((e: any) => {
          if (e.status === "en attente de validation") return false;
          if (e.status === "desactive") return false; // espace désactivé par l’entreprise
          return true;
        });

        setEspaces(list);
        setFilteredEspaces(list);

        // 3) Recommandations en fonction de l'historique
        await loadRecommendations(userId, list);
      } catch (e) {
        console.log("Erreur load home:", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /* ------------------ CONTACT / TICKET SUPPORT ------------------ */
  const handleSendContact = async () => {
    if (!contactEmail.trim() || !contactMessage.trim()) {
      Alert.alert("Oups", "Merci de remplir l’e-mail et le message.");
      return;
    }

    try {
      setSendingContact(true);

      await addDoc(collection(db, "supportTickets"), {
        userId: auth.currentUser?.uid || null,
        email: contactEmail.trim(),
        message: contactMessage.trim(),
        fromType: "utilisateur",
        status: "ouvert",
        createdAt: serverTimestamp(),
        lastUpdatedAt: serverTimestamp(),
      });

      setContactMessage("");
      Alert.alert(
        "Ticket créé",
        "Votre ticket support a été créé. Vous pouvez suivre son état dans 'Mes tickets'."
      );

      router.push("/user/mes_tickets");
    } catch (e) {
      console.log("Erreur contact utilisateur :", e);
      Alert.alert("Erreur", "Impossible de créer le ticket pour le moment.");
    } finally {
      setSendingContact(false);
    }
  };

  /* ------------------ APPLY FILTERS ------------------ */
  const applyFilters = async (
    newFilter: "Tous" | "Nouveaux lieux" | "Populaires",
    newSearch: string,
    newMaxPrice: string,
    newMinCapacity: string
  ) => {
    let result: Espace[] = [...espaces];

    if (newFilter === "Populaires") {
      const rSnap = await getDocs(collection(db, "reservations"));
      const reservations = rSnap.docs.map((d) => d.data() as any);

      const hoursMap: Record<string, number> = {};
      for (const r of reservations) {
        if (!r.espaceId) continue;
        const totalHours = r.slots?.length || 0;
        if (!hoursMap[r.espaceId]) hoursMap[r.espaceId] = 0;
        hoursMap[r.espaceId] += totalHours;
      }

      result = result
        .map((e) => ({
          ...e,
          popularityHours: hoursMap[e.id] || 0,
        }))
        .sort((a: any, b: any) => b.popularityHours - a.popularityHours)
        .slice(0, 2);
    }

    if (newFilter === "Nouveaux lieux") {
      result = result.filter((e: any) => {
        if (!e.createdAt) return false;
        const date = e.createdAt?.toDate
          ? e.createdAt.toDate()
          : new Date(e.createdAt);
        return Date.now() - date.getTime() < 72 * 3600 * 1000;
      });
    }

    if (newSearch.trim().length > 0) {
      const s = newSearch.toLowerCase();
      result = result.filter((e) =>
        ((e.localisation || "") + " " + (e.nom || ""))
          .toLowerCase()
          .includes(s)
      );
    }

    const maxP = Number(newMaxPrice.replace(",", "."));
    if (!isNaN(maxP) && maxP > 0) {
      result = result.filter((e) => {
        const p = Number(e.prix);
        return !isNaN(p) && p <= maxP;
      });
    }

    const minC = parseInt(newMinCapacity, 10);
    if (!isNaN(minC) && minC > 0) {
      result = result.filter((e) => {
        const c = Number(e.capacite);
        return !isNaN(c) && c >= minC;
      });
    }

    const now = Date.now();
    result.sort((a, b) => {
      const aBoost =
        a.boostUntil &&
        ((a.boostUntil as any).toDate
          ? (a.boostUntil as any).toDate().getTime()
          : new Date(a.boostUntil as any).getTime()) > now;
      const bBoost =
        b.boostUntil &&
        ((b.boostUntil as any).toDate
          ? (b.boostUntil as any).toDate().getTime()
          : new Date(b.boostUntil as any).getTime()) > now;

      if (aBoost && !bBoost) return -1;
      if (!aBoost && bBoost) return 1;
      return 0;
    });

    setFilteredEspaces(result);
  };

  const changeFilter = async (f: "Tous" | "Nouveaux lieux" | "Populaires") => {
    setActiveFilter(f);
    await applyFilters(f, search, maxPrice, minCapacity);
  };

  const handleSearch = (txt: string) => {
    setSearch(txt);
    applyFilters(activeFilter, txt, maxPrice, minCapacity);
  };

  const handleMaxPriceChange = (txt: string) => {
    setMaxPrice(txt);
    applyFilters(activeFilter, search, txt, minCapacity);
  };

  const handleMinCapacityChange = (txt: string) => {
    setMinCapacity(txt);
    applyFilters(activeFilter, search, maxPrice, txt);
  };

  /* ------------------ MAP POINTS ------------------ */
  const mapPoints = useMemo(
    () =>
      filteredEspaces
        .filter(
          (e) =>
            typeof e.latitude === "number" && typeof e.longitude === "number"
        )
        .map((e) => ({
          id: e.id,
          lat: e.latitude as number,
          lng: e.longitude as number,
          nom: e.nom || "Espace",
          prix: e.prix,
          localisation: e.localisation || "",
        })),
    [filteredEspaces]
  );

  const initialRegion: Region = useMemo(() => {
    if (mapPoints.length > 0) {
      return {
        latitude: mapPoints[0].lat,
        longitude: mapPoints[0].lng,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }
    return {
      latitude: 50.8466,
      longitude: 4.3528,
      latitudeDelta: 0.2,
      longitudeDelta: 0.2,
    };
  }, [mapPoints]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#3E7CB1" />
      </View>
    );
  }

  /* ------------------ RENDU ------------------ */
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* LOGO */}
        <Image
          source={require("../../assets/images/roomly-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* TITRE */}
        <Text style={styles.hello}>
          Bonjour {auth.currentUser?.displayName || "utilisateur"} !
        </Text>

        {/* PROCHAINE RÉSERVATION */}
        {nextReservation ? (
          <View style={styles.nextResaBox}>
            <Text style={styles.sectionTitleCenter}>
              Votre prochaine réservation
            </Text>

            {nextReservation.espace?.images?.[0] && (
              <Image
                source={{ uri: nextReservation.espace.images[0] }}
                style={styles.nextImage}
              />
            )}

            <Text style={styles.espaceName}>
              {nextReservation.espace?.nom}
            </Text>
            <Text style={styles.date}>Date: {nextReservation.date}</Text>
            <Text style={styles.slots}>
              Heure: {nextReservation.slots.join(", ")}
            </Text>
            <Text style={styles.price}>
              Prix: {nextReservation.total}€
            </Text>

            <Pressable
              style={styles.detailsBtn}
              onPress={() =>
                router.push(`/user/mes_reservations/${nextReservation.id}`)
              }
            >
              <Text style={styles.detailsBtnText}>Voir les détails</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.nextResaBox}>
            <Text style={styles.sectionTitleCenter}>
              Aucune réservation à venir
            </Text>
            <Text style={{ marginBottom: 10 }}>
              Réserve ton premier bureau ci-dessous !
            </Text>
          </View>
        )}

        {/* BOUTON MES RÉSERVATIONS */}
        <Pressable
          style={styles.mainButton}
          onPress={() => router.push("/user/mes_reservations/liste")}
        >
          <Text style={styles.mainButtonText}>Voir mes réservations</Text>
        </Pressable>

        {/* BOUTONS FAQ + MES TICKETS */}
        <View style={styles.secondaryButtonsRow}>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push("/user/faq")}
          >
            <Text style={styles.secondaryButtonText}>FAQ</Text>
          </Pressable>

          <Pressable
            style={[styles.secondaryButton, { marginLeft: 8 }]}
            onPress={() => router.push("/user/mes_tickets")}
          >
            <Text style={styles.secondaryButtonText}>Mes tickets</Text>
          </Pressable>
        </View>

        {/* SECTION RECOMMANDÉ POUR VOUS */}
        {!loadingReco && recommendedEspaces.length > 0 && (
          <>
            <Text style={styles.sectionTitleLeft}>Recommandé pour vous</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.recoScroll}
            >
              {recommendedEspaces.map((e) => (
                <Pressable
                  key={e.id}
                  style={styles.recoCard}
                  onPress={() =>
                    router.push(`/user/details_espace/${e.id}`)
                  }
                >
                  {e.images?.[0] ? (
                    <Image
                      source={{ uri: e.images[0] }}
                      style={styles.recoImage}
                    />
                  ) : (
                    <Image
                      source={require("../../assets/images/roomly-logo.png")}
                      style={styles.recoImage}
                    />
                  )}
                  <Text style={styles.recoName} numberOfLines={1}>
                    {e.nom || "Espace"}
                  </Text>
                  <Text style={styles.recoLocation} numberOfLines={1}>
                    {e.localisation || ""}
                  </Text>
                  {e.prix && (
                    <Text style={styles.recoPrice}>{e.prix} €/h</Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {/* BUREAUX */}
        <Text style={styles.sectionTitleLeft}>Bureaux disponibles</Text>

        {/* Recherche texte */}
        <TextInput
          placeholder="Rechercher une localisation..."
          placeholderTextColor="#777"
          style={styles.searchInput}
          value={search}
          onChangeText={handleSearch}
        />

        {/* Filtres avancés : prix & capacité */}
        <View style={styles.advancedFilterRow}>
          <TextInput
            placeholder="Prix max €/h"
            placeholderTextColor="#777"
            style={styles.advancedInput}
            keyboardType="numeric"
            value={maxPrice}
            onChangeText={handleMaxPriceChange}
          />
          <TextInput
            placeholder="Capacité min"
            placeholderTextColor="#777"
            style={styles.advancedInput}
            keyboardType="numeric"
            value={minCapacity}
            onChangeText={handleMinCapacityChange}
          />
        </View>

        {/* FILTRES (Tous / Nouveaux / Populaires) */}
        <View style={styles.filterRow}>
          {(["Tous", "Nouveaux lieux", "Populaires"] as const).map((f) => (
            <Pressable
              key={f}
              style={[styles.filter, activeFilter === f && styles.filterActive]}
              onPress={() => changeFilter(f)}
            >
              <Text
                style={{
                  fontWeight: activeFilter === f ? "700" : "400",
                  color: activeFilter === f ? "#fff" : "#000",
                }}
              >
                {f}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* TOGGLE LISTE / CARTE */}
        <View style={styles.viewToggleRow}>
          <Pressable
            style={[
              styles.viewToggleBtn,
              viewMode === "liste" && styles.viewToggleBtnActive,
            ]}
            onPress={() => setViewMode("liste")}
          >
            <Text
              style={[
                styles.viewToggleText,
                viewMode === "liste" && styles.viewToggleTextActive,
              ]}
            >
              Vue liste
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.viewToggleBtn,
              viewMode === "carte" && styles.viewToggleBtnActive,
            ]}
            onPress={() => setViewMode("carte")}
          >
            <Text
              style={[
                styles.viewToggleText,
                viewMode === "carte" && styles.viewToggleTextActive,
              ]}
            >
              Vue carte
            </Text>
          </Pressable>
        </View>

        {/* LISTE ESPACES (MODE LISTE, VERTICALE EN GRILLE 2 COLONNES) */}
        {viewMode === "liste" && (
          <View style={styles.gridContainer}>
            {filteredEspaces.length === 0 ? (
              <Text style={styles.emptyText}>Aucun espace disponible.</Text>
            ) : (
              filteredEspaces.reduce<JSX.Element[]>((rows, _, idx, arr) => {
                if (idx % 2 !== 0) return rows;

                const first = arr[idx];
                const second = arr[idx + 1];

                rows.push(
                  <View key={`row-${idx}`} style={styles.gridRow}>
                    {/* Carte 1 */}
                    <Pressable
                      style={[
                        styles.espaceCardVertical,
                        second && { marginRight: 8 },
                      ]}
                      onPress={() =>
                        router.push(`/user/details_espace/${first.id}`)
                      }
                    >
                      {first.images?.[0] ? (
                        <Image
                          source={{ uri: first.images[0] }}
                          style={styles.espaceImageVertical}
                        />
                      ) : (
                        <Image
                          source={require("../../assets/images/roomly-logo.png")}
                          style={styles.espaceImageVertical}
                        />
                      )}

                      {isBoostActive(first) && (
                        <View style={styles.boostBadge}>
                          <Text style={styles.boostBadgeText}>Top listing</Text>
                        </View>
                      )}

                      <Text style={styles.espaceCardTitle} numberOfLines={1}>
                        {first.nom || "Espace"}
                      </Text>
                      <Text style={styles.priceSmall}>{first.prix} €/h</Text>
                      <Text style={styles.locationSmall} numberOfLines={1}>
                        {first.localisation || ""}
                      </Text>
                    </Pressable>

                    {/* Carte 2 (si existe) */}
                    {second ? (
                      <Pressable
                        style={styles.espaceCardVertical}
                        onPress={() =>
                          router.push(`/user/details_espace/${second.id}`)
                        }
                      >
                        {second.images?.[0] ? (
                          <Image
                            source={{ uri: second.images[0] }}
                            style={styles.espaceImageVertical}
                          />
                        ) : (
                          <Image
                            source={require("../../assets/images/roomly-logo.png")}
                            style={styles.espaceImageVertical}
                          />
                        )}

                        {isBoostActive(second) && (
                          <View style={styles.boostBadge}>
                            <Text style={styles.boostBadgeText}>
                              Top listing
                            </Text>
                          </View>
                        )}

                        <Text style={styles.espaceCardTitle} numberOfLines={1}>
                          {second.nom || "Espace"}
                        </Text>
                        <Text style={styles.priceSmall}>
                          {second.prix} €/h
                        </Text>
                        <Text style={styles.locationSmall} numberOfLines={1}>
                          {second.localisation || ""}
                        </Text>
                      </Pressable>
                    ) : (
                      <View style={[styles.espaceCardVertical, { opacity: 0 }]} />
                    )}
                  </View>
                );

                return rows;
              }, [])
            )}
          </View>
        )}

        {/* CARTE (MODE CARTE) */}
        {viewMode === "carte" && (
          <View style={styles.mapWrapper}>
            <RoomlyMap
              initialRegion={initialRegion}
              points={mapPoints}
              onPressPoint={(id: string) =>
                router.push(`/user/details_espace/${id}`)
              }
            />
          </View>
        )}

        {/* FORMULAIRE CONTACT / TICKET — EN BAS DE LA PAGE */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Une question ?</Text>
          <Text style={styles.contactSubtitle}>
            Écris-nous, l’équipe Roomly te répondra.
          </Text>

          <TextInput
            style={styles.contactInput}
            placeholder="Ton adresse e-mail"
            placeholderTextColor="#777"
            keyboardType="email-address"
            autoCapitalize="none"
            value={contactEmail}
            onChangeText={setContactEmail}
          />

          <TextInput
            style={[styles.contactInput, styles.contactTextarea]}
            placeholder="Ton message"
            placeholderTextColor="#777"
            multiline
            numberOfLines={4}
            value={contactMessage}
            onChangeText={setContactMessage}
          />

          <Pressable
            style={[
              styles.contactButton,
              sendingContact && { opacity: 0.7 },
            ]}
            onPress={handleSendContact}
            disabled={sendingContact}
          >
            <Text style={styles.contactButtonText}>
              {sendingContact ? "Création..." : "Créer un ticket support"}
            </Text>
          </Pressable>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      <BottomNavBar activeTab="menu" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3F8" },
  content: { alignItems: "center", width: "100%" },

  logo: {
    width: "80%",
    height: 80,
    marginTop: 25,
    marginBottom: 10,
    alignSelf: "center",
  },

  hello: { fontSize: 22, fontWeight: "700", marginBottom: 10 },

  nextResaBox: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 15,
    alignItems: "center",
  },

  sectionTitleCenter: {
    width: "90%",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },

  sectionTitleLeft: {
    width: "90%",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  nextImage: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    marginBottom: 10,
  },

  espaceName: { fontSize: 18, fontWeight: "700" },
  date: { marginTop: 5 },
  slots: { marginTop: 3 },
  price: { marginTop: 3, fontWeight: "700" },

  detailsBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#3E7CB1",
    borderRadius: 10,
  },
  detailsBtnText: { color: "#fff", fontWeight: "700" },

  mainButton: {
    width: "85%",
    backgroundColor: "#3E7CB1",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  mainButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  /* FAQ / Contact / Tickets (liens) */
  secondaryButtonsRow: {
    width: "85%",
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3E7CB1",
  },
  secondaryButtonText: {
    color: "#3E7CB1",
    fontWeight: "600",
    fontSize: 14,
  },

  /* Recommandations */
  recoScroll: {
    width: "90%",
    marginBottom: 10,
  },
  recoCard: {
    width: 180,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    marginRight: 10,
  },
  recoImage: {
    width: "100%",
    height: 90,
    borderRadius: 10,
    marginBottom: 6,
  },
  recoName: {
    fontSize: 14,
    fontWeight: "700",
  },
  recoLocation: {
    fontSize: 12,
    color: "#555",
    marginTop: 2,
  },
  recoPrice: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    color: "#3E7CB1",
  },

  /* Formulaire contact (en bas) */
  contactCard: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 14,
    marginTop: 10,
    marginBottom: 20,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 13,
    color: "#555",
    marginBottom: 8,
  },
  contactInput: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 8,
  },
  contactTextarea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  contactButton: {
    marginTop: 4,
    backgroundColor: "#3E7CB1",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  contactButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  searchInput: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 8,
  },

  advancedFilterRow: {
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  advancedInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#ccc",
    marginHorizontal: 3,
  },

  filterRow: {
    flexDirection: "row",
    justifyContent: "center",
    width: "90%",
    marginBottom: 10,
  },
  filter: {
    backgroundColor: "#ddd",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  filterActive: {
    backgroundColor: "#3E7CB1",
  },

  /* Toggle vue liste / carte */
  viewToggleRow: {
    width: "90%",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
    gap: 8,
  },
  viewToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#3E7CB1",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  viewToggleBtnActive: {
    backgroundColor: "#3E7CB1",
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3E7CB1",
  },
  viewToggleTextActive: {
    color: "#fff",
    fontWeight: "700",
  },

  /* Grille 2 colonnes */
  gridContainer: {
    width: "90%",
    marginBottom: 10,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  espaceCardVertical: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    position: "relative",
  },
  espaceImageVertical: {
    width: "100%",
    height: 100,
    borderRadius: 10,
    marginBottom: 8,
  },

  boostBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#8e44ad",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  boostBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  espaceCardTitle: { fontWeight: "700", marginBottom: 3 },
  priceSmall: { fontWeight: "700", color: "#3E7CB1" },
  locationSmall: { marginTop: 4, color: "#555", fontSize: 12 },

  emptyText: {
    textAlign: "center",
    color: "#555",
    marginTop: 8,
    marginBottom: 12,
  },

  mapWrapper: {
    width: "90%",
    height: 280,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#dcdcdc",
    marginBottom: 10,
  },

  mapEmptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.75)",
  },
});
