import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { auth, db } from "../../firebaseConfig";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | null }>({
    message: "",
    type: null,
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: null }), 1800);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showToast("Veuillez remplir tous les champs.", "error");
      return;
    }

    try {
      // Connexion à Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("✅ Connecté avec succès :", user.uid);

      // On va chercher son type dans Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data() as any;
        console.log("📄 Données Firestore :", userData);

        showToast("✅ Connexion réussie !", "success");

        // Redirection selon le type
        setTimeout(() => {
          if (userData.type === "entreprise") {
            router.replace("/entreprise/home_entreprise");
          } else if (userData.type === "admin") {
            router.replace("/admin/admin_home");
          } else if (userData.type === "utilisateur") {
            router.replace("/user/home_utilisateur");
          } else {
            showToast("Type d'utilisateur inconnu.", "error");
          }
        }, 2000);
      } else {
        showToast("Aucun compte trouvé dans Firestore.", "error");
      }
    } catch (error: any) {
      console.log("❌ ERREUR LOGIN:", error);
      let message = "Erreur de connexion.";
      if (error.code === "auth/invalid-email") message = "Adresse email invalide.";
      else if (error.code === "auth/user-not-found") message = "Aucun compte trouvé avec cet email.";
      else if (error.code === "auth/wrong-password") message = "Mot de passe incorrect.";
      showToast(`❌ ${message}`, "error");
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/roomly-logo.png")}
        style={styles.logo}
        contentFit="contain"
      />

      <Text style={styles.title}>Connexion</Text>
      <Text style={styles.subtitle}>Connectez-vous à votre compte Roomly</Text>

      <TextInput
        style={styles.input}
        placeholder="adresse@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Se connecter</Text>
      </Pressable>

      <View style={styles.footer}>
        <Text>Pas encore de compte ? </Text>
        <Pressable onPress={() => router.push("/public/signup")}>
          <Text style={styles.link}>S’inscrire</Text>
        </Pressable>
      </View>

      {/* ✅ Notification (succès / erreur) */}
      {toast.type && (
        <View
          style={[
            styles.toast,
            toast.type === "success" ? styles.toastSuccess : styles.toastError,
          ]}
        >
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF3F8",
    padding: 24,
    alignItems: "center",
  },
  logo: {
    width: 160,
    height: 80,
    marginBottom: 30,
    marginTop: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
    color: "#000",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#333",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    backgroundColor: "#D9D9D9",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  button: {
    backgroundColor: "#184E77",
    borderRadius: 30,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
  },
  link: {
    color: "#007AFF",
    fontSize: 15,
  },
  toast: {
    position: "absolute",
    top: "40%",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  toastText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
  toastSuccess: {
    backgroundColor: "#2ecc71",
  },
  toastError: {
    backgroundColor: "#e74c3c",
  },
});
