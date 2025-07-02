let players = [];

function startGame() {
  const count = parseInt(document.getElementById('player-count').value);
  players = [];
  for (let i = 0; i < count; i++) {
    players.push({
      name: `Player ${i + 1}`,
      money: 1000,
      bet: 0,
      hand: [],
    });
  }

  showScreen('betting-screen');
  renderBets();
}

function renderBets() {
  const area = document.getElementById('betting-area');
  area.innerHTML = '';
  players.forEach((player, index) => {
    const div = document.createElement('div');
    div.className = 'player-bet';
    div.innerHTML = `
      ${player.name} (💰 ${player.money}): 
      <input type="number" id="bet-${index}" min="1" max="${player.money}" value="100" />
    `;
    area.appendChild(div);
  });
}

function beginRound() {
  players.forEach((player, index) => {
    const bet = parseInt(document.getElementById(`bet-${index}`).value);
    player.bet = bet;
    player.money -= bet;
    player.hand = []; // future: deal cards
  });

  showScreen('game-screen');
  renderTable();
}

function renderTable() {
  const area = document.getElementById('table-area');
  area.innerHTML = '';
  players.forEach(player => {
    const div = document.createElement('div');
    div.innerHTML = `
      <strong>${player.name}</strong><br/>
      Bet: ${player.bet} | Money left: ${player.money}<br/>
      Cards: (to be implemented)
    `;
    area.appendChild(div);
  });
}

function resetGame() {
  showScreen('setup-screen');
}

function showScreen(id) {
  ['setup-screen', 'betting-screen', 'game-screen'].forEach(screen => {
    document.getElementById(screen).classList.add('hidden');
  });
  document.getElementById(id).classList.remove('hidden');
}
