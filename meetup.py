import sqlite3

def create_meetup_table(conn):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS meetups (
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
    conn.commit()
    conn.close()

def create_meetup_join_table(conn):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS meetup_joins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            meetup_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            FOREIGN KEY (meetup_id) REFERENCES meetups (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    conn.commit()
    conn.close()

def create_meetup(location, activities, meters, latitude, longitude, host):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO meetups (location, activities, meters, latitude, longitude, host)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (location, activities, meters, latitude, longitude, host))
    meetup_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return meetup_id

def get_meetups(host):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM meetups WHERE host = ?
    ''', (host,))
    meetups = cursor.fetchall()
    conn.close()
    return meetups

def add_meetup_join(meetup_id, user_id):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO meetup_joins (meetup_id, user_id)
        VALUES (?, ?)
    ''', (meetup_id, user_id))
    conn.commit()
    conn.close()

def get_users_in_meetup(meetup_id):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT user_id FROM meetup_joins WHERE meetup_id = ?
    ''', (meetup_id,))
    users = cursor.fetchall()
    conn.close()
    return users

def remove_meetup_join(meetup_id, user_id):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        DELETE FROM meetup_joins WHERE meetup_id = ? AND user_id = ?
    ''', (meetup_id, user_id))
    conn.commit()
    conn.close()

def get_meetup_by_id(meetup_id):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM meetups WHERE id = ?
    ''', (meetup_id,))
    meetup = cursor.fetchone()
    conn.close()
    return meetup

def update_meetup(meetup_id, location, activities, meters, latitude, longitude):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE meetups 
        SET location = ?, activities = ?, meters = ?, latitude = ?, longitude = ?
        WHERE id = ?
    ''', (location, activities, meters, latitude, longitude, meetup_id))
    conn.commit()
    conn.close()

def remove_meetup(meetup_id):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        DELETE FROM meetups WHERE id = ?
    ''', (meetup_id,))
    cursor.execute('''
        DELETE FROM meetup_joins WHERE meetup_id = ?
    ''', (meetup_id,))
    conn.commit()
    conn.close()

def get_user_joined_meetups(user_id):
    """Get all meetups that a user has joined"""
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT m.*, u.username as host_username
        FROM meetups m
        JOIN meetup_joins mj ON m.id = mj.meetup_id
        JOIN users u ON m.host = u.id
        WHERE mj.user_id = ?
        ORDER BY m.id DESC
    ''', (user_id,))
    meetups = cursor.fetchall()
    conn.close()
    return meetups