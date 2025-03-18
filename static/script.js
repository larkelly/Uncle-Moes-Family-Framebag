let attempts = 3;
let points = 0;
let currentFrame = 0;
const totalFrames = 5;
let lifelineUsed = false;
let gameOver = false;
let doublePointsUsed = false;


function updateUI() {
    document.getElementById('attempts').textContent = attempts.toString();
    document.getElementById('points').textContent = `Points: ${points}`;
    document.getElementById('current-frame').textContent = `Frame: ${currentFrame + 1} OF ${totalFrames}`;
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('quiz-subtitle').classList.remove('hidden');
    document.getElementById('guess-form').style.display = 'block';
    document.getElementById('lifelines').style.display = 'block';
    document.getElementById('info-container').style.display = 'block';
    document.getElementById('episode-label').style.display = 'block';
    document.getElementById('frame').src = '';
    document.getElementById('you-win-message')?.remove();
    document.getElementById('you-lose-message')?.remove();

    const messageElement = document.querySelector('.image-container div:last-child');
    if (messageElement && messageElement.innerHTML.includes('Total Points')) {
        messageElement.remove();
    }

    const showQuoteButton = document.getElementById('show-quote');
    showQuoteButton.style.backgroundColor = '';
    showQuoteButton.disabled = false;

    const nextFrameButton = document.getElementById('next-frame');
    nextFrameButton.style.backgroundColor = '#007bff';
    nextFrameButton.textContent = 'Skip Frame';

    document.getElementById('try-again-container').style.display = 'none';
    document.getElementById('episode-info').style.display = 'none';
    document.getElementById('quiz-subtitle').style.display = 'block';
}


function resetGameState() {
    attempts = 3;
    points = 0;
    currentFrame = 0;
    lifelineUsed = false;
    gameOver = false;
    doublePointsUsed = false;
    updateUI();

    // Remove all messages containing "Total Points" or "Attempts Left"
    const messages = document.querySelectorAll('.image-container div');
    messages.forEach(message => {
        if (message.innerHTML.includes('Total Points') || message.innerHTML.includes('Attempts Left')) {
            message.remove();
        }
    });

    const doublePointsButton = document.getElementById('double-points');
    doublePointsButton.style.backgroundColor = '#007bff';
    doublePointsButton.disabled = false;

    fetchRandomFrame();
}

async function fetchRandomFrame() {
    const episodeInfo = document.getElementById('episode-info');
    episodeInfo.classList.add('hidden');

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
            frame.dataset.subtitles = JSON.stringify(data.Subtitles);
            frame.dataset.randomContent = data.random_content;

            document.getElementById('correct-text').style.display = 'none';
            const resultElement = document.getElementById('result');
            if (resultElement) {
                resultElement.textContent = '';
                resultElement.classList.remove('incorrect-text');
            }
            document.getElementById('guess').value = '';
            document.getElementById('attempts').textContent = attempts.toString();

            document.getElementById('quiz-subtitle').classList.remove('hidden');
            document.getElementById('try-again-container').style.display = 'none';
            document.getElementById('game-over').classList.add('hidden');
            document.getElementById('incorrect-animation').style.display = 'none';

            episodeInfo.classList.add('hidden');
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
    }, 2000);
});

document.getElementById('guess-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const guess = document.getElementById('guess').value;
    const episodeTitle = document.getElementById('frame').dataset.episodeTitle;
    const seasonNumber = document.getElementById('frame').dataset.seasonNumber;
    const episodeNumber = document.getElementById('frame').dataset.episodeNumber;

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
            points += doublePointsUsed ? 20 : 10;
            document.getElementById('points').textContent = `Points: ${points}`;
            const correctText = document.getElementById('correct-text');
            correctText.style.display = 'block';
            correctText.textContent = 'Correct!!';
            correctText.classList.add('slideIn');

            setTimeout(() => {
                correctText.style.display = 'none';
                correctText.classList.remove('slideIn');
                currentFrame++;
                if (currentFrame >= totalFrames) {
                    endGame(true);
                } else {
                    fetchRandomFrame();
                    document.getElementById('current-frame').textContent = `Frame: ${currentFrame + 1} OF ${totalFrames}`;
                }
            }, 2000);
        } else {
            attempts--;
            document.getElementById('attempts').textContent = attempts.toString();
            if (attempts <= 0) {
                endGame(false);
            } else {
                const incorrectAnimation = document.getElementById('incorrect-animation');
                incorrectAnimation.style.display = 'block';
                incorrectAnimation.classList.add('showX');
                document.getElementById('episode-title').textContent = `${episodeTitle}`;
                document.getElementById('season-episode').textContent = `Season ${seasonNumber}, Episode ${episodeNumber}`;
                setTimeout(() => {
                    incorrectAnimation.style.display = 'none';
                    setTimeout(() => {
                        document.getElementById('episode-info').classList.add('hidden');
                        fetchRandomFrame();
                        currentFrame++;
                        document.getElementById('episode-title').textContent = ``;
                        document.getElementById('season-episode').textContent = ``;
                        document.getElementById('current-frame').textContent = `Frame: ${currentFrame + 1} OF ${totalFrames}`;
                    }, 1500);
                }, 1500);
            }
        }

        if (currentFrame >= totalFrames && attempts > 0) {
            endGame(true);
        }

        // Reset double points after each guess
        doublePointsUsed = false;
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

document.getElementById('show-quote').addEventListener('click', () => {
    const frame = document.getElementById('frame');
    const subtitles = frame.dataset.subtitles ? JSON.parse(frame.dataset.subtitles) : [];

    if (subtitles.length > 0) {
        const concatenatedContent = subtitles.map(subtitle => subtitle.Content).join('\n');

        const hintElement = document.createElement('div');
        hintElement.textContent = concatenatedContent;
        hintElement.style.fontFamily = 'SimpsonsFont';
        hintElement.style.position = 'absolute';
        hintElement.style.bottom = '10px';
        hintElement.style.left = '50%';
        hintElement.style.transform = 'translateX(-50%)';
        hintElement.style.color = 'white';
        hintElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        hintElement.style.padding = '5px';
        hintElement.style.borderRadius = '5px';
        hintElement.style.whiteSpace = 'pre-line';

        frame.parentElement.appendChild(hintElement);

        setTimeout(() => {
            hintElement.remove();
        }, 5000);

        const showQuoteButton = document.getElementById('show-quote');
        showQuoteButton.style.backgroundColor = 'red';
        showQuoteButton.disabled = true;
    }
});

document.getElementById('double-points').addEventListener('click', () => {
    if (!doublePointsUsed) {
        doublePointsUsed = true;
        const doublePointsButton = document.getElementById('double-points');
        doublePointsButton.style.backgroundColor = 'red';
        doublePointsButton.disabled = true;
    }
});

function endGame(isWin) {
    gameOver = true;
    document.getElementById('quiz-subtitle').style.display = 'none';
    document.getElementById('guess-form').style.display = 'none';
    document.getElementById('lifelines').style.display = 'none';
    document.getElementById('info-container').style.display = 'none';
    document.getElementById('episode-label').style.display = 'none';
    document.getElementById('result').textContent = '';

    const episodeTitle = document.getElementById('frame').dataset.episodeTitle;
    const seasonNumber = document.getElementById('frame').dataset.seasonNumber;
    const episodeNumber = document.getElementById('frame').dataset.episodeNumber;

    let gameOverMessage = '';

    if (isWin) {
        document.getElementById('frame').src = '/static/images/winner.png';
        const youWinMessage = document.createElement('div');
        youWinMessage.id = 'you-win-message';
        youWinMessage.textContent = 'You Win!';
        youWinMessage.style.fontSize = '2em';
        youWinMessage.style.color = 'green';
        youWinMessage.style.textAlign = 'center';
        document.querySelector('.image-container').insertBefore(youWinMessage, document.getElementById('frame'));
        document.getElementById('episode-info').classList.add('hidden');
        document.getElementById('episode-title').style.display = 'none';
        document.getElementById('season-episode').style.display = 'none';
        document.getElementById('try-again').textContent = 'New Game';
    } else {
        document.getElementById('frame').src = '/static/images/loser.jpg';
        const youLoseMessage = document.createElement('div');
        youLoseMessage.id = 'you-lose-message';
        youLoseMessage.textContent = 'You Lose!';
        youLoseMessage.style.fontSize = '2em';
        youLoseMessage.style.color = 'red';
        youLoseMessage.style.textAlign = 'center';
        document.querySelector('.image-container').insertBefore(youLoseMessage, document.getElementById('frame'));
        document.getElementById('try-again').textContent = 'Try Again';
    }

    gameOverMessage += `Total Points: ${points} <br>Attempts Left: ${attempts}`;
    const messageElement = document.createElement('div');
    messageElement.innerHTML = gameOverMessage;
    messageElement.style.textAlign = 'center';
    document.querySelector('.image-container').appendChild(messageElement);

    document.getElementById('episode-title').textContent = `${episodeTitle}`;
    document.getElementById('season-episode').textContent = `Season ${seasonNumber}, Episode ${episodeNumber}`;
    document.getElementById('episode-info').classList.remove('hidden');
    document.getElementById('try-again-container').style.display = 'block';
    document.querySelector('.image-container').appendChild(document.getElementById('try-again-container'));
}

document.getElementById('try-again').addEventListener('click', resetGameState);
document.getElementById('give-up').addEventListener('click', () => {
    if (!gameOver) {
        currentFrame++;
        attempts--;
        document.getElementById('current-frame').textContent = `Frame: ${currentFrame + 1} OF ${totalFrames}`;
        if (attempts <= 0) {
            endGame(false);
        } else {
            fetchRandomFrame();
        }
    }
});

if (currentFrame >= totalFrames) {
    endGame(true);
} else if (attempts <= 0) {
    endGame(false);
}
fetchRandomFrame();