#!/usr/bin/env python3
"""
Database Repopulation Script
This script recreates the database with all the current data from main.db
"""

import sqlite3
import os
from datetime import datetime

def create_database():
    """Create a new database with all tables and data"""
    
    # Remove existing database if it exists
    if os.path.exists('main.db'):
        os.remove('main.db')
        print("Removed existing main.db")
    
    # Create new database connection
    conn = sqlite3.connect('main.db')
    cursor = conn.cursor()
    
    print("Creating database tables...")
    
    # Create users table
    cursor.execute('''
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            bio TEXT NOT NULL,
            location TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create online_users table
    cursor.execute('''
        CREATE TABLE online_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            location TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Create events table
    cursor.execute('''
        CREATE TABLE events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            location TEXT,
            date TEXT,
            lat REAL,
            lon REAL,
            host INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (host) REFERENCES users (id)
        )
    ''')
    
    # Create event_participants table
    cursor.execute('''
        CREATE TABLE event_participants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            can_attend INTEGER DEFAULT 0,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(event_id, user_id)
        )
    ''')
    
    # Create friends table
    cursor.execute('''
        CREATE TABLE friends (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            friend_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (friend_id) REFERENCES users (id),
            UNIQUE(user_id, friend_id)
        )
    ''')
    
    # Create friend_requests table
    cursor.execute('''
        CREATE TABLE friend_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_id INTEGER NOT NULL,
            to_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (from_id) REFERENCES users (id),
            FOREIGN KEY (to_id) REFERENCES users (id),
            UNIQUE(from_id, to_id)
        )
    ''')
    
    # Create meetups table
    cursor.execute('''
        CREATE TABLE meetups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location TEXT NOT NULL,
            activities TEXT NOT NULL,
            meters INTEGER NOT NULL,
            latitude REAL,
            longitude REAL,
            host INTEGER NOT NULL,
            FOREIGN KEY (host) REFERENCES users (id)
        )
    ''')
    
    # Create meetup_joins table
    cursor.execute('''
        CREATE TABLE meetup_joins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            meetup_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            FOREIGN KEY (meetup_id) REFERENCES meetups (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Create notifications table
    cursor.execute('''
        CREATE TABLE notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            message TEXT,
            timestamp TEXT,
            type TEXT,
            related_id INTEGER
        )
    ''')
    
    # Create meetup_invites table
    cursor.execute('''
        CREATE TABLE meetup_invites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            meetup_id INTEGER NOT NULL,
            host_id INTEGER NOT NULL,
            invited_user_id INTEGER NOT NULL,
            timestamp TEXT,
            status INTEGER DEFAULT 0,
            FOREIGN KEY (meetup_id) REFERENCES meetups (id),
            FOREIGN KEY (host_id) REFERENCES users (id),
            FOREIGN KEY (invited_user_id) REFERENCES users (id)
        )
    ''')
    
    # Create indexes
    cursor.execute('CREATE INDEX idx_users_username ON users(username)')
    cursor.execute('CREATE INDEX idx_users_email ON users(email)')
    cursor.execute('CREATE INDEX idx_events_host ON events(host)')
    cursor.execute('CREATE INDEX idx_events_date ON events(date)')
    cursor.execute('CREATE INDEX idx_event_participants_event_id ON event_participants(event_id)')
    cursor.execute('CREATE INDEX idx_event_participants_user_id ON event_participants(user_id)')
    cursor.execute('CREATE INDEX idx_online_users_user_id ON online_users(user_id)')
    cursor.execute('CREATE INDEX idx_online_users_timestamp ON online_users(timestamp)')
    cursor.execute('CREATE INDEX idx_friends_user_id ON friends(user_id)')
    cursor.execute('CREATE INDEX idx_friends_friend_id ON friends(friend_id)')
    cursor.execute('CREATE INDEX idx_friend_requests_from_id ON friend_requests(from_id)')
    cursor.execute('CREATE INDEX idx_friend_requests_to_id ON friend_requests(to_id)')
    
    print("Inserting data...")
    
    # Insert users data
    users_data = [
        (1, 'testuser', '12345', 'John', 'Doe', 'john.doe@example.com', '555-0123', 'I love coding and meeting new people!gggg', 'San Francisco, CA', '2025-09-26 12:47:40'),
        (2, 'alice', 'password123', 'Alice', 'Johnson', 'alice@example.com', '555-0124', 'Alice from the app', 'New York, NY', '2025-09-26 12:47:40'),
        (3, 'testuser1', 'password123', 'Test', 'User1', 'testuser1@example.com', '555-0001', 'Test user 1 for development', 'San Francisco, CA', '2025-09-26 12:52:25'),
        (4, 'testuser2', 'password123', 'Test', 'User2', 'testuser2@example.com', '555-0002', 'Test user 2 for development', 'San Francisco, CA', '2025-09-26 12:52:25'),
        (5, 'testuser3', 'password123', 'Test', 'User3', 'testuser3@example.com', '555-0003', 'Test user 3 for development', 'San Francisco, CA', '2025-09-26 12:52:25'),
        (6, 'testuser4', 'password123', 'Test', 'User4', 'testuser4@example.com', '555-0004', 'Test user 4 for development', 'San Francisco, CA', '2025-09-26 12:52:25'),
        (7, 'testuser5', 'password123', 'Test', 'User5', 'testuser5@example.com', '555-0005', 'Test user 5 for development', 'San Francisco, CA', '2025-09-26 12:52:25'),
        (8, 'testuser6', 'password123', 'Test', 'User6', 'testuser6@example.com', '555-0006', 'Test user 6 for development', 'San Francisco, CA', '2025-09-26 12:52:25'),
        (9, 'testuser7', 'password123', 'Test', 'User7', 'testuser7@example.com', '555-0007', 'Test user 7 for development', 'San Francisco, CA', '2025-09-26 12:52:25'),
        (10, 'testuser8', 'password123', 'Test', 'User8', 'testuser8@example.com', '555-0008', 'Test user 8 for development', 'San Francisco, CA', '2025-09-26 12:52:25'),
        (11, 'testuser9', 'password123', 'Test', 'User9', 'testuser9@example.com', '555-0009', 'Test user 9 for developmentdasdasdasd', 'San Francisco, CA', '2025-09-26 12:52:25'),
        (12, 'testuser10', 'password123', 'Test', 'User10', 'testuser10@example.com', '555-0010', 'Test user 10 for development', 'San Francisco, CA', '2025-09-26 12:52:25'),
        (13, 'newuser', 'password123', 'New', 'User', 'newuser@example.com', '555-0123', 'I am a new user', 'San Francisco, CA', '2025-09-26 16:58:08'),
        (14, 'brandnewuser', 'password789', 'Brand', 'New', 'brandnew@example.com', '555-0789', 'A completely new user', 'Seattle, WA', '2025-09-26 16:58:55')
    ]
    
    cursor.executemany('''
        INSERT INTO users (id, username, password, first_name, last_name, email, phone, bio, location, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', users_data)
    
    # Insert events data
    events_data = [
        (1, 'Updated Sample Event', 'This is an updated sample event 2', 'Updated Central Park', '2025-01-20', 40.7829, -73.9654, 1, '2025-09-26 12:47:40'),
        (3, 'Sample event 2', 'This is a sample event', 'Library', '24/05/2026', 0.0, 0.0, 1, '2025-09-26 16:06:46'),
        (4, 'Coffee Meetup', 'Join us for coffee and conversation', 'Starbucks Downtown', '2025-01-25 10:00', 37.7849, -122.4094, 3, '2025-09-26 16:15:56'),
        (5, 'Fgrdstrswrt', 'Yrtdetr\tdetested\t', 'Ftdytfyt', '24/05/2025', 0.0, 0.0, 1, '2025-09-26 16:30:51'),
        (7, 'Updated Sample Event', 'This is an updated sample event', 'Updated Central Park', '2025-01-20', 40.7829, -73.9654, 1, '2025-09-26 17:16:09'),
        (8, 'This is a mother test', 'Test\t', 'Sydney', '08/10/2025 at 14:15', 0.0, 0.0, 1, '2025-09-26 17:20:59'),
        (9, 'This is a project test', 'Birthday\t', 'Used', '10/09/2025 at 17:30', 0.0, 0.0, 1, '2025-09-27 01:51:50')
    ]
    
    cursor.executemany('''
        INSERT INTO events (id, title, description, location, date, lat, lon, host, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', events_data)
    
    # Insert meetups data
    meetups_data = [
        (2, 'Library', 'Study', 100, 37.785834, -122.406417, 1),
        (3, 'Library', 'Study', 100, 37.785834, -122.406417, 1),
        (5, 'Updated Test Location', 'Updated Test Activities', 200, 37.7849, -122.4094, 1),
        (7, 'Library', 'Testt', 100, 37.785834, -122.406417, 1),
        (8, 'Golden Gate Park', 'Morning jog and coffee', 500, 37.7694, -122.4862, 3),
        (9, 'Fisherman\'s Wharf', 'Seafood lunch and sightseeing', 300, 37.808, -122.4177, 3),
        (10, 'Lombard Street', 'Photo walk and exploring', 200, 37.8021, -122.4187, 5),
        (11, 'Alcatraz Island', 'Historical tour and ferry ride', 1000, 37.827, -122.423, 5),
        (12, 'Union Square', 'Shopping and dinner', 400, 37.7879, -122.4075, 7),
        (13, 'Coit Tower', 'City views and photography', 600, 37.8024, -122.4058, 7),
        (16, 'Test', 'Test', 100, 37.785834, -122.406417, 1),
        (18, 'T', 'T', 100, 37.785834, -122.406417, 1),
        (22, 'Test', 'Test', 100, 37.785834, -122.406417, 1),
        (23, 'Test', 'Test', 100, 37.785834, -122.406417, 1),
        (25, 'Ccxc', 'Zzz', 100, 37.785834, -122.406417, 1),
        (26, 'Test', 'Studying', 103, 37.785834, -122.406417, 1)
    ]
    
    cursor.executemany('''
        INSERT INTO meetups (id, location, activities, meters, latitude, longitude, host)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', meetups_data)
    
    # Insert friends data
    friends_data = [
        (1, 8, 1, '2025-09-26 15:02:24'),
        (2, 1, 3, '2025-09-26 15:13:12'),
        (3, 3, 1, '2025-09-26 15:13:12'),
        (4, 1, 4, '2025-09-26 15:13:12'),
        (5, 4, 1, '2025-09-26 15:13:12'),
        (6, 1, 5, '2025-09-26 15:13:12'),
        (7, 5, 1, '2025-09-26 15:13:12'),
        (8, 1, 6, '2025-09-26 15:13:12'),
        (9, 6, 1, '2025-09-26 15:13:12'),
        (10, 1, 7, '2025-09-26 15:13:12'),
        (11, 7, 1, '2025-09-26 15:13:12'),
        (12, 11, 1, '2025-09-27 01:53:41')
    ]
    
    cursor.executemany('''
        INSERT INTO friends (id, user_id, friend_id, created_at)
        VALUES (?, ?, ?, ?)
    ''', friends_data)
    
    # Insert friend_requests data
    friend_requests_data = [
        (2, 1, 12, '2025-09-27 01:03:08')
    ]
    
    cursor.executemany('''
        INSERT INTO friend_requests (id, from_id, to_id, created_at)
        VALUES (?, ?, ?, ?)
    ''', friend_requests_data)
    
    # Insert event_participants data
    event_participants_data = [
        (1, 1, 3, 0, '2025-09-26 16:11:52'),
        (3, 4, 1, 1, '2025-09-26 16:20:31'),
        (4, 5, 7, 0, '2025-09-26 16:35:31'),
        (5, 8, 4, 0, '2025-09-26 17:21:15'),
        (6, 1, 7, 0, '2025-09-27 01:45:23'),
        (7, 1, 8, 0, '2025-09-27 01:45:28'),
        (8, 1, 4, 0, '2025-09-27 01:46:14'),
        (9, 1, 6, 0, '2025-09-27 01:47:26'),
        (10, 3, 7, 0, '2025-09-27 01:51:14'),
        (11, 9, 7, 0, '2025-09-27 01:51:57')
    ]
    
    cursor.executemany('''
        INSERT INTO event_participants (id, event_id, user_id, can_attend, joined_at)
        VALUES (?, ?, ?, ?, ?)
    ''', event_participants_data)
    
    # Insert meetup_invites data
    meetup_invites_data = [
        (1, 2, 1, 3, '2025-09-27T11:13:49.527760', 1),
        (2, 2, 1, 4, '2025-09-27T11:13:49.528784', 0),
        (3, 2, 1, 5, '2025-09-27T11:13:49.529596', 0),
        (4, 23, 1, 4, '2025-09-27T11:41:47.446972', 0),
        (5, 25, 1, 3, '2025-09-27T11:44:14.278212', 0),
        (6, 26, 1, 6, '2025-09-27T11:49:29.279280', 0),
        (7, 26, 1, 7, '2025-09-27T11:49:29.280504', 0)
    ]
    
    cursor.executemany('''
        INSERT INTO meetup_invites (id, meetup_id, host_id, invited_user_id, timestamp, status)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', meetup_invites_data)
    
    # Insert notifications data
    notifications_data = [
        (1, 2, 'testuser sent you a friend request', '2025-09-27T10:57:22.051381', 'friend_request', 1),
        (2, 3, 'testuser1 joined your meetup', '2025-09-27T10:57:22.053154', 'meetup_join', 1),
        (3, 4, 'testuser2 invited you to an event', '2025-09-27T10:57:22.053711', 'event_invite', 2),
        (4, 12, 'testuser sent you a friend request', '2025-09-27T11:03:08.250693', 'friend_request', 1),
        (5, 7, 'testuser joined your meetup', '2025-09-27T11:03:33.017692', 'meetup_join', 12),
        (6, 7, 'testuser left your meetup', '2025-09-27T11:04:20.469452', 'meetup_leave', 12),
        (7, 7, 'testuser joined your meetup', '2025-09-27T11:09:16.303074', 'meetup_join', 12),
        (8, 7, 'testuser left your meetup', '2025-09-27T11:10:45.064632', 'meetup_leave', 12),
        (9, 3, 'testuser invited you to a meetup', '2025-09-27T11:13:49.528387', 'meetup_invite', 2),
        (10, 4, 'testuser invited you to a meetup', '2025-09-27T11:13:49.529132', 'meetup_invite', 2),
        (11, 5, 'testuser invited you to a meetup', '2025-09-27T11:13:49.529933', 'meetup_invite', 2),
        (12, 1, 'testuser1 accepted your meetup invitation', '2025-09-27T11:15:24.032356', 'meetup_invite_response', 2),
        (13, 7, 'testuser joined your meetup', '2025-09-27T11:18:52.212872', 'meetup_join', 12),
        (14, 7, 'testuser left your meetup', '2025-09-27T11:18:58.436050', 'meetup_leave', 12),
        (15, 7, 'testuser joined your meetup', '2025-09-27T11:19:45.523127', 'meetup_join', 12),
        (16, 7, 'testuser left your meetup', '2025-09-27T11:21:47.592374', 'meetup_leave', 12),
        (17, 7, 'testuser joined your meetup', '2025-09-27T11:22:24.140870', 'meetup_join', 12),
        (18, 7, 'testuser left your meetup', '2025-09-27T11:29:08.195381', 'meetup_leave', 12),
        (19, 7, 'testuser joined your meetup', '2025-09-27T11:29:35.506280', 'meetup_join', 12),
        (20, 7, 'testuser left your meetup', '2025-09-27T11:31:40.608470', 'meetup_leave', 12),
        (21, 4, 'testuser invited you to a meetup', '2025-09-27T11:41:47.448018', 'meetup_invite', 23),
        (22, 1, 'testuser1 left your meetup', '2025-09-27T11:42:05.231883', 'meetup_leave', 2),
        (23, 7, 'testuser joined your meetup', '2025-09-27T11:43:16.306392', 'meetup_join', 13),
        (24, 7, 'testuser left your meetup', '2025-09-27T11:43:42.862080', 'meetup_leave', 13),
        (25, 3, 'testuser invited you to a meetup', '2025-09-27T11:44:14.279021', 'meetup_invite', 25),
        (26, 1, 'testuser1 joined your meetup', '2025-09-27T11:44:55.895699', 'meetup_join', 18),
        (27, 1, 'testuser1 left your meetup', '2025-09-27T11:44:59.328099', 'meetup_leave', 18),
        (28, 6, 'testuser invited you to an event', '2025-09-27T11:47:26.158142', 'event_invite', 1),
        (29, 6, 'testuser invited you to a meetup', '2025-09-27T11:49:29.280021', 'meetup_invite', 26),
        (30, 7, 'testuser invited you to a meetup', '2025-09-27T11:49:29.281012', 'meetup_invite', 26),
        (31, 1, 'testuser3 joined your meetup', '2025-09-27T11:49:57.913199', 'meetup_join', 3),
        (32, 1, 'testuser3 left your meetup', '2025-09-27T11:50:02.681552', 'meetup_leave', 3),
        (33, 7, 'testuser joined your meetup', '2025-09-27T11:50:40.979338', 'meetup_join', 13),
        (34, 7, 'testuser left your meetup', '2025-09-27T11:50:45.240765', 'meetup_leave', 13),
        (35, 7, 'testuser invited you to an event', '2025-09-27T11:51:14.982418', 'event_invite', 3),
        (36, 7, 'testuser invited you to an event', '2025-09-27T11:51:57.454185', 'event_invite', 9),
        (37, 11, 'testuser sent you a friend request', '2025-09-27T11:53:22.954370', 'friend_request', 1),
        (38, 1, 'testuser9 accepted your friend request', '2025-09-27T11:53:41.298073', 'friend_accept', 11)
    ]
    
    cursor.executemany('''
        INSERT INTO notifications (id, user_id, message, timestamp, type, related_id)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', notifications_data)
    
    # Insert online_users data
    online_users_data = [
        (2, 4, 'San Francisco, CA', 'Sat Sep 27 01:16:24 AEST 2025', 37.786834, -122.407417),
        (4, 6, 'San Francisco, CA', 'Sat Sep 27 01:16:24 AEST 2025', 37.786434, -122.405217),
        (5, 7, 'San Francisco, CA', 'Sat Sep 27 01:16:24 AEST 2025', 37.784434, -122.407617),
        (9, 14, 'Unknown', '2025-09-26 16:59:13', 0.0, 0.0)
    ]
    
    cursor.executemany('''
        INSERT INTO online_users (id, user_id, location, timestamp, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', online_users_data)
    
    # Update sqlite_sequence table to maintain auto-increment
    cursor.execute('INSERT INTO sqlite_sequence (name, seq) VALUES ("users", 14)')
    cursor.execute('INSERT INTO sqlite_sequence (name, seq) VALUES ("events", 9)')
    cursor.execute('INSERT INTO sqlite_sequence (name, seq) VALUES ("meetups", 26)')
    cursor.execute('INSERT INTO sqlite_sequence (name, seq) VALUES ("friends", 12)')
    cursor.execute('INSERT INTO sqlite_sequence (name, seq) VALUES ("friend_requests", 2)')
    cursor.execute('INSERT INTO sqlite_sequence (name, seq) VALUES ("event_participants", 11)')
    cursor.execute('INSERT INTO sqlite_sequence (name, seq) VALUES ("meetup_invites", 7)')
    cursor.execute('INSERT INTO sqlite_sequence (name, seq) VALUES ("notifications", 38)')
    cursor.execute('INSERT INTO sqlite_sequence (name, seq) VALUES ("online_users", 9)')
    
    # Commit all changes
    conn.commit()
    conn.close()
    
    print("Database repopulation completed successfully!")
    print(f"Created at: {datetime.now()}")
    print("\nTables created:")
    print("- users (14 records)")
    print("- events (7 records)")
    print("- meetups (16 records)")
    print("- friends (12 records)")
    print("- friend_requests (1 record)")
    print("- event_participants (10 records)")
    print("- meetup_invites (7 records)")
    print("- notifications (38 records)")
    print("- online_users (4 records)")

if __name__ == "__main__":
    create_database()
