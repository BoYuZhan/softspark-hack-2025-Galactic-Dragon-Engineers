import json
from datetime import datetime

def save_message(messages_file, user_id, message, timestamp=None):
    """
    Save a user message with timestamp to messages.txt
    """
    if timestamp is None:
        timestamp = datetime.now().isoformat()

    entry = {
        "user_id": user_id,
        "timestamp": timestamp,
        "message": message
    }

    with open(messages_file, "a") as f:
        json.dump(entry, f)
        f.write("\n")

    print(f"Message saved for {user_id} at {timestamp}")
    return entry


def get_messages_with_usernames(messages_file, users_file):
    """
    Combine messages with user details from names_and_passwords.txt.
    """
    messages = []
    users = {}

    # Load users
    with open(users_file, "r") as f:
        for line in f:
            if line.strip():
                user = json.loads(line)
                users[user["id"]] = f"{user['first_name']} {user['last_name']}"

    # Load messages
    with open(messages_file, "r") as f:
        for line in f:
            if line.strip():
                msg = json.loads(line)
                user_name = users.get(msg["user_id"], "Unknown User")
                messages.append({
                    "user_id": msg["user_id"],
                    "user_name": user_name,
                    "timestamp": msg["timestamp"],
                    "message": msg["message"]
                })

    # Print messages
    for m in messages:
        print(f"{m['user_name']} ({m['user_id']}) at {m['timestamp']}: {m['message']}")

    return messages

