import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ComposantText(){
    return(
        <View style={styles.container}>
            <Text style={styles.text}>Yo, je suis ton composant.</Text>
        </View>
    );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#4dd57aff',
    borderRadius: 10,
    margin: 10,
  },
  text: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
});
