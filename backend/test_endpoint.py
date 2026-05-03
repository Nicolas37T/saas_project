import urllib.request
import json

data = json.dumps({"email": "center@saas.com"}).encode("utf-8")
req = urllib.request.Request("http://localhost:8000/auth/forgot-password", data=data, headers={"Content-Type": "application/json"})

try:
    with urllib.request.urlopen(req) as response:
        print("Status Code:", response.getcode())
        print("JSON:", response.read().decode("utf-8"))
except Exception as e:
    print("Error:", e)
