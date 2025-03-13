import logging
from flask import Flask, request, jsonify, render_template
import requests

app = Flask(__name__)

logging.basicConfig(level=logging.DEBUG)

@app.route('/')
def index():
    logging.debug('Serving index.html')
    return render_template('index.html')

@app.route('/random-frame', methods=['GET'])
def get_random_frame():
    logging.debug('Request received for /random-frame')
    try:
        response = requests.get('https://frinkiac.com/api/random')
        response.raise_for_status()
        data = response.json()
        logging.debug('Response from Frinkiac: %s', data)

        if 'Episode' in data and 'Frame' in data and 'Timestamp' in data['Frame']:
            frame_url = f"https://frinkiac.com/img/{data['Frame']['Episode']}/{data['Frame']['Timestamp']}.jpg"
            return jsonify({
                'frame_url': frame_url,
                'episode_title': data['Episode']['Title'],
                'season_number': data['Episode']['Season'],
                'episode_number': data['Episode']['EpisodeNumber']
            })
        else:
            logging.error('Invalid response from Frinkiac API: %s', data)
            return jsonify({'error': 'Invalid response from Frinkiac API'}), 500

    except requests.exceptions.RequestException as e:
        logging.error('Request exception while fetching random frame: %s', e)
        return jsonify({'error': 'An error occurred while fetching the random frame'}), 500
    except ValueError as e:
        logging.error('Value error while parsing JSON response: %s', e)
        return jsonify({'error': 'An error occurred while fetching the random frame'}), 500
    except Exception as e:
        logging.error('Unexpected error while fetching random frame: %s', e)
        return jsonify({'error': 'An unexpected error occurred while fetching the random frame'}), 500

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