var ResourceLoader = require('./ResourceLoader.js'),
    keyboardControl = require('./keyboardControl.js'),
    Constructors = require('./Constructors'),
    PubSub = require('./PubSub'),
    UIController = require('./UIController'),
    Algorithms = require('./Algorithms'),
    mainCanvas = document.getElementById('bgCanvas'),
    mainContext = mainCanvas.getContext('2d')
    mouse = {x: 200, y:200},
    centerX = mainCanvas.width / 2,
    centerY = mainCanvas.height / 2,
    FRAME_RATE = 1000/60,
    
    state = {
        INIT : -1,
        LOADING: 0,
        STORY_LINE : 1,
	    TITLE_SCREEN : 2,
        GAME_PLAY : 3,
        LEVEL_TRANSITION : 4,
        BEAT_GAME : 5,
        GAME_OVER : 6,
        CREDITS : 7,
        HOW_TO_PLAY : 8,
        PAUSED : 9,
        SHIP_JUMP : 10,
        SET_UP_LEVEL: 11,

        CURRENT : -1 
    },
    
    stateHandlers = {},
    
    loopOn = false;  

    var totalEnemies = 8,
        totalRocks = 10,
        levelRocks = 5,
        levelEnemies = 8,
        levelPerks = 4,
        enemiesKilled = 0
        currentScore = 0,
        shipLives = 4,
        rocksDestroyed = 0,
        currentLevel = 0,
        lastLevel = 14;

	//TEMP: player instance and enemies
    var playerShip,
	    alienMothership,
        humanMothership,
	    background;

     //pools holding enemies and rocks
    var enemyShipsPool,
        humanShipsPool,
        perksPool,
        meteorPool;   


function init(){
        
        var self = this;
    
        attachStateHandlers();
    
        playerShip = new Constructors.Ship();
	    alienMothership = new Constructors.Mothership();
        humanMothership = new Constructors.Mothership();
	    background = new Constructors.Background();

     //pools holding enemies and rocks
        enemyShipsPool = new Constructors.Pool(totalEnemies);
        humanShipsPool = new Constructors.Pool(10);
        perksPool = new Constructors.Pool(10);
        meteorPool = new Constructors.Pool(totalRocks);   

        background.setCanvas(mainCanvas);
		background.init(1000, 480);
		background.velX = 1;
        
        perksPool.init("perks");
        meteorPool.init("rocks");
        enemyShipsPool.init('enemy');
        
        alienMothership.setCanvas(mainCanvas);
        alienMothership.init('alien');

        playerShip.setCanvas(mainCanvas);
        playerShip.init(23, 23);
        playerShip.spawn(centerX, centerY);
        
        window.addEventListener('mousemove', onMouseMove, false);
        
        //add game control for desktop based on keyboard events
        keyboardControl.init(playerShip);
    
        
        //sign up for subscriptions
        var subID1 = PubSub.subscribe('statechange', handleStateChange.bind(self));
        var subID2 = PubSub.subscribe('meteor_explosion', handleMeteorExplosion.bind(self));
        var subID3 = PubSub.subscribe('collision', recordCollision.bind(self));
    
    
}


function onMouseMove(e){
    
    
    
    
}


//function in charged of setting up the enemies and rocks in the new level given the current level
function handleSetUpLevel(){
    
        
        
        console.log('Set Up Level function CALLED');
        
        //sets up random location for rocks and mothership
            var randomX, randomY;
        
        //increases level by 1
        currentLevel += 1;
        
        //checks if game is over
        if(currentLevel > lastLevel){
            userBeatGame = true;
            PubSub.publish('statechange', {from: state.CURRENT, to: state.GAME_OVER});
            return;
        }
           
        if(currentLevel == lastLevel){
            ResourceLoader.assets.finalLevelSound.play();
        }else{
            //begins normal soundtrack 
		   ResourceLoader.assets.soundTrack.play();
        }
		
        //resets enemy killed and rocks destroyed counter and ship lives
        enemiesKilled = 0;
        rocksDestroyed = 0;
    
        if(currentLevel == 1){
            shipLives = 4;
        }
        //sets up number of rocks and enemies that will be displayed
        levelEnemies = currentLevel+1;
        levelRocks = currentLevel+2;
        
        //checks to see if the level rocks and enemies exceed total in pool.
        levelEnemies = (levelEnemies>=totalEnemies)? totalEnemies : levelEnemies;
        levelRocks = (levelRocks>=totalRocks)? totalRocks : levelRocks;
        
        //centers ship and hide all of its missiles
        playerShip.spawn(centerX, centerY);
        
        //kill off any alive rocks and enemies
        perksPool.hideItems();
        enemyShipsPool.hideItems();
        meteorPool.hideItems();
        
        //inits the rocks
        for(var i=0; i<levelRocks; i++){
            randomX = Math.floor(Math.random()*(mainCanvas.width-50)),
            randomY = Math.floor(Math.random()*(mainCanvas.height-50));
            meteorPool.get(randomX, randomY, "largeRock");
            meteorPool.get(randomX, randomY, "smallRock");
        }
        
        for(var h=0; h<levelPerks; h++){
            randomX = Math.floor(Math.random()*(mainCanvas.width-50)),
            randomY = Math.floor(Math.random()*(mainCanvas.height-50));
            perksPool.get(randomX, randomY, "life");
            perksPool.get(randomY, randomX, "shield");
        }
    
        //alienMothership.init("alien");
        alienMothership.spawn(randomX, randomY);
        alienMothership.shield.active = true;
        alienMothership.setRelease(enemyShipsPool, levelEnemies, 8000);
        
        //updateCounter('level');
        //updateCounter('life');
        //updateCounter('score');
        
        PubSub.publish('statechange', {from: state.SET_UP_LEVEL, to: state.GAME_PLAY});
    
}

function attachStateHandlers(){
    
    stateHandlers[state.LOADING] = handleLoading;
    stateHandlers[state.STORY_LINE] = handleStoryLine;
    stateHandlers[state.TITLE_SCREEN] = handleTitleScreen;
    stateHandlers[state.SET_UP_LEVEL] = handleSetUpLevel;
    stateHandlers[state.GAME_PLAY] = handleGamePlay;
    stateHandlers[state.SHIP_JUMP] = handleShipJump;
    stateHandlers[state.LEVEL_TRANSITION] = handleLevelTransition;
    stateHandlers[state.BEAT_GAME] = handleBeatGame;
    stateHandlers[state.GAME_OVER] = handleGameOver;
    stateHandlers[state.CREDITS] = handleCredits;
    stateHandlers[state.HOW_TO_PLAY] = handleHowToPlay;
    stateHandlers[state.PAUSED] = handlePause;
        
}

function handleLoading(){
    //do nothing   
}

function handleStoryLine(){

    if(!loopOn){
     
        loopOn = true;
        gameLoop();
        
    }
    
    background.draw();
    
}

function handleTitleScreen(){
    
    if(!loopOn){
        
        loopOn = true;
        gameLoop();
        
    }
    
    background.draw();
    mainContext.drawImage(ResourceLoader.assets.earthSprite, (mainCanvas.width/2-(ResourceLoader.assets.earthSprite.width/2)), 0);
        
        for(var i=0; i<7; i++){
            var currentEnemy = enemyShipsPool.pool[i];
            currentEnemy.draw();
            currentEnemy.follow(mouse);
            Algorithms.checkBoundary(currentEnemy);
        }
    
}

function handleGamePlay(){
    
    if(!loopOn){
        
        ResourceLoader.assets.soundTrack.play();
        loopOn = true;
        gameLoop();
           
    }
    
     background.draw();

        if(alienMothership.alive){
            alienMothership.draw();
            Algorithms.checkBoundary(alienMothership);
            alienMothership.follow(playerShip);
            alienMothership.attack(playerShip);
            alienMothership.missiles.isCollidingWith(playerShip, playerShip.shield);
            playerShip.missiles.isCollidingWith(alienMothership, alienMothership.shield);
        }

            for(var m=0; m<perksPool.pool.length; m++){
                    var currentPerk = perksPool.pool[m];
                    if(currentPerk.alive){
                        currentPerk.draw(); 
                        
                        if(Algorithms.hitTest(currentPerk, playerShip)){
                            console.log('DETECTION CONFIRMED!!');
                            console.log(currentPerk);
                            console.log(playerShip);
                            currentPerk.destroy();
                            PubSub.publish('collision', currentPerk.type);
                        }
                    }
                }
        
        for(var i = 0; i<meteorPool.pool.length; i++){
           
            var currentMeteor = meteorPool.pool[i];
            
            if(currentMeteor.alive){
                currentMeteor.draw();
                Algorithms.checkBoundary(currentMeteor);
                playerShip.missiles.isCollidingWith(currentMeteor);
            }
        }
        
        meteorPool.isCollidingWith(playerShip, playerShip.shield);
        
        for(var h = 0; h<enemyShipsPool.pool.length; h++){
            
            var currentEnemy = enemyShipsPool.pool[h];
            
            if(currentEnemy.alive){
                
                currentEnemy.draw();
                Algorithms.checkBoundary(currentEnemy);
                currentEnemy.follow(playerShip);
                currentEnemy.attack(playerShip);
                currentEnemy.missiles.isCollidingWith(playerShip, playerShip.shield, meteorPool.pool);
                playerShip.missiles.isCollidingWith(currentEnemy, currentEnemy.shield);
                
                if(Algorithms.hitTest(currentEnemy, playerShip)){
                    
                    currentEnemy.destroy();
                    playerShip.destroy();
                    PubSub.publish('collision', currentEnemy.type);
                    PubSub.publish('collision', playerShip.type);
                    
                }
                
            }
            
        }
    
        //check frames
		
        if(playerShip.alive){
			keyboardControl.update();
            Algorithms.checkBoundary(playerShip);
            playerShip.draw();
        }
        
        
        if(shipLives <= 0 && !playerShip.colliding && state.CURRENT == state.GAME_PLAY){
            
                    if(currentLevel == lastLevel){
						ResourceLoader.assets.finalLevelSound.stop();
					}else{
						ResourceLoader.assets.soundTrack.stop(); 
					}
            
                currentLevel = 0;
            
        }else if(levelEnemies <= 0 && !playerShip.colliding && playerShip.alive && state.CURRENT == state.GAME_PLAY){
            
                    if(currentLevel == lastLevel){
						ResourceLoader.assets.finalLevelSound.stop();
					}else{
						ResourceLoader.assets.soundTrack.stop(); 
					}
            
            playerShip.angle = playerShip.velY = playerShip.velX = 0;
            playerShip.velX = 1;
            
            
            PubSub.publish('statechange', {from: state.GAME_PLAY, to: state.SHIP_JUMP});

        }
    
}

function handleLevelTransition(){
    
    if(loopOn){
     
        loopOn = false;
        gameLoop();

    }
        
    //reportEnemiesKilled.innerHTML = "Enemies Killed: "+enemiesKilled;
    //reportRocksDestroyed.innerHTML = "Asteroids Destroyed: "+rocksDestroyed;
    //reportScore.innerHTML = "Score: "+currentScore;
    
}

function handleMeteorExplosion(event, meteor){
    
    
            switch(meteor.size){
                case "large":
                meteorPool.get(meteor.x, meteor.y, "mediumRock");
                meteorPool.get(meteor.x, meteor.y, "mediumRock");
                    break;
                case "medium":
                meteorPool.get(meteor.x, meteor.y, "smallRock");
                meteorPool.get(meteor.x, meteor.y, "smallRock");
                    break;
                case "small":
                    //no rocks
                    break;     
            } 
    
}

function handleShipJump(){
    
    if(!loopOn){
        
        loopOn = true;
        gameLoop();
        
    }
    
    
    //draw background
        background.draw();
        
        //drawRemaining rocks
        for(var k=0; k<meteorPool.pool.length; k++){
            var currentRock = meteorPool.pool[k];
            
            //if rock alive draw it
            if(currentRock.alive){
                Algorithms.checkBoundary(currentRock);
                currentRock.draw();
            }
        }
        
        enemyShipsPool.pool.forEach(function(enemy){
            if(enemy.alive){
                enemy.draw();
            }
        });
        
        playerShip.velX += playerShip.velX*playerShip.easeValue;
        playerShip.draw();
        
        
        if(playerShip.x >= 1020-playerShip.width){ 
            
            PubSub.publish('statechange', {from: state.SHIP_JUMP, to: state.LEVEL_TRANSITION});
            
        }
    
}

function handlePause(){
 
    ResourceLoader.assets.soundTrack.pause();
    ResourceLoader.assets.finaLevelSound.pause();
    loopOn = false;
    gameLoop();
    
}

function handleBeatGame(){
    
        if(loopOn){
            
            loopOn = false;
            gameLoop();
            
        }
		
        //outputs the final score to the winner gamer :)
        //ResourceLoader.finalLevelSound.stop();       
        //beatGameScore.innerHTML = "Your Score: "+currentScore;
        userBeatGame = false;
                
        ResourceLoader.assets.victorySound.play();
        
        //resets that score
        currentScore = 0;
        currentLevel = 0;
       
}

function handleGameOver(){
    
        if(loopOn){
         
            loopOn = false;
            gameLoop();
            
        }
        
        //checks to see which sound to stop playing given the level the user was before dying
		ResourceLoader.assets.gameOverSound.play();
        
        //resets the score and level
        currentLevel = 0;
        currentScore = 0;
    
}

function recordCollision(event, objectType){
    
        switch(objectType){
            case "largeRock":
                currentScore += 20;
                UIController.updateCounter('score', currentScore);
                rocksDestroyed++;
                break;
                
            case "mediumRock":
                currentScore += 10;
                UIController.updateCounter('score', currentScore);
                rocksDestroyed++;
                break;
                
            case "smallRock":
                currentScore += 5;
                UIController.updateCounter('score', currentScore);
                rocksDestroyed++;
                break;
                
            case "humanShip":
                shipLives--;
                currentScore -= 50;
                UIController.updateCounter('score', currentScore);
                UIController.updateCounter('lives', shipLives);
                break;
                
            case "enemy":
                currentScore += 50;
                UIController.updateCounter('score', currentScore);
                levelEnemies--;
                enemiesKilled++;
                break;
                
            case "life":
                shipLives++;
                UIController.updateCounter('lives', shipLives);
                break;
                
            case "shield":
                playerShip.shield.reset();
                break;
            case "cash":
                break;
        }
        
}

function handleCredits(){
    
    
    
}

function handleHowToPlay(){
    
    
    
}

function handleStateChange(event, data){
    
    state.CURRENT = data.to;
    
    runState(data.to);
    
    
}

function runState(state){
    
     stateHandlers[state]();
    
}
    
function gameLoop(){
    
    if(loopOn){
        
			requestAnimFrame(gameLoop, FRAME_RATE);
			runState(state.CURRENT);
        
		}
}

module.exports = {
    
    init : init
    
};