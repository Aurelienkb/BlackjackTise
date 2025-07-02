function startGame() {
    const count = parseInt(document.getElementById("playerCount").value);
    if (isNaN(count) || count < 1 || count > 10) {
      alert("Please enter a number of players between 1 and 10.");
      return;
    }
  
    alert(`Starting a Blackjack game with ${count} player${count > 1 ? 's' : ''} for sips! 🥂`);
  
    // You can now build the game logic here!
  }
  