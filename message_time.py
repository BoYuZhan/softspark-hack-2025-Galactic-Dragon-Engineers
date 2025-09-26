import json
from datetime import datetime

def save_message(messages_file, user_id, message, timestamp=None):
    """
    Save a user message with timestamp to messages.txt

    Args:
        messages_file (str): path to messages.txt
        user_id (str): the user ID (must exist in names_and_passwords.txt)
        message (str): the text message
        timestamp (str): optional ISO datetime, defaults to now
    """
    if timestamp is None:
        timestamp = datetime.now().isoformat()

    entry = {
        "user_id": user_id,
        "timestamp": timestamp,
        "message": message
    }

    # Append to file
    with open(messages_file, "a") as f:
        json.dump(entry, f)
        f.write("\n")

    print(f"Message saved for {user_id} at {timestamp}")
    return entry

