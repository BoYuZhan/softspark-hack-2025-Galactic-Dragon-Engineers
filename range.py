import json
from geopy.distance import geodesic

def generate_event_invitations(event_file, users_file, friends_file, max_distance_km=50):
    """
    Reads event, user, and friends files and generates invitation lists.
    
    Args:
        event_file (str): Path to event.txt
        users_file (str): Path to names_and_passwords.txt
        friends_file (str): Path to friends.txt
        max_distance_km (float): Maximum distance to consider a user in range
        
    Returns:
        List of events with invited friends added
    """
    
    # Load events
    events = []
    with open(event_file, "r") as f:
        for line in f:
            if line.strip():
                event = json.loads(line)
                event["invited"] = []  # initialize invitation list
                events.append(event)

    # Load users
    users = {}
    with open(users_file, "r") as f:
        for line in f:
            if line.strip():
                user = json.loads(line)
                users[user["id"]] = user

    # Load friends
    friends = {}
    with open(friends_file, "r") as f:
        for line in f:
            if line.strip():
                data = json.loads(line)
                friends[data["id"]] = data["friends"]

    # Process invitations
    for event in events:
        event_coords = (event["lat"], event["lon"])
        
        # Find host ID
        host_id = None
        for uid, user in users.items():
            if user["first_name"].lower() == event["host"].lower():
                host_id = uid
                break
        if host_id is None:
            continue  # skip if host not found

        host_friends = friends.get(host_id, [])

        for uid, user in users.items():
            if uid == host_id:
                continue  # skip host
            
            # Only invite friends
            if uid not in host_friends:
                continue

            user_coords = (user["latitude"], user["longitude"])
            distance = geodesic(event_coords, user_coords).km

            if distance <= max_distance_km:
                event["invited"].append({
                    "id": uid,
                    "first_name": user["first_name"],
                    "last_name": user["last_name"],
                    "distance_km": round(distance, 2)
                })

    return events

# Example usage
events_with_invitations = generate_event_invitations("event.txt", "names_and_passwords.txt", "friends.txt")

# Print results
for event in events_with_invitations:
    print(f"Event: {event['title']} (Host: {event['host']})")
    if event["invited"]:
        print("Invited Friends:")
        for invitee in event["invited"]:
            print(f"  - {invitee['first_name']} {invitee['last_name']} ({invitee['distance_km']} km away)")
    else:
        print("No friends within range.")
    print("-" * 50)

