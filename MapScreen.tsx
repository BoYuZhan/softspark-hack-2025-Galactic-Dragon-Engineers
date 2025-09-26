/**
 * Map Screen Component with Location Features
 * @format
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';

// API Configuration
const API_BASE_URL = 'http://localhost:8000';

interface Location {
  latitude: number;
  longitude: number;
  timestamp?: string;
  description?: string;
}

interface CustomMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  type: 'landmark' | 'user' | 'shared';
}

interface MapScreenProps {
  onBack: () => void;
  username: string;
  userId?: number;
  activeTab?: 'maps' | 'events' | 'chats' | 'local' | 'friends' | 'profile';
  onTabPress?: (tab: 'maps' | 'events' | 'chats' | 'local' | 'friends' | 'profile') => void;
  safeAreaInsets?: any;
}

export default function MapScreen({ onBack, username, userId, activeTab, onTabPress, safeAreaInsets }: MapScreenProps) {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [customMarkers, setCustomMarkers] = useState<CustomMarker[]>([]);
  const [sharedLocations, setSharedLocations] = useState<CustomMarker[]>([]);
  const [meetupMarkers, setMeetupMarkers] = useState<CustomMarker[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentRegion, setCurrentRegion] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareDescription, setShareDescription] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackingInterval, setTrackingInterval] = useState(5000); // 5 seconds
  const [showIntervalModal, setShowIntervalModal] = useState(false);
  const [showMeetupModal, setShowMeetupModal] = useState(false);
  const [meetupLocation, setMeetupLocation] = useState('');
  const [meetupActivities, setMeetupActivities] = useState('');
  const [meetupMeters, setMeetupMeters] = useState('100');
  const [activeMeetup, setActiveMeetup] = useState<any>(null);
  const [joinedMeetups, setJoinedMeetups] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'friends' | 'meetups'>('all');
  const mapRef = useRef<MapView>(null);
  const watchIdRef = useRef<number | null>(null);

  const intervalOptions = [
    { label: '1 second', value: 1000 },
    { label: '5 seconds', value: 5000 },
    { label: '10 seconds', value: 10000 },
    { label: '30 seconds', value: 30000 },
    { label: '1 minute', value: 60000 },
  ];

  // Get current location on component mount
  useEffect(() => {
    getCurrentLocation();
    fetchCustomMarkers();
    fetchSharedLocations();
    fetchJoinedMeetups();
    
    // Cleanup location tracking on unmount
    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Fetch markers when maps tab becomes active
  useEffect(() => {
    if (activeTab === 'maps') {
      fetchCustomMarkers();
      fetchSharedLocations();
    }
  }, [activeTab, userId]);

  // Check and request location permissions
  const checkLocationPermissions = () => {
    Geolocation.requestAuthorization();
  };

  const getCurrentLocation = () => {
    setLoading(true);
    checkLocationPermissions();
    Geolocation.getCurrentPosition(
      (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date().toISOString(),
          description: 'Current location',
        };
        
        // Debug: Log the actual coordinates
        console.log('📍 Current Location Coordinates:', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        });
        
        setCurrentLocation(location);
        updateLocationOnServer(location);
        
        // Update current region and center map on current location
        const newRegion = {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setCurrentRegion(newRegion);
        
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        Alert.alert('Error', 'Failed to get current location. Please check location permissions.');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0, // Don't use cached location, always get fresh data
      }
    );
  };

  // Start continuous location tracking
  const startLocationTracking = () => {
    if (watchIdRef.current !== null) {
      return; // Already tracking
    }

    checkLocationPermissions();
    setIsTracking(true);
    watchIdRef.current = Geolocation.watchPosition(
      (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date().toISOString(),
          description: 'Live location',
        };
        setCurrentLocation(location);
        updateLocationOnServer(location);
        
        // Smoothly animate map to new location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000); // 1 second animation
        }
      },
      (error) => {
        console.error('Error tracking location:', error);
        Alert.alert('Location Error', 'Failed to track location. Please check permissions.');
        stopLocationTracking();
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Update every 10 meters
        interval: trackingInterval,
      }
    );
  };

  // Stop continuous location tracking
  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  // Toggle location tracking
  const toggleLocationTracking = () => {
    if (isTracking) {
      stopLocationTracking();
    } else {
      startLocationTracking();
    }
  };

  const updateLocationOnServer = async (location: Location) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/location/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(location),
      });
      
      const data = await response.json();
      if (data.success) {
        console.log('Location updated on server');
      }
    } catch (error) {
      console.error('Error updating location on server:', error);
    }
  };

  const handleFilterPress = (filter: 'friends' | 'meetups') => {
    setActiveFilter(filter);
    
    // Show different content based on filter
    if (filter === 'friends') {
      fetchCustomMarkers();
    } else if (filter === 'meetups') {
      fetchAllMeetups();
    }
  };

  const fetchCustomMarkers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/location/friends_markers?user_id=${userId || 1}`);
      const data = await response.json();
      
      if (data.success) {
        setCustomMarkers(data.markers);
      }
    } catch (error) {
      console.error('Error fetching custom markers:', error);
    }
  };

  const fetchSharedLocations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/location/shared`);
      const data = await response.json();
      
      if (data.success) {
        const sharedMarkers: CustomMarker[] = data.locations.map((loc: any) => ({
          id: loc.id,
          latitude: loc.latitude,
          longitude: loc.longitude,
          title: loc.description,
          description: `Shared by ${loc.shared_by}`,
          type: 'shared' as const,
        }));
        setSharedLocations(sharedMarkers);
      }
    } catch (error) {
      console.error('Error fetching shared locations:', error);
    }
  };

  const fetchAllMeetups = async () => {
    try {
      // Fetch meetups from all users (we'll need to create this endpoint)
      const response = await fetch(`${API_BASE_URL}/api/meetup/all`);
      const data = await response.json();
      
      if (data.success) {
        const meetupMarkersData: CustomMarker[] = data.meetups.map((meetup: any) => ({
          id: `meetup_${meetup.id}`,
          latitude: meetup.latitude,
          longitude: meetup.longitude,
          title: meetup.location,
          description: `${meetup.activities} (${meetup.meters}m radius) - Host: ${meetup.host_username}`,
          type: 'meetup' as const,
        }));
        setMeetupMarkers(meetupMarkersData);
      }
    } catch (error) {
      console.error('Error fetching meetups:', error);
    }
  };

  const fetchJoinedMeetups = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/meetup/joined/${userId || 1}`);
      const data = await response.json();
      
      if (data.success) {
        setJoinedMeetups(data.meetups);
      }
    } catch (error) {
      console.error('Error fetching joined meetups:', error);
    }
  };

  const joinMeetup = async (meetupId: number) => {
    // Check if user is already in a meetup
    if (joinedMeetups.length > 0 || activeMeetup) {
      Alert.alert('Cannot Join', 'You are already in a meetup. Please leave your current meetup before joining another one.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/meetup/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetup_id: meetupId,
          user_id: userId || 1
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'You have joined the meetup!');
        // Refresh joined meetups
        fetchJoinedMeetups();
      } else {
        Alert.alert('Error', data.message || 'Failed to join meetup');
      }
    } catch (error) {
      console.error('Error joining meetup:', error);
      Alert.alert('Error', 'Failed to join meetup');
    }
  };

  const leaveMeetup = async (meetupId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/meetup/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetup_id: meetupId,
          user_id: userId || 1
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'You have left the meetup!');
        // Refresh joined meetups
        fetchJoinedMeetups();
      } else {
        Alert.alert('Error', data.message || 'Failed to leave meetup');
      }
    } catch (error) {
      console.error('Error leaving meetup:', error);
      Alert.alert('Error', 'Failed to leave meetup');
    }
  };

  const zoomIn = () => {
    const newRegion = {
      ...currentRegion,
      latitudeDelta: currentRegion.latitudeDelta * 0.5,
      longitudeDelta: currentRegion.longitudeDelta * 0.5,
    };
    setCurrentRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 1000);
  };

  const zoomOut = () => {
    const newRegion = {
      ...currentRegion,
      latitudeDelta: Math.min(currentRegion.latitudeDelta * 2, 10), // Max zoom out
      longitudeDelta: Math.min(currentRegion.longitudeDelta * 2, 10), // Max zoom out
    };
    setCurrentRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 1000);
  };

  const shareCurrentLocation = async () => {
    if (!currentLocation) {
      Alert.alert('Error', 'No current location available');
      return;
    }

    try {
      setLoading(true);
      const shareData = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        description: shareDescription || 'Shared location',
        share_with: ['testuser'], // In a real app, this would be dynamic
      };

      const response = await fetch(`${API_BASE_URL}/api/location/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shareData),
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Location shared successfully!');
        setShowShareModal(false);
        setShareDescription('');
        fetchSharedLocations(); // Refresh shared locations
      } else {
        Alert.alert('Error', 'Failed to share location');
      }
    } catch (error) {
      console.error('Error sharing location:', error);
      Alert.alert('Error', 'Failed to share location');
    } finally {
      setLoading(false);
    }
  };

  const createMeetup = async () => {
    if (!meetupLocation.trim() || !meetupActivities.trim()) {
      Alert.alert('Error', 'Please fill in location and activities');
      return;
    }

    // Check if user is already in a meetup (but allow updates to active meetup)
    if (!activeMeetup && (joinedMeetups.length > 0)) {
      Alert.alert('Cannot Create', 'You are already in a meetup. Please leave your current meetup before creating a new one.');
      return;
    }

    try {
      setLoading(true);
      const isUpdate = activeMeetup !== null;
      
      if (isUpdate) {
        // Update existing meetup
        const updateData = {
          meetup_id: activeMeetup.id,
          location: meetupLocation,
          activities: meetupActivities,
          meters: parseInt(meetupMeters) || 100,
          latitude: currentLocation?.latitude || 0,
          longitude: currentLocation?.longitude || 0,
        };

        const response = await fetch(`${API_BASE_URL}/api/meetup/update`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        const data = await response.json();
        
        if (data.success) {
          Alert.alert('Success', 'Meetup updated successfully!');
          setShowMeetupModal(false);
          setActiveMeetup(data.meetup); // Update the active meetup with new data
          setMeetupLocation('');
          setMeetupActivities('');
          setMeetupMeters('100');
        } else {
          Alert.alert('Error', data.message || 'Failed to update meetup');
        }
      } else {
        // Create new meetup
        const meetupData = {
          location: meetupLocation,
          activities: meetupActivities,
          meters: parseInt(meetupMeters) || 100,
          latitude: currentLocation?.latitude || 0,
          longitude: currentLocation?.longitude || 0,
          created_by: username,
        };

        const response = await fetch(`${API_BASE_URL}/api/meetup/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(meetupData),
        });

        const data = await response.json();
        
        if (data.success) {
          Alert.alert('Success', 'Meetup created successfully!');
          setShowMeetupModal(false);
          setActiveMeetup(data.meetup); // Set the active meetup
          setMeetupLocation('');
          setMeetupActivities('');
          setMeetupMeters('100');
        } else {
          Alert.alert('Error', data.message || 'Failed to create meetup');
        }
      }
    } catch (error) {
      console.error('Error with meetup:', error);
      Alert.alert('Error', 'Failed to process meetup');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMeetup = () => {
    if (activeMeetup) {
      setMeetupLocation(activeMeetup.location);
      setMeetupActivities(activeMeetup.activities);
      setMeetupMeters(activeMeetup.meters.toString());
      setShowMeetupModal(true);
    }
  };

  const handleInviteToMeetup = () => {
    Alert.alert('Invite Friends', 'Invite functionality coming soon!');
  };

  const handleEndMeetup = () => {
    Alert.alert(
      'End Meetup',
      'Are you sure you want to end this meetup?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'End',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await fetch(`${API_BASE_URL}/api/meetup/end/${userId || 1}`, {
                method: 'DELETE',
              });

              const data = await response.json();
              
              if (data.success) {
                setActiveMeetup(null); // Return to pre-meetup state
                Alert.alert('Success', 'Meetup ended successfully!');
              } else {
                Alert.alert('Error', data.message || 'Failed to end meetup');
              }
            } catch (error) {
              console.error('Error ending meetup:', error);
              Alert.alert('Error', 'Failed to end meetup');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'user':
        return '#007AFF'; // Blue for user location
      case 'landmark':
        return '#FF9500'; // Orange for landmarks
      case 'shared':
        return '#34C759'; // Green for shared locations
      case 'meetup':
        return '#FF3B30'; // Red for meetups
      default:
        return '#FF3B30'; // Red for default
    }
  };

  const allMarkers = [
    ...customMarkers,
    ...sharedLocations,
    ...(activeFilter === 'meetups' ? meetupMarkers : []),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Map View</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.topButtons}>
        <TouchableOpacity 
          style={[styles.topButton, activeFilter === 'friends' && styles.activeTopButton]}
          onPress={() => handleFilterPress('friends')}
        >
          <Text style={[styles.topButtonText, activeFilter === 'friends' && styles.activeTopButtonText]}>
            👥 All Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.topButton, activeFilter === 'meetups' && styles.activeTopButton]}
          onPress={() => handleFilterPress('meetups')}
        >
          <Text style={[styles.topButtonText, activeFilter === 'meetups' && styles.activeTopButtonText]}>
            🤝 Meet Ups
          </Text>
        </TouchableOpacity>
      </View>

      {/* Zoom Controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomButton} onPress={zoomIn}>
          <Text style={styles.zoomButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={zoomOut}>
          <Text style={styles.zoomButtonText}>−</Text>
        </TouchableOpacity>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={currentRegion}
        region={currentRegion}
        onRegionChangeComplete={setCurrentRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {allMarkers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title}
            description={marker.description}
            pinColor={getMarkerColor(marker.type)}
            onCalloutPress={() => {
              if (marker.type === 'meetup') {
                const meetupId = parseInt(marker.id.replace('meetup_', ''));
                Alert.alert(
                  'Join Meetup',
                  `Would you like to join this meetup at ${marker.title}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Join', 
                      onPress: () => joinMeetup(meetupId),
                      style: 'default'
                    }
                  ]
                );
              }
            }}
          />
        ))}
        
        {/* Current User Location Marker */}
        {currentLocation && (
          <Marker
            key="current-user"
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="You are here"
            description={`${username}'s current location`}
            pinColor="#34C759"
          />
        )}
      </MapView>

      {/* Meetup Button - Bottom Right */}
      {!activeMeetup && joinedMeetups.length === 0 ? (
        <TouchableOpacity
          style={styles.meetupButton}
          onPress={() => setShowMeetupModal(true)}
        >
          <Text style={styles.meetupButtonText}>🤝</Text>
          <Text style={styles.meetupButtonLabel}>Meetup</Text>
        </TouchableOpacity>
      ) : activeMeetup ? (
        <View style={styles.activeMeetupContainer}>
          <View style={styles.activeMeetupInfo}>
            <Text style={styles.activeMeetupTitle}>Active Meetup</Text>
            <Text style={styles.activeMeetupLocation}>{activeMeetup.location}</Text>
            <Text style={styles.activeMeetupActivities}>{activeMeetup.activities}</Text>
          </View>
          <View style={styles.meetupActionButtons}>
            <TouchableOpacity
              style={[styles.meetupActionButton, styles.editButton]}
              onPress={handleEditMeetup}
            >
              <Text style={styles.meetupActionButtonText}>✏️ Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.meetupActionButton, styles.inviteButton]}
              onPress={handleInviteToMeetup}
            >
              <Text style={styles.meetupActionButtonText}>👥 Invite</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.meetupActionButton, styles.endButton]}
              onPress={handleEndMeetup}
            >
              <Text style={styles.meetupActionButtonText}>🏁 End</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : joinedMeetups.length > 0 ? (
        <View style={styles.joinedMeetupContainer}>
          <View style={styles.joinedMeetupInfo}>
            <Text style={styles.joinedMeetupTitle}>Joined Meetup</Text>
            <Text style={styles.joinedMeetupLocation}>{joinedMeetups[0].location}</Text>
            <Text style={styles.joinedMeetupActivities}>{joinedMeetups[0].activities}</Text>
            <Text style={styles.joinedMeetupHost}>Host: {joinedMeetups[0].host_username}</Text>
          </View>
          <View style={styles.joinedMeetupActionButtons}>
            <TouchableOpacity
              style={[styles.meetupActionButton, styles.inviteButton]}
              onPress={() => Alert.alert('Invite', 'Invite functionality coming soon!')}
            >
              <Text style={styles.meetupActionButtonText}>👥 Invite</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.meetupActionButton, styles.endButton]}
              onPress={() => leaveMeetup(joinedMeetups[0].id)}
            >
              <Text style={styles.meetupActionButtonText}>🚪 Leave</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}


      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      <Modal
        visible={showShareModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share Location</Text>
            
            <TextInput
              style={styles.textInput}
              placeholder="Add a description (optional)"
              value={shareDescription}
              onChangeText={setShareDescription}
              multiline
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowShareModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.shareButton]}
                onPress={shareCurrentLocation}
                disabled={loading}
              >
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showIntervalModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowIntervalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Interval</Text>
            
            <ScrollView style={styles.intervalList}>
              {intervalOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.intervalOption,
                    trackingInterval === option.value && styles.selectedIntervalOption
                  ]}
                  onPress={() => {
                    setTrackingInterval(option.value);
                    setShowIntervalModal(false);
                    // Restart tracking with new interval if currently tracking
                    if (isTracking) {
                      stopLocationTracking();
                      setTimeout(() => startLocationTracking(), 100);
                    }
                  }}
                >
                  <Text style={[
                    styles.intervalOptionText,
                    trackingInterval === option.value && styles.selectedIntervalOptionText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowIntervalModal(false)}
            >
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Meetup Modal */}
      <Modal
        visible={showMeetupModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMeetupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {activeMeetup ? 'Edit Meetup' : 'Create Meetup'}
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Location *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter meetup location"
                value={meetupLocation}
                onChangeText={setMeetupLocation}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Activities *</Text>
              <TextInput
                style={[styles.textInput, styles.activitiesInput]}
                placeholder="Describe the activities"
                value={meetupActivities}
                onChangeText={setMeetupActivities}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Radius (meters)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="100"
                value={meetupMeters}
                onChangeText={setMeetupMeters}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowMeetupModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.startMeetupButton]}
                onPress={createMeetup}
                disabled={loading}
              >
                <Text style={styles.startMeetupButtonText}>
                  {activeMeetup ? 'Update Meetup' : 'Start Meetup'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Toolbar */}
      {onTabPress && (
        <View style={[styles.bottomToolbar, { paddingBottom: safeAreaInsets?.bottom || 0 }]}>
          <TouchableOpacity 
            style={[styles.toolbarButton, activeTab === 'maps' && styles.activeToolbarButton]}
            onPress={() => onTabPress('maps')}
          >
            <Text style={[styles.toolbarIcon, activeTab === 'maps' && styles.activeToolbarIcon]}>🗺️</Text>
            <Text style={[styles.toolbarLabel, activeTab === 'maps' && styles.activeToolbarLabel]}>Maps</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toolbarButton, activeTab === 'events' && styles.activeToolbarButton]}
            onPress={() => onTabPress('events')}
          >
            <Text style={[styles.toolbarIcon, activeTab === 'events' && styles.activeToolbarIcon]}>📅</Text>
            <Text style={[styles.toolbarLabel, activeTab === 'events' && styles.activeToolbarLabel]}>Events</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toolbarButton, activeTab === 'chats' && styles.activeToolbarButton]}
            onPress={() => onTabPress('chats')}
          >
            <Text style={[styles.toolbarIcon, activeTab === 'chats' && styles.activeToolbarIcon]}>💬</Text>
            <Text style={[styles.toolbarLabel, activeTab === 'chats' && styles.activeToolbarLabel]}>Chats</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toolbarButton, activeTab === 'local' && styles.activeToolbarButton]}
            onPress={() => onTabPress('local')}
          >
            <Text style={[styles.toolbarIcon, activeTab === 'local' && styles.activeToolbarIcon]}>📍</Text>
            <Text style={[styles.toolbarLabel, activeTab === 'local' && styles.activeToolbarLabel]}>What's On</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toolbarButton, activeTab === 'friends' && styles.activeToolbarButton]}
            onPress={() => onTabPress('friends')}
          >
            <Text style={[styles.toolbarIcon, activeTab === 'friends' && styles.activeToolbarIcon]}>👥</Text>
            <Text style={[styles.toolbarLabel, activeTab === 'friends' && styles.activeToolbarLabel]}>Friends</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toolbarButton, activeTab === 'profile' && styles.activeToolbarButton]}
            onPress={() => onTabPress('profile')}
          >
            <Text style={[styles.toolbarIcon, activeTab === 'profile' && styles.activeToolbarIcon]}>👤</Text>
            <Text style={[styles.toolbarLabel, activeTab === 'profile' && styles.activeToolbarLabel]}>Profile</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerSpacer: {
    padding: 8,
    width: 60, // Same width as back button to maintain layout
  },
  topButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    justifyContent: 'space-around',
  },
  topButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  topButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTopButton: {
    backgroundColor: '#34C759', // Green for active state
  },
  activeTopButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
  },
  refreshButtonText: {
    fontSize: 20,
  },
  map: {
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  controlButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  trackingButton: {
    backgroundColor: '#FF3B30', // Red when tracking
  },
  secondaryControls: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: 'white',
  },
  intervalButton: {
    backgroundColor: '#8E8E93',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  intervalButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  intervalList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  intervalOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedIntervalOption: {
    backgroundColor: '#007AFF',
  },
  intervalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedIntervalOptionText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  shareButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Bottom Toolbar Styles
  bottomToolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toolbarButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeToolbarButton: {
    backgroundColor: '#f0f8ff',
  },
  toolbarIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  activeToolbarIcon: {
    fontSize: 22,
  },
  toolbarLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  activeToolbarLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
  // Meetup Button Styles
  meetupButton: {
    position: 'absolute',
    bottom: 100, // Above the bottom toolbar
    right: 20,
    backgroundColor: '#34C759',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  meetupButtonText: {
    fontSize: 20,
    marginBottom: 2,
  },
  meetupButtonLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  // Meetup Modal Styles
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  activitiesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  startMeetupButton: {
    backgroundColor: '#34C759',
  },
  startMeetupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Active Meetup Styles
  activeMeetupContainer: {
    position: 'absolute',
    bottom: 100, // Above the bottom toolbar
    right: 20,
    left: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  activeMeetupInfo: {
    marginBottom: 12,
  },
  activeMeetupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34C759',
    marginBottom: 4,
  },
  activeMeetupLocation: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  activeMeetupActivities: {
    fontSize: 12,
    color: '#666',
  },
  meetupActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meetupActionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  inviteButton: {
    backgroundColor: '#FF9500',
  },
  endButton: {
    backgroundColor: '#FF3B30',
  },
  meetupActionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  // Joined Meetup Styles
  joinedMeetupContainer: {
    position: 'absolute',
    bottom: 100, // Above the bottom toolbar
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  joinedMeetupInfo: {
    marginBottom: 12,
  },
  joinedMeetupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  joinedMeetupLocation: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  joinedMeetupActivities: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  joinedMeetupHost: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
  },
  joinedMeetupActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  zoomControls: {
    position: 'absolute',
    right: 20,
    top: 200,
    zIndex: 1000,
  },
  zoomButton: {
    backgroundColor: 'white',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  zoomButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});
