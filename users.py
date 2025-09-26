import os
import sqlite3

def create_users_table(conn):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            bio TEXT NOT NULL
            location TEXT NOT NULL
        )
    ''')
    conn.commit()

def add_user(username, password, first_name, last_name, email, phone, bio, location):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO users (username, password, first_name, last_name, email, phone, bio, location)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (username, password, first_name, last_name, email, phone, bio, location))
        user_id = cursor.lastrowid
        conn.commit()
        return user_id
    except Exception as e:
        conn.rollback()
        print(f"Error adding user: {e}")
        return None
    finally:
        conn.close()

def get_user(username):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM users WHERE username = ?
    ''', (username,))
    user = cursor.fetchone()
    conn.close()
    return user

def user_exists(username):
    """Check if a username already exists"""
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT id FROM users WHERE username = ?', (username,))
        user = cursor.fetchone()
        return user is not None
    except Exception as e:
        print(f"Error checking if user exists: {e}")
        return False
    finally:
        conn.close()

def get_user_by_id(user_id):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM users WHERE id = ?
    ''', (user_id,))
    user = cursor.fetchone()
    conn.close()
    return user

def create_online_users_table(conn):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS online_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

def add_online_user(user_id, location="Unknown", latitude=0.0, longitude=0.0):
    """Add a user to the online_users table"""
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    try:
        # Check if user is already online
        cursor.execute('SELECT id FROM online_users WHERE user_id = ?', (user_id,))
        existing = cursor.fetchone()
        
        if existing:
            # Update existing record
            cursor.execute('''
                UPDATE online_users 
                SET location = ?, latitude = ?, longitude = ?, timestamp = CURRENT_TIMESTAMP
                WHERE user_id = ?
            ''', (location, latitude, longitude, user_id))
        else:
            # Insert new record
            cursor.execute('''
                INSERT INTO online_users (user_id, location, latitude, longitude, timestamp)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ''', (user_id, location, latitude, longitude))
        
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"Error adding online user: {e}")
        return False
    finally:
        conn.close()

def remove_online_user(user_id):
    """Remove a user from the online_users table"""
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    try:
        cursor.execute('DELETE FROM online_users WHERE user_id = ?', (user_id,))
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"Error removing online user: {e}")
        return False
    finally:
        conn.close()

def get_online_users(user_id):
    """Get online user data by user_id"""
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM online_users WHERE user_id = ?
    ''', (user_id,))
    users = cursor.fetchall()
    conn.close()
    return users

def is_user_online(user_id):
    """Check if a user is currently online"""
    online_users = get_online_users(user_id)
    return len(online_users) > 0

def update_user(user_id, first_name, last_name, email, bio, location):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE users 
        SET first_name = ?, last_name = ?, email = ?, bio = ?, location = ?
        WHERE id = ?
    ''', (first_name, last_name, email, bio, location, user_id))
    conn.commit()
    conn.close()
