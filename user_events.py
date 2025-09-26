import os
import sqlite3

def create_user_group_events_table(conn):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
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
            host INTEGER
            FOREIGN KEY (host) REFERENCES users (id)
        )
    ''')
    conn.commit()

def create_user_group_event_participants_table(conn):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS event_participants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER,
            user_id INTEGER,
            can_attend INTEGER,
            FOREIGN KEY (event_id) REFERENCES events (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    conn.commit()
    conn.close()

def add_user_group_event_participant(event_id, user_id, can_attend):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO event_participants (event_id, user_id, can_attend)
        VALUES (?, ?, ?)
    ''', (event_id, user_id, can_attend))
    conn.commit()
    conn.close()

def update_user_group_event_participant(event_id, user_id, can_attend):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE event_participants SET can_attend = ? WHERE event_id = ? AND user_id = ?
    ''', (can_attend, event_id, user_id))
    conn.commit()
    conn.close()

def create_user_group_event(title, description, location, date, lat, lon, host):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO events (title, description, location, date, lat, lon, host)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (title, description, location, date, lat, lon, host))
    event_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return event_id

def delete_user_group_event(event_id):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        DELETE FROM events WHERE id = ?
    ''', (event_id,))
    cursor.execute('''
        DELETE FROM event_participants WHERE event_id = ?
    ''', (event_id,))
    conn.commit()
    conn.close()

def get_user_group_events(host):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT e.*, u.username as host_username
        FROM events e
        JOIN users u ON e.host = u.id
        WHERE e.host = ?
    ''', (host,))
    events = cursor.fetchall()
    conn.close()
    return events

def get_user_group_event_participants(event_id):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM event_participants WHERE event_id = ?
    ''', (event_id,))
    participants = cursor.fetchall()
    conn.close()
    return participants

def get_all_user_events(user_id):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM events WHERE host = ? OR id IN (SELECT event_id FROM event_participants WHERE user_id = ? AND can_attend = 1)
    ''', (user_id, user_id))
    events = cursor.fetchall()
    conn.close()
    return events

def update_user_group_event(event_id, title, description, location, date, lat, lon):
    """Update an existing user group event"""
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE events 
        SET title = ?, description = ?, location = ?, date = ?, lat = ?, lon = ?
        WHERE id = ?
    ''', (title, description, location, date, lat, lon, event_id))
    conn.commit()
    conn.close()

def get_event_by_id(event_id):
    """Get a specific event by ID"""
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM events WHERE id = ?
    ''', (event_id,))
    event = cursor.fetchone()
    conn.close()
    return event

def get_event_participants_with_users(event_id):
    """Get event participants with user information"""
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT ep.*, u.username 
        FROM event_participants ep
        JOIN users u ON ep.user_id = u.id
        WHERE ep.event_id = ?
    ''', (event_id,))
    participants = cursor.fetchall()
    conn.close()
    return participants

def invite_user_to_event(event_id, user_id):
    """Invite a user to an event (add as participant with can_attend = 0)"""
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    try:
        # Check if user is already a participant
        cursor.execute('''
            SELECT id FROM event_participants WHERE event_id = ? AND user_id = ?
        ''', (event_id, user_id))
        existing = cursor.fetchone()
        
        if existing:
            # User already exists, just update can_attend to 0 (invited)
            cursor.execute('''
                UPDATE event_participants SET can_attend = 0 WHERE event_id = ? AND user_id = ?
            ''', (event_id, user_id))
        else:
            # Add new participant with can_attend = 0 (invited)
            cursor.execute('''
                INSERT INTO event_participants (event_id, user_id, can_attend)
                VALUES (?, ?, 0)
            ''', (event_id, user_id))
        
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"Error inviting user to event: {e}")
        return False
    finally:
        conn.close()

def get_user_event_invitations(user_id):
    """Get all event invitations for a user (can_attend = 0)"""
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT e.*, ep.id as participant_id, u.username as host_username
        FROM events e
        JOIN event_participants ep ON e.id = ep.event_id
        JOIN users u ON e.host = u.id
        WHERE ep.user_id = ? AND ep.can_attend = 0
    ''', (user_id,))
    invitations = cursor.fetchall()
    conn.close()
    return invitations

def get_user_attending_events(user_id):
    """Get all events that a user is attending (can_attend = 1)"""
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT e.*, ep.id as participant_id, u.username as host_username
        FROM events e
        JOIN event_participants ep ON e.id = ep.event_id
        JOIN users u ON e.host = u.id
        WHERE ep.user_id = ? AND ep.can_attend = 1
    ''', (user_id,))
    attending_events = cursor.fetchall()
    conn.close()
    return attending_events

def respond_to_event_invitation(participant_id, response):
    """
    Respond to an event invitation
    response: 1 = accept, 2 = reject
    """
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE event_participants 
        SET can_attend = ? 
        WHERE id = ?
    ''', (response, participant_id))
    conn.commit()
    conn.close()