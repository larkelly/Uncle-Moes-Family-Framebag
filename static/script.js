let attempts = 3;
let points = 0;
let currentFrame = 0;
const totalFrames = 5;
let lifelineUsed = false;

async function fetchRandomFrame() {
    try {
        const response = await fetch('/random-frame');
        const data = await response.json();
        console.log('Random Frame Data:', data); // Log the data to see the URL
        if (data.frame_url) {
            const frame = document.getElementById('frame');
            frame.src = data.frame_url;
            frame.dataset.episodeTitle = data.episode_title;
            frame.dataset.seasonNumber = data.season_number;
            frame.dataset.episodeNumber = data.episode_number;

            document.getElementById('left-crown').style.display = 'none';
            document.getElementById('right-crown').style.display = 'none';
            document.getElementById('correct-text').style.display = 'none';
            document.getElementById('result').textContent = '';
            document.getElementById('result').classList.remove('incorrect-text'); // Remove incorrect styling when resetting
            document.getElementById('guess').value = ''; // Clear the input field
            document.getElementById('quiz-title').textContent = 'Uncle Moes Family Framebag'; // Reset the header
            document.getElementById('attempts').textContent = attempts; // Update attempts

            // Show the subtitle and hide other elements
            document.getElementById('quiz-subtitle').classList.remove('hidden');
            document.getElementById('episode-info').classList.add('hidden');
            document.getElementById('try-again-container').style.display = 'none'; // Hide the try again button
            document.getElementById('game-over').classList.add('hidden');
            document.getElementById('incorrect-animation').style.display = 'none'; // Hide the incorrect animation
        } else {
            document.getElementById('result').textContent = 'Error fetching frame';
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

document.getElementById('guess').addEventListener('input', async function () {
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
            document.getElementById('result').textContent = '';
            document.getElementById('left-crown').style.display = 'block';
            document.getElementById('right-crown').style.display = 'block';
            document.getElementById('correct-text').style.display = 'block';
            document.getElementById('correct-text').textContent = 'Correct!!'; // Ensure only one "Correct!!" text
            document.getElementById('quiz-title').textContent = ''; // Clear the header to avoid duplication
            document.getElementById('quiz-subtitle').textContent = ''; // Clear the header to avoid duplication
        } else {
            attempts--;
            document.getElementById('attempts').textContent = attempts;
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
                }, 1000); // Hide the X after the animation ends
            }
        }

        // Check if the round is over
        currentFrame++;
        if (currentFrame < totalFrames) {
            fetchRandomFrame();
        } else {
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
    document.getElementById('attempts').textContent = attempts;
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