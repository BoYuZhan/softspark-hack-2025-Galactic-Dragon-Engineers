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

def create_meetup_invites_table(conn):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS meetup_invites (
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

def invite_user_to_meetup(meetup_id, host_id, invited_user_id):
    """Invite a user to a meetup"""
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    try:
        # Check if invitation already exists
        cursor.execute('''
            SELECT id FROM meetup_invites 
            WHERE meetup_id = ? AND invited_user_id = ?
        ''', (meetup_id, invited_user_id))
        existing = cursor.fetchone()
        
        if existing:
            conn.close()
            return False  # Invitation already exists
        
        # Create invitation
        from datetime import datetime
        timestamp = datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO meetup_invites (meetup_id, host_id, invited_user_id, timestamp)
            VALUES (?, ?, ?, ?)
        ''', (meetup_id, host_id, invited_user_id, timestamp))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        conn.rollback()
        conn.close()
        print(f"Error inviting user to meetup: {e}")
        return False

def get_meetup_invites_for_user(user_id):
    """Get all meetup invitations for a user"""
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT mi.*, m.location, m.activities, m.latitude, m.longitude, u.username as host_username
        FROM meetup_invites mi
        JOIN meetups m ON mi.meetup_id = m.id
        JOIN users u ON mi.host_id = u.id
        WHERE mi.invited_user_id = ? AND mi.status = 0
        ORDER BY mi.timestamp DESC
    ''', (user_id,))
    invites = cursor.fetchall()
    conn.close()
    return invites

def respond_to_meetup_invite(invite_id, response):
    """Respond to a meetup invitation (1 = accept, 2 = decline)"""
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    try:
        # Update invitation status
        cursor.execute('''
            UPDATE meetup_invites SET status = ? WHERE id = ?
        ''', (response, invite_id))
        
        # If accepted, add user to meetup
        if response == 1:
            cursor.execute('''
                SELECT meetup_id, invited_user_id FROM meetup_invites WHERE id = ?
            ''', (invite_id,))
            result = cursor.fetchone()
            if result:
                meetup_id, user_id = result
                cursor.execute('''
                    INSERT INTO meetup_joins (meetup_id, user_id)
                    VALUES (?, ?)
                ''', (meetup_id, user_id))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        conn.rollback()
        conn.close()
        print(f"Error responding to meetup invite: {e}")
        return False