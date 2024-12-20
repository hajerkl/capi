let numPlayers;
let playerNames = [];
let currentFeatureIndex = 0;
let features = [];
const cards = [0, 1, 2, 3, 5, 8, 13, 20, 40, 100, "cafe", "?"];

function createPlayerFields() {
    const numPlayers = document.getElementById('numPlayers').value;
    const playerFields = document.getElementById('player-fields');
    playerFields.innerHTML = '';
    for (let i = 0; i < numPlayers; i++) {
        playerFields.innerHTML += `<div>
            <label for="player${i}-name">Pseudo du joueur ${i+1}:</label>
            <input type="text" id="player${i}-name" name="player${i}-name" required>
        </div>`;
    }
}

function startGame() {
    numPlayers = document.getElementById('numPlayers').value;
    for (let i = 0; i < numPlayers; i++) {
        playerNames.push(document.getElementById(`player${i}-name`).value);
    }
    document.getElementById('config').style.display = 'none';
    document.getElementById('backlog').style.display = 'none'; // Masquer le backlog
    document.getElementById('game').style.display = 'block';
    displayFeature();
}

function displayFeature() {
    if (currentFeatureIndex < features.length) {
        const feature = features[currentFeatureIndex];
        document.getElementById('feature-name').innerText = feature.name;
        document.getElementById('player-votes').innerHTML = generateVoteOptions();
    } else {
        // Sauvegarder et afficher les résultats finaux
        document.getElementById('voting').style.display = 'none';
        document.getElementById('results').style.display = 'block';
        displayFinalResults();
        saveResults();
    }
}

function generateVoteOptions() {
    let voteOptions = '';
    for (let i = 0; i < numPlayers; i++) {
        voteOptions += `<div>
            <label for="player${i}-vote">${playerNames[i]} :</label>
            <select id="player${i}-vote" name="player${i}-vote" required>
                ${cards.map(card => `<option value="${card}">${card}</option>`).join('')}
            </select>
        </div>`;
    }
    return voteOptions;
}

function submitVotes() {
    const votes = [];
    for (let i = 0; i < numPlayers; i++) {
        votes.push(document.getElementById(`player${i}-vote`).value);
    }
    features[currentFeatureIndex].votes = votes;
    if (votes.every(vote => vote === "cafe")) {
        saveProgress();
    } else {
        validateVotes();
    }
}

function validateVotes() {
    const feature = features[currentFeatureIndex];
    const votes = feature.votes.map(vote => vote === "?" ? 0 : (vote === "cafe" ? -1 : parseInt(vote)));
    
    // Mode strict : Unanimité
    const allVotesEqual = votes.every(vote => vote === votes[0]);
    if (document.getElementById('rules').value === "strict") {
        if (allVotesEqual) {
            feature.estimatedDifficulty = votes[0]; // Tous les votes sont les mêmes
            displayResults();
        } else {
            alert("Les votes ne sont pas unanimes. Veuillez revoter.");
        }
        return;
    }
    
    // Premier tour : Unanimité
    if (currentFeatureIndex === 0 && !allVotesEqual) {
        alert("Les votes ne sont pas unanimes pour le premier tour. Veuillez revoter.");
        return;
    }
    
    // Mode moyenne
    if (document.getElementById('rules').value === "average") {
        const avgVote = calculateAverage(votes);
        feature.estimatedDifficulty = avgVote;
        displayResults();
    }
}

function calculateAverage(votes) {
    const validVotes = votes.filter(vote => vote !== -1); // Exclure les votes "cafe"
    const sum = validVotes.reduce((total, vote) => total + vote, 0);
    return Math.round(sum / validVotes.length);
}

function displayResults() {
    const feature = features[currentFeatureIndex];
    currentFeatureIndex++;
    displayFeature();
}

function displayFinalResults() {
    const resultsDiv = document.getElementById('vote-results');
    resultsDiv.innerHTML = '';
    features.forEach(feature => {
        resultsDiv.innerHTML += `<p>Fonctionnalité: ${feature.name}, Difficulté Estimée: ${feature.estimatedDifficulty}</p>`;
    });
}

function saveProgress() {
    const progress = { currentFeatureIndex, features };
    const json = JSON.stringify(progress);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'progress.json';
    a.click();
    URL.revokeObjectURL(url);
    alert("L'avancement a été enregistré.");
}

function handleFileLoad(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        loadProgress(e.target.result);
    };
    reader.readAsText(file);
}

function loadProgress(json) {
    const progress = JSON.parse(json);
    currentFeatureIndex = progress.currentFeatureIndex;
    features = progress.features;
    displayFeature();
}

function handleBacklogLoad(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        features = JSON.parse(e.target.result);
        alert("Le backlog a été chargé avec succès.");
        displayBacklog();
        currentFeatureIndex = 0;
    };
    reader.readAsText(file);
}

function displayBacklog() {
    const featureList = document.getElementById('feature-list');
    featureList.innerHTML = '';
    features.forEach(feature => {
        featureList.innerHTML += `<li>${feature.name}</li>`;
    });
}

function saveResults() {
    const results = features.map(feature => ({ name: feature.name, estimatedDifficulty: feature.estimatedDifficulty }));
    const json = JSON.stringify(results);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'results.json';
    a.click();
    URL.revokeObjectURL(url);
    alert("Les résultats finaux ont été enregistrés.");
}
