import sqlite3
import json

def create_friend_requests_table(conn):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS friend_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_id INTEGER NOT NULL,
            to_id INTEGER NOT NULL
            FOREIGN KEY (from_id) REFERENCES users (id),
            FOREIGN KEY (to_id) REFERENCES users (id)
        )
    ''')
    conn.commit()
    conn.close()

def create_friends_table(conn):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS friends (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            friend_id INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (friend_id) REFERENCES users (id)
        )
    ''')
    conn.commit()
    conn.close()

def add_friend(user_id, friend_id):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO friends (user_id, friend_id)
            VALUES (?, ?)
        ''', (user_id, friend_id))
        
        cursor.execute('''
            DELETE FROM friend_requests WHERE from_id = ? AND to_id = ?
        ''', (friend_id, user_id))
        
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def remove_friend(user_id, friend_id):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        DELETE FROM friends WHERE user_id = ? AND friend_id = ?
    ''', (user_id, friend_id))
    conn.commit()
    conn.close()

def get_friends(user_id):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT 
            CASE 
                WHEN user_id = ? THEN friend_id 
                ELSE user_id 
            END as friend_id
        FROM friends 
        WHERE user_id = ? OR friend_id = ?
    ''', (user_id, user_id, user_id))
    friends = cursor.fetchall()

    conn.close()
    return friends

def add_friend_request(from_id, to_id):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO friend_requests (from_id, to_id)
        VALUES (?, ?)
    ''', (from_id, to_id))
    conn.commit()
    conn.close()

def remove_friend_request(from_id, to_id):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        DELETE FROM friend_requests WHERE from_id = ? AND to_id = ?
    ''', (from_id, to_id))
    conn.commit()
    conn.close()

def get_friend_requests(to_id):
    file_path = 'main.db'
    conn = sqlite3.connect(file_path)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM friend_requests WHERE to_id = ?
    ''', (to_id,))
    requests = cursor.fetchall()
    conn.close()
    return requests


def manage_friend_requests(file_path, from_id, to_id, action="add"):
    """
    Add or remove a friend request in wanttobefriends.txt
    
    Args:
        file_path (str): Path to wanttobefriends.txt
        from_id (str): ID of the user sending the request
        to_id (str): ID of the user receiving the request
        action (str): "add" to add a request, "remove" to delete
    """
    
    requests = []
    
    # Load existing requests
    try:
        with open(file_path, "r") as f:
            for line in f:
                if line.strip():
                    requests.append(json.loads(line))
    except FileNotFoundError:
        # If file doesn't exist yet, start with empty list
        requests = []
    
    if action == "add":
        # Check if request already exists
        if any(r["from_id"] == from_id and r["to_id"] == to_id for r in requests):
            print(f"Request from {from_id} to {to_id} already exists.")
        else:
            requests.append({"from_id": from_id, "to_id": to_id})
            print(f"Friend request added from {from_id} to {to_id}.")
    
    elif action == "remove":
        original_len = len(requests)
        requests = [r for r in requests if not (r["from_id"] == from_id and r["to_id"] == to_id)]
        if len(requests) < original_len:
            print(f"Friend request removed from {from_id} to {to_id}.")
        else:
            print(f"No friend request found from {from_id} to {to_id}.")

    else:
        print("Invalid action. Use 'add' or 'remove'.")
        return
    
    # Save back to file
    with open(file_path, "w") as f:
        for r in requests:
            json.dump(r, f)
            f.write("\n")


manage_friend_requests("wanttobefriends.txt", "A1B2C3", "D4E5F6", action="add")
manage_friend_requests("wanttobefriends.txt", "A1B2C3", "D4E5F6", action="remove")

