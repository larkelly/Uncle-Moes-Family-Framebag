let attempts = 3;

async function fetchRandomFrame() {
    try {
        const response = await fetch('/random-frame');
        const data = await response.json();
        console.log('Random Frame Data:', data); // Log the data to see the URL
        if (data.frame_url) {
            const frame = document.getElementById('frame');
            frame.src = data.frame_url;
            frame.dataset.episodeTitle = data.episode_title;
            document.getElementById('left-crown').style.display = 'none';
            document.getElementById('right-crown').style.display = 'none';
            document.getElementById('correct-text').style.display = 'none';
            document.getElementById('result').textContent = '';
            document.getElementById('guess').value = ''; // Clear the input field
            document.getElementById('quiz-title').textContent = 'Guess the Simpsons Episode'; // Reset the header
            document.getElementById('attempts').textContent = attempts; // Update attempts
        } else {
            document.getElementById('result').textContent = 'Error fetching frame';
        }
    } catch (error) {
        console.error('Error fetching random frame:', error);
        document.getElementById('result').textContent = 'Error fetching frame';
    }
}

document.getElementById('guess-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const guess = document.getElementById('guess').value;
    const episodeTitle = document.getElementById('frame').dataset.episodeTitle;

    try {
        const response = await fetch('/validate-guess', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ guess, episode_title: episodeTitle })
        });
        const result = await response.json();
        if (result.correct) {
            document.getElementById('result').textContent = '';
            document.getElementById('left-crown').style.display = 'block';
            document.getElementById('right-crown').style.display = 'block';
            document.getElementById('correct-text').style.display = 'block';
            document.getElementById('correct-text').textContent = 'Correct!!'; // Ensure only one "Correct!!" text
            document.getElementById('quiz-title').textContent = ''; // Clear the header to avoid duplication
        } else {
            attempts--;
            document.getElementById('attempts').textContent = attempts;
            if (attempts <= 0) {
                document.getElementById('game-over').classList.remove('hidden');
                document.getElementById('quiz-title').classList.add('hidden');
                document.getElementById('guess-form').classList.add('hidden');
                document.getElementById('result').textContent = '';
            } else {
                document.getElementById('result').textContent = 'Incorrect!';
            }
        }
    } catch (error) {
        console.error('Error validating guess:', error);
        document.getElementById('result').textContent = 'Error validating guess';
    }
});

document.getElementById('next-frame').addEventListener('click', fetchRandomFrame);

document.getElementById('try-again').addEventListener('click', () => {
    attempts = 3;
    document.getElementById('attempts').textContent = attempts;
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('quiz-title').classList.remove('hidden');
    document.getElementById('guess-form').classList.remove('hidden');
    fetchRandomFrame();
});

fetchRandomFrame();