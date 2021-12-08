from dotenv import load_dotenv
import requests
import os

# Check if on heroku
debug = False
if 'DYNO' not in os.environ: debug = True

if debug:
  load_dotenv()
  AUTH_KEY = os.getenv('AUTH_KEY')
  SERVER_ID = os.getenv('SERVER_ID')
else:
  AUTH_KEY = os.environ['auth_key']
  SERVER_ID = os.environ['server_id']

def restartServer():
  data = requests.post(
          f"https://api.nitrado.net/services/{SERVER_ID}/gameservers/restart",
          headers={
            "Authorization": AUTH_KEY
          }).json()

if __name__ == '__main__':
  restartServer()
