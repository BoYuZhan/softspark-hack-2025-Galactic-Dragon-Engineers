/**
 * React Native App with FastAPI Backend Integration
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import MapScreen from './MapScreen';

// API Configuration
const API_BASE_URL = 'http://localhost:8000';

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  message?: string;
  username?: string;
  user_id?: number;
}

interface Friend {
  id: number;
  username: string;
}

interface FriendRequest {
  id: number;
  username: string;
}

interface HelloResponse {
  message: string;
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [helloMessage, setHelloMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'main' | 'map'>('map');
  const [activeTab, setActiveTab] = useState<'maps' | 'events' | 'chats' | 'local' | 'friends' | 'profile'>('maps');
  const [username, setUsername] = useState<string>('testuser');
  const [userId, setUserId] = useState<number | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    email: '',
    location: '',
  });
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsTab, setEventsTab] = useState<'events' | 'hosting' | 'attending' | 'invitations'>('events');
  const [hostingEvents, setHostingEvents] = useState<any[]>([]);
  const [hostingLoading, setHostingLoading] = useState(false);
  const [allUserGroupEvents, setAllUserGroupEvents] = useState<any[]>([]);
  const [allUserGroupEventsLoading, setAllUserGroupEventsLoading] = useState(false);
  const [eventInvitations, setEventInvitations] = useState<any[]>([]);
  const [eventInvitationsLoading, setEventInvitationsLoading] = useState(false);
  const [attendingEvents, setAttendingEvents] = useState<any[]>([]);
  const [attendingEventsLoading, setAttendingEventsLoading] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);
  const [friendSearchText, setFriendSearchText] = useState('');
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [invitingToEvent, setInvitingToEvent] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [eventParticipants, setEventParticipants] = useState<any[]>([]);
  const [eventParticipantsLoading, setEventParticipantsLoading] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    lat: 0,
    lon: 0,
    selectedFriends: [] as Friend[],
  });
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [friendsTab, setFriendsTab] = useState<'friends' | 'requests' | 'send'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [showSendRequestModal, setShowSendRequestModal] = useState(false);
  const [sendRequestForm, setSendRequestForm] = useState({
    to_username: '',
  });

  // Check if user is already logged in
  useEffect(() => {
    // In a real app, you'd check for stored tokens here
    // For now, we'll start with login screen
  }, []);

  // Fetch hosting events when hosting tab is selected
  useEffect(() => {
    if (eventsTab === 'hosting') {
      fetchHostingEvents();
    }
  }, [eventsTab]);

  // Fetch invitations when invitations tab is selected
  useEffect(() => {
    if (eventsTab === 'invitations') {
      fetchEventInvitations();
    }
  }, [eventsTab]);

  // Fetch attending events when attending tab is selected
  useEffect(() => {
    if (eventsTab === 'attending') {
      fetchAttendingEvents();
    }
  }, [eventsTab]);

  // Fetch hello message from backend
  const fetchHelloMessage = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/hello`);
      const data: HelloResponse = await response.json();
      setHelloMessage(data.message);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch message from server');
      console.error('Error fetching hello message:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch events from backend
  const fetchEvents = async () => {
    try {
      setEventsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/events/list`);
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.events);
        console.log('Events fetched:', data.events);
      } else {
        Alert.alert('Error', 'Failed to fetch events');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server for events');
      console.error('Error fetching events:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  // Fetch hosting events from backend
  const fetchHostingEvents = async () => {
    try {
      setHostingLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/user_group_events_host/get?host=${userId || 1}`);
      const data = await response.json();
      
      if (data.success) {
        setHostingEvents(data.events);
        console.log('Hosting events fetched:', data.events);
      } else {
        Alert.alert('Error', 'Failed to fetch hosting events');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server for hosting events');
      console.error('Error fetching hosting events:', error);
    } finally {
      setHostingLoading(false);
    }
  };

  // Create user group event
  const createUserGroupEvent = async () => {
    if (!eventForm.title.trim() || !eventForm.description.trim() || !eventForm.location.trim() || !eventForm.date.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const eventData = {
        title: eventForm.title,
        description: eventForm.description,
        location: eventForm.location,
        date: eventForm.date,
        lat: eventForm.lat,
        lon: eventForm.lon,
        host: userId || 1, // Current user ID
        participants: [], // Empty for now
      };

      const response = await fetch(`${API_BASE_URL}/api/user_group_events/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Event created successfully!');
        setShowCreateEventModal(false);
        setEventForm({
          title: '',
          description: '',
          location: '',
          date: '',
          lat: 0,
          lon: 0,
          selectedFriends: [],
        });
        fetchHostingEvents(); // Refresh hosting events
      } else {
        Alert.alert('Error', 'Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEvent = async (eventId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user_group_events/${eventId}`);
      const data = await response.json();
      
      if (data.success) {
        setEditingEvent(data.event);
        setEventForm({
          title: data.event.title,
          description: data.event.description,
          location: data.event.location,
          date: data.event.date,
          lat: data.event.lat,
          lon: data.event.lon,
          selectedFriends: []
        });
        setShowEditEventModal(true);
      } else {
        Alert.alert('Error', 'Failed to load event details');
      }
    } catch (error) {
      console.error('Error loading event:', error);
      Alert.alert('Error', 'Failed to load event details');
    }
  };

  const updateEvent = async () => {
    if (!eventForm.title.trim() || !eventForm.description.trim() || !eventForm.location.trim() || !eventForm.date.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const eventData = {
        event_id: editingEvent.id,
        title: eventForm.title,
        description: eventForm.description,
        location: eventForm.location,
        date: eventForm.date,
        lat: eventForm.lat,
        lon: eventForm.lon
      };

      const response = await fetch(`${API_BASE_URL}/api/user_group_events/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Event updated successfully!');
        setShowEditEventModal(false);
        setEditingEvent(null);
        setEventForm({
          title: '',
          description: '',
          location: '',
          date: '',
          lat: 0,
          lon: 0,
          selectedFriends: []
        });
        fetchHostingEvents(); // Refresh hosting events
      } else {
        Alert.alert('Error', data.message || 'Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      Alert.alert('Error', 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteToEvent = (eventId: number) => {
    setInvitingToEvent(eventId);
    setShowInviteModal(true);
    fetchFriends(); // Load friends for invitation
  };

  const inviteUserToEvent = async (friendId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user_group_events/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: invitingToEvent,
          user_id: friendId
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'User invited to event successfully!');
        setShowInviteModal(false);
        setInvitingToEvent(null);
      } else {
        Alert.alert('Error', data.message || 'Failed to invite user');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      Alert.alert('Error', 'Failed to invite user');
    }
  };

  // Fetch event invitations
  const fetchEventInvitations = async () => {
    try {
      setEventInvitationsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/user_group_events/invitations/${userId || 1}`);
      const data = await response.json();
      
      if (data.success) {
        setEventInvitations(data.invitations);
      } else {
        console.error('Failed to fetch invitations:', data.message);
        setEventInvitations([]);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
      setEventInvitations([]);
    } finally {
      setEventInvitationsLoading(false);
    }
  };

  // Fetch attending events
  const fetchAttendingEvents = async () => {
    try {
      setAttendingEventsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/user_group_events/attending/${userId || 1}`);
      const data = await response.json();
      
      if (data.success) {
        setAttendingEvents(data.events);
      } else {
        console.error('Failed to fetch attending events:', data.message);
        setAttendingEvents([]);
      }
    } catch (error) {
      console.error('Error fetching attending events:', error);
      setAttendingEvents([]);
    } finally {
      setAttendingEventsLoading(false);
    }
  };

  // Respond to invitation
  const respondToInvitation = async (participantId: number, response: number) => {
    try {
      const responseData = await fetch(`${API_BASE_URL}/api/user_group_events/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participant_id: participantId,
          response: response
        }),
      });

      const data = await responseData.json();
      
      if (data.success) {
        const responseText = response === 1 ? 'accepted' : 'rejected';
        Alert.alert('Success', `Invitation ${responseText} successfully!`);
        fetchEventInvitations(); // Refresh invitations
        fetchAttendingEvents(); // Refresh attending events
      } else {
        Alert.alert('Error', data.message || 'Failed to respond to invitation');
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
      Alert.alert('Error', 'Failed to respond to invitation');
    }
  };

  // Delete event
  const deleteEvent = async (eventId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user_group_events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Event deleted successfully!');
        fetchHostingEvents(); // Refresh hosting events
      } else {
        Alert.alert('Error', data.message || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      Alert.alert('Error', 'Failed to delete event');
    }
  };

  // Handle delete event with confirmation
  const handleDeleteEvent = (eventId: number, eventTitle: string) => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteEvent(eventId),
        },
      ]
    );
  };

  // Date and time input handlers
  const handleDateChange = (text: string) => {
    // Remove any non-numeric characters except slashes
    let cleaned = text.replace(/[^\d/]/g, '');
    
    // Auto-format as user types (xx/xx/xxxx)
    if (cleaned.length >= 2 && cleaned.charAt(2) !== '/') {
      cleaned = cleaned.substring(0, 2) + '/' + cleaned.substring(2);
    }
    if (cleaned.length >= 5 && cleaned.charAt(5) !== '/') {
      cleaned = cleaned.substring(0, 5) + '/' + cleaned.substring(5);
    }
    
    // Limit to 10 characters (MM/DD/YYYY)
    if (cleaned.length <= 10) {
      setEventDate(cleaned);
      updateEventFormDate(cleaned, eventTime);
    }
  };

  const handleTimeChange = (text: string) => {
    // Remove any non-numeric characters except colons
    let cleaned = text.replace(/[^\d:]/g, '');
    
    // Auto-format as user types (xx:xx)
    if (cleaned.length >= 2 && cleaned.charAt(2) !== ':') {
      cleaned = cleaned.substring(0, 2) + ':' + cleaned.substring(2);
    }
    
    // Limit to 5 characters (HH:MM)
    if (cleaned.length <= 5) {
      setEventTime(cleaned);
      updateEventFormDate(eventDate, cleaned);
    }
  };

  const updateEventFormDate = (date: string, time: string) => {
    if (date && time) {
      setEventForm({...eventForm, date: `${date} at ${time}`});
    } else if (date) {
      setEventForm({...eventForm, date: date});
    } else if (time) {
      setEventForm({...eventForm, date: time});
    }
  };

  // Fetch event participants
  const fetchEventParticipants = async (eventId: number) => {
    try {
      setEventParticipantsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/user_group_events/${eventId}/participants`);
      const data = await response.json();
      
      if (data.success) {
        setEventParticipants(data.participants);
      } else {
        console.error('Failed to fetch participants:', data.message);
        setEventParticipants([]);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
      setEventParticipants([]);
    } finally {
      setEventParticipantsLoading(false);
    }
  };

  // Handle event click
  const handleEventClick = async (event: any) => {
    setSelectedEvent(event);
    setShowEventDetailModal(true);
    await fetchEventParticipants(event.event_id || event.id);
  };

  // Fetch all user group events from backend
  const fetchAllUserGroupEvents = async () => {
    try {
      setAllUserGroupEventsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/user_group_events/get?user_id=${userId || 1}`);
      const data = await response.json();
      
      if (data.success) {
        setAllUserGroupEvents(data.events);
        console.log('All user group events fetched:', data.events);
      } else {
        Alert.alert('Error', 'Failed to fetch user group events');
      }
    } catch (error) {
      console.error('Error fetching user group events:', error);
      Alert.alert('Error', 'Failed to fetch user group events');
    } finally {
      setAllUserGroupEventsLoading(false);
    }
  };

  // Friends functions
  const fetchFriends = async () => {
    try {
      setFriendsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/friends/get?user_id=${userId || 1}`);
      const data = await response.json();
      
      if (data.success) {
        setFriends(data.friends);
        console.log('Friends fetched:', data.friends);
      } else {
        Alert.alert('Error', 'Failed to fetch friends');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server for friends');
      console.error('Error fetching friends:', error);
    } finally {
      setFriendsLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      setFriendsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/friends/requests?user_id=${userId || 1}`);
      const data = await response.json();
      
      if (data.success) {
        setFriendRequests(data.requests);
        console.log('Friend requests fetched:', data.requests);
      } else {
        Alert.alert('Error', 'Failed to fetch friend requests');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server for friend requests');
      console.error('Error fetching friend requests:', error);
    } finally {
      setFriendsLoading(false);
    }
  };

  const sendFriendRequest = async () => {
    if (!sendRequestForm.to_username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    try {
      setLoading(true);
      const requestData = {
        from_id: userId || 1, // Current user ID (integer)
        to_username: sendRequestForm.to_username, // Username to send request to
      };

      const response = await fetch(`${API_BASE_URL}/api/friends/send_request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Friend request sent successfully!');
        setShowSendRequestModal(false);
        setSendRequestForm({ to_username: '' });
      } else {
        Alert.alert('Error', 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request');
    } finally {
      setLoading(false);
    }
  };

  const acceptFriendRequest = async (fromId: string) => {
    try {
      setLoading(true);
      const actionData = {
        user_id: userId?.toString() || "1", // Current user ID
        friend_id: fromId,
      };

      const response = await fetch(`${API_BASE_URL}/api/friends/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(actionData),
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Friend request accepted!');
        fetchFriendRequests(); // Refresh requests
        fetchFriends(); // Refresh friends list
      } else {
        Alert.alert('Error', 'Failed to accept friend request');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      setLoading(true);
      const actionData = {
        user_id: userId?.toString() || "1", // Current user ID
        friend_id: friendId,
      };

      const response = await fetch(`${API_BASE_URL}/api/friends/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(actionData),
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Friend removed successfully!');
        fetchFriends(); // Refresh friends list
      } else {
        Alert.alert('Error', 'Failed to remove friend');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      Alert.alert('Error', 'Failed to remove friend');
    } finally {
      setLoading(false);
    }
  };

  // Profile functions
  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/profile?user_id=${userId || 1}`);
      const data = await response.json();
      
      if (data.success) {
        setUserProfile(data.user);
        setEditProfileForm({
          first_name: data.user.first_name || '',
          last_name: data.user.last_name || '',
          bio: data.user.bio || '',
          email: data.user.email || '',
          location: data.user.location || '',
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const updateUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/user/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId || 1,
          ...editProfileForm
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Profile updated successfully!');
        setShowEditProfileModal(false);
        fetchUserProfile(); // Refresh profile data
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const handleLogin = async (username: string, password: string) => {
    try {
      setLoading(true);
      const loginData: LoginRequest = { username, password };
      
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data: LoginResponse = await response.json();

      if (data.success && data.token) {
        setToken(data.token);
        setIsLoggedIn(true);
        setUsername(data.username || username);
        setUserId(data.user_id || null);
        await fetchHelloMessage();
        Alert.alert('Success', 'Login successful!');
      } else {
        Alert.alert('Error', data.message || 'Login failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server. Make sure the backend is running.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Signup function
  const handleSignup = async (signupData: {
    username: string;
    firstName: string;
    lastName: string;
    password: string;
    bio: string;
    email: string;
    phone: string;
  }) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Account created successfully! Please login.');
        setIsSignupMode(false);
      } else {
        Alert.alert('Error', data.message || 'Signup failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server. Make sure the backend is running.');
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      // Call logout API to remove user from online_users table
      if (userId) {
        const response = await fetch(`${API_BASE_URL}/api/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: userId }),
        });
        
        const data = await response.json();
        if (data.success) {
          console.log('Successfully logged out from server');
        } else {
          console.log('Logout API call failed:', data.message);
        }
      }
    } catch (error) {
      console.error('Error calling logout API:', error);
    } finally {
      // Always clear local state regardless of API call result
      setIsLoggedIn(false);
      setToken(null);
      setUserId(null);
      setUsername('');
      setHelloMessage('');
      setCurrentScreen('map');
      setActiveTab('maps');
    }
  };

  // Navigation functions
  const goToMap = () => {
    setCurrentScreen('map');
  };

  const goToMain = () => {
    setCurrentScreen('main');
  };

  // Tab navigation functions
  const handleTabPress = (tab: 'maps' | 'events' | 'chats' | 'local' | 'friends' | 'profile') => {
    setActiveTab(tab);
    if (tab === 'maps') {
      setCurrentScreen('map');
    } else if (tab === 'local') {
      setCurrentScreen('main');
      fetchEvents(); // Fetch events when local tab is pressed
    } else if (tab === 'events') {
      setCurrentScreen('main');
      if (eventsTab === 'events') {
        fetchAllUserGroupEvents(); // Fetch all user group events when events tab is pressed
      } else if (eventsTab === 'hosting') {
        fetchHostingEvents(); // Fetch hosting events when events tab is pressed
      }
    } else if (tab === 'friends') {
      setCurrentScreen('main');
      if (friendsTab === 'friends') {
        fetchFriends(); // Fetch friends when friends tab is pressed
      } else if (friendsTab === 'requests') {
        fetchFriendRequests(); // Fetch friend requests when requests tab is pressed
      }
    } else if (tab === 'profile') {
      setCurrentScreen('main');
      fetchUserProfile(); // Fetch user profile when profile tab is pressed
    } else {
      setCurrentScreen('main');
    }
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'events':
        return (
          <View style={styles.eventsContainer}>
            <Text style={styles.title}>Events</Text>
            
            {/* Event Tab Buttons */}
            <View style={styles.eventTabButtons}>
              <TouchableOpacity 
                style={[styles.eventTabButton, eventsTab === 'events' && styles.activeEventTabButton]}
                onPress={() => {
                  setEventsTab('events');
                  fetchAllUserGroupEvents();
                }}
              >
                <Text style={[styles.eventTabButtonText, eventsTab === 'events' && styles.activeEventTabButtonText]}>
                  Events
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.eventTabButton, eventsTab === 'hosting' && styles.activeEventTabButton]}
                onPress={() => {
                  setEventsTab('hosting');
                  fetchHostingEvents();
                }}
              >
                <Text style={[styles.eventTabButtonText, eventsTab === 'hosting' && styles.activeEventTabButtonText]}>
                  Hosting
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.eventTabButton, eventsTab === 'attending' && styles.activeEventTabButton]}
                onPress={() => setEventsTab('attending')}
              >
                <Text style={[styles.eventTabButtonText, eventsTab === 'attending' && styles.activeEventTabButtonText]}>
                  Attending
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.eventTabButton, eventsTab === 'invitations' && styles.activeEventTabButton]}
                onPress={() => setEventsTab('invitations')}
              >
                <Text style={[styles.eventTabButtonText, eventsTab === 'invitations' && styles.activeEventTabButtonText]}>
                  Invitations
                </Text>
              </TouchableOpacity>
            </View>

            {/* Event Content */}
            <View style={styles.eventContent}>
              {eventsTab === 'events' && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>All Events</Text>
                  {allUserGroupEventsLoading ? (
                    <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 20 }} />
                  ) : allUserGroupEvents.length > 0 ? (
                    <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
                      {allUserGroupEvents.map((event, index) => (
                        <TouchableOpacity key={index} style={styles.eventItem} onPress={() => handleEventClick(event)}>
                          <Text style={styles.eventTitle}>{event.title}</Text>
                          <Text style={styles.eventDescription}>{event.description}</Text>
                          <Text style={styles.eventDate}>{event.date}</Text>
                          <Text style={styles.eventLocation}>📍 {event.location}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={styles.infoText}>No events found. Create your first event!</Text>
                  )}
                </View>
              )}
              
              {eventsTab === 'hosting' && (
                <View style={styles.card}>
                  <View style={styles.hostingHeader}>
                    <Text style={styles.cardTitle}>Hosting Events</Text>
                    <TouchableOpacity 
                      style={styles.createEventButton}
                      onPress={() => {
                        setShowCreateEventModal(true);
                        setFriendSearchText(''); // Clear search when opening modal
                        fetchFriends(); // Fetch friends when opening create event modal
                      }}
                    >
                      <Text style={styles.createEventButtonText}>+ Create Event</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {hostingLoading ? (
                    <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 20 }} />
                  ) : hostingEvents.length > 0 ? (
                    <ScrollView style={styles.hostingEventsList} showsVerticalScrollIndicator={false}>
                      {hostingEvents.map((event, index) => (
                        <View key={index} style={styles.hostingEventItem}>
                          <TouchableOpacity onPress={() => handleEventClick(event)}>
                            <Text style={styles.hostingEventTitle}>{event.title}</Text>
                            <Text style={styles.hostingEventDescription}>{event.description}</Text>
                            <Text style={styles.hostingEventLocation}>{event.location}</Text>
                            <Text style={styles.hostingEventDate}>{event.date}</Text>
                            <Text style={styles.hostingEventHost}>Host: {event.host_username}</Text>
                          </TouchableOpacity>
                          <View style={styles.hostingEventActions}>
                            <TouchableOpacity
                              style={[styles.eventActionButton, styles.editEventButton]}
                              onPress={() => handleEditEvent(event.id)}
                            >
                              <Text style={styles.eventActionButtonText}>✏️ Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.eventActionButton, styles.inviteEventButton]}
                              onPress={() => handleInviteToEvent(event.id)}
                            >
                              <Text style={styles.eventActionButtonText}>👥 Invite</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.eventActionButton, styles.deleteEventButton]}
                              onPress={() => handleDeleteEvent(event.id, event.title)}
                            >
                              <Text style={styles.eventActionButtonText}>🗑️ Delete</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={styles.infoText}>No hosting events found. Create your first event!</Text>
                  )}
                </View>
              )}
              
              {eventsTab === 'attending' && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Attending Events</Text>
                  {attendingEventsLoading ? (
                    <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 20 }} />
                  ) : attendingEvents.length > 0 ? (
                    <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
                      {attendingEvents.map((event, index) => (
                        <TouchableOpacity key={index} style={styles.eventItem} onPress={() => handleEventClick(event)}>
                          <Text style={styles.eventTitle}>{event.title}</Text>
                          <Text style={styles.eventDescription}>{event.description}</Text>
                          <Text style={styles.eventLocation}>{event.location}</Text>
                          <Text style={styles.eventDate}>{event.date}</Text>
                          <Text style={styles.eventHost}>Host: {event.host_username}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={styles.infoText}>You're not attending any events yet.</Text>
                  )}
                </View>
              )}
              
              {eventsTab === 'invitations' && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Event Invitations</Text>
                  {eventInvitationsLoading ? (
                    <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 20 }} />
                  ) : eventInvitations.length > 0 ? (
                    <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
                      {eventInvitations.map((invitation, index) => (
                        <View key={index} style={styles.invitationItem}>
                          <TouchableOpacity onPress={() => handleEventClick(invitation)}>
                            <Text style={styles.eventTitle}>{invitation.title}</Text>
                            <Text style={styles.eventDescription}>{invitation.description}</Text>
                            <Text style={styles.eventLocation}>{invitation.location}</Text>
                            <Text style={styles.eventDate}>{invitation.date}</Text>
                            <Text style={styles.eventHost}>Host: {invitation.host_username}</Text>
                          </TouchableOpacity>
                          <View style={styles.invitationActions}>
                            <TouchableOpacity
                              style={[styles.invitationButton, styles.acceptButton]}
                              onPress={() => respondToInvitation(invitation.participant_id, 1)}
                            >
                              <Text style={styles.invitationButtonText}>✓ Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.invitationButton, styles.rejectButton]}
                              onPress={() => respondToInvitation(invitation.participant_id, 2)}
                            >
                              <Text style={styles.invitationButtonText}>✗ Reject</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={styles.infoText}>No pending invitations.</Text>
                  )}
                </View>
              )}
            </View>
          </View>
        );
      
      case 'chats':
        return (
          <>
            <Text style={styles.title}>Chats</Text>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recent Conversations</Text>
              <Text style={styles.infoText}>💬 Community Group - 5 new messages</Text>
              <Text style={styles.infoText}>👥 Running Club - 2 new messages</Text>
              <Text style={styles.infoText}>🎯 Event Planning - 1 new message</Text>
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Start New Chat</Text>
              </TouchableOpacity>
            </View>
          </>
        );
      
      case 'local':
        return (
          <View style={styles.localContainer}>
            <View style={styles.localHeader}>
              <Text style={styles.title}>Local Events</Text>
              <TouchableOpacity style={styles.refreshButton} onPress={fetchEvents}>
                <Text style={styles.refreshButtonText}>🔄</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.localCard}>
              <Text style={styles.cardTitle}>Nearby Activities</Text>
              {eventsLoading ? (
                <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 20 }} />
              ) : events.length > 0 ? (
                <ScrollView style={styles.eventsListFull} showsVerticalScrollIndicator={false}>
                  {events.map((event, index) => (
                    <View key={index} style={styles.eventItem}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventDescription}>{event.description}</Text>
                      <Text style={styles.eventDate}>{event.date}</Text>
                      {event.link && (
                        <Text style={styles.eventLink}>🔗 {event.link}</Text>
                      )}
                    </View>
                  ))}
                  <TouchableOpacity style={styles.button} onPress={fetchEvents}>
                    <Text style={styles.buttonText}>Refresh Events</Text>
                  </TouchableOpacity>
                </ScrollView>
              ) : (
                <View style={styles.noEventsContainer}>
                  <Text style={styles.infoText}>No events found. Tap refresh to load events.</Text>
                  <TouchableOpacity style={styles.button} onPress={fetchEvents}>
                    <Text style={styles.buttonText}>Refresh Events</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        );
      
      case 'friends':
        return (
          <View style={styles.friendsContainer}>
            <Text style={styles.title}>Friends</Text>
            
            {/* Friends Tab Buttons */}
            <View style={styles.friendsTabButtons}>
              <TouchableOpacity 
                style={[styles.friendsTabButton, friendsTab === 'friends' && styles.activeFriendsTabButton]}
                onPress={() => {
                  setFriendsTab('friends');
                  fetchFriends();
                }}
              >
                <Text style={[styles.friendsTabButtonText, friendsTab === 'friends' && styles.activeFriendsTabButtonText]}>
                  Friends
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.friendsTabButton, friendsTab === 'requests' && styles.activeFriendsTabButton]}
                onPress={() => {
                  setFriendsTab('requests');
                  fetchFriendRequests();
                }}
              >
                <Text style={[styles.friendsTabButtonText, friendsTab === 'requests' && styles.activeFriendsTabButtonText]}>
                  Requests
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.friendsTabButton, friendsTab === 'send' && styles.activeFriendsTabButton]}
                onPress={() => setFriendsTab('send')}
              >
                <Text style={[styles.friendsTabButtonText, friendsTab === 'send' && styles.activeFriendsTabButtonText]}>
                  Send Request
                </Text>
              </TouchableOpacity>
            </View>

            {/* Friends Content */}
            <View style={styles.friendsContent}>
              {friendsTab === 'friends' && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>My Friends</Text>
                  
                  {friendsLoading ? (
                    <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 20 }} />
                  ) : friends.length > 0 ? (
                    <ScrollView style={styles.friendsList} showsVerticalScrollIndicator={false}>
                      {friends.map((friend, index) => (
                        <View key={index} style={styles.friendItem}>
                          <Text style={styles.friendName}>{friend.username}</Text>
                          <TouchableOpacity 
                            style={styles.removeFriendButton}
                            onPress={() => removeFriend(friend.id.toString())}
                          >
                            <Text style={styles.removeFriendButtonText}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={styles.infoText}>No friends found. Add some friends!</Text>
                  )}
                </View>
              )}
              
              {friendsTab === 'requests' && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Friend Requests</Text>
                  
                  {friendsLoading ? (
                    <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 20 }} />
                  ) : friendRequests.length > 0 ? (
                    <ScrollView style={styles.requestsList} showsVerticalScrollIndicator={false}>
                      {friendRequests.map((request, index) => (
                        <View key={index} style={styles.requestItem}>
                          <Text style={styles.requestFrom}>From: {request.username}</Text>
                          <View style={styles.requestButtons}>
                            <TouchableOpacity 
                              style={styles.acceptButton}
                              onPress={() => acceptFriendRequest(request.id.toString())}
                            >
                              <Text style={styles.acceptButtonText}>Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.declineButton}
                              onPress={() => Alert.alert('Info', 'Decline functionality coming soon!')}
                            >
                              <Text style={styles.declineButtonText}>Decline</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={styles.infoText}>No pending friend requests.</Text>
                  )}
                </View>
              )}
              
              {friendsTab === 'send' && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Send Friend Request</Text>
                  <Text style={styles.infoText}>Enter a username to send a friend request</Text>
                  
                  <View style={styles.sendRequestContainer}>
                    <TextInput
                      style={styles.sendRequestInput}
                      placeholder="Enter username"
                      value={sendRequestForm.to_username}
                      onChangeText={(text) => setSendRequestForm({...sendRequestForm, to_username: text})}
                    />
                    <TouchableOpacity 
                      style={styles.sendRequestButton}
                      onPress={sendFriendRequest}
                    >
                      <Text style={styles.sendRequestButtonText}>Send Request</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        );
      
      case 'profile':
        return (
          <>
            <Text style={styles.title}>User Profile</Text>
            
            {userProfile ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Profile Information</Text>
                <Text style={styles.profileInfo}>Username: {userProfile.username}</Text>
                <Text style={styles.profileInfo}>First Name: {userProfile.first_name || 'Not set'}</Text>
                <Text style={styles.profileInfo}>Last Name: {userProfile.last_name || 'Not set'}</Text>
                <Text style={styles.profileInfo}>Email: {userProfile.email || 'Not set'}</Text>
                <Text style={styles.profileInfo}>Location: {userProfile.location || 'Not set'}</Text>
                <Text style={styles.profileInfo}>Bio: {userProfile.bio || 'No bio available'}</Text>
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Loading Profile...</Text>
              </View>
            )}
            
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Actions</Text>
              <TouchableOpacity 
                style={styles.button}
                onPress={() => setShowEditProfileModal(true)}
              >
                <Text style={styles.buttonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </>
        );
      
      default:
        return null;
    }
  };

  if (isLoggedIn) {
    // Show map screen if current screen is 'map'
    if (currentScreen === 'map') {
      return (
        <MapScreen 
          onBack={goToMain} 
          username={username}
          userId={userId || undefined}
          activeTab={activeTab}
          onTabPress={handleTabPress}
          safeAreaInsets={safeAreaInsets}
        />
      );
    }

    // Show main screen with bottom toolbar
    return (
      <View style={[styles.container, { paddingTop: safeAreaInsets.top }]}>
        <ScrollView contentContainerStyle={[styles.mainContainer, { paddingBottom: 100 }]}>
          {renderTabContent()}
        </ScrollView>
        
        {/* Bottom Toolbar */}
        <View style={[styles.bottomToolbar, { paddingBottom: safeAreaInsets.bottom }]}>
          <TouchableOpacity 
            style={[styles.toolbarButton, activeTab === 'maps' && styles.activeToolbarButton]}
            onPress={() => handleTabPress('maps')}
          >
            <Text style={[styles.toolbarIcon, activeTab === 'maps' && styles.activeToolbarIcon]}>🗺️</Text>
            <Text style={[styles.toolbarLabel, activeTab === 'maps' && styles.activeToolbarLabel]}>Maps</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toolbarButton, activeTab === 'events' && styles.activeToolbarButton]}
            onPress={() => handleTabPress('events')}
          >
            <Text style={[styles.toolbarIcon, activeTab === 'events' && styles.activeToolbarIcon]}>📅</Text>
            <Text style={[styles.toolbarLabel, activeTab === 'events' && styles.activeToolbarLabel]}>Events</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toolbarButton, activeTab === 'chats' && styles.activeToolbarButton]}
            onPress={() => handleTabPress('chats')}
          >
            <Text style={[styles.toolbarIcon, activeTab === 'chats' && styles.activeToolbarIcon]}>💬</Text>
            <Text style={[styles.toolbarLabel, activeTab === 'chats' && styles.activeToolbarLabel]}>Chats</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toolbarButton, activeTab === 'local' && styles.activeToolbarButton]}
            onPress={() => handleTabPress('local')}
          >
            <Text style={[styles.toolbarIcon, activeTab === 'local' && styles.activeToolbarIcon]}>📍</Text>
            <Text style={[styles.toolbarLabel, activeTab === 'local' && styles.activeToolbarLabel]}>What's On</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toolbarButton, activeTab === 'friends' && styles.activeToolbarButton]}
            onPress={() => handleTabPress('friends')}
          >
            <Text style={[styles.toolbarIcon, activeTab === 'friends' && styles.activeToolbarIcon]}>👥</Text>
            <Text style={[styles.toolbarLabel, activeTab === 'friends' && styles.activeToolbarLabel]}>Friends</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toolbarButton, activeTab === 'profile' && styles.activeToolbarButton]}
            onPress={() => handleTabPress('profile')}
          >
            <Text style={[styles.toolbarIcon, activeTab === 'profile' && styles.activeToolbarIcon]}>👤</Text>
            <Text style={[styles.toolbarLabel, activeTab === 'profile' && styles.activeToolbarLabel]}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Create Event Modal */}
        <Modal
          visible={showCreateEventModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCreateEventModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create Event</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter event title"
                  value={eventForm.title}
                  onChangeText={(text) => setEventForm({...eventForm, title: text})}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={[styles.textInput, styles.activitiesInput]}
                  placeholder="Describe the event"
                  value={eventForm.description}
                  onChangeText={(text) => setEventForm({...eventForm, description: text})}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Location *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter event location"
                  value={eventForm.location}
                  onChangeText={(text) => setEventForm({...eventForm, location: text})}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Date & Time *</Text>
                <View style={styles.dateTimeContainer}>
                  <View style={styles.dateTimeInputWrapper}>
                    <Text style={styles.dateTimeInputLabel}>Date (MM/DD/YYYY)</Text>
                    <TextInput
                      style={styles.dateTimeInput}
                      placeholder="MM/DD/YYYY"
                      value={eventDate}
                      onChangeText={handleDateChange}
                      keyboardType="numeric"
                      maxLength={10}
                    />
                  </View>
                  <View style={styles.dateTimeInputWrapper}>
                    <Text style={styles.dateTimeInputLabel}>Time (HH:MM)</Text>
                    <TextInput
                      style={styles.dateTimeInput}
                      placeholder="HH:MM"
                      value={eventTime}
                      onChangeText={handleTimeChange}
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>
                </View>
                {eventForm.date ? (
                  <Text style={styles.selectedDateTimeText}>
                    Selected: {eventForm.date}
                  </Text>
                ) : null}
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Add Friends</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Search friends to invite..."
                  value={friendSearchText}
                  onChangeText={(text) => {
                    setFriendSearchText(text);
                    if (text.length > 0 && friends.length === 0) {
                      fetchFriends(); // Load friends when user starts typing
                    }
                  }}
                />
                
                {/* Friends Dropdown */}
                {friendSearchText.length > 0 && (
                  <View style={styles.friendsDropdown}>
                    {friendsLoading ? (
                      <ActivityIndicator size="small" color="#007AFF" style={{ padding: 10 }} />
                    ) : (
                      <ScrollView style={styles.friendsDropdownList} showsVerticalScrollIndicator={false}>
                        {friends
                          .filter(friend => 
                            friend.username.toLowerCase().includes(friendSearchText.toLowerCase()) &&
                            !eventForm.selectedFriends.some(selected => selected.id === friend.id)
                          )
                          .map((friend, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.friendDropdownItem}
                              onPress={() => {
                                setEventForm({...eventForm, selectedFriends: [...eventForm.selectedFriends, friend]});
                                setFriendSearchText(''); // Clear search after selection
                              }}
                            >
                              <Text style={styles.friendDropdownText}>{friend.username}</Text>
                              <Text style={styles.addFriendText}>+ Add</Text>
                            </TouchableOpacity>
                          ))
                        }
                        {friends.filter(friend => 
                          friend.username.toLowerCase().includes(friendSearchText.toLowerCase()) &&
                          !eventForm.selectedFriends.some(selected => selected.id === friend.id)
                        ).length === 0 && (
                          <Text style={styles.noFriendsText}>No friends found matching "{friendSearchText}"</Text>
                        )}
                      </ScrollView>
                    )}
                  </View>
                )}
                
                {/* Selected Friends */}
                {eventForm.selectedFriends.length > 0 && (
                  <View style={styles.selectedFriendsContainer}>
                    <Text style={styles.selectedFriendsLabel}>Selected Friends:</Text>
                    {eventForm.selectedFriends.map((friend, index) => (
                      <View key={index} style={styles.selectedFriendChip}>
                        <Text style={styles.selectedFriendText}>{friend.username}</Text>
                        <TouchableOpacity
                          onPress={() => {
                            const updatedFriends = eventForm.selectedFriends.filter((_, i) => i !== index);
                            setEventForm({...eventForm, selectedFriends: updatedFriends});
                          }}
                        >
                          <Text style={styles.removeFriendChipText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowCreateEventModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.startMeetupButton]}
                  onPress={createUserGroupEvent}
                  disabled={loading}
                >
                  <Text style={styles.startMeetupButtonText}>Create Event</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Event Modal */}
        <Modal
          visible={showEditEventModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowEditEventModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Event</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter event title"
                  value={eventForm.title}
                  onChangeText={(text) => setEventForm({...eventForm, title: text})}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={[styles.textInput, styles.activitiesInput]}
                  placeholder="Describe the event"
                  value={eventForm.description}
                  onChangeText={(text) => setEventForm({...eventForm, description: text})}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Location *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter event location"
                  value={eventForm.location}
                  onChangeText={(text) => setEventForm({...eventForm, location: text})}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Date *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter event date"
                  value={eventForm.date}
                  onChangeText={(text) => setEventForm({...eventForm, date: text})}
                />
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowEditEventModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.startMeetupButton]}
                  onPress={updateEvent}
                  disabled={loading}
                >
                  <Text style={styles.startMeetupButtonText}>Update Event</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Invite Users Modal */}
        <Modal
          visible={showInviteModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowInviteModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Invite Friends to Event</Text>
              
              {friendsLoading ? (
                <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 20 }} />
              ) : friends.length > 0 ? (
                <ScrollView style={styles.friendSelectionList} showsVerticalScrollIndicator={false}>
                  {friends.map((friend, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.friendSelectionItem}
                      onPress={() => inviteUserToEvent(friend.id)}
                    >
                      <Text style={styles.friendSelectionItemText}>{friend.username}</Text>
                      <Text style={styles.inviteButtonText}>📧 Invite</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.infoText}>No friends found. Add some friends first!</Text>
              )}
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowInviteModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Event Detail Modal */}
        <Modal
          visible={showEventDetailModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowEventDetailModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Event Details</Text>
              
              {selectedEvent && (
                <View style={styles.eventDetailContainer}>
                  <Text style={styles.eventDetailTitle}>{selectedEvent.title}</Text>
                  <Text style={styles.eventDetailDescription}>{selectedEvent.description}</Text>
                  <Text style={styles.eventDetailLocation}>📍 {selectedEvent.location}</Text>
                  <Text style={styles.eventDetailDate}>📅 {selectedEvent.date}</Text>
                  {selectedEvent.host_username && (
                    <Text style={styles.eventDetailHost}>👤 Host: {selectedEvent.host_username}</Text>
                  )}
                  
                  <View style={styles.participantsSection}>
                    <Text style={styles.participantsTitle}>Participants</Text>
                    {eventParticipantsLoading ? (
                      <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 10 }} />
                    ) : eventParticipants.length > 0 ? (
                      <ScrollView style={styles.participantsList} showsVerticalScrollIndicator={false}>
                        {eventParticipants.map((participant, index) => (
                          <View key={index} style={styles.participantItem}>
                            <Text style={styles.participantName}>{participant.username}</Text>
                            <Text style={[
                              styles.participantStatus,
                              participant.can_attend === 1 ? styles.attendingStatus :
                              participant.can_attend === 0 ? styles.invitedStatus :
                              styles.rejectedStatus
                            ]}>
                              {participant.can_attend === 1 ? '✓ Attending' :
                               participant.can_attend === 0 ? '📧 Invited' :
                               '✗ Declined'}
                            </Text>
                          </View>
                        ))}
                      </ScrollView>
                    ) : (
                      <Text style={styles.noParticipantsText}>No participants yet</Text>
                    )}
                  </View>
                </View>
              )}
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowEventDetailModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Profile Modal */}
        <Modal
          visible={showEditProfileModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowEditProfileModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter first name"
                  value={editProfileForm.first_name}
                  onChangeText={(text) => setEditProfileForm({...editProfileForm, first_name: text})}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter last name"
                  value={editProfileForm.last_name}
                  onChangeText={(text) => setEditProfileForm({...editProfileForm, last_name: text})}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter email"
                  value={editProfileForm.email}
                  onChangeText={(text) => setEditProfileForm({...editProfileForm, email: text})}
                  keyboardType="email-address"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter location"
                  value={editProfileForm.location}
                  onChangeText={(text) => setEditProfileForm({...editProfileForm, location: text})}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput
                  style={[styles.textInput, styles.activitiesInput]}
                  placeholder="Tell us about yourself"
                  value={editProfileForm.bio}
                  onChangeText={(text) => setEditProfileForm({...editProfileForm, bio: text})}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowEditProfileModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.startMeetupButton]}
                  onPress={updateUserProfile}
                  disabled={loading}
                >
                  <Text style={styles.startMeetupButtonText}>Update Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <LoginScreen 
      onLogin={handleLogin}
      onSignup={handleSignup}
      loading={loading}
      isSignupMode={isSignupMode}
      setIsSignupMode={setIsSignupMode}
      safeAreaInsets={safeAreaInsets}
    />
  );
}

interface LoginScreenProps {
  onLogin: (username: string, password: string) => void;
  onSignup: (signupData: {
    username: string;
    firstName: string;
    lastName: string;
    password: string;
    bio: string;
    email: string;
    phone: string;
  }) => void;
  loading: boolean;
  isSignupMode: boolean;
  setIsSignupMode: (mode: boolean) => void;
  safeAreaInsets: any;
}

function LoginScreen({ onLogin, onSignup, loading, isSignupMode, setIsSignupMode, safeAreaInsets }: LoginScreenProps) {
  const [username, setUsername] = useState('testuser');
  const [password, setPassword] = useState('12345');
  
  // Signup form state
  const [signupData, setSignupData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    bio: '',
    email: '',
    phone: '',
  });

  const handleSubmit = () => {
    if (isSignupMode) {
      handleSignupSubmit();
    } else {
      handleLoginSubmit();
    }
  };

  const handleLoginSubmit = () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }
    onLogin(username.trim(), password.trim());
  };

  const handleSignupSubmit = () => {
    const { username, firstName, lastName, password, bio, email, phone } = signupData;
    
    if (!username.trim() || !firstName.trim() || !lastName.trim() || !password.trim() || !email.trim()) {
      Alert.alert('Error', 'Please fill in all required fields (Username, First Name, Last Name, Password, Email)');
      return;
    }
    
    onSignup(signupData);
  };

  const updateSignupField = (field: string, value: string) => {
    setSignupData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <View style={[styles.container, { paddingTop: safeAreaInsets.top }]}>
      <ScrollView contentContainerStyle={styles.loginContainer}>
        <Text style={styles.loginTitle}>
          {isSignupMode ? 'MyApp Signup' : 'MyApp Login'}
        </Text>
        <Text style={styles.loginSubtitle}>
          {isSignupMode ? 'Create your account' : 'Connect to FastAPI Backend'}
        </Text>

        {isSignupMode ? (
          // Signup Form
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Username *</Text>
              <TextInput
                style={styles.input}
                value={signupData.username}
                onChangeText={(value) => updateSignupField('username', value)}
                placeholder="Enter username"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={signupData.firstName}
                  onChangeText={(value) => updateSignupField('firstName', value)}
                  placeholder="First name"
                  autoCapitalize="words"
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.inputLabel}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  value={signupData.lastName}
                  onChangeText={(value) => updateSignupField('lastName', value)}
                  placeholder="Last name"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                value={signupData.email}
                onChangeText={(value) => updateSignupField('email', value)}
                placeholder="Enter email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={signupData.phone}
                onChangeText={(value) => updateSignupField('phone', value)}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password *</Text>
              <TextInput
                style={styles.input}
                value={signupData.password}
                onChangeText={(value) => updateSignupField('password', value)}
                placeholder="Enter password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={signupData.bio}
                onChangeText={(value) => updateSignupField('bio', value)}
                placeholder="Tell us about yourself..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </>
        ) : (
          // Login Form
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.credentialsInfo}>
              <Text style={styles.credentialsText}>Demo Credentials:</Text>
              <Text style={styles.credentialsText}>Username: testuser</Text>
              <Text style={styles.credentialsText}>Password: 12345</Text>
            </View>
          </>
        )}

        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.loginButtonText}>
              {isSignupMode ? 'Create Account' : 'Login'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.toggleButton}
          onPress={() => setIsSignupMode(!isSignupMode)}
        >
          <Text style={styles.toggleButtonText}>
            {isSignupMode 
              ? 'Already have an account? Login' 
              : "Don't have an account? Sign up"
            }
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mainContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  profileInfo: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    paddingVertical: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  mapButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  mapButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  loginSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  credentialsInfo: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  credentialsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  // Signup form styles
  inputRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  toggleButton: {
    marginTop: 20,
    padding: 10,
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
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
  // Event Styles
  eventsList: {
    flex: 1,
  },
  localContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  localHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  refreshButtonText: {
    fontSize: 18,
    color: 'white',
  },
  localCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventsListFull: {
    flex: 1,
  },
  noEventsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  eventDate: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  eventHost: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  eventLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  eventLink: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  // Events Tab Styles
  eventsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  eventTabButtons: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 4,
  },
  eventTabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeEventTabButton: {
    backgroundColor: '#007AFF',
  },
  eventTabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeEventTabButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  eventContent: {
    flex: 1,
  },
  hostingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  createEventButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  createEventButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  hostingEventsList: {
    flex: 1,
  },
  hostingEventItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#34C759',
  },
  hostingEventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  hostingEventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  hostingEventLocation: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  hostingEventDate: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  hostingEventHost: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  // Modal Styles
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
  },
  activitiesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateTimeInputWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
  dateTimeInputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    fontWeight: '500',
  },
  dateTimeInput: {
    backgroundColor: '#f8f8f8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  selectedDateTimeText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
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
  startMeetupButton: {
    backgroundColor: '#34C759',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  startMeetupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Friends Styles
  friendsContainer: {
    flex: 1,
  },
  friendsTabButtons: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 4,
  },
  friendsTabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeFriendsTabButton: {
    backgroundColor: '#007AFF',
  },
  friendsTabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeFriendsTabButtonText: {
    color: 'white',
  },
  friendsContent: {
    flex: 1,
  },
  friendsList: {
    maxHeight: 300,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  removeFriendButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeFriendButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  requestsList: {
    maxHeight: 300,
  },
  requestItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  requestFrom: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  requestButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  acceptButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  declineButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  sendRequestContainer: {
    marginTop: 16,
  },
  sendRequestInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  sendRequestButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendRequestButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Friend selection styles
  friendSelectionInput: {
    backgroundColor: '#f8f9fa',
    borderColor: '#007AFF',
    borderWidth: 1,
    justifyContent: 'center',
  },
  friendSelectionText: {
    color: '#007AFF',
    fontSize: 16,
  },
  selectedFriendsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  selectedFriendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedFriendText: {
    color: 'white',
    fontSize: 14,
    marginRight: 6,
  },
  removeFriendChipText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendSelectionList: {
    maxHeight: 300,
    marginVertical: 10,
  },
  friendSelectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectedFriendItem: {
    backgroundColor: '#e3f2fd',
  },
  friendSelectionItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedFriendItemText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  checkmark: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Friends Search Dropdown Styles
  friendsDropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  friendsDropdownList: {
    maxHeight: 200,
  },
  friendDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  friendDropdownText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  addFriendText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  noFriendsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
  },
  selectedFriendsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 10,
  },
  // Event Action Buttons
  hostingEventActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  eventActionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  editEventButton: {
    backgroundColor: '#007AFF',
  },
  inviteEventButton: {
    backgroundColor: '#34C759',
  },
  deleteEventButton: {
    backgroundColor: '#FF3B30',
  },
  eventActionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  inviteButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  // Invitation Styles
  invitationItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9500',
  },
  invitationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  invitationButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  invitationButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  // Event Detail Modal Styles
  eventDetailContainer: {
    marginBottom: 20,
  },
  eventDetailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  eventDetailDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    lineHeight: 22,
  },
  eventDetailLocation: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 6,
  },
  eventDetailDate: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 6,
  },
  eventDetailHost: {
    fontSize: 14,
    color: '#34C759',
    marginBottom: 15,
    fontWeight: '600',
  },
  participantsSection: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
    paddingTop: 15,
  },
  participantsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  participantsList: {
    maxHeight: 200,
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 6,
  },
  participantName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  participantStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  attendingStatus: {
    color: '#34C759',
  },
  invitedStatus: {
    color: '#FF9500',
  },
  rejectedStatus: {
    color: '#FF3B30',
  },
  noParticipantsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
});

export default App;
