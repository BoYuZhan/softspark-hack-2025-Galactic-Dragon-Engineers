import requests

def get_events():
    url = "https://api.artsdata.ca/events"
    params = {
        "format": "json",
        "frame": "event_bn",
        "source": "http://kg.artsdata.ca/culture-creates/footlight/placedesarts-com"
    }
    response = requests.get(url, params=params)
    events = response.json()

    events = open('events.txt','r')
    event_list = []
    for e in events:
        event = e.strip().split('#')
        event_list.append({
            "title": event[0],
            "date": event[2],
            "description": event[1],
            "link": event[3]
        })
    events.close()

    return event_list
