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
  const numDecks = 6; // Play with 6 decks

  for (let i = 0; i < numDecks; i++) {
    for (let suit of suits) {
      for (let rank of ranks) {
        deck.push({ rank, suit });
      }
    }
  }
  
  // Shuffle the combined deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  console.log(`Deck created with ${deck.length} cards (simulating ${numDecks} decks).`);
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
        // MODIFIED: Pass the explicit player and hand index for animation
        updatePlayerDisplay(dealPlayerIndex, { playerIdx: dealPlayerIndex, handIdx: 0 }); 

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
        updateDealerHandDisplay(false, true, 'first'); 
        gameDisplay.innerHTML += `<p>Dealing first card to Dealer...</p>`;
        gameDisplay.scrollTop = gameDisplay.scrollHeight;

        // Deal dealer's second card (hidden)
        setTimeout(() => {
            const card2 = deck.pop();
            playerData.dealerHand.push(card2);
            playerData.dealerScore = calculateHandValue(playerData.dealerHand);
            // MODIFIED: Do not animate the hidden second card for the dealer
            updateDealerHandDisplay(false, false); 
            gameDisplay.innerHTML += `<p>Dealing second card to Dealer (hidden)...</p>`;
            gameDisplay.scrollTop = gameDisplay.scrollHeight;

            // Finalize initial deal
            gameDisplay.innerHTML += "<h2>Initial Deal Complete!</h2>";
            gameDisplay.scrollTop = gameDisplay.scrollHeight;

            // Check for initial blackjacks and then start player turns
            setTimeout(() => {
                let dealerHasBlackjack = (playerData.dealerHand.length === 2 && playerData.dealerScore === 21);
                let anyPlayerHasBlackjack = false;

                for (let player of playerData) {
                    if (player.hands[0].score === 21 && player.hands[0].hand.length === 2) { // Check for actual Blackjack
                        player.hands[0].isBlackjack = true;
                        gameDisplay.innerHTML += `<p><strong>${player.name}'s Hand 1 has Blackjack!</strong></p>`;
                        anyPlayerHasBlackjack = true;
                    }
                }

                if (dealerHasBlackjack) {
                    gameDisplay.innerHTML += `<p><strong>Dealer has Blackjack!</strong></p>`;
                    updateDealerHandDisplay(true); // Reveal dealer's hand immediately
                    // ADDED: Delay before determining winners to allow user to see revealed hand
                    setTimeout(() => {
                        determineWinners();
                    }, 2000); // 2-second delay
                } else if (anyPlayerHasBlackjack) {
                    determineWinners(); // Go straight to results if there's an immediate player Blackjack
                }
                else {
                    startPlayerTurn(0, 0); // Start with the first player's first hand if no initial blackjacks
                }
            }, 500); // Small delay before determining blackjacks or starting turns
        }, 1500); // 1.5 second delay for dealer's second card
    }, 1500); // 1.5 second delay for dealer's first card
  }

  // Start the delayed dealing process for players
  dealPlayerCardWithDelay();
}

// MODIFIED: updatePlayerDisplay to take animateCardConfig for precise animation control
function updatePlayerDisplay(playerIndexToUpdate, animateCardConfig = null) { 
    const player = playerData[playerIndexToUpdate];
    let playerContainerDiv = document.getElementById(`player-${playerIndexToUpdate}-hand-container`);

    if (!playerContainerDiv) {
        playerContainerDiv = document.createElement('div');
        playerContainerDiv.id = `player-${playerIndexToUpdate}-hand-container`;
        document.getElementById("handsDisplay").appendChild(playerContainerDiv);
    }

    let playerHandsHTML = `<h2>${player.name}'s Hands (Total Sips: ${player.sips})</h2>`;

    player.hands.forEach((hand, handIdx) => {
        const cardsHTML = hand.hand.map(card => createCardHTML(card)).join('');
        const isCurrentHand = (playerIndexToUpdate === currentPlayerIndex && handIdx === currentHandIndex);
        const handStatus = hand.isBust ? 'BUST!' : hand.hasStood ? 'STOOD' : hand.isBlackjack ? 'BLACKJACK!' : '';
        const handScoreDisplay = hand.score > 0 ? `(Score: ${hand.score})` : '';

        // Construct the HTML for the hand
        playerHandsHTML += `
            <div id="player-${playerIndexToUpdate}-hand-${handIdx}-display" class="player-hand-container" style="${isCurrentHand ? 'border-color: #d4af37; box-shadow: 0 0 15px #d4af37;' : ''}">
                <h3 style="${isCurrentHand ? 'color: #d4af37; text-shadow: 0 0 10px #d4af37;' : ''}">Hand ${handIdx + 1} ${handScoreDisplay} (Bet: ${hand.bet}) ${handStatus}</h3>
                <div class="cards-container">${cardsHTML}</div>
            </div>
        `;
    });

    playerContainerDiv.innerHTML = playerHandsHTML; // Set innerHTML once after building all hands

    // Animate only the specified card, if requested
    if (animateCardConfig &&
        animateCardConfig.playerIdx === playerIndexToUpdate &&
        player.hands.length > animateCardConfig.handIdx) {

        const targetHandDisplay = document.getElementById(`player-${animateCardConfig.playerIdx}-hand-${animateCardConfig.handIdx}-display`);
        if (targetHandDisplay) {
            const cardsInTargetHand = targetHandDisplay.querySelectorAll('.card');
            // The card to animate is always the last card in the hand's DOM structure
            if (cardsInTargetHand.length > 0) {
                const lastCard = cardsInTargetHand[cardsInTargetHand.length - 1];
                lastCard.classList.remove('new-card-dealt');
                void lastCard.offsetWidth; // Trigger reflow
                lastCard.classList.add('new-card-dealt');
            }
        }
    }
}


function updateDealerHandDisplay(revealAll = false, animateNewCard = false, cardDealtType = '') { 
  let dealerHandDiv = document.getElementById("dealer-hand-display");
  if (dealerHandDiv) {
    let cardsHTML;
    const currentHandLength = playerData.dealerHand.length;

    if (revealAll) {
      cardsHTML = playerData.dealerHand.map(card => createCardHTML(card)).join('');
      dealerHandDiv.innerHTML = `
        <h3>Dealer's Hand (Score: ${playerData.dealerScore})</h3>
        <div class="cards-container">${cardsHTML}</div>
      `;
    } else {
      let displayedCards = [];
      if (currentHandLength > 0) {
          displayedCards.push(createCardHTML(playerData.dealerHand[0])); // Dealer's first card always visible
          // Only add a hidden card placeholder if there's a second card in the actual hand
          if (currentHandLength >= 1) { 
              displayedCards.push(createHiddenCardHTML()); 
          }
      }
      cardsHTML = displayedCards.join('');

      dealerHandDiv.innerHTML = `
        <h3>Dealer's Hand</h3>
        <div class="cards-container">${cardsHTML}</div>
      `;
    }
    
    if (animateNewCard) {
        let cardToAnimate = null;

        if (revealAll) { // When dealer's full hand is revealed (and new cards are added during hits)
            const allVisibleCards = dealerHandDiv.querySelectorAll('.card');
            if (allVisibleCards.length > 0) {
                cardToAnimate = allVisibleCards[allVisibleCards.length - 1]; // Animate the last visible card
            }
        } else { // During initial deal (first card visible, second hidden)
            if (cardDealtType === 'first') {
                // Animate the first card (which is visible)
                cardToAnimate = dealerHandDiv.querySelector('.card:not(.hidden)');
            } else if (cardDealtType === 'second') {
                // Animate the hidden card (which is the second one in the DOM, after the first visible)
                const allCards = dealerHandDiv.querySelectorAll('.card');
                if (allCards.length >= 2) { // Ensure both first and hidden cards are present
                    cardToAnimate = allCards[1]; // The hidden card is always the second element
                }
            }
        }

        if (cardToAnimate) {
            cardToAnimate.classList.remove('new-card-dealt'); 
            void cardToAnimate.offsetWidth; // Trigger reflow
            cardToAnimate.classList.add('new-card-dealt');
        }
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
  
  // Call updatePlayerDisplay for the current player to highlight the active hand (no animation here)
  updatePlayerDisplay(currentPlayerIndex);
  // Also update all other players' displays to ensure consistent view (no animation here)
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

  // MODIFIED: Pass config for animation
  updatePlayerDisplay(currentPlayerIndex, { playerIdx: currentPlayerIndex, handIdx: currentHandIndex }); 

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
        gameDisplay.innerHTML += `<p style="color:red;">You can only double down on your initial two cards!</p>`;
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

    // MODIFIED: Pass config for animation
    updatePlayerDisplay(currentPlayerIndex, { playerIdx: currentPlayerIndex, handIdx: currentHandIndex }); 

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
    gameDisplay.innerHTML += `<p><strong>${currentPlayer.name} splits Hand ${currentHandIndex + 1}! Two new hands created, each with a bet of ${originalBet}.</strong></p>`;
    gameDisplay.scrollTop = gameDisplay.scrollHeight;

    // Animate the new card dealt to the first split hand
    updatePlayerDisplay(currentPlayerIndex, { playerIdx: currentPlayerIndex, handIdx: currentHandIndex });
    
    // Animate the new card dealt to the second split hand with a slight delay
    setTimeout(() => {
        updatePlayerDisplay(currentPlayerIndex, { playerIdx: currentPlayerIndex, handIdx: currentHandIndex + 1 });
    }, 100); 

    // Since the current hand has changed and a new one was inserted,
    // we need to ensure the turn continues for the *first* of the split hands.
    startPlayerTurn(currentPlayerIndex, currentHandIndex);
}


function dealerTurn() {
  let gameDisplay = document.getElementById("gameDisplay");
  let playerActionsDiv = document.getElementById("playerActions");
  playerActionsDiv.innerHTML = ""; // Clear player action buttons

  gameDisplay.innerHTML += "<h2>Dealer's Turn:</h2>";
  gameDisplay.scrollTop = gameDisplay.scrollHeight;

  updateDealerHandDisplay(true); // Reveal dealer's hidden card (no animation, just revealing)
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
        updateDealerHandDisplay(true, true); // Animate the new card

        if (playerData.dealerScore > 21) {
          gameDisplay.innerHTML += `<p><strong>Dealer busts with a score of ${playerData.dealerScore}!</strong></p>`;
          gameDisplay.scrollTop = gameDisplay.scrollHeight;
          determineWinners();
        } else if (playerData.dealerScore >= 17) {
          gameDisplay.innerHTML += `<p><strong>Dealer stands with a score of ${playerData.dealerScore}.</strong></p>`;
          gameDisplay.scrollTop = gameDisplay.scrollHeight;
          determineWinners();
        } else {
          dealerHitsWithDelay(); // Dealer hits again if score is still < 17
        }
      }, 2000); // 2 second delay for each dealer hit
    } else {
      gameDisplay.innerHTML += `<p><strong>Dealer stands with a score of ${playerData.dealerScore}.</strong></p>`;
      gameDisplay.scrollTop = gameDisplay.scrollHeight;
      determineWinners();
    }
  }

  dealerHitsWithDelay();
}


function determineWinners() {
  let gameDisplay = document.getElementById("gameDisplay");
  gameDisplay.innerHTML += "<h2>--- Round Results ---</h2>";
  gameDisplay.scrollTop = gameDisplay.scrollHeight;

  const dealerScore = playerData.dealerScore;
  const dealerBust = dealerScore > 21;

  for (let i = 0; i < playerData.length; i++) {
    const player = playerData[i];
    player.hands.forEach((hand, handIdx) => {
      let resultMessage = `${player.name}'s Hand ${handIdx + 1} (Score: ${hand.score}, Bet: ${hand.bet}): `;
      let sipsChange = 0;

      if (hand.isBust) {
        resultMessage += `Bust! Loses ${hand.bet} sips.`;
        sipsChange = -hand.bet;
      } else if (hand.isBlackjack) {
        if (dealerScore === 21 && playerData.dealerHand.length === 2) { // Dealer also has Blackjack
          resultMessage += `Push (Blackjack)! Returns ${hand.bet} sips.`;
          sipsChange = 0; // Bet is returned
        } else {
          // Blackjack pays 1.5 times the bet
          sipsChange = hand.bet * 1.5;
          resultMessage += `Blackjack! Wins ${sipsChange} sips.`;
        }
      } else if (dealerBust) {
        resultMessage += `Dealer busts! Wins ${hand.bet} sips.`;
        sipsChange = hand.bet;
      } else if (hand.score > dealerScore) {
        resultMessage += `Wins! Wins ${hand.bet} sips.`;
        sipsChange = hand.bet;
      } else if (hand.score < dealerScore) {
        resultMessage += `Loses! Loses ${hand.bet} sips.`;
        sipsChange = -hand.bet;
      } else { // Push
        resultMessage += `Push! Returns ${hand.bet} sips.`;
        sipsChange = 0; // Bet is returned
      }
      player.sips += sipsChange;
      gameDisplay.innerHTML += `<p>${resultMessage} (Current Sips: ${player.sips})</p>`;
      gameDisplay.scrollTop = gameDisplay.scrollHeight;
    });
  }

  gameDisplay.innerHTML += `<button onclick="askForNewBets()">Play Another Round</button>`;
  gameDisplay.scrollTop = gameDisplay.scrollHeight;
}

function askForNewBets() {
    const form = document.getElementById("playerForm");
    form.innerHTML = ''; // Clear any previous input

    playerData.forEach((player, i) => {
        form.innerHTML += `
            <div style="margin-bottom: 10px;">
                <label>${player.name}'s Current Sips: ${player.sips}</label><br />
                <label>Bet for next round:</label><br />
                <input type="number" name="bet${i}" min="1" required placeholder="Sips" value="${player.hands[0].bet}" />
            </div>
        `;
    });

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
            // Reset player hands and update bet for the new round
            playerData[i].hands = [{ hand: [], score: 0, bet: newBet, isBust: false, hasStood: false, isBlackjack: false }];
        }
    }

    // Reset dealer's hand
    playerData.dealerHand = [];
    playerData.dealerScore = 0;

    console.log("Players with new bets for next round:", playerData);

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
    // The dealInitialCards now handles initial display and animation.
    // This loop is for ensuring consistent state, but won't trigger new animations.
    for (let i = 0; i < playerData.length; i++) {
      updatePlayerDisplay(i); // Use the new updatePlayerDisplay
    }
    
    // Add a small delay to ensure DOM is updated before starting player turns
    // The startPlayerTurn is called within dealInitialCards
}

function resetGame() {
    document.getElementById("gameDisplay").innerHTML = "";
    document.getElementById("handsDisplay").innerHTML = ""; // Clear hands display
    document.getElementById("playerActions").innerHTML = "";

    playerData = []; // Clear all player data to start fresh
    playerData.dealerHand = [];
    playerData.dealerScore = 0;
    currentPlayerIndex = 0;
    currentHandIndex = 0; // Reset hand index too

    document.getElementById("setup").style.display = "block";
    document.getElementById("playerForm").style.display = "none"; // Hide form
    document.getElementById("gameContainer").style.display = "none";
}