import json

def remove_friend(friends_file, user_id, friend_id):
    """
    Removes a friend from a user's friend list and updates the file.
    
    Args:
        friends_file (str): Path to friends.txt
        user_id (str): ID of the user
        friend_id (str): ID of the friend to remove
    """
    
    updated_friends = []
    
    # Load all friends data
    with open(friends_file, "r") as f:
        for line in f:
            if line.strip():
                data = json.loads(line)
                # If this is the target user, remove the friend
                if data["id"] == user_id:
                    if friend_id in data["friends"]:
                        data["friends"].remove(friend_id)
                        print(f"Removed friend {friend_id} from user {user_id}")
                    else:
                        print(f"Friend {friend_id} not in user {user_id}'s friend list")
                updated_friends.append(data)
    
    # Save back to the same file
    with open(friends_file, "w") as f:
        for data in updated_friends:
            json.dump(data, f)
            f.write("\n")

# Example usage
remove_friend("friends.txt", "A1B2C3", "D4E5F6")

