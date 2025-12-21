import React from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Callout, Marker } from "react-native-maps";

type Point = {
  id: string;
  lat: number;
  lng: number;
  nom: string;
  prix?: string | number;
  localisation: string;
};

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export default function RoomlyMap({
  initialRegion,
  points,
  onPressPoint,
}: {
  initialRegion: Region;
  points: Point[];
  onPressPoint: (id: string) => void;
}) {
  return (
    <MapView
      style={StyleSheet.absoluteFillObject}
      initialRegion={initialRegion}
      showsUserLocation
      showsMyLocationButton
    >
      {points.map((p) => (
        <Marker key={p.id} coordinate={{ latitude: p.lat, longitude: p.lng }}>
          <Callout onPress={() => onPressPoint(p.id)}>
            <View style={{ width: 220 }}>
              <Text style={{ fontWeight: "700" }}>{p.nom}</Text>
              <Text>{p.localisation}</Text>
              <Text style={{ fontWeight: "700" }}>{p.prix ?? "-"} €/h</Text>
              <Text style={{ marginTop: 6 }}>Appuyer pour ouvrir</Text>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}
