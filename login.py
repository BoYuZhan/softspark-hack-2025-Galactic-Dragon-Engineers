from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import json

app = FastAPI()

# Request model
class LoginRequest(BaseModel):
    first_name: str
    password: str

# Login endpoint
@app.post("/api/login")
def login(data: LoginRequest):
    # Open the names_and_passwords.txt file
    try:
        with open("names_and_passwords.txt", "r") as f:
            for line in f:
                if line.strip():
                    user = json.loads(line)
                    # Check name and password
                    if user["first_name"].lower() == data.first_name.lower() and user["password"] == data.password:
                        return {"success": True, "message": f"Welcome {user['first_name']}!"}
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="User database not found.")
    
    # If no match found
    raise HTTPException(status_code=401, detail="Invalid name or password.")

