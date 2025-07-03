let playerData = [];
let deck = [];
const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
let currentPlayerIndex = 0;
let currentHandIndex = 0; // New: To track which hand of a player is currently playing

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
      playerData.push({
        name,
        // Each player now has an array of hands
        hands: [{ hand: [], score: 0, bet, isBust: false, hasStood: false, isBlackjack: false }],
        sips: 0 // Initial sips, assuming they start with 0 and gain/lose
      });
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

function getCardSymbol(suit) {
  const symbols = {
    'Hearts': '♥',
    'Diamonds': '♦',
    'Clubs': '♣',
    'Spades': '♠'
  };
  return symbols[suit];
}

function getCardColor(suit) {
  return ['Hearts', 'Diamonds'].includes(suit) ? 'red' : 'black';
}

function createCardHTML(card) {
  const symbol = getCardSymbol(card.suit);
  const color = getCardColor(card.suit);
  const displayRank = card.rank === 'Jack' ? 'J' : 
                     card.rank === 'Queen' ? 'Q' : 
                     card.rank === 'King' ? 'K' : 
                     card.rank === 'Ace' ? 'A' : card.rank;
  
  return `<div class="card ${color}">
    <div class="card-corner top-left">
      <div class="card-rank">${displayRank}</div>
      <div class="card-suit">${symbol}</div>
    </div>
    <div class="card-center">${symbol}</div>
    <div class="card-corner bottom-right">
      <div class="card-rank">${displayRank}</div>
      <div class="card-suit">${symbol}</div>
    </div>
  </div>`;
}

function createHiddenCardHTML() {
  return `<div class="card hidden">
    <div class="card-back">🂠</div>
  </div>`;
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
  let handsDisplay = document.getElementById("handsDisplay");
  handsDisplay.innerHTML = ''; // Clear existing hands display

  let dealPlayerIndex = 0;
  let dealCardPerPlayerCount = 0; // To ensure each player gets 2 cards, one by one
  const numPlayers = playerData.length;
  const gameDisplay = document.getElementById("gameDisplay");

  gameDisplay.innerHTML += "<h2>Initial Deal Starting...</h2>";
  gameDisplay.scrollTop = gameDisplay.scrollHeight;

  // Function to deal one card to a player, then schedule the next
  function dealPlayerCardWithDelay() {
    if (dealCardPerPlayerCount < 2) { // Each player gets 2 cards
      if (dealPlayerIndex < numPlayers) {
        const currentPlayer = playerData[dealPlayerIndex];
        const currentHand = currentPlayer.hands[0]; // Always deal to the first hand initially
        const newCard = deck.pop();
        currentHand.hand.push(newCard);
        currentHand.score = calculateHandValue(currentHand.hand);

        // Ensure player container exists and update it
        let playerContainerDiv = document.getElementById(`player-${dealPlayerIndex}-hand-container`);
        if (!playerContainerDiv) {
            playerContainerDiv = document.createElement('div');
            playerContainerDiv.id = `player-${dealPlayerIndex}-hand-container`;
            handsDisplay.appendChild(playerContainerDiv);
        }
        updatePlayerDisplay(dealPlayerIndex); // Update player's hand display

        gameDisplay.innerHTML += `<p>Dealing card to ${currentPlayer.name}...</p>`;
        gameDisplay.scrollTop = gameDisplay.scrollHeight;

        dealPlayerIndex++; // Move to the next player for the next card
        if (dealPlayerIndex === numPlayers) {
          dealPlayerIndex = 0; // Reset to first player for the second round of cards
          dealCardPerPlayerCount++; // Increment card count after all players get one card
        }

        setTimeout(dealPlayerCardWithDelay, 1500); // 1.5 second delay between each player's card
      } else { // Should not happen if logic is correct, but as a safeguard
        console.error("Issue in dealing player cards loop.");
        dealDealerCards();
      }
    } else { // Players have received both their cards
      dealDealerCards();
    }
  }

  // Function to deal dealer cards after players receive theirs
  function dealDealerCards() {
    if (!playerData.dealerHand) {
      playerData.dealerHand = [];
      playerData.dealerScore = 0;
    }

    const dealerDiv = document.createElement('div');
    dealerDiv.id = 'dealer-hand-display';
    dealerDiv.className = 'dealer-hand-container';
    handsDisplay.appendChild(dealerDiv);

    // Deal dealer's first card
    setTimeout(() => {
        const card1 = deck.pop();
        playerData.dealerHand.push(card1);
        playerData.dealerScore = calculateHandValue(playerData.dealerHand);
        updateDealerHandDisplay(false); // First card visible, second hidden
        gameDisplay.innerHTML += `<p>Dealing first card to Dealer...</p>`;
        gameDisplay.scrollTop = gameDisplay.scrollHeight;

        // Deal dealer's second card (hidden)
        setTimeout(() => {
            const card2 = deck.pop();
            playerData.dealerHand.push(card2);
            playerData.dealerScore = calculateHandValue(playerData.dealerHand);
            updateDealerHandDisplay(false); // Still show second card as hidden
            gameDisplay.innerHTML += `<p>Dealing second card to Dealer (hidden)...</p>`;
            gameDisplay.scrollTop = gameDisplay.scrollHeight;

            // Finalize initial deal
            gameDisplay.innerHTML += "<h2>Initial Deal Complete!</h2>";
            gameDisplay.scrollTop = gameDisplay.scrollHeight;

            // Check for initial blackjacks and then start player turns
            setTimeout(() => {
                // Check if any player or dealer has a Blackjack on initial deal
                let gameEndedByBlackjack = false;
                for (let player of playerData) {
                    if (player.hands[0].isBlackjack) {
                        gameDisplay.innerHTML += `<p><strong>${player.name}'s Hand 1 has Blackjack!</strong></p>`;
                        gameEndedByBlackjack = true;
                    }
                }
                if (playerData.dealerHand.length === 2 && playerData.dealerScore === 21) {
                    gameDisplay.innerHTML += `<p><strong>Dealer has Blackjack!</strong></p>`;
                    gameEndedByBlackjack = true;
                    updateDealerHandDisplay(true); // Reveal dealer's hand immediately if they have Blackjack
                }

                if (gameEndedByBlackjack) {
                    determineWinners(); // Go straight to results if there's an immediate Blackjack
                } else {
                    startPlayerTurn(0, 0); // Start with the first player's first hand
                }
            }, 500); // Small delay before determining blackjacks or starting turns
        }, 1500); // 1.5 second delay for dealer's second card
    }, 1500); // 1.5 second delay for dealer's first card
  }

  // Start the delayed dealing process for players
  dealPlayerCardWithDelay();
}


function updatePlayerDisplay(playerIndex) {
    const player = playerData[playerIndex];
    let playerContainerDiv = document.getElementById(`player-${playerIndex}-hand-container`);

    if (!playerContainerDiv) {
        playerContainerDiv = document.createElement('div');
        playerContainerDiv.id = `player-${playerIndex}-hand-container`;
        document.getElementById("handsDisplay").appendChild(playerContainerDiv);
    }
    // Clear previous hands HTML for this player to redraw all hands correctly
    playerContainerDiv.innerHTML = `<h2>${player.name}'s Hands (Total Sips: ${player.sips})</h2>`;

    player.hands.forEach((hand, handIdx) => {
        const cardsHTML = hand.hand.map(card => createCardHTML(card)).join('');
        const isCurrentHand = (playerIndex === currentPlayerIndex && handIdx === currentHandIndex);
        const handStatus = hand.isBust ? 'BUST!' : hand.hasStood ? 'STOOD' : hand.isBlackjack ? 'BLACKJACK!' : '';
        const handScoreDisplay = hand.score > 0 ? `(Score: ${hand.score})` : '';

        playerContainerDiv.innerHTML += `
            <div id="player-${playerIndex}-hand-${handIdx}-display" class="player-hand-container" style="${isCurrentHand ? 'border-color: #d4af37; box-shadow: 0 0 15px #d4af37;' : ''}">
                <h3 style="${isCurrentHand ? 'color: #d4af37; text-shadow: 0 0 10px #d4af37;' : ''}">Hand ${handIdx + 1} ${handScoreDisplay} ${handStatus} (Bet: ${hand.bet})</h3>
                <div class="cards-container">${cardsHTML}</div>
            </div>
        `;
    });
}


function updateDealerHandDisplay(revealAll = false) {
  let dealerHandDiv = document.getElementById("dealer-hand-display");
  if (dealerHandDiv) {
    let cardsHTML;
    if (revealAll) {
      cardsHTML = playerData.dealerHand.map(card => createCardHTML(card)).join('');
      dealerHandDiv.innerHTML = `
        <h3>Dealer's Hand (Score: ${playerData.dealerScore})</h3>
        <div class="cards-container">${cardsHTML}</div>
      `;
    } else {
      // If not revealing all, and we have at least one card, show the first card and then a hidden card
      // This handles the case where only one card is dealt so far
      if (playerData.dealerHand.length > 0) {
          cardsHTML = createCardHTML(playerData.dealerHand[0]);
          // Add hidden card only if it's the initial two cards
          if (playerData.dealerHand.length === 1 || playerData.dealerHand.length === 2) {
              cardsHTML += createHiddenCardHTML();
          }
      } else {
          cardsHTML = ''; // No cards dealt yet
      }
      dealerHandDiv.innerHTML = `
        <h3>Dealer's Hand</h3>
        <div class="cards-container">${cardsHTML}</div>
      `;
    }
  }
}

function startPlayerTurn(playerIndex, handIndex = 0) {
  currentPlayerIndex = playerIndex;
  currentHandIndex = handIndex;
  let playerActionsDiv = document.getElementById("playerActions");
  playerActionsDiv.innerHTML = ""; // Clear previous actions

  if (currentPlayerIndex >= playerData.length) {
    console.log("All players done, starting dealer turn");
    dealerTurn();
    return;
  }

  const currentPlayer = playerData[currentPlayerIndex];
  const currentHand = currentPlayer.hands[currentHandIndex];

  // If this hand is already bust or stood, move to the next hand/player
  if (currentHand.isBust || currentHand.hasStood || currentHand.isBlackjack) {
    let gameDisplay = document.getElementById("gameDisplay");
    gameDisplay.innerHTML += `<p>${currentPlayer.name}'s Hand ${currentHandIndex + 1} has already finished their turn.</p>`;
    gameDisplay.scrollTop = gameDisplay.scrollHeight;
    nextHandOrPlayerTurn();
    return;
  }

  playerActionsDiv.innerHTML = `
    <h3>${currentPlayer.name}'s Turn - Hand ${currentHandIndex + 1} (Sips Bet: ${currentHand.bet})</h3>
    <button onclick="hit()">Hit</button>
    <button onclick="stand()">Stand</button>
  `;

  // Double Down option: Only available on the initial two cards
  if (currentHand.hand.length === 2) {
      playerActionsDiv.innerHTML += `<button onclick="doubleDown()">Double Down</button>`;
  }

  // Check for split option: Only available on the initial two cards of the same rank
  if (currentHand.hand.length === 2 && currentHand.hand[0].rank === currentHand.hand[1].rank && currentPlayer.hands.length < 4) { // Limit max hands for simplicity
      playerActionsDiv.innerHTML += `<button onclick="split()">Split</button>`;
  }
  
  // Update game display to show whose turn it is
  let gameDisplay = document.getElementById("gameDisplay");
  gameDisplay.innerHTML += `<p><strong>It's ${currentPlayer.name}'s turn for Hand ${currentHandIndex + 1}!</strong></p>`;
  gameDisplay.scrollTop = gameDisplay.scrollHeight;
  
  // Call updatePlayerDisplay for the current player to highlight the active hand
  updatePlayerDisplay(currentPlayerIndex);
  // Also update all other players' displays to ensure consistent view
  for (let i = 0; i < playerData.length; i++) {
    if (i !== currentPlayerIndex) {
      updatePlayerDisplay(i);
    }
  }
}

function nextHandOrPlayerTurn() {
    const currentPlayer = playerData[currentPlayerIndex];
    if (currentHandIndex + 1 < currentPlayer.hands.length) {
        // Move to the next hand for the current player
        startPlayerTurn(currentPlayerIndex, currentHandIndex + 1);
    } else {
        // Move to the next player
        startPlayerTurn(currentPlayerIndex + 1, 0);
    }
}


function hit() {
  const currentPlayer = playerData[currentPlayerIndex];
  const currentHand = currentPlayer.hands[currentHandIndex];
  const newCard = deck.pop();
  currentHand.hand.push(newCard);
  currentHand.score = calculateHandValue(currentHand.hand);

  let gameDisplay = document.getElementById("gameDisplay");
  gameDisplay.innerHTML += `<p>${currentPlayer.name}'s Hand ${currentHandIndex + 1} hits and gets: ${newCard.rank} of ${newCard.suit}</p>`;
  gameDisplay.scrollTop = gameDisplay.scrollHeight;

  updatePlayerDisplay(currentPlayerIndex); // Update display with new card and score

  if (currentHand.score > 21) {
    currentHand.isBust = true;
    gameDisplay.innerHTML += `<p><strong>${currentPlayer.name}'s Hand ${currentHandIndex + 1} busts with a score of ${currentHand.score}!</strong></p>`;
    gameDisplay.scrollTop = gameDisplay.scrollHeight;
    nextHandOrPlayerTurn();
  } else if (currentHand.score === 21) {
      // Automatically stand on 21 to prevent accidental hit
      gameDisplay.innerHTML += `<p><strong>${currentPlayer.name}'s Hand ${currentHandIndex + 1} has 21! Standing automatically.</strong></p>`;
      gameDisplay.scrollTop = gameDisplay.scrollHeight;
      currentHand.hasStood = true;
      nextHandOrPlayerTurn();
  }
}

function stand() {
  const currentPlayer = playerData[currentPlayerIndex];
  const currentHand = currentPlayer.hands[currentHandIndex];
  currentHand.hasStood = true;
  let gameDisplay = document.getElementById("gameDisplay");
  gameDisplay.innerHTML += `<p><strong>${currentPlayer.name}'s Hand ${currentHandIndex + 1} stands with a score of ${currentHand.score}.</strong></p>`;
  gameDisplay.scrollTop = gameDisplay.scrollHeight;
  nextHandOrPlayerTurn();
}

function doubleDown() {
    const currentPlayer = playerData[currentPlayerIndex];
    const currentHand = currentPlayer.hands[currentHandIndex];
    let gameDisplay = document.getElementById("gameDisplay");

    if (currentHand.hand.length !== 2) {
        gameDisplay.innerHTML += `<p style="color:red;">Can only double down on your first two cards!</p>`;
        gameDisplay.scrollTop = gameDisplay.scrollHeight;
        return;
    }

    // Double the bet
    currentHand.bet *= 2;
    gameDisplay.innerHTML += `<p><strong>${currentPlayer.name}'s Hand ${currentHandIndex + 1} doubles down! New bet: ${currentHand.bet}.</strong></p>`;
    gameDisplay.scrollTop = gameDisplay.scrollHeight;

    // Hit one card
    const newCard = deck.pop();
    currentHand.hand.push(newCard);
    currentHand.score = calculateHandValue(currentHand.hand);
    gameDisplay.innerHTML += `<p>${currentPlayer.name}'s Hand ${currentHandIndex + 1} gets: ${newCard.rank} of ${newCard.suit}</p>`;
    gameDisplay.scrollTop = gameDisplay.scrollHeight;

    updatePlayerDisplay(currentPlayerIndex); // Update display with new card and score

    // Automatically stand (or bust) after the single hit
    if (currentHand.score > 21) {
        currentHand.isBust = true;
        gameDisplay.innerHTML += `<p><strong>${currentPlayer.name}'s Hand ${currentHandIndex + 1} busts with a score of ${currentHand.score} after doubling down!</strong></p>`;
    } else {
        currentHand.hasStood = true;
        gameDisplay.innerHTML += `<p><strong>${currentPlayer.name}'s Hand ${currentHandIndex + 1} stands with a score of ${currentHand.score} after doubling down.</strong></p>`;
    }
    gameDisplay.scrollTop = gameDisplay.scrollHeight;
    nextHandOrPlayerTurn(); // Move to the next hand/player
}


function split() {
    const currentPlayer = playerData[currentPlayerIndex];
    const currentHand = currentPlayer.hands[currentHandIndex];

    if (currentHand.hand.length !== 2 || currentHand.hand[0].rank !== currentHand.hand[1].rank) {
        let gameDisplay = document.getElementById("gameDisplay");
        gameDisplay.innerHTML += `<p style="color:red;">Cannot split this hand! Cards must be of the exact same rank (e.g., K-K, J-J).</p>`;
        gameDisplay.scrollTop = gameDisplay.scrollHeight;
        return;
    }

    // Create two new hands
    const card1 = currentHand.hand[0];
    const card2 = currentHand.hand[1];
    const originalBet = currentHand.bet;

    // Reset the current hand to be the first split hand
    currentHand.hand = [card1, deck.pop()]; // Give the first card and a new card
    currentHand.score = calculateHandValue(currentHand.hand);
    currentHand.isBust = false;
    currentHand.hasStood = false;
    currentHand.isBlackjack = (currentHand.score === 21 && currentHand.hand.length === 2);


    // Add a new hand to the player's hands array for the second split card
    currentPlayer.hands.splice(currentHandIndex + 1, 0, {
        hand: [card2, deck.pop()], // Give the second card and a new card
        score: 0,
        bet: originalBet, // Same bet as original hand
        isBust: false,
        hasStood: false,
        isBlackjack: false
    });
    // Calculate score for the newly created hand
    currentPlayer.hands[currentHandIndex + 1].score = calculateHandValue(currentPlayer.hands[currentHandIndex + 1].hand);
    currentPlayer.hands[currentHandIndex + 1].isBlackjack = (currentPlayer.hands[currentHandIndex + 1].score === 21 && currentPlayer.hands[currentHandIndex + 1].hand.length === 2);


    let gameDisplay = document.getElementById("gameDisplay");
    gameDisplay.innerHTML += `<p><strong>${currentPlayer.name} splits Hand ${currentHandIndex + 1}! Two new hands created, each with a bet of ${originalBet}.</strong></p தொடர்பானစာ။`;
    gameDisplay.scrollTop = gameDisplay.scrollHeight;

    updatePlayerDisplay(currentPlayerIndex); // Update the display for the player to show both new hands

    // Since the current hand has changed and a new one was inserted,
    // we need to ensure the turn continues for the *first* of the split hands.
    // The `startPlayerTurn` will naturally process `currentHandIndex` and then `currentHandIndex + 1`.
    startPlayerTurn(currentPlayerIndex, currentHandIndex);
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

  // Use a recursive function with setTimeout for delayed hits
  function dealerHitsWithDelay() {
    if (playerData.dealerScore < 17) {
      setTimeout(() => {
        const newCard = deck.pop();
        playerData.dealerHand.push(newCard);
        playerData.dealerScore = calculateHandValue(playerData.dealerHand);
        gameDisplay.innerHTML += `<p>Dealer hits and gets: ${newCard.rank} of ${newCard.suit}</p>`;
        gameDisplay.innerHTML += `<p>Dealer's New Score: ${playerData.dealerScore}</p>`;
        gameDisplay.scrollTop = gameDisplay.scrollHeight;
        updateDealerHandDisplay(true); // Update dealer's hand display
        dealerHitsWithDelay(); // Call itself for the next hit
      }, 1000); // 1000 milliseconds = 1 second delay
    } else {
      // Once dealer stands or busts
      if (playerData.dealerScore > 21) {
        gameDisplay.innerHTML += `<p><strong>Dealer busts with a score of ${playerData.dealerScore}!</strong></p>`;
      } else {
        gameDisplay.innerHTML += `<p><strong>Dealer stands with a score of ${playerData.dealerScore}.</strong></p>`;
      }
      gameDisplay.scrollTop = gameDisplay.scrollHeight;
      determineWinners();
    }
  }

  dealerHitsWithDelay(); // Start the delayed hitting process
}

function determineWinners() {
  let gameDisplay = document.getElementById("gameDisplay");
  gameDisplay.innerHTML += "<h2>Results:</h2>";
  gameDisplay.scrollTop = gameDisplay.scrollHeight;

  const dealerFinalScore = playerData.dealerScore;
  const dealerBusted = dealerFinalScore > 21;

  for (let player of playerData) {
    gameDisplay.innerHTML += `<p>--- ${player.name}'s Results ---</p>`;
    let playerTotalSipsChange = 0; // Track sips change for all hands of a player

    player.hands.forEach((hand, handIdx) => {
        let resultMessage = `${player.name}'s Hand ${handIdx + 1} (Bet: ${hand.bet}): `;
        let sipsChange = 0;

        if (hand.isBust) {
            resultMessage += `Busted! Loses ${hand.bet} sips.`;
            sipsChange -= hand.bet;
        } else if (hand.isBlackjack && !dealerBusted && playerData.dealerHand.length === 2 && playerData.dealerScore !== 21) {
            // Player Blackjack vs. Dealer No Blackjack
            resultMessage += `BLACKJACK! Wins ${hand.bet * 1.5} sips.`; // Pays 1.5 times bet
            sipsChange += hand.bet * 1.5;
        } else if (hand.isBlackjack && playerData.dealerHand.length === 2 && playerData.dealerScore === 21) {
            // Player Blackjack vs. Dealer Blackjack (Push)
            resultMessage += `BLACKJACK! Pushes with Dealer. No sips gained or lost.`;
            sipsChange += 0;
        } else if (dealerBusted || hand.score > dealerFinalScore) {
            resultMessage += `Wins! Gets ${hand.bet} sips.`;
            sipsChange += hand.bet;
        } else if (hand.score < dealerFinalScore) {
            resultMessage += `Loses! Loses ${hand.bet} sips.`;
            sipsChange -= hand.bet;
        } else { // Push
            resultMessage += `Pushes! No sips gained or lost.`;
            sipsChange += 0;
        }
        player.sips += sipsChange; // Apply sips change to player's total
        gameDisplay.innerHTML += `<p>${resultMessage}</p>`;
    });
    gameDisplay.innerHTML += `<p><strong>${player.name}'s Total Sips: ${player.sips}</strong></p>`;
    gameDisplay.scrollTop = gameDisplay.scrollHeight;
  }

  gameDisplay.innerHTML += `<button onclick="resetGame()">Play Again (New Players)</button>`;
  gameDisplay.innerHTML += `<button onclick="askForNewBets()">Play Again (Same Players)</button>`; // New button
  gameDisplay.scrollTop = gameDisplay.scrollHeight;
}

function resetGame() {
    document.getElementById("gameDisplay").innerHTML = "";
    document.getElementById("handsDisplay").innerHTML = ""; // Clear hands display
    document.getElementById("playerActions").innerHTML = "";

    playerData = []; // Clear all player data for new players
    playerData.dealerHand = [];
    playerData.dealerScore = 0;
    currentPlayerIndex = 0;
    currentHandIndex = 0;

    document.getElementById("setup").style.display = "block";
    document.getElementById("gameContainer").style.display = "none";
}

function askForNewBets() {
    document.getElementById("gameDisplay").innerHTML = "";
    document.getElementById("handsDisplay").innerHTML = "";
    document.getElementById("playerActions").innerHTML = "";

    const form = document.getElementById("playerForm");
    form.innerHTML = ''; // Clear previous input

    for (let i = 0; i < playerData.length; i++) {
        const player = playerData[i];
        form.innerHTML += `
            <div style="margin-bottom: 10px;">
                <label>Player ${player.name} (Current Sips: ${player.sips}) - New Bet:</label><br />
                <input type="number" name="bet${i}" min="1" required placeholder="Sips" value="${player.hands[0].bet}" />
            </div>
        `;
        // Reset player specific game state for the *next* round, but keep sips balance
        // Crucially, reset hands array to a single, empty hand
        player.hands = [{ hand: [], score: 0, bet: 0, isBust: false, hasStood: false, isBlackjack: false }];
    }
    // Reset dealer state
    playerData.dealerHand = [];
    playerData.dealerScore = 0;
    currentPlayerIndex = 0;
    currentHandIndex = 0;


    form.innerHTML += `<button type="submit">Start Next Round!</button>`;
    form.onsubmit = submitNewBets;

    document.getElementById("playerForm").style.display = "block";
    document.getElementById("gameContainer").style.display = "none";
}

function submitNewBets(event) {
    event.preventDefault();
    const form = document.getElementById("playerForm");
    const formData = new FormData(form);

    for (let i = 0; i < playerData.length; i++) {
        const newBet = parseInt(formData.get(`bet${i}`));
        if (newBet) {
            playerData[i].hands[0].bet = newBet; // Update the bet for the first hand
        }
    }

    console.log("Players with new bets:", playerData);

    document.getElementById("playerForm").style.display = "none";
    document.getElementById("gameContainer").style.display = "block";
    initializeGame();
}


function initializeGame() {
    document.getElementById("gameDisplay").innerHTML = ""; // Clear previous game log
    dealInitialCards();
    
    // Debug: Log player data to console
    console.log("Player data after deal:", playerData);
    
    // After dealing initial cards, ensure all player hands are updated in the display
    // This is now handled within dealInitialCards's delayed process
    // for (let i = 0; i < playerData.length; i++) {
    //   updatePlayerDisplay(i);
    // }
    
    // Starting the turn is also handled after dealing completes
    // setTimeout(() => {
    //     startPlayerTurn(0, 0);
    // }, 100);
}