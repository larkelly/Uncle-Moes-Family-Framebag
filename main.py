from flask import Flask, request, jsonify, render_template
import requests
import random, json, logging

app = Flask(__name__)

logging.basicConfig(level=logging.DEBUG)

@app.route('/')
def index():
    logging.debug('Serving index.html')
    return render_template('index.html')

# Load episodes from episodes.json
with open('static/episodes.json') as f:
    episodes = json.load(f)

@app.route('/random-frame', methods=['GET'])
def get_random_frame():
    try:
        # Select a random season
        random_season = random.choice(list(episodes.keys()))
        # Select a random episode from the chosen season
        random_episode = random.choice(episodes[random_season])
        episode_number = random_episode['episode']

        # Form the API URL
        url = f'https://frinkiac.com/api/episode/{episode_number}/1/999999'

        # Make the API request
        response = requests.get(url)
        response.raise_for_status()  # Check for HTTP errors
        data = response.json()

        logging.debug(data)

        # Select a random RepresentativeTimestamp from data['Subtitles']
        random_subtitle = random.choice(data['Subtitles'])
        random_timestamp = random_subtitle['RepresentativeTimestamp']

        # Form the next API URL using the random timestamp
        random_frame_from_episode = f'https://frinkiac.com/api/caption?e={episode_number}&t={random_timestamp}'

        # Make the next API request
        random_frame_response = requests.get(random_frame_from_episode)
        random_frame_response.raise_for_status()  # Check for HTTP errors
        next_data = random_frame_response.json()

        return jsonify(next_data)
    except requests.RequestException as e:
        return jsonify({'error': 'Error fetching frame', 'details': str(e)}), 500

@app.route('/validate-guess', methods=['POST'])
def validate_guess():
    logging.debug('Request received for /validate-guess')
    try:
        user_guess = request.json['guess']
        episode_title = request.json['episode_title']
        correct = user_guess.lower() == episode_title.lower()
        return jsonify({'correct': correct})
    except KeyError as e:
        logging.error('Key error in validate guess: %s', e)
        return jsonify({'error': 'Invalid request data'}), 400
    except Exception as e:
        logging.error('Unexpected error while validating guess: %s', e)
        return jsonify({'error': 'An unexpected error occurred while validating the guess'}), 500

if __name__ == '__main__':
    app.run(debug=True)