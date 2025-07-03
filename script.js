let playerData = [];
let deck = [];
const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
let currentPlayerIndex = 0;

function askNamesAndBets() {
  const count = parseInt(document.getElementById("playerCount").value);
  if (isNaN(count) || count < 1 || count > 10) {
    alert("Please enter a number of players between 1 and 10.");
    return;
  }

  const form = document.getElementById("playerForm");
  form.innerHTML = ''; // Clear any previous input

  for (let i = 0; i < count; i++) {
    form.innerHTML += `
      <div style="margin-bottom: 10px;">
        <label>Player ${i + 1} Name:</label><br />
        <input type="text" name="name${i}" required placeholder="Name" />
        <br />
        <label>Sips to bet:</label><br />
        <input type="number" name="bet${i}" min="1" required placeholder="Sips" />
      </div>
    `;
  }

  form.innerHTML += `<button type="submit">Begin Blackjack!</button>`;
  form.onsubmit = submitPlayers;

  document.getElementById("setup").style.display = "none";
  form.style.display = "block";
  document.getElementById("gameContainer").style.display = "none"; // Hide game elements initially
}

function submitPlayers(event) {
  event.preventDefault();
  const form = document.getElementById("playerForm");
  const formData = new FormData(form);

  playerData = [];
  
  // Get the player count to know how many players to process
  const playerCount = parseInt(document.getElementById("playerCount").value);
  
  for (let i = 0; i < playerCount; i++) {
    const name = formData.get(`name${i}`);
    const bet = parseInt(formData.get(`bet${i}`));
    if (name && bet) {
      playerData.push({ name, bet, hand: [], score: 0, sips: 0, isBust: false, hasStood: false });
    }
  }

  console.log("Players ready:", playerData);

  document.getElementById("playerForm").style.display = "none";
  document.getElementById("gameContainer").style.display = "block"; // Show game elements
  initializeGame();
}

function createDeck() {
  deck = [];
  for (let suit of suits) {
    for (let rank of ranks) {
      deck.push({ rank, suit });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function getCardValue(card) {
  if (['Jack', 'Queen', 'King'].includes(card.rank)) {
    return 10;
  } else if (card.rank === 'Ace') {
    return 11;
  } else {
    return parseInt(card.rank);
  }
}

function calculateHandValue(hand) {
  let value = 0;
  let aceCount = 0;

  for (let card of hand) {
    value += getCardValue(card);
    if (card.rank === 'Ace') {
      aceCount++;
    }
  }

  while (value > 21 && aceCount > 0) {
    value -= 10;
    aceCount--;
  }
  return value;
}

function dealInitialCards() {
  createDeck();

  for (let player of playerData) {
    player.hand = [deck.pop(), deck.pop()];
    player.score = calculateHandValue(player.hand);
  }

  const dealerHand = [deck.pop(), deck.pop()];
  const dealerScore = calculateHandValue(dealerHand);

  playerData.dealerHand = dealerHand;
  playerData.dealerScore = dealerScore;

  // Clear and rebuild handsDisplay
  let handsDisplay = document.getElementById("handsDisplay");
  handsDisplay.innerHTML = '';

  // Create display elements for all players
  for (let i = 0; i < playerData.length; i++) {
    const playerDiv = document.createElement('div');
    playerDiv.id = `player-${i}-hand-display`;
    playerDiv.innerHTML = `
      <p>${playerData[i].name}'s Hand: ${playerData[i].hand.map(card => `${card.rank} of ${card.suit}`).join(', ')} (Score: ${playerData[i].score})</p>
    `;
    handsDisplay.appendChild(playerDiv);
  }

  // Create dealer display
  const dealerDiv = document.createElement('div');
  dealerDiv.id = 'dealer-hand-display';
  dealerDiv.innerHTML = `
    <p>Dealer's Hand: ${playerData.dealerHand[0].rank} of ${playerData.dealerHand[0].suit}, [Hidden Card]</p>
  `;
  handsDisplay.appendChild(dealerDiv);

  // Log initial deal to gameDisplay
  let gameDisplay = document.getElementById("gameDisplay");
  gameDisplay.innerHTML += "<h2>Initial Deal Complete!</h2>";
  gameDisplay.scrollTop = gameDisplay.scrollHeight; // Scroll to bottom
}

function updatePlayerHandDisplay(playerIndex) {
  const player = playerData[playerIndex];
  let playerHandDiv = document.getElementById(`player-${playerIndex}-hand-display`);
  if (playerHandDiv) {
    playerHandDiv.innerHTML = `
      <p style="${playerIndex === currentPlayerIndex ? 'font-weight: bold; color: yellow;' : ''}">
        ${player.name}'s Hand: ${player.hand.map(card => `${card.rank} of ${card.suit}`).join(', ')} (Score: ${player.score})
      </p>
    `;
  }
}

function updateDealerHandDisplay(revealAll = false) {
  let dealerHandDiv = document.getElementById("dealer-hand-display");
  if (dealerHandDiv) {
    if (revealAll) {
      dealerHandDiv.innerHTML = `
        <p>Dealer's Hand: ${playerData.dealerHand.map(card => `${card.rank} of ${card.suit}`).join(', ')} (Score: ${playerData.dealerScore})</p>
      `;
    } else {
      dealerHandDiv.innerHTML = `
        <p>Dealer's Hand: ${playerData.dealerHand[0].rank} of ${playerData.dealerHand[0].suit}, [Hidden Card]</p>
      `;
    }
  }
}

function startPlayerTurn(playerIndex) {
  currentPlayerIndex = playerIndex;
  let playerActionsDiv = document.getElementById("playerActions");
  playerActionsDiv.innerHTML = ""; // Clear previous actions

  console.log(`Starting turn for player ${playerIndex}, total players: ${playerData.length}`);

  if (currentPlayerIndex >= playerData.length) {
    console.log("All players done, starting dealer turn");
    dealerTurn();
    return;
  }

  const currentPlayer = playerData[currentPlayerIndex];
  console.log(`Current player: ${currentPlayer.name}, isBust: ${currentPlayer.isBust}, hasStood: ${currentPlayer.hasStood}`);

  if (currentPlayer.isBust || currentPlayer.hasStood) {
    let gameDisplay = document.getElementById("gameDisplay");
    gameDisplay.innerHTML += `<p>${currentPlayer.name} has already finished their turn.</p>`;
    gameDisplay.scrollTop = gameDisplay.scrollHeight;
    startPlayerTurn(currentPlayerIndex + 1);
    return;
  }

  playerActionsDiv.innerHTML = `
    <h3>${currentPlayer.name}'s Turn (Sips Bet: ${currentPlayer.bet})</h3>
    <button onclick="hit()">Hit</button>
    <button onclick="stand()">Stand</button>
  `;
  
  // Update game display to show whose turn it is
  let gameDisplay = document.getElementById("gameDisplay");
  gameDisplay.innerHTML += `<p><strong>It's ${currentPlayer.name}'s turn!</strong></p>`;
  gameDisplay.scrollTop = gameDisplay.scrollHeight;
  
  // Call updatePlayerHandDisplay for all players to ensure they are visible and current player is highlighted
  for (let i = 0; i < playerData.length; i++) {
    updatePlayerHandDisplay(i);
  }
}

function hit() {
  const currentPlayer = playerData[currentPlayerIndex];
  const newCard = deck.pop();
  currentPlayer.hand.push(newCard);
  currentPlayer.score = calculateHandValue(currentPlayer.hand);

  let gameDisplay = document.getElementById("gameDisplay");
  gameDisplay.innerHTML += `<p>${currentPlayer.name} hits and gets: ${newCard.rank} of ${newCard.suit}</p>`;
  gameDisplay.scrollTop = gameDisplay.scrollHeight;

  updatePlayerHandDisplay(currentPlayerIndex); // Update display with new card and score

  if (currentPlayer.score > 21) {
    currentPlayer.isBust = true;
    gameDisplay.innerHTML += `<p><strong>${currentPlayer.name} busts with a score of ${currentPlayer.score}!</strong></p>`;
    gameDisplay.scrollTop = gameDisplay.scrollHeight;
    alert(`${currentPlayer.name} busts with a score of ${currentPlayer.score}!`); // Still use alert for immediate feedback
    startPlayerTurn(currentPlayerIndex + 1);
  }
}

function stand() {
  const currentPlayer = playerData[currentPlayerIndex];
  currentPlayer.hasStood = true;
  let gameDisplay = document.getElementById("gameDisplay");
  gameDisplay.innerHTML += `<p><strong>${currentPlayer.name} stands with a score of ${currentPlayer.score}.</strong></p>`;
  gameDisplay.scrollTop = gameDisplay.scrollHeight;
  alert(`${currentPlayer.name} stands with a score of ${currentPlayer.score}.`); // Still use alert for immediate feedback
  startPlayerTurn(currentPlayerIndex + 1);
}

function dealerTurn() {
  let gameDisplay = document.getElementById("gameDisplay");
  let playerActionsDiv = document.getElementById("playerActions");
  playerActionsDiv.innerHTML = ""; // Clear player action buttons

  gameDisplay.innerHTML += "<h2>Dealer's Turn:</h2>";
  gameDisplay.scrollTop = gameDisplay.scrollHeight;

  updateDealerHandDisplay(true); // Reveal dealer's hidden card
  gameDisplay.innerHTML += `<p>Dealer's initial hand revealed: ${playerData.dealerHand.map(card => `${card.rank} of ${card.suit}`).join(', ')} (Score: ${playerData.dealerScore})</p>`;
  gameDisplay.scrollTop = gameDisplay.scrollHeight;


  while (playerData.dealerScore < 17) {
    const newCard = deck.pop();
    playerData.dealerHand.push(newCard);
    playerData.dealerScore = calculateHandValue(playerData.dealerHand);
    gameDisplay.innerHTML += `<p>Dealer hits and gets: ${newCard.rank} of ${newCard.suit}</p>`;
    gameDisplay.innerHTML += `<p>Dealer's New Score: ${playerData.dealerScore}</p>`;
    gameDisplay.scrollTop = gameDisplay.scrollHeight;
    updateDealerHandDisplay(true); // Update dealer's hand display
  }

  if (playerData.dealerScore > 21) {
    gameDisplay.innerHTML += `<p><strong>Dealer busts with a score of ${playerData.dealerScore}!</strong></p>`;
  } else {
    gameDisplay.innerHTML += `<p><strong>Dealer stands with a score of ${playerData.dealerScore}.</strong></p>`;
  }
  gameDisplay.scrollTop = gameDisplay.scrollHeight;

  determineWinners();
}

function determineWinners() {
  let gameDisplay = document.getElementById("gameDisplay");
  gameDisplay.innerHTML += "<h2>Results:</h2>";
  gameDisplay.scrollTop = gameDisplay.scrollHeight;

  const dealerFinalScore = playerData.dealerScore;
  const dealerBusted = dealerFinalScore > 21;

  for (let player of playerData) {
    let resultMessage = `${player.name}: `;
    if (player.isBust) {
      resultMessage += `Busted! Loses ${player.bet} sips.`;
      player.sips -= player.bet;
    } else if (dealerBusted || player.score > dealerFinalScore) {
      resultMessage += `Wins! Gets ${player.bet} sips.`;
      player.sips += player.bet;
    } else if (player.score < dealerFinalScore) {
      resultMessage += `Loses! Loses ${player.bet} sips.`;
      player.sips -= player.bet;
    } else { // Push
      resultMessage += `Pushes! No sips gained or lost.`;
    }
    gameDisplay.innerHTML += `<p>${resultMessage} (Current Sips: ${player.sips})</p>`;
    gameDisplay.scrollTop = gameDisplay.scrollHeight;
  }

  gameDisplay.innerHTML += `<button onclick="resetGame()">Play Again</button>`;
  gameDisplay.scrollTop = gameDisplay.scrollHeight;
}

function resetGame() {
    document.getElementById("gameDisplay").innerHTML = "";
    document.getElementById("handsDisplay").innerHTML = ""; // Clear hands display
    document.getElementById("playerActions").innerHTML = "";

    for(let player of playerData) {
        player.hand = [];
        player.score = 0;
        player.isBust = false;
        player.hasStood = false;
    }
    playerData.dealerHand = [];
    playerData.dealerScore = 0;
    currentPlayerIndex = 0;

    document.getElementById("setup").style.display = "block";
    document.getElementById("gameContainer").style.display = "none";
}

function initializeGame() {
    document.getElementById("gameDisplay").innerHTML = ""; // Clear previous game log
    dealInitialCards();
    
    // Debug: Log player data to console
    console.log("Player data after deal:", playerData);
    
    // After dealing initial cards, ensure all player hands are updated in the display
    for (let i = 0; i < playerData.length; i++) {
      updatePlayerHandDisplay(i);
    }
    
    // Add a small delay to ensure DOM is updated before starting player turns
    setTimeout(() => {
        startPlayerTurn(0);
    }, 100);
}