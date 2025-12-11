import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { auth, db } from "../../firebaseConfig";

export default function SignupEntreprise() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | null }>({
    message: "",
    type: null,
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: null }), 1800);
  };

  const isPasswordValid = (pwd: string) => {
    const hasMinLength = pwd.length >= 8;
    const hasUppercase = /[A-Z]/.test(pwd);
    const hasDigit = /\d/.test(pwd);
    return hasMinLength && hasUppercase && hasDigit;
  };

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      showToast("Veuillez remplir tous les champs.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Les mots de passe ne correspondent pas.", "error");
      return;
    }

    if (!isPasswordValid(password)) {
      showToast(
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.",
        "error"
      );
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("✅ Compte entreprise créé dans Firebase:", user.uid);

      await setDoc(doc(db, "users", user.uid), {
        email: email,
        companyName: companyName || "Entreprise sans nom",
        type: "entreprise",
        phone:"",
        createdAt: new Date (),
      });

      console.log("✅ Données Firestore enregistrées pour:", email);
      showToast("✅ Compte entreprise créé avec succès !", "success");

      setTimeout(() => {
        router.push("/public/login");
      }, 2500);
    } catch (error: any) {
      console.log("❌ ERREUR FIREBASE:", error);
      let message = "Une erreur est survenue.";

      if (error.code === "auth/email-already-in-use") message = "Cet email est déjà utilisé.";
      else if (error.code === "auth/invalid-email") message = "Adresse email invalide.";
      else if (error.code === "auth/weak-password")
        message = "Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.";
      else if (error.code === "permission-denied")
        message = "Accès Firestore refusé : vérifie tes règles de sécurité.";
      else message = error.message || message;

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

      <Text style={styles.title}>Créer un compte entreprise</Text>
      <Text style={styles.subtitle}>
        Entrez votre adresse mail et définissez votre mot de passe pour commencer à louer
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Nom de votre entreprise"
        value={companyName}
        onChangeText={setCompanyName}
      />
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
      <TextInput
        style={styles.input}
        placeholder="Confirmation du mot de passe"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <Text style={styles.passwordHint}>
        Votre mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.
      </Text>

      <Pressable style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>S’inscrire</Text>
      </Pressable>

      <View style={styles.footer}>
        <Text>Déjà un compte ? </Text>
        <Pressable onPress={() => router.push("/public/login")}>
          <Text style={styles.link}>Se connecter</Text>
        </Pressable>
      </View>

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
    fontSize: 20,
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
  passwordHint: {
    fontSize: 12,
    color: "#444",
    textAlign: "left",
    width: "100%",
    marginBottom: 20,
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
