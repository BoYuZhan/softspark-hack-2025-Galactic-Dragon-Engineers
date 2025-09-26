import json

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

