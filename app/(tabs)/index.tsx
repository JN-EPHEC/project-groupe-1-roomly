import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Logo Roomly */}
      <Image
      source={require('../../assets/images/roomly-logo.png')}
      style={styles.logo}
      contentFit="contain"
      />


      {/* Texte d’intro */}
      <Text style={styles.subtitle}>
        Trouve ou propose un espace de travail, en quelques clics.
      </Text>

      {/* Boutons de choix */}
      <View style={styles.buttons}>
        <Pressable style={styles.button} onPress={() => router.push('/public/signup' as any)}>
          <Text style={styles.buttonText}>Je cherche un espace</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={() => router.push('/public/signup_entreprise' as any)}>
          <Text style={styles.buttonText}>Je loue un espace</Text>
        </Pressable>
      </View>

      {/* Lien de connexion */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Déjà un compte ?</Text>
        <Pressable onPress={() => router.push('/public/login')}>
          <Text style={styles.link}>Connexion</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF3F8', // fond légèrement bleuté
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 160,
    height: 80,
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    marginBottom: 40,
  },
  buttons: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  button: {
    backgroundColor: '#D9D9D9',
    width: '90%',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  footerText: {
    color: '#000',
    fontSize: 14,
  },
  link: {
    color: '#007AFF',
    fontSize: 15,
    marginTop: 4,
  },
});
