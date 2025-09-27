import sqlite3
from datetime import datetime

def create_notifications_table(conn):
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            message TEXT,
            timestamp TEXT,
            type TEXT,
            related_id INTEGER
        )
    ''')
    conn.commit()
    print("✅ Created notifications table")

def add_notification(user_id, message, notification_type=None, related_id=None):
    """Add a notification for a user"""
    conn = sqlite3.connect('main.db')
    cursor = conn.cursor()
    timestamp = datetime.now().isoformat()
    
    cursor.execute('''
        INSERT INTO notifications (user_id, message, timestamp, type, related_id)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_id, message, timestamp, notification_type, related_id))
    conn.commit()
    conn.close()

def get_user_notifications(user_id):
    """Get all notifications for a user"""
    conn = sqlite3.connect('main.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM notifications 
        WHERE user_id = ? 
        ORDER BY timestamp DESC
    ''', (user_id,))
    notifications = cursor.fetchall()
    conn.close()
    return notifications

def get_users_in_meetup(meetup_id):
    """Get all users in a meetup (excluding the host)"""
    conn = sqlite3.connect('main.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT DISTINCT user_id FROM meetup_joins WHERE meetup_id = ?
    ''', (meetup_id,))
    users = cursor.fetchall()
    conn.close()
    return [user[0] for user in users]

def get_meetup_host(meetup_id):
    """Get the host of a meetup"""
    conn = sqlite3.connect('main.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT host FROM meetups WHERE id = ?
    ''', (meetup_id,))
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else None

def get_event_host(event_id):
    """Get the host of an event"""
    conn = sqlite3.connect('main.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT host FROM events WHERE id = ?
    ''', (event_id,))
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else None

def get_username_by_id(user_id):
    """Get username by user ID"""
    conn = sqlite3.connect('main.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT username FROM users WHERE id = ?
    ''', (user_id,))
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else "Unknown User"

def get_meetup_invites_for_user(user_id):
    """Get all meetup invitations for a user"""
    conn = sqlite3.connect('main.db')
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