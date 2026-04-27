import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '1.5rem'
};

const centerDefault = {
  lat: -23.5505,
  lng: -46.6333
};

export default function MapaCliente() {
  const [motoristas, setMotoristas] = useState<any[]>([]);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || ''
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'motoristas_online'), (snap) => {
      const lista = snap.docs.map(doc => doc.data());
      // Filtra apenas os motoristas disponíveis para aparecerem no mapa
      setMotoristas(lista.filter(m => m.status === 'disponivel'));
    });

    return () => unsub();
  }, []);

  if (!isLoaded) return <div className="h-full w-full bg-slate-200 animate-pulse rounded-3xl"></div>;

  return (
    <div className="h-48 w-full mb-6 rounded-3xl overflow-hidden shadow-inner border-4 border-slate-100">
        <GoogleMap mapContainerStyle={containerStyle} center={centerDefault} zoom={12} options={{ disableDefaultUI: true }}>
          {motoristas.map((m, i) => (
            <Marker
              key={i}
              position={{ lat: m.lat, lng: m.lng }}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#22c55e",
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "#ffffff"
              }}
            />
          ))}
        </GoogleMap>
    </div>
  );
}
