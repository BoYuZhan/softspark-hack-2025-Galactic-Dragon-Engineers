import json
from datetime import datetime

def handle_message(user_id, message, messages_file="messages.txt", users_file="names_and_passwords.txt"):
    """
    Save a message, attach user details, and print it.
    """

    # Load users into a dictionary
    users = {}
    with open(users_file, "r") as f:
        for line in f:
            if line.strip():
                user = json.loads(line)
                users[user["id"]] = f"{user['first_name']} {user['last_name']}"

    # Create message entry
    timestamp = datetime.now().isoformat()
    entry = {
        "user_id": user_id,
        "timestamp": timestamp,
        "message": message
    }

    # Save message to file
    with open(messages_file, "a") as f:
        json.dump(entry, f)
        f.write("\n")

    # Print message with name
    user_name = users.get(user_id, "Unknown User")
    print(f"{user_name} ({user_id}) at {timestamp}: {message}")

    return entry
