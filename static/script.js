let attempts = 3;
let points = 0;
let currentFrame = 0;
const totalFrames = 5;
let lifelineUsed = false;

async function fetchRandomFrame() {
    try {
        const response = await fetch('/random-frame');
        const data = await response.json();

        if (data.Frame && data.Frame.Timestamp) {
            const frame = document.getElementById('frame');
            const frameUrl = `https://frinkiac.com/img/${data.Episode.Key}/${data.Frame.Timestamp}.jpg`;
            frame.src = frameUrl;
            frame.dataset.episodeTitle = data.Episode.Title;
            frame.dataset.seasonNumber = data.Episode.Season;
            frame.dataset.episodeNumber = data.Episode.EpisodeNumber;

            document.getElementById('correct-text').style.display = 'none';
            const resultElement = document.getElementById('result');
            if (resultElement) {
                resultElement.textContent = '';
                resultElement.classList.remove('incorrect-text'); // Remove incorrect styling when resetting
            }
            document.getElementById('guess').value = ''; // Clear the input field
            document.getElementById('attempts').textContent = attempts.toString(); // Update attempts

            // Show the subtitle and hide other elements
            document.getElementById('quiz-subtitle').classList.remove('hidden');
            document.getElementById('episode-info').classList.add('hidden');
            document.getElementById('try-again-container').style.display = 'none'; // Hide the try again button
            document.getElementById('game-over').classList.add('hidden'); // Hide the game over text
            document.getElementById('incorrect-animation').style.display = 'none'; // Hide the incorrect animation
        } else {
            const resultElement = document.getElementById('result');
            if (resultElement) {
                resultElement.textContent = 'Error fetching frame';
            }
        }
    } catch (error) {
        console.error('Error fetching random frame:', error);
        document.getElementById('result').textContent = 'Error fetching frame';
    }
}

async function loadEpisodes() {
    try {
        const response = await fetch('/static/episodes.json');
        const data = await response.json();
        return Object.values(data).flat().map(ep => `${ep.episode} - ${ep.title}`);
    } catch (error) {
        console.error('Error loading episodes:', error);
        return [];
    }
}

let debounceTimeout;

document.getElementById('guess').addEventListener('input', function () {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
        const episodes = await loadEpisodes();
        const input = this.value.toLowerCase();
        const suggestions = episodes.filter(episode => episode.toLowerCase().includes(input));
        const datalist = document.getElementById('episode-suggestions');
        datalist.innerHTML = '';
        if (input) {
            suggestions.forEach(suggestion => {
                const option = document.createElement('option');
                option.value = suggestion;
                datalist.appendChild(option);
            });
        }
    }, 2000); // 2-second debounce delay
});

document.getElementById('guess-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const guess = document.getElementById('guess').value;
    const episodeTitle = document.getElementById('frame').dataset.episodeTitle;
    const seasonNumber = document.getElementById('frame').dataset.seasonNumber;
    const episodeNumber = document.getElementById('frame').dataset.episodeNumber;

    // Extract the episode title from the guess
    const guessTitle = guess.split(' - ')[1];

    try {
        const response = await fetch('/validate-guess', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({guess: guessTitle, episode_title: episodeTitle})
        });
        const result = await response.json();
        if (result.correct) {
            points += 10;
            const correctText = document.getElementById('correct-text');
            correctText.style.display = 'block';
            correctText.textContent = 'Correct!!';
            correctText.classList.add('slideIn');

            setTimeout(() => {
                correctText.style.display = 'none';
                correctText.classList.remove('slideIn');
                fetchRandomFrame();
                currentFrame++;
                document.getElementById('current-frame').textContent = `Frame: ${currentFrame + 1} OF ${totalFrames}`;
            }, 2000); // Adjust the timeout to match the animation duration
        } else {
            attempts--;
            document.getElementById('attempts').textContent = attempts.toString(); // Update attempts
            if (attempts <= 0) {
                document.getElementById('game-over').classList.remove('hidden');
                document.getElementById('quiz-title').classList.add('hidden');
                document.getElementById('quiz-subtitle').classList.add('hidden'); // Hide the subtitle on game over
                document.getElementById('guess-form').classList.add('hidden');
                document.getElementById('result').textContent = '';

                // Display episode info and show try again button when game is over
                document.getElementById('episode-title').textContent = `${episodeTitle}`;
                document.getElementById('season-episode').textContent = `Season ${seasonNumber}, Episode ${episodeNumber}`;
                document.getElementById('episode-info').classList.remove('hidden');
                document.getElementById('try-again-container').style.display = 'block'; // Show the try again button on game over
            } else {
                // Show the X animation
                const incorrectAnimation = document.getElementById('incorrect-animation');
                incorrectAnimation.style.display = 'block';
                incorrectAnimation.classList.add('showX');
                setTimeout(() => {
                    incorrectAnimation.style.display = 'none';
                    fetchRandomFrame();
                    currentFrame++;
                    document.getElementById('current-frame').textContent = `Frame: ${currentFrame + 1} OF ${totalFrames}`;
                }, 1000); // Hide the X after the animation ends
            }
        }

        // Check if the round is over
        if (currentFrame >= totalFrames) {
            document.getElementById('game-over').classList.remove('hidden');
            document.getElementById('result').textContent = `Round over! You scored ${points} points.`;
            document.getElementById('next-frame').style.display = 'none';
            document.getElementById('try-again-container').style.display = 'block'; // Show the try again button
        }
    } catch (error) {
        console.error('Error validating guess:', error);
        document.getElementById('result').textContent = 'Error validating guess';
    }
});

document.getElementById('next-frame').addEventListener('click', () => {
    if (!lifelineUsed) {
        lifelineUsed = true;
        fetchRandomFrame();
        document.getElementById('next-frame').style.backgroundColor = 'red';
        document.getElementById('next-frame').textContent = 'Skip Frame';
    } else {
        document.getElementById('result').textContent = 'You can only skip the frame once per round.';
    }
});

document.getElementById('try-again').addEventListener('click', () => {
    attempts = 3;
    points = 0;
    currentFrame = 0;
    lifelineUsed = false;
    document.getElementById('attempts').textContent = attempts.toString(); // Update attempts
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('quiz-title').classList.remove('hidden');
    document.getElementById('quiz-subtitle').classList.remove('hidden'); // Show the subtitle when restarting
    document.getElementById('guess-form').classList.remove('hidden');
    document.getElementById('try-again-container').style.display = 'none'; // Hide the try again button when the game restarts
    document.getElementById('next-frame').style.backgroundColor = '#007bff'; // Reset the button color
    document.getElementById('next-frame').textContent = 'Skip Frame'; // Reset the button text
    fetchRandomFrame();
});

fetchRandomFrame();