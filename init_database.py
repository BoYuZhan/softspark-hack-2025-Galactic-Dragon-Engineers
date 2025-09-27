#!/usr/bin/env python3
"""
Database Initialization Script
Creates all database tables for the SoftSpark Hack 2025 application.

This script creates the following tables:
- users: User account information
- online_users: Currently online users and their locations
- events: User-created group events
- event_participants: Event participation tracking
- friends: User friendship relationships
- friend_requests: Pending friend requests

Run this script to initialize the database before starting the application.
"""

import sqlite3
import os
from datetime import datetime
from meetup import *
from notifications import *
# Database file path
DB_FILE = 'main.db'

def create_database_connection():
    """Create a connection to the SQLite database."""
    return sqlite3.connect(DB_FILE)

def create_users_table(conn):
    """Create the users table for storing user account information."""
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
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
    print("✅ Created users table")

def create_online_users_table(conn):
    """Create the online_users table for tracking currently online users."""
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS online_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            location TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    print("✅ Created online_users table")

def create_events_table(conn):
    """Create the events table for user-created group events."""
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS events (
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
    print("✅ Created events table")

def create_event_participants_table(conn):
    """Create the event_participants table for tracking event participation."""
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS event_participants (
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
    print("✅ Created event_participants table")

def create_friends_table(conn):
    """Create the friends table for storing friendship relationships."""
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS friends (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            friend_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (friend_id) REFERENCES users (id),
            UNIQUE(user_id, friend_id)
        )
    ''')
    print("✅ Created friends table")

def create_friend_requests_table(conn):
    """Create the friend_requests table for storing pending friend requests."""
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS friend_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_id INTEGER NOT NULL,
            to_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (from_id) REFERENCES users (id),
            FOREIGN KEY (to_id) REFERENCES users (id),
            UNIQUE(from_id, to_id)
        )
    ''')
    print("✅ Created friend_requests table")

def create_indexes(conn):
    """Create useful indexes for better query performance."""
    cursor = conn.cursor()
    
    # Indexes for users table
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
    
    # Indexes for events table
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_events_host ON events(host)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_events_date ON events(date)')
    
    # Indexes for event_participants table
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id)')
    
    # Indexes for friends table
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id)')
    
    # Indexes for friend_requests table
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_friend_requests_from_id ON friend_requests(from_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_friend_requests_to_id ON friend_requests(to_id)')
    
    # Indexes for online_users table
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_online_users_user_id ON online_users(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_online_users_timestamp ON online_users(timestamp)')
    
    print("✅ Created database indexes")

def insert_sample_data(conn):
    """Insert sample data for testing purposes."""
    cursor = conn.cursor()
    
    # Check if sample data already exists
    cursor.execute('SELECT COUNT(*) FROM users WHERE username = ?', ('testuser',))
    if cursor.fetchone()[0] > 0:
        print("ℹ️  Sample data already exists, skipping...")
        return
    
    # Insert sample user
    cursor.execute('''
        INSERT INTO users (username, password, first_name, last_name, email, phone, bio, location)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', ('testuser', '12345', 'Test', 'User', 'test@example.com', '555-0123', 'Test user for development', 'San Francisco, CA'))
    
    # Insert another sample user
    cursor.execute('''
        INSERT INTO users (username, password, first_name, last_name, email, phone, bio, location)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', ('alice', 'password123', 'Alice', 'Johnson', 'alice@example.com', '555-0124', 'Alice from the app', 'New York, NY'))
    
    # Insert sample event
    cursor.execute('''
        INSERT INTO events (title, description, location, date, lat, lon, host)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', ('Sample Event', 'This is a sample event for testing', 'Central Park', '2025-01-15', 40.7829, -73.9654, 1))
    
    print("✅ Inserted sample data")

def verify_tables(conn):
    """Verify that all tables were created successfully."""
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    
    expected_tables = ['users', 'online_users', 'events', 'event_participants', 'friends', 'friend_requests', 'meetups', 'meetup_joins']
    
    print("\n📊 Database Tables Created:")
    for table in expected_tables:
        if table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"   • {table}: {count} records")
        else:
            print(f"   ❌ {table}: NOT FOUND")
    
    return len([t for t in expected_tables if t in tables]) == len(expected_tables)

def main():
    """Main function to initialize the database."""
    print("🚀 Initializing SoftSpark Hack 2025 Database...")
    print("=" * 50)
    
    # Remove existing database if it exists (optional - uncomment if you want to start fresh)
    # if os.path.exists(DB_FILE):
    #     os.remove(DB_FILE)
    #     print(f"🗑️  Removed existing database: {DB_FILE}")
    
    try:
        # Create database connection
        conn = create_database_connection()
        print(f"📁 Connected to database: {DB_FILE}")
        
        # Create all tables
        print("\n📋 Creating database tables...")
        create_users_table(conn)
        create_online_users_table(conn)
        create_events_table(conn)
        create_event_participants_table(conn)
        create_friends_table(conn)
        create_friend_requests_table(conn)
        create_meetup_table(conn)
        create_meetup_join_table(conn)
        create_meetup_invites_table(conn)
        create_notifications_table(conn)
        
        # Create indexes
        print("\n🔍 Creating database indexes...")
        create_indexes(conn)
        
        # Insert sample data
        print("\n📝 Inserting sample data...")
        insert_sample_data(conn)
        
        # Commit all changes
        conn.commit()
        
        # Verify tables
        print("\n✅ Verifying database setup...")
        if verify_tables(conn):
            print("\n🎉 Database initialization completed successfully!")
            print(f"📊 Database file: {os.path.abspath(DB_FILE)}")
            print(f"📅 Initialized at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        else:
            print("\n❌ Database initialization completed with errors!")
        
    except sqlite3.Error as e:
        print(f"\n❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return False
    finally:
        if conn:
            conn.close()
            print("🔒 Database connection closed")
    
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
