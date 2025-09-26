from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime

app = FastAPI()

# In-memory storage for demo purposes
# In production, use a proper database
shared_locations = {}
user_locations = {}

class LoginRequest(BaseModel):
    username: str
    password: str

class LocationData(BaseModel):
    latitude: float
    longitude: float
    timestamp: Optional[str] = None
    description: Optional[str] = None

class ShareLocationRequest(BaseModel):
    latitude: float
    longitude: float
    description: Optional[str] = None
    share_with: List[str] = []  # List of usernames to share with

class LocationResponse(BaseModel):
    id: str
    latitude: float
    longitude: float
    timestamp: str
    description: Optional[str] = None
    shared_by: str

@app.post("/api/login")
async def login(data: LoginRequest):
    if data.username == "testuser" and data.password == "12345":
        return {"success": True, "token": "abc123xyz"}
    return {"success": False, "message": "Invalid credentials"}

@app.get("/api/hello")
async def hello():
    return {"message": "Hello from FastAPI!"}

@app.post("/api/location/update")
async def update_location(location: LocationData, username: str = "testuser"):
    """Update user's current location"""
    location_id = str(uuid.uuid4())
    timestamp = datetime.now().isoformat()
    
    user_locations[username] = {
        "id": location_id,
        "latitude": location.latitude,
        "longitude": location.longitude,
        "timestamp": timestamp,
        "description": location.description or "Current location"
    }
    
    return {
        "success": True,
        "location_id": location_id,
        "message": "Location updated successfully"
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

@app.get("/api/location/markers")
async def get_custom_markers(username: str = "testuser"):
    """Get custom markers for the map"""
    markers = [
        {
            "id": "1",
            "latitude": 37.7749,
            "longitude": -122.4194,
            "title": "San Francisco",
            "description": "Golden Gate City",
            "type": "landmark"
        },
        {
            "id": "2", 
            "latitude": 40.7128,
            "longitude": -74.0060,
            "title": "New York City",
            "description": "The Big Apple",
            "type": "landmark"
        },
        {
            "id": "3",
            "latitude": 34.0522,
            "longitude": -118.2437,
            "title": "Los Angeles",
            "description": "City of Angels",
            "type": "landmark"
        }
    ]
    
    # Add user's current location if available
    if username in user_locations:
        user_location = user_locations[username]
        markers.append({
            "id": "user_location",
            "latitude": user_location["latitude"],
            "longitude": user_location["longitude"],
            "title": "My Location",
            "description": user_location["description"],
            "type": "user"
        })
    
    return {
        "success": True,
        "markers": markers,
        "count": len(markers)
    }

# Import your functions
from addfriends import manage_friend_requests
from remove import remove_friend
from range import generate_event_invitations

import json

app = FastAPI()


class LoginRequest(BaseModel):
    first_name: str
    password: str

@app.post("/api/login")
def login(data: LoginRequest):
    try:
        with open("names_and_passwords.txt", "r") as f:
            for line in f:
                if line.strip():
                    user = json.loads(line)
                    if user["first_name"].lower() == data.first_name.lower() and user["password"] == data.password:
                        return {"success": True, "message": f"Welcome {user['first_name']}!"}
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="User database not found.")

    raise HTTPException(status_code=401, detail="Invalid name or password.")


@app.post("/api/friends/request")
def add_friend_request(from_id: str, to_id: str):
    manage_friend_requests("wanttobefriends.txt", from_id, to_id, action="add")
    return {"success": True, "message": f"Friend request added from {from_id} to {to_id}"}

@app.delete("/api/friends/request")
def remove_friend_request(from_id: str, to_id: str):
    manage_friend_requests("wanttobefriends.txt", from_id, to_id, action="remove")
    return {"success": True, "message": f"Friend request removed from {from_id} to {to_id}"}


@app.delete("/api/friends/remove")
def remove_existing_friend(user_id: str, friend_id: str):
    remove_friend("friends.txt", user_id, friend_id)
    return {"success": True, "message": f"Attempted to remove {friend_id} from {user_id}'s friends"}


@app.get("/api/events/invitations")
def get_event_invitations():
    events = generate_event_invitations("event.txt", "names_and_passwords.txt", "friends.txt")
    return {"success": True, "events": events}
