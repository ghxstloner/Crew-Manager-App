import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '../../store/networkStore';

export default function NetworkBanner() {
  const { isConnected } = useNetwork();
  const [showBanner, setShowBanner] = useState(false);
  const [bannerType, setBannerType] = useState<'offline' | 'online'>('offline');
  const slideAnim = useRef(new Animated.Value(100)).current;
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (isConnected === false) {
      setBannerType('offline');
      setShowBanner(true);
      setWasOffline(true);
      
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else if (isConnected === true && wasOffline) {
      setBannerType('online');
      setShowBanner(true);
      
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
      
      setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowBanner(false);
          setWasOffline(false);
        });
      }, 3000);
    }
  }, [isConnected, wasOffline]);

  if (!showBanner) return null;

  const isOffline = bannerType === 'offline';

  return (
    <Animated.View 
      style={[
        styles.banner,
        {
          backgroundColor: isOffline ? '#FF4444' : '#4CAF50',
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.bannerContent}>
        <Ionicons 
          name={isOffline ? "cloud-offline" : "cloud-done"} 
          size={20} 
          color="#FFFFFF" 
        />
        <Text style={styles.bannerText}>
          {isOffline ? 'Sin conexión a internet' : 'Conexión restablecida'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 10,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});