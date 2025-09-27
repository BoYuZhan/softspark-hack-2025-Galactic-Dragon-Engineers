# Social Meetup App

A React Native mobile application with FastAPI backend for social meetups, events, health tracking, and friend management.

## Youtube link: https://youtu.be/ZQe_AnefvAE (with errors)

## Demo Link (just the demo for running the app): https://youtu.be/uhuhyviUhBM

## What is the problem

Tired of constantly being aired when making plans? Sick of how long it takes everyone to respond? Want to join others in activities but don't know their schedule of the top of your head? Then Colourful living has the solution.

In this day and age, more and more individuals are stuck on their phones, and not living in the moment. More young individuals are lonlier than ever:
- About 1 in 4 Australians will experience loneliness or isolation at some point. 
- Among younger people (18-24) a high percentage report feeling lonely
- Research shows that over time, the number of close friends Australians report has declined compared to decades past. Also, people are less likely to know their neighbours well enough to drop in uninvited

This idea of lack of social connection has been tackled by Colourful Living with the new application.

## Features

- 🗺️ **Location-based meetups** - Create and join meetups near you
- 📅 **Event management** - Host and attend social events
- 🏥 **Health dashboard** - Track health metrics with visual charts
- 👥 **Friend system** - Add friends and manage friend requests
- 🔔 **Notifications** - Real-time notifications for invitations and updates
- 📍 **Location sharing** - Share your location with friends
- 🎯 **Host-only invitations** - Meetup hosts can invite specific users

## How it solves the problem?

Colourful Living encourages users to be active, always looking out for nearby friends and events. The meetup feature encourages meaningful interaction, where friends are more likely to interact with others in their daily life. The event planner also allows for easier interactions with no stress of planning, just the event date and time and if the users are coming or not.

## Technical Features & Implementation

### **Frontend (React Native)**
- **Cross-platform mobile app** built with React Native 0.81.4 and TypeScript
- **Real-time location tracking** using `@react-native-community/geolocation` with configurable intervals
- **Interactive maps** powered by `react-native-maps` with custom markers for users, meetups, and shared locations
- **Tab-based navigation** with 7 main sections: Maps, Events, Health, Local, Friends, Profile, Notifications
- **Modal-based UI** for meetup creation, user search, and profile editing
- **Responsive design** with dark/light mode support and safe area handling

### **Backend (FastAPI)**
- **RESTful API** built with FastAPI and Pydantic for data validation
- **SQLite database** with 10+ tables for users, events, meetups, friends, and notifications
- **Real-time location services** with server-side location tracking and sharing
- **Host-only invitation system** with user search and multi-select functionality
- **Static file serving** for health chart images and assets
- **Comprehensive API endpoints** for authentication, social features, and data management

### **Health Analytics (Data Science)**
- **Machine learning pipeline** using Pandas, NumPy, Matplotlib, Seaborn, and Scikit-learn
- **Time series analysis** for heart rate and happiness tracking over time
- **Statistical visualizations** including density plots for MAP and body temperature
- **Linear regression model** for happiness prediction based on health metrics
- **Automated chart generation** with PNG export for mobile display
- **Health metrics tracking**: Heart Rate, Blood Pressure, MAP, Body Temperature, Body Humidity, Happiness Index

### **Real-time Features**
- **Continuous GPS tracking** with configurable update intervals (1 second to 1 minute)
- **Live location sharing** between friends with map animations
- **Real-time notifications** for meetup invitations, friend requests, and event updates
- **Server synchronization** for location data and social interactions
- **Map animations** for smooth user experience during location updates

### **Social Features**
- **Friend system** with request/accept workflow and search functionality
- **Location-based meetups** with GPS coordinates and configurable radius
- **Event management** with host controls and participant tracking
- **Invitation system** with host-only permissions and user search
- **Social graph** tracking relationships and interactions

### **Database Architecture**
- **SQLite database** with ACID compliance and foreign key constraints
- **Optimized schema** with proper indexing for performance
- **10+ tables** including users, events, meetups, friends, notifications, and location tracking
- **Automated initialization** with sample data and repopulation scripts
- **Migration support** for schema updates and data management

### **Development & Deployment**
- **Cross-platform support** for iOS and Android with shared codebase
- **Modern development tools** including ESLint, Prettier, Jest, and Babel
- **TypeScript integration** for type safety and better development experience
- **Database management** with initialization scripts and sample data
- **Comprehensive documentation** with setup instructions and troubleshooting


## Prerequisites

Before running the application, ensure you have the following installed:

### Backend Requirements
- Python 3.8 or higher
- pip (Python package manager)

### Frontend Requirements
- Node.js 16 or higher
- npm or yarn
- React Native development environment
  - For iOS: Xcode (macOS only)
  - For Android: Android Studio and Android SDK (UNTESTED)

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd softspark-hack-2025-Galactic-Dragon-Engineers
```

### 2. Backend Setup

#### Install Python Dependencies
```bash
pip install fastapi uvicorn sqlite3 pandas numpy matplotlib seaborn scikit-learn
```

#### Initialize and Populate Database
```bash
# Run the database repopulation script
python3 repopulate_database.py
```

This will create a new `main.db` file with all the necessary tables and sample data.

#### Start the Backend Server
```bash
# Start the FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at `http://localhost:8000`

### 3. Frontend Setup

#### Install Node.js Dependencies
```bash
cd MyApp
npm install
```

#### iOS Setup (macOS only)
```bash
cd ios
pod install
cd ..
```

#### Start the React Native App

For iOS:
```bash
npx react-native run-ios
```

For Android:
```bash
npx react-native run-android
```

## Database Management

### Repopulate Database
If you need to reset the database with fresh data:
```bash
python3 repopulate_database.py
```

### Database Schema
The application uses SQLite with the following main tables:
- `users` - User accounts and profiles
- `events` - Social events
- `meetups` - Location-based meetups
- `friends` - Friend relationships
- `notifications` - User notifications
- `online_users` - Current user locations

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/signup` - User registration
- `POST /api/logout` - User logout

### Events
- `GET /api/user_group_events/get` - Get user events
- `POST /api/user_group_events/create` - Create new event
- `POST /api/user_group_events/invite` - Invite users to event

### Meetups
- `GET /api/meetup/all` - Get all meetups
- `POST /api/meetup/create` - Create new meetup
- `POST /api/meetup/join` - Join a meetup
- `POST /api/meetup/invite` - Invite users to meetup

### Friends
- `GET /api/friends/get` - Get user's friends
- `POST /api/friends/send_request` - Send friend request
- `POST /api/friends/accept` - Accept friend request

### Health
- `GET /api/health/metrics` - Get health metrics
- `GET /api/health/pictures` - Get health chart images

### Notifications
- `GET /api/notifications/{user_id}` - Get user notifications

## Sample Data

The database comes pre-populated with:
- 14 sample users (testuser, alice, testuser1-10, newuser, brandnewuser)
- 7 sample events
- 16 sample meetups
- Friend relationships and requests
- Sample notifications

### Default Login Credentials
- Username: `testuser`
- Password: `12345`

## Development

### Backend Development
- Main API file: `main.py`
- Database models: `users.py`, `meetup.py`, `user_events.py`
- Health analytics: `health.py`

### Frontend Development
- Main app: `MyApp/App.tsx`
- Map screen: `MyApp/MapScreen.tsx`
- Health dashboard: Integrated in App.tsx

### File Structure
```
├── main.py                 # FastAPI backend
├── repopulate_database.py  # Database setup script
├── health.py              # Health analytics
├── users.py               # User management
├── meetup.py              # Meetup functionality
├── user_events.py         # Event management
├── notifications.py       # Notification system
├── MyApp/                 # React Native frontend
│   ├── App.tsx           # Main app component
│   ├── MapScreen.tsx     # Map and meetup interface
│   └── package.json      # Frontend dependencies
└── pictures/             # Health chart images
```

## Troubleshooting

### Common Issues

1. **Database not found**
   ```bash
   python3 repopulate_database.py
   ```

2. **Port already in use**
   ```bash
   # Kill process on port 8000
   lsof -ti:8000 | xargs kill -9
   ```

3. **React Native build issues**
   ```bash
   cd MyApp
   npx react-native clean
   npm install
   ```

4. **iOS pod issues**
   ```bash
   cd MyApp/ios
   pod deintegrate
   pod install
   ```

### Health Charts
The health dashboard displays charts generated from `statistics.csv`. If charts are missing:
```bash
python3 health.py
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the SoftSpark Hackathon 2025.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check the database schema
4. Contact the development team

---

**Happy coding! 🚀**
