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
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

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

  // Check if user is already logged in
  useEffect(() => {
    // In a real app, you'd check for stored tokens here
    // For now, we'll start with login screen
  }, []);

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

  // Logout function
  const handleLogout = () => {
    setIsLoggedIn(false);
    setToken(null);
    setHelloMessage('');
  };

  if (isLoggedIn) {
    return (
      <View style={[styles.container, { paddingTop: safeAreaInsets.top }]}>
        <ScrollView contentContainerStyle={styles.mainContainer}>
          <Text style={styles.title}>Welcome to MyApp!</Text>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Backend Connection</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#007AFF" />
            ) : (
              <Text style={styles.message}>{helloMessage}</Text>
            )}
            <TouchableOpacity 
              style={styles.button} 
              onPress={fetchHelloMessage}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Refresh Message</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>User Info</Text>
            <Text style={styles.infoText}>Token: {token?.substring(0, 10)}...</Text>
            <Text style={styles.infoText}>Status: Logged In</Text>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <LoginScreen 
      onLogin={handleLogin} 
      loading={loading}
      safeAreaInsets={safeAreaInsets}
    />
  );
}

interface LoginScreenProps {
  onLogin: (username: string, password: string) => void;
  loading: boolean;
  safeAreaInsets: any;
}

function LoginScreen({ onLogin, loading, safeAreaInsets }: LoginScreenProps) {
  const [username, setUsername] = useState('testuser');
  const [password, setPassword] = useState('12345');

  const handleSubmit = () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }
    onLogin(username.trim(), password.trim());
  };

  return (
    <View style={[styles.container, { paddingTop: safeAreaInsets.top }]}>
      <View style={styles.loginContainer}>
        <Text style={styles.loginTitle}>MyApp Login</Text>
        <Text style={styles.loginSubtitle}>Connect to FastAPI Backend</Text>

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

        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <View style={styles.credentialsInfo}>
          <Text style={styles.credentialsText}>Demo Credentials:</Text>
          <Text style={styles.credentialsText}>Username: testuser</Text>
          <Text style={styles.credentialsText}>Password: 12345</Text>
        </View>
      </View>
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
});

export default App;
