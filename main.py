from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uuid
import sqlite3
from datetime import datetime
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from eventapi import get_events
#from messages import save_message
#from returnmessages import handle_massages
from user_events import *
from users import *
from addfriends import *
from meetup import *
from notifications import *
app = FastAPI()

# Mount static files for pictures
app.mount("/pictures", StaticFiles(directory="pictures"), name="pictures")

# In-memory storage for demo purposes
# In production, use a proper database
shared_locations = {}
user_locations = {}
meetups = {}

class LoginRequest(BaseModel):
    username: str
    password: str

class SignupRequest(BaseModel):
    username: str
    firstName: str
    lastName: str
    password: str
    bio: str
    email: str
    phone: str
    location: str

class LocationData(BaseModel):
    latitude: float
    longitude: float
    timestamp: Optional[str] = None
    description: Optional[str] = None

class LocationUpdateRequest(BaseModel):
    latitude: float
    longitude: float
    timestamp: Optional[str] = None
    description: Optional[str] = None
    user_id: int

class ShareLocationRequest(BaseModel):
    latitude: float
    longitude: float
    description: Optional[str] = None
    share_with: List[str] = []  # List of usernames to share with

class MessageRequest(BaseModel):
    user_id: str
    message: str
    timestamp: Optional[str] = None

class LocationResponse(BaseModel):
    id: str
    latitude: float
    longitude: float
    timestamp: str
    description: Optional[str] = None
    shared_by: str


class UserGroupEventRequest(BaseModel):
    title: str
    description: str
    location: str
    date: str
    lat: float
    lon: float
    host: int
    participants: List[int] = []

class UpdateEventRequest(BaseModel):
    event_id: int
    title: str
    description: str
    location: str
    date: str
    lat: float
    lon: float

class InviteUserRequest(BaseModel):
    event_id: int
    user_id: int

class RespondToInvitationRequest(BaseModel):
    participant_id: int
    response: int  # 1 = accept, 2 = reject

class FriendRequestModel(BaseModel):
    from_id: int
    to_username: str

class FriendActionModel(BaseModel):
    user_id: int
    friend_id: int

class UserIdModel(BaseModel):
    id: int

@app.post("/api/message")
async def post_message(user_id: str, message: str):
    entry = handle_message(user_id, message)
    return {"success": True, "entry": entry}

@app.post("/api/messages/send")
def send_message(data: MessageRequest):
    entry = save_message("messages.txt", data.user_id, data.message, data.timestamp)
    return {"success": True, "message": entry}

@app.post("/api/login")
async def login(data: LoginRequest):
    user = get_user(data.username)
    if user and user[2] == data.password:
        user_id = user[0]
        # Add user to online_users table if not already there
        add_online_user(user_id, "Unknown", 0.0, 0.0)
        return {"username": user[1], "success": True, "token": "abc123xyz", "user_id": user_id}
    else:
        return {"success": False, "message": "Invalid credentials"}

@app.post("/api/logout")
async def logout(user_data: UserIdModel):
    """Logout user and remove from online_users table"""
    try:
        success = remove_online_user(user_data.id)
        if success:
            return {"success": True, "message": "Logged out successfully"}
        else:
            return {"success": False, "message": "Failed to logout"}
    except Exception as e:
        print(f"Error during logout: {e}")
        return {"success": False, "message": f"Logout error: {str(e)}"}

@app.post("/api/signup")
async def signup(data: SignupRequest):
    """Signup function that creates a new user account"""
    try:
        # Check if username already exists
        if user_exists(data.username):
            return {
                "success": False,
                "message": "Username already exists. Please choose a different username."
            }
        
        # Add user to database
        user_id = add_user(
            data.username, 
            data.password, 
            data.firstName, 
            data.lastName, 
            data.email, 
            data.phone, 
            data.bio, 
            data.location
        )
        
        if user_id:
            return {
                "success": True, 
                        "message": "Account created successfully!",
                        "user_id": user_id,
                        "username": data.username
                    }
        else:
            return {
                "success": False,
                "message": "Failed to create account. Please try again."
            }
            
    except Exception as e:
        print(f"Error during signup: {e}")
        return {
            "success": False,
            "message": f"Signup error: {str(e)}"
        }

@app.post("/api/location/update")
async def update_location(location_data: LocationUpdateRequest):
    """Update user's current location in both user_locations and online_users tables"""
    
    try:
        location_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
    
        # Get username from user_id for backward compatibility with user_locations
        user = get_user_by_id(location_data.user_id)
        if not user:
            return {
                "success": False,
                "message": "User not found"
            }
        
        username = user[1]  # username is at index 1
        
        # Update user_locations dictionary (for backward compatibility)
        user_locations[username] = {
            "id": location_id,
                "latitude": location_data.latitude,
                "longitude": location_data.longitude,
            "timestamp": timestamp,
                "description": location_data.description or "Current location"
            }
            
            # Update online_users table with new location
        success = add_online_user(
            location_data.user_id, 
            location_data.description or "Current location",
            location_data.latitude, 
            location_data.longitude
        )
        
        if success:
            return {
                "success": True,
                "location_id": location_id,
                        "message": f"Location updated for {username}",
                        "user_id": location_data.user_id
                    }
        else:
            return {
                "success": False,
                "message": "Failed to update location in database"
            }
                    
    except Exception as e:
        print(f"Error updating location: {e}")
        return {
            "success": False,
            "message": f"Failed to update location: {str(e)}"
    }

@app.get("/api/location/current")
async def get_current_location(username: str = "testuser"):
    """Get user's current location"""
    if username not in user_locations:
        raise HTTPException(status_code=404, detail="Location not found")
    
    return {
        "success": True,
        "location": user_locations[username]
    }

@app.post("/api/location/share")
async def share_location(share_request: ShareLocationRequest, username: str = "testuser"):
    """Share location with other users"""
    location_id = str(uuid.uuid4())
    timestamp = datetime.now().isoformat()
    
    shared_location = {
        "id": location_id,
        "latitude": share_request.latitude,
        "longitude": share_request.longitude,
        "timestamp": timestamp,
        "description": share_request.description or "Shared location",
        "shared_by": username
    }
    
    # Store shared location
    if location_id not in shared_locations:
        shared_locations[location_id] = shared_location
    
    return {
        "success": True,
        "location_id": location_id,
        "message": f"Location shared with {len(share_request.share_with)} users"
    }

@app.get("/api/location/shared")
async def get_shared_locations(username: str = "testuser"):
    """Get all shared locations"""
    # In a real app, you'd filter by user permissions
    locations = list(shared_locations.values())
    
    return {
        "success": True,
        "locations": locations,
        "count": len(locations)
    }

@app.get("/api/location/friends_markers")
async def get_friends_markers(user_id: int = 1):
    """Get friend markers for the map"""
    
    friends = get_friends(user_id)
    online_friends = []
    
    # Get online friends (use set to avoid duplicates)
    online_friends_set = set()
    for friend in friends:
        online_friend = get_online_users(friend[0])
        if online_friend:
            online_friends_set.add(friend[0])
    online_friends = list(online_friends_set)
    
    markers_data = []
    
    # Add friend locations as markers
    for friend_id in online_friends:
        friend_data = get_user_by_id(friend_id)
        if friend_data:
            # Get friend's location from online_users table
            online_data = get_online_users(friend_id)
            if online_data:
                markers_data.append({
                    "id": f"friend_{friend_id}",
                    "latitude": online_data[0][4],  # latitude
                    "longitude": online_data[0][5],  # longitude
                    "title": friend_data[1],  # username
                    "description": f"{friend_data[1]} is online",
            "type": "user"
        })
    
    return {
        "success": True,
            "markers": markers_data,
            "count": len(markers_data)
        }


@app.get("/api/whats_on/list")
async def list_whats_on():
    """Get all events"""
    events = get_events()
    return {
        "success": True,
        "events": events,
        "count": len(events)
    }


@app.post("/api/user_group_events/create")
async def create_user_group_event_endpoint(event_data: UserGroupEventRequest):
    """Create a new user group event"""
    try:
        # Create the event in database
        event_id = create_user_group_event(
            event_data.title, 
            event_data.description, 
            event_data.location, 
            event_data.date, 
            event_data.lat, 
            event_data.lon, 
            event_data.host
        )
        
        for user in event_data.participants:
            add_user_group_event_participant(event_id, user, 0)
        
        return {
            "success": True,
            "message": "User group event created successfully",
            "event_id": event_id,
            "event": event_data
        }
    except Exception as e:
        print(f"Error creating event: {e}")
        return {
            "success": False,
            "message": f"Failed to create event: {str(e)}"
        }


@app.get("/api/user_group_events/get")
async def get_user_group_events_all(user_id: int = 1):
    """Get all user group events for a user"""
    try:
        events = get_all_user_events(user_id)
        events_data = []
        for event in events:
            event_data = {
                "id": event[0],
                "title": event[1],
                "description": event[2],
                "location": event[3],
                "date": event[4],
                "lat": event[5],
                "lon": event[6],
                "host": event[7]
            }
            events_data.append(event_data)
        return {
            "success": True,
            "events": events_data,
            "count": len(events_data)
        }
    except Exception as e:
        print(f"Error fetching events: {e}")
        return {
            "success": False,
            "message": f"Failed to fetch events: {str(e)}",
            "events": [],
            "count": 0
        }

@app.get("/api/user_group_events_host/get")
async def get_user_group_events_host(host: int = 1):
    """Get all user group events for a host"""
    try:
        events = get_user_group_events(host)
        events_data = []
        for event in events:
            events_data.append({
                "id": event[0],
                "title": event[1],
                "description": event[2],
                "location": event[3],
                "date": event[4],
                "lat": event[5],
                "lon": event[6],
                "host": event[7],
                "created_at": event[8],
                "host_username": event[9]
            })
        
        return {
            "success": True,
            "events": events_data,
            "count": len(events_data)
        }
    except Exception as e:
        print(f"Error fetching events: {e}")
        return {
            "success": False,
            "message": f"Failed to fetch events: {str(e)}",
            "events": [],
            "count": 0
        }

@app.put("/api/user_group_events/update")
async def update_user_group_event_endpoint(event_data: UpdateEventRequest):
    """Update an existing user group event"""
    try:
        update_user_group_event(
            event_data.event_id,
            event_data.title,
            event_data.description,
            event_data.location,
            event_data.date,
            event_data.lat,
            event_data.lon
        )
        
        return {
            "success": True,
            "message": "Event updated successfully",
            "event_id": event_data.event_id
        }
    except Exception as e:
        print(f"Error updating event: {e}")
        return {
            "success": False,
            "message": f"Failed to update event: {str(e)}"
        }

@app.delete("/api/user_group_events/{event_id}")
async def delete_user_group_event_endpoint(event_id: int):
    """Delete a user group event"""
    try:
        # First check if the event exists
        event = get_event_by_id(event_id)
        if not event:
            return {
                "success": False,
                "message": "Event not found"
            }
        
        # Delete the event (this also deletes participants due to CASCADE)
        delete_user_group_event(event_id)
        
        return {
            "success": True,
            "message": "Event deleted successfully",
            "event_id": event_id
        }
    except Exception as e:
        print(f"Error deleting event: {e}")
        return {
            "success": False,
            "message": f"Failed to delete event: {str(e)}"
        }

@app.get("/api/user_group_events/{event_id}")
async def get_event_by_id_endpoint(event_id: int):
    """Get a specific event by ID"""
    try:
        event = get_event_by_id(event_id)
        if not event:
            return {
                "success": False,
                "message": "Event not found"
            }
        
        event_data = {
            "id": event[0],
            "title": event[1],
            "description": event[2],
            "location": event[3],
            "date": event[4],
            "lat": event[5],
            "lon": event[6],
            "host": event[7]
        }
        
        return {
            "success": True,
            "event": event_data
        }
    except Exception as e:
        print(f"Error fetching event: {e}")
        return {
            "success": False,
            "message": f"Failed to fetch event: {str(e)}"
        }

@app.get("/api/user_group_events/{event_id}/participants")
async def get_event_participants_endpoint(event_id: int):
    """Get event participants with user information"""
    try:
        participants = get_event_participants_with_users(event_id)
        participants_data = []
        
        for participant in participants:
            participants_data.append({
                "id": participant[0],
                "event_id": participant[1],
                "user_id": participant[2],
                "can_attend": participant[3],
                "joined_at": participant[4],
                "username": participant[5]
            })
        
        return {
            "success": True,
            "participants": participants_data,
            "count": len(participants_data)
        }
    except Exception as e:
        print(f"Error fetching participants: {e}")
        return {
            "success": False,
            "message": f"Failed to fetch participants: {str(e)}",
            "participants": [],
            "count": 0
        }

@app.post("/api/user_group_events/invite")
async def invite_user_to_event_endpoint(invite_data: InviteUserRequest):
    """Invite a user to an event"""
    try:
        success = invite_user_to_event(invite_data.event_id, invite_data.user_id)
        
        if success:
            # Send notification to the invited user
            event_host = get_event_host(invite_data.event_id)
            host_username = get_username_by_id(event_host) if event_host else "Unknown Host"
            notification_message = f"{host_username} invited you to an event"
            add_notification(invite_data.user_id, notification_message, "event_invite", invite_data.event_id)
            
            return {
                "success": True,
                "message": "User invited to event successfully"
            }
        else:
            return {
                "success": False,
                "message": "Failed to invite user to event"
            }
    except Exception as e:
        print(f"Error inviting user to event: {e}")
        return {
            "success": False,
            "message": f"Failed to invite user: {str(e)}"
        }

@app.get("/api/user_group_events/invitations/{user_id}")
async def get_user_event_invitations_endpoint(user_id: int):
    """Get all event invitations for a user"""
    try:
        invitations = get_user_event_invitations(user_id)
        invitations_data = []
        
        for invitation in invitations:
            invitations_data.append({
                "participant_id": invitation[8],  # participant_id
                "event_id": invitation[0],
                "title": invitation[1],
                "description": invitation[2],
                "location": invitation[3],
                "date": invitation[4],
                "lat": invitation[5],
                "lon": invitation[6],
                "host": invitation[7],
                "host_username": invitation[9]
            })
        
        return {
            "success": True,
            "invitations": invitations_data,
            "count": len(invitations_data)
        }
    except Exception as e:
        print(f"Error fetching invitations: {e}")
        return {
            "success": False,
            "message": f"Failed to fetch invitations: {str(e)}",
            "invitations": [],
            "count": 0
        }

@app.get("/api/user_group_events/attending/{user_id}")
async def get_user_attending_events_endpoint(user_id: int):
    """Get all events that a user is attending"""
    try:
        attending_events = get_user_attending_events(user_id)
        events_data = []
        
        for event in attending_events:
            events_data.append({
                "participant_id": event[8],  # participant_id
                "event_id": event[0],
                "title": event[1],
                "description": event[2],
                "location": event[3],
                "date": event[4],
                "lat": event[5],
                "lon": event[6],
                "host": event[7],
                "host_username": event[9]
            })
        
        return {
            "success": True,
            "events": events_data,
            "count": len(events_data)
        }
    except Exception as e:
        print(f"Error fetching attending events: {e}")
        return {
            "success": False,
            "message": f"Failed to fetch attending events: {str(e)}",
            "events": [],
            "count": 0
        }

@app.post("/api/user_group_events/respond")
async def respond_to_invitation_endpoint(response_data: RespondToInvitationRequest):
    """Respond to an event invitation"""
    try:
        respond_to_event_invitation(response_data.participant_id, response_data.response)
        
        # Get participant info to send notification to host
        conn = sqlite3.connect('main.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT user_id, event_id FROM event_participants WHERE id = ?
        ''', (response_data.participant_id,))
        participant_info = cursor.fetchone()
        conn.close()
        
        if participant_info:
            user_id, event_id = participant_info
            event_host = get_event_host(event_id)
            responder_username = get_username_by_id(user_id)
            response_text = "accepted" if response_data.response == 1 else "rejected"
            
            # Send notification to the event host
            if event_host and event_host != user_id:
                notification_message = f"{responder_username} {response_text} your event invitation"
                add_notification(event_host, notification_message, "event_response", event_id)
        
        response_text = "accepted" if response_data.response == 1 else "rejected"
        return {
            "success": True,
            "message": f"Invitation {response_text} successfully"
        }
    except Exception as e:
        print(f"Error responding to invitation: {e}")
        return {
            "success": False,
            "message": f"Failed to respond to invitation: {str(e)}"
        }

# Notification endpoints
@app.get("/api/notifications/{user_id}")
async def get_user_notifications_endpoint(user_id: int):
    """Get all notifications for a user"""
    try:
        notifications = get_user_notifications(user_id)
        
        notifications_data = []
        for notification in notifications:
            notifications_data.append({
                "id": notification[0],
                "user_id": notification[1],
                "message": notification[2],
                "timestamp": notification[3],
                "type": notification[4],
                "related_id": notification[5]
            })
        
        return {
            "success": True,
            "notifications": notifications_data,
            "count": len(notifications_data)
        }
    except Exception as e:
        print(f"Error fetching notifications: {e}")
        return {
            "success": False,
            "message": f"Failed to fetch notifications: {str(e)}",
            "notifications": [],
            "count": 0
        }

# Friends endpoints
@app.get("/api/friends/get")
async def get_user_friends(user_id: int = 1):
    """Get all friends for a user"""
    try:
        friends = get_friends(user_id)
        friends_data = []
        seen_ids = set()
        for friend in friends:
            friend_id = friend[0]
            if friend_id not in seen_ids and friend_id != user_id:  # Avoid duplicates and self
                friend_user = get_user_by_id(friend_id)
                if friend_user:
                    friends_data.append({
                        "id": friend_user[0],
                        "username": friend_user[1]
                    })
                    seen_ids.add(friend_id)
        print(friends_data)
        return {
            "success": True,
            "friends": friends_data,
            "count": len(friends_data)
        }
    except Exception as e:
        print(f"Error fetching friends: {e}")
        return {
            "success": False,
            "message": f"Failed to fetch friends: {str(e)}",
            "friends": [],
            "count": 0
        }

@app.get("/api/friends/requests")
async def get_user_friend_requests(user_id: str = "1"):
    """Get friend requests received by a user"""
    try:
        requests = get_friend_requests(user_id)
        request_data = []
        for request in requests:
            # Get the user who sent the request (request[1] is from_id)
            from_user = get_user_by_id(request[1])
            if from_user and len(from_user) > 1:
                # Return both user ID and username for frontend compatibility
                request_data.append({
                    "id": request[1],  # user ID
                    "username": from_user[1]  # username
                })
            else:
                # If user not found, use the user ID as fallback
                request_data.append({
                    "id": request[1],
                    "username": f"User {request[1]}"
                })
        print(f"Friend requests for user {user_id}: {request_data}")
        return {
            "success": True,
            "requests": request_data,
            "count": len(requests)
        }
    except Exception as e:
        print(f"Error fetching friend requests: {e}")
        return {
            "success": False,
            "message": f"Failed to fetch friend requests: {str(e)}",
            "requests": [],
            "count": 0
        }

@app.post("/api/friends/send_request")
async def send_friend_request(request_data: FriendRequestModel):
    """Send a friend request"""
    try:
        print(f"Sending friend request from user {request_data.from_id} to username {request_data.to_username}")        
        to_user = get_user(request_data.to_username)
        if not to_user:
            return {
                "success": False,
                "message": f"User '{request_data.to_username}' not found"
            }
        
        to_user_id = to_user[0]
        print(f"Found user {request_data.to_username} with ID {to_user_id}")
        
        add_friend_request(request_data.from_id, to_user_id)
        
        # Send notification to the recipient
        from_username = get_username_by_id(request_data.from_id)
        notification_message = f"{from_username} sent you a friend request"
        add_notification(to_user_id, notification_message, "friend_request", request_data.from_id)
        
        print(f"Friend request sent from user {request_data.from_id} to user {to_user_id}")
        return {
            "success": True,
            "message": "Friend request sent successfully"
        }
    except Exception as e:
        print(f"Error sending friend request: {e}")
        return {
            "success": False,
            "message": f"Failed to send friend request: {str(e)}"
        }

@app.post("/api/friends/accept")
async def accept_friend_request(action_data: FriendActionModel):
    """Accept a friend request"""
    try:
        print(action_data)
        user_id = action_data.user_id
        friend_id = action_data.friend_id
        print(f"Accepting friend request from {user_id} to {friend_id}")
        add_friend(user_id, friend_id)
        
        # Send notification to the person who sent the friend request
        accepter_username = get_username_by_id(user_id)
        notification_message = f"{accepter_username} accepted your friend request"
        add_notification(friend_id, notification_message, "friend_accept", user_id)
        
        print(f"Friend request accepted: {action_data.user_id} and {action_data.friend_id} are now friends")
        return {
            "success": True,
            "message": "Friend request accepted successfully"
        }
    except Exception as e:
        print(f"Error accepting friend request: {e}")
        return {
            "success": False,
            "message": f"Failed to accept friend request: {str(e)}"
        }

@app.post("/api/friends/remove")
async def remove_friend_endpoint(action_data: FriendActionModel):
    """Remove a friend"""
    try:
        remove_friend(action_data.user_id, action_data.friend_id)
        print(f"Friend removed: {action_data.user_id} and {action_data.friend_id} are no longer friends")
        return {
            "success": True,
            "message": "Friend removed successfully"
        }
    except Exception as e:
        print(f"Error removing friend: {e}")
        return {
            "success": False,
            "message": f"Failed to remove friend: {str(e)}"
        }

# Meetup endpoints
class MeetupModel(BaseModel):
    location: str
    activities: str
    meters: int
    latitude: float
    longitude: float
    created_by: str

@app.post("/api/meetup/create")
async def create_meetup_endpoint(meetup_data: MeetupModel):
    """Create a new meetup"""
    try:
        # Get user ID from username
        user = get_user(meetup_data.created_by)
        if not user:
            return {
                "success": False,
                "message": f"User '{meetup_data.created_by}' not found"
            }
        
        user_id = user[0]  # user ID is at index 0
        
        # Create meetup in database
        meetup_id = create_meetup(
            meetup_data.location,
            meetup_data.activities,
            meetup_data.meters,
            meetup_data.latitude,
            meetup_data.longitude,
            user_id
        )
        
        print(f"Meetup created: {meetup_data.location} by user {user_id} with ID {meetup_id}")
        return {
            "success": True,
            "message": "Meetup created successfully",
            "meetup": {
                "id": meetup_id,
                "location": meetup_data.location,
                "activities": meetup_data.activities,
                "meters": meetup_data.meters,
                "latitude": meetup_data.latitude,
                "longitude": meetup_data.longitude,
                "host": user_id
            }
        }
    except Exception as e:
        print(f"Error creating meetup: {e}")
        return {
            "success": False,
            "message": f"Failed to create meetup: {str(e)}"
        }

@app.delete("/api/meetup/end/{user_id}")
async def end_meetup_endpoint(user_id: int):
    """End/remove a meetup for a user"""
    try:
        # Get user's meetups
        user_meetups = get_meetups(user_id)
        
        if not user_meetups:
            return {
                "success": False,
                "message": "No active meetups found for this user"
            }
        
        # Remove the most recent meetup (assuming one active meetup per user)
        latest_meetup = user_meetups[-1]  # Get the last (most recent) meetup
        meetup_id = latest_meetup[0]  # ID is at index 0
        
        remove_meetup(meetup_id)
        
        print(f"Meetup ended: meetup {meetup_id} by user {user_id}")
        return {
            "success": True,
            "message": "Meetup ended successfully"
        }
    except Exception as e:
        print(f"Error ending meetup: {e}")
        return {
            "success": False,
            "message": f"Failed to end meetup: {str(e)}"
        }

@app.get("/api/meetup/get/{user_id}")
async def get_user_meetups_endpoint(user_id: int):
    """Get all meetups for a user"""
    try:
        meetups = get_meetups(user_id)
        meetups_data = []
        
        for meetup in meetups:
            meetups_data.append({
                "id": meetup[0],
                "location": meetup[1],
                "activities": meetup[2],
                "meters": meetup[3],
                "latitude": meetup[4],
                "longitude": meetup[5],
                "host": meetup[6]
            })
        
        return {
            "success": True,
            "meetups": meetups_data,
            "count": len(meetups_data)
        }
    except Exception as e:
        print(f"Error fetching meetups: {e}")
        return {
            "success": False,
            "message": f"Failed to fetch meetups: {str(e)}",
            "meetups": [],
            "count": 0
        }

class MeetupUpdateModel(BaseModel):
    meetup_id: int
    location: str
    activities: str
    meters: int
    latitude: float
    longitude: float

@app.put("/api/meetup/update")
async def update_meetup_endpoint(meetup_data: MeetupUpdateModel):
    """Update an existing meetup"""
    try:
        # Update meetup in database
        update_meetup(
            meetup_data.meetup_id,
            meetup_data.location,
            meetup_data.activities,
            meetup_data.meters,
            meetup_data.latitude,
            meetup_data.longitude
        )
        
        print(f"Meetup updated: ID {meetup_data.meetup_id}")
        return {
            "success": True,
            "message": "Meetup updated successfully",
            "meetup": {
                "id": meetup_data.meetup_id,
                "location": meetup_data.location,
                "activities": meetup_data.activities,
                "meters": meetup_data.meters,
                "latitude": meetup_data.latitude,
                "longitude": meetup_data.longitude
            }
        }
    except Exception as e:
        print(f"Error updating meetup: {e}")
        return {
            "success": False,
            "message": f"Failed to update meetup: {str(e)}"
        }

@app.get("/api/meetup/all")
async def get_all_meetups():
    """Get all meetups from all users"""
    try:
        # Get all meetups from database
        file_path = 'main.db'
        conn = sqlite3.connect(file_path)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT m.*, u.username 
            FROM meetups m 
            JOIN users u ON m.host = u.id
            ORDER BY m.id DESC
        ''')
        meetups = cursor.fetchall()
        conn.close()
        
        meetups_data = []
        for meetup in meetups:
            meetups_data.append({
                "id": meetup[0],
                "location": meetup[1],
                "activities": meetup[2],
                "meters": meetup[3],
                "latitude": meetup[4],
                "longitude": meetup[5],
                "host": meetup[6],
                "host_username": meetup[7]
            })
        
        return {
            "success": True,
            "meetups": meetups_data,
            "count": len(meetups_data)
        }
    except Exception as e:
        print(f"Error fetching all meetups: {e}")
        return {
            "success": False,
            "message": f"Failed to fetch meetups: {str(e)}",
            "meetups": [],
            "count": 0
        }

@app.get("/api/meetup/{meetup_id}/details")
async def get_meetup_details(meetup_id: int):
    """Get detailed meetup information including participants"""
    try:
        # Get meetup details
        meetup = get_meetup_by_id(meetup_id)
        if not meetup:
            return {
                "success": False,
                "message": "Meetup not found"
            }
        
        # Ensure meetup is a tuple/list with expected length
        if not isinstance(meetup, (tuple, list)) or len(meetup) < 7:
            print(f"Invalid meetup data: {meetup}, type: {type(meetup)}")
            return {
                "success": False,
                "message": "Invalid meetup data"
            }
        
        # Get host username
        host_user_id = meetup[6]  # meetup[6] is the host user_id
        host_user = get_user_by_id(host_user_id)
        host_username = host_user[1] if host_user else "Unknown"
        
        # Get participants
        participants = get_users_in_meetup(meetup_id)
        participant_details = []
        
        for participant in participants:
            # Ensure participant is a tuple/list with expected length
            if isinstance(participant, (tuple, list)) and len(participant) > 0:
                user = get_user_by_id(participant[0])  # participant[0] is user_id
                if user and isinstance(user, (tuple, list)) and len(user) > 4:
                    participant_details.append({
                        "user_id": participant[0],
                        "username": user[1],
                        "first_name": user[3],
                        "last_name": user[4]
                    })
        
        return {
            "success": True,
            "meetup": {
                "id": meetup[0],
                "location": meetup[1],
                "activities": meetup[2],
                "meters": meetup[3],
                "latitude": meetup[4],
                "longitude": meetup[5],
                "host": meetup[6],
                "host_username": host_username
            },
            "participants": participant_details,
            "participant_count": len(participant_details)
        }
        
    except Exception as e:
        print(f"Error getting meetup details: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "message": f"Failed to get meetup details: {str(e)}"
        }

class JoinMeetupModel(BaseModel):
    meetup_id: int
    user_id: int

@app.post("/api/meetup/join")
async def join_meetup(join_data: JoinMeetupModel):
    """Join a meetup"""
    try:
        # Add user to meetup using the existing function
        add_meetup_join(join_data.meetup_id, join_data.user_id)
        
        # Send notifications to other users in the meetup
        joiner_username = get_username_by_id(join_data.user_id)
        meetup_host = get_meetup_host(join_data.meetup_id)
        existing_users = get_users_in_meetup(join_data.meetup_id)
        
        # Notify the host (if not the joiner)
        if meetup_host and meetup_host != join_data.user_id:
            notification_message = f"{joiner_username} joined your meetup"
            add_notification(meetup_host, notification_message, "meetup_join", join_data.meetup_id)
        
        # Notify other participants
        for user_id in existing_users:
            if user_id != join_data.user_id and user_id != meetup_host:
                notification_message = f"{joiner_username} joined the meetup"
                add_notification(user_id, notification_message, "meetup_join", join_data.meetup_id)
        
        print(f"User {join_data.user_id} joined meetup {join_data.meetup_id}")
        return {
            "success": True,
            "message": "Successfully joined meetup"
        }
    except Exception as e:
        print(f"Error joining meetup: {e}")
        return {
            "success": False,
            "message": f"Failed to join meetup: {str(e)}"
        }

@app.get("/api/meetup/joined/{user_id}")
async def get_user_joined_meetups_endpoint(user_id: int):
    """Get all meetups that a user has joined"""
    try:
        joined_meetups = get_user_joined_meetups(user_id)
        
        meetups_data = []
        for meetup in joined_meetups:
            meetups_data.append({
                "id": meetup[0],
                "location": meetup[1],
                "activities": meetup[2],
                "meters": meetup[3],
                "latitude": meetup[4],
                "longitude": meetup[5],
                "host": meetup[6],
                "host_username": meetup[7]
            })
        
        return {
            "success": True,
            "meetups": meetups_data,
            "count": len(meetups_data)
        }
    except Exception as e:
        print(f"Error fetching joined meetups: {e}")
        return {
            "success": False,
            "message": f"Failed to fetch joined meetups: {str(e)}",
            "meetups": [],
            "count": 0
        }

@app.post("/api/meetup/leave")
async def leave_meetup(join_data: JoinMeetupModel):
    """Leave a meetup"""
    try:
        # Remove user from meetup using the existing function
        remove_meetup_join(join_data.meetup_id, join_data.user_id)
        
        # Send notifications to other users in the meetup
        leaver_username = get_username_by_id(join_data.user_id)
        meetup_host = get_meetup_host(join_data.meetup_id)
        remaining_users = get_users_in_meetup(join_data.meetup_id)
        
        # Notify the host (if not the leaver)
        if meetup_host and meetup_host != join_data.user_id:
            notification_message = f"{leaver_username} left your meetup"
            add_notification(meetup_host, notification_message, "meetup_leave", join_data.meetup_id)
        
        # Notify other participants
        for user_id in remaining_users:
            if user_id != join_data.user_id and user_id != meetup_host:
                notification_message = f"{leaver_username} left the meetup"
                add_notification(user_id, notification_message, "meetup_leave", join_data.meetup_id)
        
        print(f"User {join_data.user_id} left meetup {join_data.meetup_id}")
        return {
            "success": True,
            "message": "Successfully left meetup"
        }
    except Exception as e:
        print(f"Error leaving meetup: {e}")
        return {
            "success": False,
            "message": f"Failed to leave meetup: {str(e)}"
        }

class MeetupInviteRequest(BaseModel):
    meetup_id: int
    host_id: int
    invited_user_ids: List[int]

class MeetupInviteResponse(BaseModel):
    invite_id: int
    response: int  # 1 = accept, 2 = decline

# Meetup invite endpoints
@app.post("/api/meetup/invite")
async def invite_users_to_meetup(invite_request: MeetupInviteRequest):
    """Invite multiple users to a meetup"""
    try:
        # Verify that the host_id matches the actual meetup host
        meetup = get_meetup_by_id(invite_request.meetup_id)
        if not meetup:
            return {
                "success": False,
                "message": "Meetup not found"
            }
        
        if meetup[6] != invite_request.host_id:  # meetup[6] is the host field
            return {
                "success": False,
                "message": "Only the meetup host can invite friends"
            }
        
        invited_count = 0
        failed_invites = []
        
        for user_id in invite_request.invited_user_ids:
            success = invite_user_to_meetup(invite_request.meetup_id, invite_request.host_id, user_id)
            if success:
                # Send notification to invited user
                host_username = get_username_by_id(invite_request.host_id)
                notification_message = f"{host_username} invited you to a meetup"
                add_notification(user_id, notification_message, "meetup_invite", invite_request.meetup_id)
                invited_count += 1
            else:
                failed_invites.append(user_id)
        
        return {
            "success": True,
            "message": f"Successfully invited {invited_count} users",
            "invited_count": invited_count,
            "failed_invites": failed_invites
        }
    except Exception as e:
        print(f"Error inviting users to meetup: {e}")
        return {
            "success": False,
            "message": f"Failed to invite users: {str(e)}"
        }

@app.get("/api/meetup/invites/{user_id}")
async def get_meetup_invites_endpoint(user_id: int):
    """Get all meetup invitations for a user"""
    try:
        invites = get_meetup_invites_for_user(user_id)
        
        invites_data = []
        for invite in invites:
            invites_data.append({
                "invite_id": invite[0],
                "meetup_id": invite[1],
                "host_id": invite[2],
                "invited_user_id": invite[3],
                "timestamp": invite[4],
                "status": invite[5],
                "location": invite[6],
                "activities": invite[7],
                "latitude": invite[8],
                "longitude": invite[9],
                "host_username": invite[10]
            })
        
        return {
            "success": True,
            "invites": invites_data,
            "count": len(invites_data)
        }
    except Exception as e:
        print(f"Error fetching meetup invites: {e}")
        return {
            "success": False,
            "message": f"Failed to fetch meetup invites: {str(e)}",
            "invites": [],
            "count": 0
        }

@app.post("/api/meetup/invite/respond")
async def respond_to_meetup_invite_endpoint(response_data: MeetupInviteResponse):
    """Respond to a meetup invitation"""
    try:
        success = respond_to_meetup_invite(response_data.invite_id, response_data.response)
        
        if success:
            # Get invite details for notification
            conn = sqlite3.connect('main.db')
            cursor = conn.cursor()
            cursor.execute('''
                SELECT mi.host_id, mi.invited_user_id, mi.meetup_id 
                FROM meetup_invites mi WHERE mi.id = ?
            ''', (response_data.invite_id,))
            invite_info = cursor.fetchone()
            conn.close()
            
            if invite_info:
                host_id, invited_user_id, meetup_id = invite_info
                responder_username = get_username_by_id(invited_user_id)
                response_text = "accepted" if response_data.response == 1 else "declined"
                
                # Send notification to host
                if host_id != invited_user_id:
                    notification_message = f"{responder_username} {response_text} your meetup invitation"
                    add_notification(host_id, notification_message, "meetup_invite_response", meetup_id)
            
            response_text = "accepted" if response_data.response == 1 else "declined"
            return {
                "success": True,
                "message": f"Meetup invitation {response_text} successfully"
            }
        else:
            return {
                "success": False,
                "message": "Failed to respond to meetup invitation"
            }
    except Exception as e:
        print(f"Error responding to meetup invitation: {e}")
        return {
            "success": False,
            "message": f"Failed to respond to invitation: {str(e)}"
        }

# User profile endpoints
@app.get("/api/user/profile")
async def get_user_profile(user_id: int = 1):
    """Get user profile information"""
    try:
        user = get_user_by_id(user_id)
        if not user:
            return {
                "success": False,
                "message": f"User with ID {user_id} not found"
            }
        
        return {
            "success": True,
            "user": {
                "id": user[0],
                "username": user[1],
                "first_name": user[3],
                "last_name": user[4],
                "email": user[5],
                "bio": user[7],
                "location": user[8]
            }
        }
    except Exception as e:
        print(f"Error fetching user profile: {e}")
        return {
            "success": False,
            "message": f"Failed to fetch user profile: {str(e)}"
        }

class UserUpdateModel(BaseModel):
    user_id: int
    first_name: str = ""
    last_name: str = ""
    email: str = ""
    bio: str = ""
    location: str = ""

@app.put("/api/user/update")
async def update_user_profile(user_data: UserUpdateModel):
    """Update user profile information"""
    try:
        # Update user in database
        update_user(
            user_data.user_id,
            user_data.first_name,
            user_data.last_name,
            user_data.email,
            user_data.bio,
            user_data.location
        )
        
        print(f"User profile updated: ID {user_data.user_id}")
        return {
            "success": True,
            "message": "Profile updated successfully"
        }
    except Exception as e:
        print(f"Error updating user profile: {e}")
        return {
            "success": False,
            "message": f"Failed to update profile: {str(e)}"
        }

@app.get("/api/events/list")
async def list_whats_on():
    """Get what's on events from the events file"""
    try:
        events = get_events()
        return {
            "success": True,
            "events": events
        }
    except Exception as e:
        print(f"Error fetching what's on events: {e}")
        return {
            "success": False,
            "message": f"Failed to fetch events: {str(e)}",
            "events": []
    }

# Health endpoints
@app.get("/api/health/metrics")
async def get_health_metrics():
    """Get health metrics data"""
    try:
        # Read statistics from CSV file
        import pandas as pd
        df = pd.read_csv('statistics.csv')
        
        # Get the latest health metrics
        latest_data = df.iloc[-1]
        
        health_metrics = {
            "heart_rate": int(latest_data['HeartRate']),
            "bp_sys": int(latest_data['BP_sys']),
            "bp_dia": int(latest_data['BP_dia']),
            "map": float(latest_data['MAP']),
            "body_humidity": float(latest_data['Body Humidity']),
            "body_temperature": float(latest_data['Body Temperature']),
            "happiness": float(latest_data['Happiness(%)']),
            "timestamp": latest_data['Time']
        }
        
        return {
            "success": True,
            "metrics": health_metrics
        }
    except Exception as e:
        print(f"Error fetching health metrics: {e}")
        return {
            "success": False,
            "message": f"Failed to fetch health metrics: {str(e)}"
        }

@app.get("/api/health/pictures")
async def get_health_pictures():
    """Get list of health pictures with their names"""
    try:
        pictures_dir = "pictures"
        if not os.path.exists(pictures_dir):
            return {
                "success": False,
                "message": "Pictures directory not found"
            }
        
        picture_files = [f for f in os.listdir(pictures_dir) if f.endswith(('.png', '.jpg', '.jpeg'))]
        
        # Map picture names to their descriptions
        picture_mapping = {
            "heart.png": "Heart Rate",
            "happy.png": "Happiness",
            "map.png": "Mean Arterial Pressure",
            "temp.png": "Body Temperature"
        }
        
        pictures = []
        for picture_file in picture_files:
            if picture_file in picture_mapping:
                pictures.append({
                    "filename": picture_file,
                    "name": picture_mapping[picture_file],
                    "url": f"/pictures/{picture_file}"
                })
        
        return {
            "success": True,
            "pictures": pictures
        }
    except Exception as e:
        print(f"Error fetching health pictures: {e}")
        return {
            "success": False,
            "message": f"Failed to fetch health pictures: {str(e)}"
        }

# User search endpoint for meetup invitations
@app.get("/api/users/search")
async def search_users(query: str = "", limit: int = 20):
    """Search for users by username for meetup invitations"""
    try:
        if not query or len(query) < 2:
            return {
                "success": True,
                "users": [],
                "count": 0
            }
        
        # Search users by username
        conn = sqlite3.connect('main.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, username, first_name, last_name 
            FROM users 
            WHERE username LIKE ? OR first_name LIKE ? OR last_name LIKE ?
            LIMIT ?
        ''', (f'%{query}%', f'%{query}%', f'%{query}%', limit))
        users = cursor.fetchall()
        conn.close()
        
        users_data = []
        for user in users:
            users_data.append({
                "id": user[0],
                "username": user[1],
                "first_name": user[2],
                "last_name": user[3],
                "display_name": f"{user[2]} {user[3]} (@{user[1]})"
            })
        
        return {
            "success": True,
            "users": users_data,
            "count": len(users_data)
        }
    except Exception as e:
        print(f"Error searching users: {e}")
        return {
            "success": False,
            "message": f"Failed to search users: {str(e)}",
            "users": [],
            "count": 0
        }
