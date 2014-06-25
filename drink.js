//====================================================
// Card class
//====================================================

function Card(suit, rank) {
  this.suit = suit;
  this.rank = rank;
}

Card.prototype = {
  constructor: Card,
  numSuits: 4,
  numRanks: 13,
  testKarma: function(number) {
    return number + 2;
  }
};

//====================================================
// Deck class
//====================================================

function Deck() {
  this.cards = [];
  var i = 0;
  for (var suit = 0; suit < Card.prototype.numSuits; suit++) {
    for (var rank = 0; rank < Card.prototype.numRanks; rank++) {
      this.cards[i] = new Card(suit, rank);
      i++;
    }
  }
}

Deck.prototype = {
  constructor: Deck,

  deal: function() {
    return this.cards.shift();
  },

  shuffle: function() {
    //Fisher Yates shuffle copied from http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
    for (var i = this.cards.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = this.cards[i];
        this.cards[i] = this.cards[j];
        this.cards[j] = temp;
    }
  },

  getLength: function() {
    return this.cards.length;
  }

};

//====================================================
// Hand class
//====================================================

function Hand() {
  this.cards = [];
}

Hand.prototype = {
  constructor: Hand,

  addCard: function(card) {
    this.cards.push(card);
  },

  removeCard: function(indexNum) {
    return this.cards.splice(indexNum, 1)[0]; //splice actually returns an array, so just get the card at the first index
  },

  getCardByIndex: function(index) {
    return this.cards[index];
  },

  getCardsOfRank: function(rankNum) {
    //checks if a card of the given rank is in the hand
    //returns an array of indices of matching cards
    var cardIndices = [];
    this.cards.forEach(function(card, index) {
      if (card.rank === rankNum) {
        cardIndices.push(index);
      }
    });
    return cardIndices;
  },

  getCardIndicesByRank: function() {
    //returns an array of all unique ranks found in the hand and the card indices of that rank
    //array keys are the ranks
    //array values are arrays of the matching card indices
    var cardIndicesByRank = [];
    this.cards.forEach(function(card, index) {
      if (cardIndicesByRank[card.rank] === undefined) {
        cardIndicesByRank[card.rank] = [index];
      } else {
        cardIndicesByRank[card.rank].push(index);
      }
    });
    return cardIndicesByRank;
  },

  getNumCards: function() {
    return this.cards.length;
  }

};

//====================================================
// Player class
//====================================================

function Player(number) {
  this.hand = new Hand();
  this.name = "Player";
  this.number = number;
}

Player.prototype = {
  constructor: Player,

  setName: function(str) {
    if (typeof str === "string") {
      this.name = str;
    }
  },

  makeGuess: function() {
    var randomCardIndex = Math.floor(Math.random() * (this.hand.getNumCards() - 1));
    return this.hand.getCardByIndex(randomCardIndex).rank;
  },

  drink: function(deck, cardRank) {
    if (deck.getLength === 0) return;
    var card;
    do {
      card = deck.deal();
      if (card === undefined) break; //there are no more cards in the deck
      this.hand.addCard(card);
    } while (card.rank !== cardRank);
  },

  checkDiscard: function() {
    //checks the player's hand for collections of 4 cards of identical rank and removes them if found

    /*
    var player = this; //for some reason, "this" does not persist inside the cardIndices loop
    var cardIndicesByRank = this.hand.getCardIndicesByRank();
    cardIndicesByRank.forEach(function(cardIndices) {
      if (cardIndices.length === 4) {
        var shift = 0;
        cardIndices.forEach(function(index) {
          player.hand.removeCard(index - shift);
          shift++;
        });
      }
    });
    */
    var player = this;
    for (var i = 0; i < Card.prototype.numRanks; i++) {
      var cardsOfRank = player.hand.getCardsOfRank(i);
      if (cardsOfRank !== undefined && cardsOfRank.length === 4) {
        var shift = 0;
        cardsOfRank.forEach(function(index) {
          player.hand.removeCard(index - shift);
          shift++;
        });
      }
    }
  }

};

//====================================================
// Game class
//====================================================

function Game() {
  this.NUM_PLAYERS = 2;
  this.STARTING_HAND_COUNT = 5;

  this.deck = new Deck();
  this.deck.shuffle();

  //create the players and populate their hands
  this.players = []; //the index in this array is the same as Player.number
  for (var i = 0; i < this.NUM_PLAYERS; i++) {
    var player = new Player(i);
    for (var j = 0; j < this.STARTING_HAND_COUNT; j++) {
      player.hand.addCard(this.deck.deal());
    }
    player.setName(i.toString());
    player.checkDiscard(); //there is a small possibility the player could be dealt a four card match
    this.players.push(player);
  }
}

Game.prototype = {
  constructor: Game,

  play: function() {
    var playerNum = this.chooseRandomPlayerNum();
    var winningPlayer = false;
    do {
      var currentPlayer = this.players[playerNum];
      //otherPlayer is the player that currentPlayer takes cards from
      var otherPlayerNum = this.getOtherPlayerNum(playerNum);
      var otherPlayer = this.players[otherPlayerNum];
      var guess = currentPlayer.makeGuess();
      var matchingCardIndices = otherPlayer.hand.getCardsOfRank(guess);

      if (matchingCardIndices.length > 0) {
        this.transferCards(currentPlayer, otherPlayer, matchingCardIndices);
      } else {
        currentPlayer.drink(this.deck, guess);
      }

      currentPlayer.checkDiscard();
      playerNum = otherPlayerNum;
      winningPlayer = this.findWinningPlayerNum([currentPlayer, otherPlayer]); //always check the currentPlayer first, in case they bottomed otherPlayer's hand
      //winningPlayer = true;
    } while (winningPlayer === false);

    this.gameOver(winningPlayer);
  },

  chooseRandomPlayerNum: function() {
    return Math.floor(Math.random() * this.NUM_PLAYERS);
  },

  transferCards: function(takingPlayer, givingPlayer, cardNumArray) {
    //give cards from one player to another
    //cardNumArray is filled with the card indices of givingPlayer's hand to take
    var shift = 0; //as cards are removed from givingPlayer's hand, we need to adjust the index to match the new length
    cardNumArray.forEach(function(cardNum) {
      var card = givingPlayer.hand.removeCard(cardNum - shift);
      takingPlayer.hand.addCard(card);
      shift++;
    });
  },

  getOtherPlayerNum: function(playerNum) {
    //get the number of the next player in order
    //if there are no more players, the next player is the first player (i.e. the 0th)
    if (playerNum < this.players.length - 1) {
      return playerNum + 1;
    } else {
      return 0;
    }
  },

  findWinningPlayerNum: function(playerArray) {
    //a player who empties their hand wins.
    //if the deck is emptied, the player with the smallest hand wins.
    //If a winner is found, return their number
    /*
    if (this.deck.getLength() === 0) {
      var winningPlayerNum;
      var smallestHandLength;
      this.players.forEach(function(player, playerNum) {
        if (smallestHandLength === undefined || player.hand.getNumCards() < smallestHandLength) {
          winningPlayerNum = playerNum;
          smallestHandLength = player.hand.getNumCards();
        }
      });
      return winningPlayerNum;
    } else { */
      var winningPlayerNum = false;

      for (var i = 0; i < playerArray.length; i++) {
        var handLength = playerArray[i].hand.getNumCards();
        if (handLength === 0) {
          winningPlayerNum = playerArray[i].number;
          break;
        }
      }

    //}
    return winningPlayerNum;
  },

  gameOver: function(winningPlayer) {
    console.log("Player " + this.players[winningPlayer].name + " is victorious!");
  }

};

//====================================================
// Game starts here
//====================================================

var game = new Game();
game.play();
