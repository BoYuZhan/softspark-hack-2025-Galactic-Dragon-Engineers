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
    cursor.execute('''
        INSERT INTO users (username, password, first_name, last_name, email, phone, bio, location)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (username, password, first_name, last_name, email, phone, bio))
    conn.commit()
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

def add_online_user(id, location, timestamp):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO online_users (id, location, timestamp)
        VALUES (?, ?)
    ''', (id, location, timestamp))
    conn.commit()
    conn.close()

def remove_online_user(id):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        DELETE FROM online_users WHERE id = ?
    ''', (id,))
    conn.commit()
    conn.close()

def get_online_users(id):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM online_users WHERE id = ?
    ''', (id,))
    users = cursor.fetchall()
    conn.close()
    return users

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
