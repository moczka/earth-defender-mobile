window.addEventListener('load', onWindowLoad, false);

function onWindowLoad(){
	
		canvasApp();
	
}
	
//inis canvas app
function canvasApp(){
	
			//sets up game engine
		window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame   ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame    ||
			window.oRequestAnimationFrame      ||
			window.msRequestAnimationFrame     ||
			function(/* function */ callback, /* DOMElement */ element){
				window.setTimeout(callback, FRAME_RATE);
			};
})();
	
	//keyboard keycode constants
	const UP_ARROW = 38,
	LEFT_ARROW = 37,
	RIGHT_ARROW = 39,
	DOWN_ARROW = 40,
	SPACE_BAR = 32,
	LETTER_P = 80;
	
	//pc normal states
	const STATE_LOADING = 10,
    STATE_INIT = 20,
    STATE_STORY_LINE = 21,
	STATE_TITLE_SCREEN = 70,
    STATE_HOW_TO_PLAY = 80,
	STATE_PLAYING = 30,
    STATE_WAITING = 31,
    STATE_LEVEL_TRANSITION = 33,
    STATE_NEXT_LEVEL = 40,
	STATE_USER_BEAT_GAME = 50,
	STATE_GAME_OVER = 60,
    STATE_CREDITS = 70;
		var appState;
		var previousAppState;
	
	//orientation and mobile device states
	const STATE_ASPECT_RATIO = 0,
	STATE_ORIENTATION_CHANGE = 1,
	STATE_USER_AGENT = 4;
	
	//userAgent info and canvas control
	var userAgent = {mobile:false,platform:"", portrait:false};
	var canvasHolder = $('#canvasHolder');
    var preloadImage = $('#preload');
    var interfaceWrapper = $('#interfaceWrapper');
	var orientationMessageHolder = $('#orientationMessage');
	
	//frame, assets counter and audio support
	var frameRate = new FrameRateCounter();
	var supportedFormat = getSoundFormat();
	var maxVelocity = 4;
	var itemsToLoad = 15;
	var loadCount = 0;
	var FRAME_RATE = 1000/60;
	var loopOn = false;
	
	//set up sprites sheets & sounds
	var backgroundSprite = new Image(),
	    earthSprite = new Image(),
	    soundTrack,
        perkSprite = new Image(),
        finalLevelSound,
        perkSound,
        enemySpriteSheet = new Image(),
        MothershipSpriteSheet = new Image(),
	    playerSpriteSheet = new Image(),
        meteorLargeSpriteSheet = new Image(),
        meteorMediumSpriteSheet = new Image(),
        meteorSmallSpriteSheet = new Image();
    
    
	//mouse
	var mouse = {x:0,y:0, alive:true};
	
	//counters
	var scoreCounter = $('#scoreCounter');
	var levelCounter = $('#levelCounter');
	var livesCounter = $('#livesCounter');
	var frameRateCounter = $('#frameRate');
    var reportEnemiesKilled = $('#reportCarnage');
    var reportRocksDestroyed = $('#reportAsteroids');
    var reportScore = $('#reportScore');
    var beatGameScore = $('#beatGameScore');
	
	//title screen buttons 
	var startButton = $('#startGame');
    var howToPlayButton = $('#howToPlay');
	var restartButton = $('#restart');
    var storyLineButton = $('#storyLine');
    var creditsButton = $('#creditsButton');
    
	
	//game text div holders and controls
	var gameStartHolder = $('#gameStart');
	var gamePlayHolder = $('#gamePlay');
	var gameOverHolder = $('#gameOver');
    var howToPlayHolder = $('#howToPlayHolder');
    var storyLineHolder = $('#storyLineHolder');
    var levelTransitionHolder = $('#levelTransition');
    var creditsHolder = $('#credits');
    var beatGameHolder = $('#beatGame');
    
    var nextLevelButton = $('#nextLevel');
	var howToBackButton = $('#howToBack');
    var storyLineSkipButton = $('#skipStoryLine');
    var shareButton = $('#shareStart');
    var skipCredits = $('#skipCredits');
    
	//score  & level variables
	var currentScore = 0,
	    currentLevel = 0,
        lastLevel = 8,
        userBeatGame = false,
        enemyShipWorth = 10,
        rockWorth = 5,
	    shipLives = 4;
	
	//mobile acceleration
	var ax, ay;
	var friction = 0.005;
	
	//make custom classes inherit display class
	Ship.prototype = new Display(); 
	Missile.prototype = new Display();
	Enemy.prototype = new Display();
	Shield.prototype = new Display();
	Background.prototype = new Display();
    Rock.prototype = new Display();
    Mothership.prototype = new Display();
    Perk.prototype = new Display();
    
	//sounds API
    var meteorExplosionSound;
    var playerShootSound;
    var explosionSound;
    
    
    
	//gets canvas and its context and creates center x and y variables
	var mainCanvas = $('#bgCanvas');
	var mainContext = mainCanvas.getContext('2d');
	var centerX;
	var centerY;
    
	//array holding key presses
	var keyPressList = [];

	//TEMP: player instance and enemies
    var playerShip = new Ship();
	var alienMothership = new Mothership();
    var humanMothership = new Mothership();
	var background = new Background();
    var gameInterface = new Interface();
    
    var totalEnemies = 10,
        totalRocks = 8,
        levelRocks = 5,
        levelEnemies = 8,
        levelPerks = 4,
        enemiesKilled = 0,
        rocksDestroyed = 0;

     //pools holding enemies and rocks
    var enemyShipsPool = new Pool(totalEnemies),
        humanShipsPool = new Pool(10),
        perksPool = new Pool(10);
        meteorPool = new MeteorPool(totalRocks);
    
	
	appState = STATE_USER_AGENT;
	runState();
	
	function runState(){
		
	switch(appState){
			
		case STATE_USER_AGENT:
				getUserAgentInfo();
			break;
			
		case STATE_ASPECT_RATIO:
				setAspectRatio();
			break;
		case STATE_ORIENTATION_CHANGE:
				onOrientationChange();
			break;
		//normal states
		case STATE_INIT: 
			loadAssets();
			break;
		case STATE_LOADING:
			//wait for calls backs of load events
			break;
        case STATE_STORY_LINE:
            storyLine();
            break;
		case STATE_TITLE_SCREEN:
			introAnimation();
			break;
        case STATE_HOW_TO_PLAY:
            howToPlay();
            break;
		case STATE_PLAYING:
			drawCanvas();
			break;
        case STATE_LEVEL_TRANSITION:
            //the transition between one level and the other.
            transLevelAnimation();
            break;
        case STATE_NEXT_LEVEL:
            nextLevelDialog();
			break;
        case STATE_WAITING:
            //loop does nothing, waits for a change in state.
            break;
		case STATE_USER_BEAT_GAME:
            beatGame();
			break;
        case STATE_CREDITS:
            //sets to credits
            break;
		case STATE_GAME_OVER:
			gameOver();
			break;
		}
	}
	
	function gameLoop(){
		if(loopOn){
			requestAnimFrame(gameLoop, FRAME_RATE);
            //window.setTimeout(gameLoop, FRAME_RATE);
			runState();
		}
	}
	
	function getUserAgentInfo(){
		
		userAgent.platform = navigator.platform;
		
		if(userAgent.platform != "Win32" && userAgent.platform != "MacIntel"){
			userAgent.mobile = true;
			window.addEventListener('resize', onOrientationChange, false);
			if(window.innerHeight>= window.innerWidth){
				orientationMessageHolder.setAttribute('style', 'display:block;');
				canvasHolder.setAttribute('style', 'display:none;');
                interfaceWrapper.setAttribute('style','display:none;');
				userAgent.portrait = true;
			}
		}
		appState = STATE_ASPECT_RATIO;
		runState();
	}
	
	function setAspectRatio(){
		
		//if not on mobile, set the canvas ratio to 600 by 480
		if(!userAgent.mobile){
			mainCanvas.width = 600;
			mainCanvas.height = 480;
			centerX = mainCanvas.width/2;
	        centerY = mainCanvas.height/2;
		}else{
            centerX = mainCanvas.width/2;
	        centerY = mainCanvas.height/2;
			mainCanvas.setAttribute('style', 'width: 100%; height: 100%');
			document.addEventListener('touchmove', onTouchMove, false);
			interfaceWrapper.setAttribute('style', 'margin: auto;');
		}
		
		loopOn = true;
		appState = STATE_INIT;
		gameLoop();
		
	}
	
	function loadAssets(){
        
        //change app state
		appState = STATE_LOADING;
		
		background.setCanvas(mainCanvas);
        
		
		//sounds 5 sounds
		soundTrack = new Howl({
                    urls: ['assets/sounds/soundtrack.mp3','assets/sounds/soundtrack.wav'],
                    volume: 0.5,
                    loop: true,
                    onload: onAssetsLoad
                        });
        
        
        finalLevelSound = new Howl({
                     urls: ['assets/sounds/finalLevelSound.mp3','assets/sounds/finalLevelSound.wav'],
                     volume: 1,
                     loop: true,
                     onload: onAssetsLoad
                        });
        
        meteorExplosionSound = new Howl({
                                    urls: ['assets/sounds/meteorExplosion.mp3','assets/sounds/meteorExplosion.wav'],
                                    volume: 1,
                                    onload: onAssetsLoad
                                    });
        playerShootSound = new Howl({
                                    urls: ['assets/sounds/shoot.mp3','assets/sounds/shoot.wav'],
                                    volume: 0.3,
                                    onload: onAssetsLoad
                                    });
        explosionSound = new Howl({
                                    urls: ['assets/sounds/explosion.mp3','assets/sounds/explosion.wav'],
                                    volume: 0.2,
                                    onload: onAssetsLoad
                                    });
        perkSound = new Howl({
                    urls: ['assets/sounds/perk.mp3','assets/sounds/perk.wav'],
                    volume: 1.5,
                    onload: onAssetsLoad
                        });
        
        
        
		//sprites | images 9 images
		earthSprite.src = 'assets/sprites/earth.png';
		earthSprite.addEventListener('load', onAssetsLoad, false);
        playerSpriteSheet.src = 'assets/sprites/playerShip.png';
        playerSpriteSheet.addEventListener('load', onAssetsLoad, false);
        enemySpriteSheet.src = 'assets/sprites/enemyShips.png';
        enemySpriteSheet.addEventListener('load', onAssetsLoad, false);
        MothershipSpriteSheet.src = 'assets/sprites/motherships.png';
        MothershipSpriteSheet.addEventListener('load', onAssetsLoad, false);
		backgroundSprite.src = 'assets/sprites/background.png';
		backgroundSprite.addEventListener('load', onAssetsLoad, false);
        meteorLargeSpriteSheet.src = 'assets/sprites/meteorLarge.png';
        meteorLargeSpriteSheet.addEventListener('load', onAssetsLoad, false);
        meteorMediumSpriteSheet.src = 'assets/sprites/meteorMedium.png';
        meteorMediumSpriteSheet.addEventListener('load', onAssetsLoad, false);
        meteorSmallSpriteSheet.src = 'assets/sprites/meteorSmall.png';
        meteorSmallSpriteSheet.addEventListener('load', onAssetsLoad, false);
        perkSprite.src = 'assets/sprites/perks.png';
        perkSprite.addEventListener('load', onAssetsLoad, false);
        

        //hides preload image
        preloadImage.setAttribute('style', 'display:none;');
        
	}
	
	function onAssetsLoad(e){
        
        if(loadCount === itemsToLoad){
         return;   
        }
		
		var target = (e == undefined)? {} : e;
		loadCount++;
		
		//removes event listeners of loaded items
		if(target.tagName == "AUDIO"){
			target.removeEventListener('canplaythrough', onAssetsLoad, false);
		}else if(target.tagName == "IMG"){
			target.removeEventListener('load', onAssetsLoad, false);
		}

		console.log('The number of items that have loaded is '+ loadCount);
		
		//draws loading progress
		background.drawProgress(loadCount, itemsToLoad);
		if(loadCount === itemsToLoad){
			console.log('The number of items that should  have loaded are '+ itemsToLoad);
			background.clear();
			initAssets();
		}
	}
	
	function initAssets(){
        
        meteorPool.init();
          //init enemy pool
        
        //init perks
        
        perksPool.init("perks");
        
        enemyShipsPool.init('enemy');
        
		playerShip.setCanvas(mainCanvas);
		playerShip.init(centerX,centerY,23,23);
		background.init(0,0,1000, 480);
		background.velX = 1;
        playerShip.thrustAccel = 0.06;
        alienMothership.setCanvas(mainCanvas);
        
        window.addEventListener('mousemove', onMouseMove, false);
        gameInterface.addButtonListeners();
        
        
        if(userAgent.mobile){
			//add game controls for mobile devices based on motion
			window.addEventListener('touchend', onTouchEndHandler, false);
			window.addEventListener('devicemotion', devMotionHandler, false);
			//adds listener for touch move to remove the default behavior
			window.addEventListener('touchstart', onTouchStart, false);
			
		}else{
			//add game control for desktop based on keyboard events
		 	document.addEventListener('keyup', onKeyUp, false);
			document.addEventListener('keydown', onKeyDown, false);
		}
        
        gameInterface.display('storyLine');
		appState = STATE_STORY_LINE;
		
	}
    
    
    //function in charged of playing the story line
    function storyLine(){
        background.draw(); 
    }
	
	function introAnimation(){
		background.draw();
		mainContext.drawImage(earthSprite, (mainCanvas.width/2-(earthSprite.width/2)), 0);
        for(var i=0; i<7; i++){
            var currentEnemy = enemyShipsPool.pool[i];
            currentEnemy.draw();
            currentEnemy.follow(mouse);
            checkBoundary(currentEnemy);
        }
	}
    
    function howToPlay(){
        
    }
    
    //function in charged of setting up the enemies and rocks in the new level given the current level
    function setUpLevel(){
        
        console.log('Set Up Level function CALLED');
        
        
        //sets up random location for rocks and mothership
        var randomX;
        var randomY;
        
        //increases level by 1
        currentLevel += 1;
        
        //checks if game is over
        if(currentLevel > lastLevel){
            userBeatGame = true;
            return;
        }
           
        if(currentLevel == lastLevel){
            finalLevelSound.play();
        }else{
            //begins normal soundtrack 
		    soundTrack.play();
        }

        
        //resets enemy killed and rocks destroyed counter and ship lives
        enemiesKilled = 0;
        rocksDestroyed = 0;
        if(currentLevel == 1){
        shipLives = 4;
        }
        //sets up number of rocks and enemies that will be displayed
        levelEnemies = currentLevel+1;
        levelRocks = currentLevel+1;
        
        //checks to see if the level rocks and enemies exceed total in pool.
        levelEnemies = (levelEnemies>=totalEnemies)? totalEnemies : levelEnemies;
        levelRocks = (levelRocks>=totalRocks)? totalRocks : levelRocks;
        
        //centers ship and hide all of its missiles
        playerShip.spawn(centerX, centerY);
        
        //kill off any alive rocks and enemies
        enemyShipsPool.hideItems();
        meteorPool.hideItems();
        
        //inits the rocks
        for(var i=0; i<levelRocks; i++){
            randomX = Math.floor(Math.random()*(mainCanvas.width-50));
            randomY = Math.floor(Math.random()*(mainCanvas.height-50));
            meteorPool.getMeteor(randomX, randomY, "large");
        }
        
        for(var j=0; j<perksPool.pool.length; j++){
            perksPool.hideItems();
        }
        
        for(var h=0; h<levelPerks; h++){
            var randomPerk = Math.floor(Math.random()*perksPool.pool.length);
            perksPool.pool[randomPerk].alive = true;
        }
        
        alienMothership.init(0, 0, "alien");
        alienMothership.spawn(randomX, randomY);
        alienMothership.setRelease(levelEnemies, 8);
        
    }

	//once the user has clicked the start button, this function draws the game
	function drawCanvas(){
        
        //console.log('The draw screen function is being called');
        
        if(enemiesKilled == levelEnemies && !playerShip.colliding){
            if(currentLevel<lastLevel){
                soundTrack.stop();
            }else{
                finalLevelSound.stop();
            }
            gameInterface.hide('gamePlay');
            playerShip.angle = 0;
            playerShip.velY = 0;
            playerShip.velX = 0.2;
            appState = STATE_LEVEL_TRANSITION;
            return;
        }else if(shipLives < 0 && !playerShip.colliding){
            shipLives = 0;
            updateCounter('life');
            appState = STATE_GAME_OVER;
            return;
        }
        
		//draw background
		background.draw();
		
        //counts actual frames
		frameRate.countFrames();
        
        //hide debugging frame counter on final versions
		//frameRateCounter.innerHTML = "Frames: "+frameRate.lastFrameCount;
        frameRateCounter.innerHTML = "";
		
        //adds friction to player ship motion
		playerShip.velX -= playerShip.velX*friction;
		playerShip.velY -= playerShip.velY*friction;
        //draws player ship
		checkBoundary(playerShip);
		playerShip.draw();
        
        if(alienMothership.alive){
            alienMothership.draw();
        }
        
        
        if(!userAgent.mobile){
		keyControl(playerShip);
		}
        
        
        for(var i=0; i<levelEnemies; i++){
            var currentEnemy = enemyShipsPool.pool[i];
            
            if(currentEnemy.alive){
                checkBoundary(currentEnemy);
                currentEnemy.follow(playerShip);
                currentEnemy.attack(playerShip);
                currentEnemy.draw();
                
                if(!currentEnemy.colliding && hitTest(currentEnemy, playerShip) && !playerShip.colliding && !playerShip.velX == 0){
                    if(!playerShip.shieldActive){
                        currentScore += enemyShipWorth;
                        enemiesKilled++;
                        shipLives--;
                        playerShip.colliding = true;
                        currentEnemy.colliding = true;
                        explosionSound.play();
                        var randomPerk = Math.floor(Math.random()*perksPool.pool.length);
                        perksPool.pool[randomPerk].alive = true;
                    }else{
                        explosionSound.play();
                        currentEnemy.colliding = true;
                        currentScore += enemyShipWorth;
                        playerShip.shield.life -= 20;
                        enemiesKilled++;
                    }
                }
        
                for(var h=0; h<playerShip.missiles.length; h++){
                    var currentPlayerMissile = playerShip.missiles[h];
                    if(!currentEnemy.colliding && hitTest(currentPlayerMissile, currentEnemy) && currentPlayerMissile.alive ){
                       currentScore += enemyShipWorth;
                        enemiesKilled++;
                       explosionSound.play();
                       currentEnemy.colliding = true;
                       currentPlayerMissile.alive = false;
                    }
                }
                for(var j=0; j<currentEnemy.missiles.length; j++){
                    var currentEnemyMissile = currentEnemy.missiles[j];
                    if(currentEnemyMissile.alive && !playerShip.colliding && hitTest(currentEnemyMissile, playerShip) && !playerShip.shieldActive && !playerShip.velX == 0){
                        currentEnemyMissile.alive = false;
                        playerShip.colliding = true;
                        shipLives--;
                        var randomPerk = Math.floor(Math.random()*perksPool.pool.length);
                        perksPool.pool[randomPerk].alive = true;
                        explosionSound.play();
                    }else if(hitTest(currentEnemyMissile, playerShip.shield) && playerShip.shieldActive && currentEnemyMissile.alive){
                            currentEnemyMissile.alive = false;
                            playerShip.shield.life -= 10;
                            console.log('enemy missiled attacked sheld!!');
                    }
                    
                    for(var o=0; o<meteorPool.pool.length; o++){
                        var currentRock2 = meteorPool.pool[o];
                        if(currentRock2.alive){
                            if(hitTest(currentEnemyMissile, currentRock2) && !currentRock2.colliding && currentEnemyMissile.alive){
                                     meteorExplosionSound.play();
                                     currentRock2.colliding = true;
                                     currentEnemyMissile.alive = false;
                               }
                        }
                    }
                }
            }
        }
        
        for(var k=0; k<meteorPool.pool.length; k++){
            var currentRock = meteorPool.pool[k];
            
            if(currentRock.alive){
            
            checkBoundary(currentRock);
            currentRock.draw();
            
            if(hitTest(currentRock, playerShip) && !currentRock.colliding && !playerShip.colliding && !playerShip.shieldActive && !playerShip.velX == 0){
                meteorExplosionSound.play();
                currentRock.colliding = true;
                playerShip.colliding = true;
                shipLives--;
                rocksDestroyed++;
                currentScore += rockWorth;
                var randomPerk = Math.floor(Math.random()*perksPool.pool.length);
                perksPool.pool[randomPerk].alive = true;
            }
            for(var l=0; l<playerShip.missiles.length; l++){
                    var currentPlayerMissile2 = playerShip.missiles[l];
                    if(hitTest(currentPlayerMissile2, currentRock) && !currentRock.colliding && currentPlayerMissile2.alive){
                        currentPlayerMissile2.alive = false;
                       meteorExplosionSound.play();
                       currentRock.colliding = true;
                        currentScore += rockWorth;
                        rocksDestroyed++;
                    }
                } 
            }
        }
        
        
        for(var m=0; m<perksPool.pool.length; m++){
            var currentPerk = perksPool.pool[m];
            if(currentPerk.alive){
                currentPerk.draw(); 
                if(hitTest(playerShip, currentPerk) && !playerShip.shieldActive){
                    currentPerk.alive = false;
                    if(currentPerk.type == "life"){
                        shipLives++;   
                        perkSound.play();
                    }else{
                        playerShip.shield.reset();   
                        perkSound.play();
                    }
                }
                
            }
        }
        
			
        updateCounter('score');
        updateCounter('life');
        updateCounter('level');
		
	}
    
    //function in charged of transition level
    function nextLevelDialog(){
        appState = STATE_WAITING;
        
        reportEnemiesKilled.innerHTML = "Enemies Killed: "+enemiesKilled;
        reportRocksDestroyed.innerHTML = "Asteroids Destroyed: "+rocksDestroyed;
        reportScore.innerHTML = "Score: "+currentScore;
        
        gameInterface.hide('gamePlay');
        gameInterface.display('nextLevel');
        
    }
    
    function transLevelAnimation(){
        
        //draw background
        background.draw();
        
        //drawRemaining rocks
        for(var k=0; k<meteorPool.pool.length; k++){
            var currentRock = meteorPool.pool[k];
            
            //if rock alive draw it
            if(currentRock.alive){
            checkBoundary(currentRock);
            currentRock.draw();
            }
        }
        
        playerShip.velX += playerShip.velX*playerShip.easeValue;
        playerShip.draw();
        
        if(playerShip.x >= 1020-playerShip.width){
            appState = STATE_NEXT_LEVEL;   
        }
        
    }
    
    function beatGame(){
        appState = STATE_WAITING;
        
        //outputs the final score to the winner gamer :)
        finalLevelSound.stop();       
        beatGameScore.innerHTML = "Your Score: "+currentScore;
        userBeatGame = false;
        gameInterface.hide('gamePlay');
        gameInterface.display('beatGame'); 
        
        //resets that score
        currentScore = 0;
        currentLevel = 0;
        
    }

	//function in charged of ending the game
	function gameOver(){
        
        //changes the state to call code only once.
		appState = STATE_WAITING;
        
        //checks to see which sound to stop playing given the level the user was before dying.
        if(currentLevel == lastLevel){
            finalLevelSound.stop();
        }else{
            soundTrack.stop();
            
        }
        
        //resets the score and level
        currentLevel = 0;
        currentScore = 0;

        //displays the appropriate interface
        gameInterface.hide('gamePlay');
        gameInterface.display('gameOver');
        
	}
	
	
	//checks if an object has left the canvas bouding box
	function checkBoundary(object){

		if(object.x >= object.canvasWidth){
			object.x = 0;
		}else if(object.x <= -object.width){
			object.x = object.canvasWidth-object.width;
		}else if(object.y >= object.canvasHeight+object.height){
			object.y = 0;
		}else if(object.y <= -object.height){
			object.y = object.canvasHeight-object.height;
		}	
	}
	
	//collision detection.
	function hitTest(object1, object2){
   		var left1 = object1.x;
   		var left2 = object2.x;
   		var right1 = object1.x + object1.width;
   		var right2 = object2.x + object2.width;
   		var top1 = object1.y;
   		var top2 = object2.y;
   		var bottom1 = object1.y + object1.height;
   		var bottom2 = object2.y + object2.height;

   		if (bottom1 < top2) return(false);
   		if (top1 > bottom2) return(false);
   		if (right1 < left2) return(false);
   		if (left1 > right2) return(false);
   		return(true);
	}
	
	//checks if the shield has been hit
	function hitTestShield(object1, object2){
		var dx = object2.x - object1.x;
		var dy = object2.y - object1.y;
		var distance = Math.sqrt(dx*dx + dy*dy);
		
		if(distance<40){
			return (true);
		}else{
		
		return (false);
		}
		
	}
	
	//updates game board, scores, level etc..
	function updateCounter(object){
		switch(object){
			case "life":
				livesCounter.innerHTML = "Lives: "+shipLives;
				break;
			case "score":
				scoreCounter.innerHTML = "Score: "+currentScore;
				break;
			case "level":
				levelCounter.innerHTML = "Level: "+currentLevel;
				break;
		}
	}
	
	//PC CONTROLS 
	//handles the key presses on desktop
	function onKeyUp(e){
		e.preventDefault();
		keyPressList[e.keyCode] = false;
        
        //pauses the game
        if(keyPressList[LETTER_P] == false){
		keyPressList[LETTER_P] = true;
		if(appState == STATE_PLAYING){
            appState = STATE_WAITING;
            console.log('STATE CHANGED');
        }else{
            appState = STATE_PLAYING;
            runState();
            console.log(appState);
        }
	}
		
	}
	
	function onKeyDown(e){
		e.preventDefault();
		keyPressList[e.keyCode] = true; 
	}

	//key control if user is playing on desktop
	function keyControl(object){
	
	if(keyPressList[LEFT_ARROW]){
		object.angle -= 5*Math.PI/180;
	}else if(keyPressList[RIGHT_ARROW]){
		object.angle += 5*Math.PI/180;
	}
	if(keyPressList[UP_ARROW]){
		object.thrust = true;
		var faceX = Math.cos(object.angle);
		var faceY = Math.sin(object.angle);
		var newVelX = object.velX+faceX*object.thrustAccel;
		var newVelY = object.velY+faceY*object.thrustAccel;
		
		var futureVelocity = Math.sqrt((newVelX*newVelX)+(newVelY*newVelY));
		currentVelocity = Math.floor(futureVelocity*200);
		
		if(futureVelocity > 4){
			newVelX = object.velX;
			newVelY = object.velY;
			currentVelocity = 800;
		}
		
		object.velX = newVelX;
		object.velY = newVelY;	
		
	}else{
		object.thrust = false;
	}
	if(keyPressList[SPACE_BAR] == false){
		keyPressList[SPACE_BAR] = true;
        if(!object.shieldActive){
		object.shoot();
        }
		console.log(object.missiles.length);
	}
	if(keyPressList[DOWN_ARROW]){
       
		object.activateShield(true);
        
	}else if(keyPressList[DOWN_ARROW] == false){
		object.activateShield(false);
	}

	}
	
	//handles the mousemove interaction at title screen.
	function onMouseMove(event){
        
		if(appState != STATE_TITLE_SCREEN){
            return;
        }
        
		if ( event.layerX ||  event.layerX == 0) { // Firefox
   			mouse.x = event.layerX ;
    		mouse.y = event.layerY;
  		} else if (event.offsetX || event.offsetX == 0) { // Opera
    		mouse.x = event.offsetX;
    		mouse.y = event.offsetY;
  		}
		
	}
	
	//MOBILE CONTROLS
	//function that handles mobile controls of the game
	
	function devMotionHandler(e){
        
        if(appState != STATE_PLAYING){
            return;    
        }
        
		var futureVelX, futureVelY, futureVel;
		
		ax = (e.accelerationIncludingGravity.x)/8;
		ay = (e.accelerationIncludingGravity.y)/8;
		
		var landscapeOrientation = window.innerWidth/window.innerHeight > 1;
		if (landscapeOrientation) {
			futureVelX = playerShip.velX-ay;
			futureVelY = playerShip.velY-ax;
		} else {
			futureVelX = playerShip.velX+ax;
			futureVelY = playerShip.velY-ay;
		}
		
		futureVel = Math.sqrt(futureVelX*futureVelX+futureVelY*futureVelY);
		
		if(futureVel >= 3){
			futureVelX = playerShip.velX;   
		    futureVelY = playerShip.velY; 
		}
		
		playerShip.velX = futureVelX;
		playerShip.velY = futureVelY;	
		playerShip.angle = Math.atan2(playerShip.velY, playerShip.velX);
		
	}
	
	function onTouchStart(e){
		
        if(appState != STATE_PLAYING){
            return;   
        }
        
        //comparings the global touches active if more than one shield is activated.
		if(e.touches.length >= 2){
			//if more than one finger on screen. activate shield
			playerShip.activateShield(true);
		}
	}
	
	function onTouchEndHandler(e){
        
        if(appState != STATE_PLAYING){
            return;    
        }
        
        if(e.touches.length <= 1){
            playerShip.shoot();
		    playerShip.activateShield(false);
        }
	}
	
	//Checks for device orientation
	function onOrientationChange(e){

		if(window.innerHeight>= window.innerWidth){
			userAgent.portrait = true;
			orientationMessageHolder.setAttribute('style', 'display: block;');
			canvasHolder.setAttribute('style', 'display:none;');
            interfaceWrapper.setAttribute('style', 'display: none;');
		}else if(window.innerHeight<=window.innerWidth){
			orientationMessageHolder.setAttribute('style', '');
			canvasHolder.setAttribute('style', '');
            interfaceWrapper.setAttribute('style', '');
			userAgent.portrait = false;
		}
		
	}
	
	//removes the default behavior of pinching zoom on Mobile
	function onTouchMove(e){
		e.preventDefault();
	}
	
	//pauses the game via the pause button
	function onPauseButton(e){
		loopOn = !loopOn;
		gameLoop();
	}
	

	function getSoundFormat(){
		var sound = new Audio();
		var format;
		if(sound.canPlayType('audio/mp3') == "maybe" || sound.canPlayType('audio/mp3') == "probably"){
			format = ".mp3";
		}else if(sound.canPlayType('audio/wav') == "maybe" || sound.canPlayType('audio/wav') == "probably"){
			format = ".wav";
		}
		return format;
	}
	
	//FramRate Class
	
	function FrameRateCounter() {

   this.lastFrameCount = 0;
   var dateTemp = new Date();
   this.frameLast = dateTemp.getTime();
   delete dateTemp;
   this.frameCtr = 0;
}

FrameRateCounter.prototype.countFrames=function() {
   var dateTemp = new Date();
   this.frameCtr++;

   if (dateTemp.getTime() >=this.frameLast+1000) {
      //ConsoleLog.log("frame event");
      this.lastFrameCount = this.frameCtr;
      this.frameLast = dateTemp.getTime();
      this.frameCtr = 0;
   }

   delete dateTemp;
}
	
	//custom classes
   function Display(){
		this.context;
		this.canvasWidth;
		this.canvasHeight;
		this.centerX;
		this.centerY;
		this.height = 0;
		this.width = 0;
		this.x = 0;
		this.y = 0;
		this.color = "#00FF00";
		this.alpha = 1;
        this.velX = 0;
		this.velY = 0;
		this.angle = 0;  
        this.alive = false;  
        this.colliding = false;
		var self = this;
		this.setCanvas = function(canvas){
			self.context = canvas.getContext('2d');
			self.canvasWidth = canvas.width;
			self.canvasHeight = canvas.height;
		};
			//this init function is for all inanimate objects not.
		this.init = function(x,y, width, height){
			self.x = x;
			self.y = y;
			self.width = width || 20;
			self.height = height || 20;
			self.centerX = width/2;
			self.centerY = height/2;
			self.alive = true;
		};
        this.reset = function(){
			self.x = 0;
			self.y = 0;
			self.angle = 0;
			self.velX = 0;
			self.velY = 0;
			self.alive = false;
			self.colliding = false;
		};

	}
    
       function SpriteAnimation(){
        this.width;
        this.height;
        this.x;
        this.y;
        this.context;
        this.canvasHeight;
        this.canvasWidth;
        this.speed;
        this.numCol;
        this.numRow;
        this.currentFrame;
        this.finalFrame;
        this.startFrame;
        this.totalFrames;
        this.appFPS;
        this.loop = true;
        
        var frames = [];
        var frameIncrement;
        var frameIndex;
        
        var self = this;
        this.setCanvas = function(canvas){
            self.context = canvas.getContext('2d');
            self.canvasHeight = canvas.height;
            self.canvasWidth = canvas.width;
        };
        this.init = function(spriteObject){
            
            //sets up sprite properties from the spritesheet info object being passed in.
            self.width = spriteObject.width || 32;
            self.height = spriteObject.height || 32;
            self.numCol = spriteObject.numCol || 1;
            self.numRow = spriteObject.numRow || 1;
            self.startFrame = spriteObject.from || 0;
            self.finalFrame = spriteObject.to || 0;
            self.speed = spriteObject.speed || 15;
            self.totalFrames = spriteObject.numCol * spriteObject.numRow - 1;
            self.loop = (spriteObject.loop != undefined)? spriteObject.loop: true;
            self.appFPS = spriteObject.fps;
            
            //creates the decimal of increment for each second
            frameIncrement = self.speed/spriteObject.fps;
            frameIndex = self.startFrame;        
            
            //creates a variable holding the length of the array holding the frames
            var totalFramesLength = spriteObject.numCol * spriteObject.numRow;
            
            for(var i = 0; i < totalFramesLength; i++){
                var frame = {regX:0, regY:0};
                
                //indexes the regX and regY points of each sprite frame into the array.
                if(i>=self.numCol){
                    frame.regX = (i - Math.floor(i/self.numCol)*self.numCol)*self.width;
                    frame.regY = Math.floor(i/self.numCol)*self.height;
                }else{
                    frame.regX = i * self.width;
                    frame.regY = 0;
                }
                //pushes the objects with the regX and regY for each frame into a frame array.
                frames.push(frame);
                
            }
              
        };
        //use this method to locate or move the sprite sheet to a cordinate
        this.play = function(x, y, sprite){
            self.x = x;
            self.y = y;

            //no animation will be playeed if the starting frame is equal to the final frame.
            if(self.startFrame === self.finalFrame){
               
                self.currentFrame = frames[self.startFrame];
                self.context.drawImage(sprite, self.currentFrame.regX, self.currentFrame.regY, self.width, self.height, self.x, self.y, self.width, self.height);
                
            }else{
                //increments the frameIndex by a decimal, this will be floored because it is used to find an item in the frame array.
                frameIndex += frameIncrement;
                
                if(frameIndex >= self.finalFrame + 1){
                    frameIndex = (self.loop)? self.startFrame: self.finalFrame;
                }
                //floors the current index to a whole number so to find an object in the frame array
                self.currentFrame = frames[Math.floor(frameIndex)];
                //surrounds the sprite into a white block for debugging purposes, you can remove this in your final app
                //self.context.strokeStyle = '#FFFFFF';
                //self.context.strokeRect(self.x, self.y, self.width, self.height);
                //draws the section of the image given the regX and regY as well as the width and height
                self.context.drawImage(sprite, self.currentFrame.regX, self.currentFrame.regY, self.width, self.height, self.x, self.y, self.width, self.height); 
            } 
        };
        //use this method to change the fps speed of your sprite sheet animation
        this.setSpeed = function(speed){
            //reason why a method for this is needed is because there is  math to be done when speed is changed.
          self.speed = speed || self.speed;
            frameIncrement = self.speed / self.appFPS;
            frameIndex = self.startFrame;   
        };   
        this.getFrame = function(frameIndex){
            frameIndex = (frameIndex == undefined)? 0: frameIndex;
            return frames[frameIndex];
        };
           
    }  
    //class for the rocks floating
    
    function Rock(){
        
        this.x = Math.floor(Math.random()*mainCanvas.width);
        this.y = Math.floor(Math.random()*mainCanvas.height);
        
        this.hasSplit = false;
        this.size;
        
        var largeRockSpeed = 0.5,
            mediumRockSpeed = 1.5,
            smallRockSpeed = 2;
        
        var rockSprite;
        var spriteAnimation = new SpriteAnimation();
            spriteAnimation.setCanvas(mainCanvas);
        var spriteAnimationInfo;
        var explosion = new Explosion(15);
            explosion.setCanvas(mainCanvas);

        var self = this;
        this.init = function(size){
            
            size = (size === undefined)? "large": size;
    
            switch(size){
                case "large":
            spriteAnimationInfo = {width:56,height:55, numCol:2, numRow:9,fps:60,speed:8,loop:true,from:0,to:17};
            spriteAnimation.init(spriteAnimationInfo);
                this.width = 56;
                this.height = 55;
                this.centerX = this.width/2;
                this.centerY = this.height/2;
                this.angle = Math.random()*(Math.PI*2);
                this.speed = largeRockSpeed;
                this.velX = Math.cos(this.angle)*this.speed;
                this.velY = Math.sin(this.angle)*this.speed;
            rockSprite = meteorLargeSpriteSheet;
                self.size = "large";
                    break;
                case "medium":
            spriteAnimationInfo = {width:44,height:44, numCol:3, numRow:6,fps:60,speed:12,loop:true,from:0,to:17};   
            spriteAnimation.init(spriteAnimationInfo);
                this.width = 44;
                this.height = 44;
                this.centerX = this.width/2;
                this.centerY = this.height/2;
                this.angle = Math.random()*(Math.PI*2);
                this.speed = mediumRockSpeed;
                this.velX = Math.cos(this.angle)*this.speed;
                this.velY = Math.sin(this.angle)*this.speed;
            rockSprite = meteorMediumSpriteSheet;
                self.size = "medium";
                    break;
                case "small":
            spriteAnimationInfo = {width:33,height:33, numCol:3, numRow:6,fps:60,speed:15,loop:true,from:0,to:17};
            spriteAnimation.init(spriteAnimationInfo);
                this.width = 33;
                this.height = 33;
                this.centerX = this.width/2;
                this.centerY = this.height/2;
                this.angle = Math.random()*(Math.PI*2);
                this.speed = smallRockSpeed;
                this.velX = Math.cos(this.angle)*this.speed;
                this.velY = Math.sin(this.angle)*this.speed;
            rockSprite = meteorSmallSpriteSheet;
                self.size = "small";
                    break;
            }
            
            this.alive = false;
            this.x = 0;
            this.y = 0;
            
        };
        this.spawn = function(x, y){
            this.colliding = false;
            this.alive = true;
            self.hasSplit = false;
            this.x = x;
            this.y = y;
        };
        
        this.split = function(){
            if(self.hasSplit){
                return;
            }
            
            self.hasSplit = true;
            
            switch(self.size){
                case "large":
                meteorPool.getMeteor(this.x, this.y, "medium");
                meteorPool.getMeteor(this.x, this.y, "medium");
                    break;
                case "medium":
                meteorPool.getMeteor(this.x, this.y, "small");
                meteorPool.getMeteor(this.x, this.y, "small");
                    break;
                case "small":
                    //no rocks
                    break;     
            }  
        };
        
        this.draw = function(){
            
			if(this.colliding){ 
            //when object is colliding, creates and draws explosion
			explosion.create(this.x+this.centerX, this.y+this.centerY);
			explosion.draw();
                self.split();

			     if(!explosion.running){
			     //once explosion is over, kills off object
                    this.colliding = false;
                    this.alive = false;
                    }
                // if the explosion is still running return to drawing the explosion
			     return;
			}
            
            this.x += this.velX;
            this.y += this.velY;
            
            spriteAnimation.play(this.x, this.y, rockSprite);    
            
        };
        
    }
    
	function Background(){
		var self = this;
		var progressBarWidth = 400;
		var progressBarHeight = 40;
		this.draw = function(){
			this.x += this.velX;
			this.y += this.velY;
            
this.context.drawImage(backgroundSprite, 0,0,this.canvasWidth,this.canvasHeight,this.x-this.canvasWidth, this.y,this.canvasWidth,this.canvasHeight);	
this.context.drawImage(backgroundSprite, 0,0,this.canvasWidth,this.canvasHeight,this.x,this.y,this.canvasWidth,this.canvasHeight);
			
			if(this.x>this.canvasWidth){
				this.x = 0;
			}	
		};
		this.drawProgress = function(loaded, toLoad){
			this.context.fillStyle = '#000000';
			this.context.fillRect(0,0, this.canvasWidth, this.canvasHeight);
			this.context.strokeStyle = '#FFFFFF';
			this.context.strokeRect((this.canvasWidth-400)/2, this.canvasHeight/2-40, progressBarWidth, progressBarHeight);
			this.context.fillStyle = '#FFFFFF';
			this.context.fillRect((this.canvasWidth-400)/2, this.canvasHeight/2-40, (progressBarWidth*(loaded/toLoad)), progressBarHeight);
			this.context.font = '20px Ariel';
			this.context.textAlign = 'center';
			this.context.fillText('Loading...', this.canvasWidth/2, this.canvasHeight/2+40);
		};
		this.clear = function(){
			this.context.fillStyle = '#000000';
			this.context.fillRect(0,0,this.canvasWidth, this.canvasHeight);
		};	
	}
    
    function Interface(){
        
        this.addButtonListeners = function(){
            
            storyLineSkipButton.addEventListener('mousedown', function(){
                gameInterface.hide('storyLine');
                gameInterface.display('titleScreen');
                appState = STATE_TITLE_SCREEN;
            }, false);
            
            //the only exception
            startButton.addEventListener('mousedown', function(){
                gameInterface.hide('titleScreen');
                gameInterface.display('gamePlay');
                setUpLevel();
                appState = STATE_PLAYING;
            }, false);
            
            storyLineButton.addEventListener('mousedown', function(){
                gameInterface.hide('titleScreen');
                gameInterface.display('storyLine');
                appState = STATE_STORY_LINE;
            }, false);
            howToPlayButton.addEventListener('mousedown', function(){
                gameInterface.hide('titleScreen');
                gameInterface.display('howToPlay');
                appState = STATE_HOW_TO_PLAY;
            }, false);
            creditsButton.addEventListener('mousedown', function(){
                gameInterface.hide('titleScreen');
                gameInterface.display('credits');
                appState = STATE_CREDITS;
            }, false);
            skipCredits.addEventListener('mousedown', function(){
                gameInterface.hide('credits');
                gameInterface.display('titleScreen');
                appState = STATE_TITLE_SCREEN;
            }, false);
            howToBackButton.addEventListener('mousedown', function(){
                gameInterface.hide('howToPlay');
                gameInterface.display('titleScreen');
                appState = STATE_TITLE_SCREEN;
            }, false);    
            nextLevelButton.addEventListener('mousedown', function(){
                
                    setUpLevel();
                
                if(!userBeatGame){
                    gameInterface.hide('nextLevel');
                    gameInterface.display('gamePlay');
                    appState = STATE_PLAYING;
                }else{
                    gameInterface.hide('nextLevel');
                    gameInterface.display('beatGame');
                    appState = STATE_USER_BEAT_GAME;
                }
                
            }, false);
            shareButton.addEventListener('mousedown', function(){
                userBeatGame = false;
                currentLevel = 0;
                window.open('https://www.facebook.com/sharer.php?u=http://www.noxtar.com/2016/06/play-earth-defender-game.html');
                gameInterface.hide('beatGame');
                gameInterface.display('titleScreen');
                appState = STATE_TITLE_SCREEN;
            }, false);
            restartButton.addEventListener('mousedown', function(){
                gameInterface.hide('gamePlay');
                gameInterface.hide('gameOver');
                gameInterface.display('titleScreen');
                appState = STATE_TITLE_SCREEN;
            }, false);
        };
        
        this.display = function(page){
            switch(page){
                case "titleScreen":
                    gameStartHolder.setAttribute('style', 'display: block;');
                    break;
                case "gamePlay":
                    gamePlayHolder.setAttribute('style', 'display: block;'); 
                    break;
                case "storyLine":
                    storyLineHolder.setAttribute('style', 'display: block;');
                    break;
                case "howToPlay":
                    howToPlayHolder.setAttribute('style', 'display:block;');
                    break;
                case "nextLevel":
                    levelTransitionHolder.setAttribute('style', 'display: block;');  
                    break;
                case "gameOver":
                    gameOverHolder.setAttribute('style', 'display: block;');
                    break;
                case "beatGame":
                    beatGameHolder.setAttribute('style', 'display: block;');
                    break;
                case "credits":
                    creditsHolder.setAttribute('style', 'display: block;');
                    break;
                case "none":
                    interfaceWrapper.setAttribute('style', '');
                    break;        
            } 
        };
        this.hide = function(page){
            switch(page){
                case "titleScreen":
                    gameStartHolder.setAttribute('style', '');
                    break;
                case "gamePlay":
                    gamePlayHolder.setAttribute('style', ''); 
                    break;
                case "storyLine":
                    storyLineHolder.setAttribute('style', '');
                    break;
                case "howToPlay":
                    howToPlayHolder.setAttribute('style', '');
                    break;
                case "nextLevel":
                    levelTransitionHolder.setAttribute('style', '');  
                    break;
                case "gameOver":
                    gameOverHolder.setAttribute('style', '');
                    break;
                case "beatGame":
                    beatGameHolder.setAttribute('style', '');
                    break;
                case "credits":
                    creditsHolder.setAttribute('style', '');
                    break;
                case "none":
                    interfaceWrapper.setAttribute('style', '');
                    break;        
            } 
        };
    }
    
    
	
	function Ship(){
	this.shieldActive = false;
	this.shieldDisabled = false;
	this.speed = 0;
	this.thrustAccel = 0;
	this.angle = 0;
	this.accelX = 0;
	this.accelY = 0;
	this.thrust = false;
    this.easeValue = 0.03;
        
    var alphaSpeed = 0.03;
	var missilePool = new Pool(10);
		missilePool.init('missile');
	this.missiles = missilePool.pool;	
	var allowSound = false;
	var explosion = new Explosion(20);
	explosion.setCanvas(mainCanvas);
	var shield = new Shield();
	shield.setCanvas(mainCanvas);
	shield.init(0,0, 80, 80);
	shield.width = shield.radius*2;
	shield.height = shield.radius*2;
	this.shield = shield;
        
    this.spriteAnimation = new SpriteAnimation();
    this.spriteAnimation.setCanvas(mainCanvas);
    var shipSpriteInfo = {width:21,height:22, numCol:1, numRow:2,fps:60,speed:30,loop:false,from:0,to:0};
    this.spriteAnimation.init(shipSpriteInfo);    
        
	var self = this;
	this.init = function(x,y, width, height){
			this.x = x;
			this.y = y;
			this.width = width || 20;
			this.height = height || 20;
			this.centerX = width/2 || 10;
			this.centerY = height/2 || 10;
			this.alive = true;
            this.alpha = 0;
		};
	this.shoot = function(){
		if(!this.alive || this.colliding || this.velX == 0){
			return;
		}
        
        playerShootSound.play();
		missilePool.get(this.x+this.centerX, this.y+this.centerY, this.angle, 5);
		
	};
	this.draw = function(){
		for(var i=0; i<missilePool.pool.length; i++){
			var currentMissile = missilePool.pool[i];
			if(currentMissile.alive){
				currentMissile.draw();
			}
		}
		
		if(this.colliding){	
            
            //creates explosion when ship is colliding
			explosion.create(this.x, this.y);
			explosion.draw();
			
			if(!explosion.running){
			     //when explosion ends set to dead
                this.colliding = false;
                this.alive = false;
                self.spawn(centerX,centerY);
			}

			return;
		}
		
		if(self.shieldActive){
            if(shield.disabled){
                self.shieldActive = false;   
            }
			shield.x = this.x-shield.centerX+this.centerX;
			shield.y = this.y-shield.centerY+this.centerY;
			shield.draw();
		}
        

		this.context.save();
        this.alpha += alphaSpeed;
        this.alpha = (this.alpha >= 1)? 1: this.alpha;
        this.context.globalAlpha = this.alpha;
		this.context.translate(this.x+10, this.y+10);	
		this.context.rotate(this.angle);
		this.x += this.velX;
		this.y += this.velY;
		if(self.thrust){
            self.spriteAnimation.startFrame = 1;
            self.spriteAnimation.finalFrame = 1;
			self.spriteAnimation.play(-this.centerX, -this.centerY, playerSpriteSheet);
		}else{
			//this.context.drawImage(shipSprite, 0, 0, this.width, this.height, -10,-10, this.width, this.height);
            self.spriteAnimation.startFrame = 0;
            self.spriteAnimation.finalFrame = 0;
			self.spriteAnimation.play(-this.centerX, -this.centerY, playerSpriteSheet);
		}
		this.context.restore();
		};
    this.spawn = function(x, y){
        missilePool.hideItems();
        shield.reset();
        self.activateShield(false);
        this.alive = true;
        this.colliding = false;
        this.x = x;
        this.y = y;
        this.alpha = 0;
        this.velX = this.velY = 0;
        this.angle = 0;
    };
    this.activateShield = function(onOrOff){
        onOrOff = (onOrOff == undefined)? true: onOrOff;
    
        if(onOrOff && !shield.disabled){
            self.shieldActive = true;
            self.shieldDisabled = false;
        }else{
            self.shieldDisabled = true;
            self.shieldActive = false;  
        }
        
    };
        
	}
    
    function Perk(){
        
        var spriteAnimation = new SpriteAnimation();
        var spriteInfo;
        this.type;
    
        var self = this;
        this.init = function(perk){
            
             var randomX = Math.floor(Math.random()*mainCanvas.width-20),
                 randomY = Math.floor(Math.random()*mainCanvas.height-20);
            
            
            switch(perk){
                    
                case "shield":
                    spriteInfo = {width:18,height:19, numCol:1, numRow:2,fps:60,speed:1,loop:false,from:0,to:0};
                    spriteAnimation.setCanvas(mainCanvas);
                    spriteAnimation.init(spriteInfo);
                    this.width = spriteInfo.width;
                    this.height = spriteInfo.height;
                    this.centerX = spriteInfo.width/2;
                    this.centerY = spriteInfo.height/2;
                    this.x = randomX;
                    this.y = randomY;
                    self.type = "shield";
                    break;
                    
                case "life":
                    spriteInfo = {width:18,height:19, numCol:1, numRow:2,fps:60,speed:1,loop:false,from:1,to:1};
                    spriteAnimation.setCanvas(mainCanvas);
                    spriteAnimation.init(spriteInfo);
                    this.width = spriteInfo.width;
                    this.height = spriteInfo.height;
                    this.centerX = spriteInfo.width/2;
                    this.centerY = spriteInfo.height/2;
                    this.x = randomX;
                    this.y = randomY;
                    self.type = "life";
                    break;
            }
        };
        this.spawn = function(x, y){
            this.alive = true;
            this.x = x;
            this.y = y;
        };
        this.draw = function(){
            
            spriteAnimation.play(this.x, this.y, perkSprite);
            
        };
    
    }
    
	function Missile(){
		this.speed = 3;
		this.life = 0;
		var maxLife = 100;
		var self = this;
		this.draw = function(){
			self.life++;
			if(self.life>=maxLife){
				self.life = 0;
				this.alive = false;
			}
			this.x += this.velX;
			this.y += this.velY;
			this.context.fillStyle = this.color;
			this.context.fillRect(this.x, this.y, this.width, this.height);
		};
		this.init = function(x,y, width, height){
			this.x = x;
			this.y = y;
			this.width = width|| 20;
			this.height = height || 20;
			this.centerX = width/2;
			this.centerY = height/2;
			this.alive = true;
		};
		this.spawn = function(x, y){
			this.alive = true;
			this.x = x;
			this.y = y;
			this.colliding = false;
		};
	}
	
	function Enemy(){
		this.speed = 0;
		this.thrust = 0.06;
		var explosion = new Explosion(20);
		explosion.setCanvas(mainCanvas);
		var missilePool = new Pool(10);
		missilePool.init('missile');
		this.missiles = missilePool.pool;
        var spriteRandomIndex = Math.floor(Math.random()*4);
        this.spriteAnimation = new SpriteAnimation();
        this.spriteAnimation.setCanvas(mainCanvas);
        var enemySpriteInfo = {width:23,height:21, numCol:1, numRow:4,fps:60,speed:30,loop:false,from:spriteRandomIndex,to:spriteRandomIndex};
        this.spriteAnimation.init(enemySpriteInfo);
        
        var self = this;
        
		this.init = function(x,y, width, height){
			this.x = x;
			this.y = y;
			this.width = width || 20;
			this.height = height || 20;
			this.centerX = width/2 || 10;
			this.centerY = height/2 || 10;
			this.alive = true;
		};
		this.attack = function(object){
			if(Math.random() >= 0.005 || !this.alive || !object.alive){
				return;
			}
			missilePool.get(this.x+10, this.y+10, this.angle);
		};
		this.draw = function(){
            
            
            //console.log(spriteInfo);

			for(var i=0; i<self.missiles.length; i++){
				currentMissle = self.missiles[i];
				if(currentMissle.alive){
				currentMissle.draw();
				}
			}
			
			if(this.colliding){
			explosion.create(this.x, this.y);
			explosion.draw();
                //console.log('Enemy explosion running');
				
			     if(!explosion.running){
			     //appState = STATE_GAME_OVER;
                    this.colliding = false;
                    this.alive = false;
                    //self.spawn(200, 400);
                    }
			     return;
			}
			
			this.x += this.velX;
			this.y += this.velY;
			this.context.save();
			this.context.translate(this.x+this.centerX, this.y+this.centerY);
			this.context.rotate(this.angle);
            self.spriteAnimation.play(-this.centerX, -this.centerX, enemySpriteSheet);
			this.context.restore();
			
		};
        
        this.spawn = function(x, y){
            missilePool.hideItems();
            this.alive = true;
            this.colliding = false;
            this.x = x;
            this.y = y;
        };
        
		this.follow = function(object){
			if(!object.alive){
				return;
			}	
			var dx, dy, distance, newVelX, newVelY, futureVel, direction;
			dx = object.x - this.x;
			dy = object.y - this.y;
			distance = Math.sqrt(dx*dx+dy*dy);
			direction = Math.atan2(dy, dx);
			this.angle = direction;
			
			if(distance>=140){
			newVelX = this.velX+Math.cos(this.angle)*self.thrust;
			newVelY = this.velY+Math.sin(this.angle)*self.thrust;	
			futureVel = Math.sqrt(newVelX*newVelX + newVelY*newVelY);	
					if(futureVel>1.5){
				newVelX = this.velX;
				newVelY = this.velY;
				}else{
				this.velX = newVelX;
				this.velY = newVelY;
				}
			}	
		};
	}
    
    function Mothership(){
        this.hasReleasedShips = false;
        this.spriteAnimation = new SpriteAnimation();
        this.spriteAnimation.setCanvas(mainCanvas);
        this.type;
        this.alpha = 0;
        var spriteIndex;
        var spriteSheetInfo;
        
        var shield = new Shield();
	       shield.setCanvas(mainCanvas);
	       shield.init(0,0, 80, 80);
	       shield.width = shield.radius*2;
	       shield.height = shield.radius*2;
	    this.shield = shield;
        
        var numShips = 0;
        var alphaSpeed = 0.02;
        
        var self = this;
        this.init = function(x, y, shipType){
            switch(shipType){
                case "human":
                 var spriteSheetInfo = {width:51,height:46, numCol:1, numRow:2,fps:60,speed:30,loop:false,from:0,to:0};
                 spriteIndex = Math.floor(Math.random()*spriteSheetInfo.to);
                 spriteSheetInfo.from = spriteSheetInfo.to = spriteIndex;
                 self.spriteAnimation.init(spriteSheetInfo);
                 self.type = "human";
                 this.x = x;
                 this.y = y;
                 this.width = spriteSheetInfo.width;
                 this.height = spriteSheetInfo.height;
                 this.centerX = this.width / 2;
                 this.centerY = this.height / 2;
                    break;
                case "alien":
                var spriteSheetInfo = {width:51,height:46, numCol:3, numRow:2,fps:60,speed:30,loop:false,from:0,to:3};
                spriteIndex = Math.floor(Math.random()*spriteSheetInfo.to);
                spriteSheetInfo.from = spriteSheetInfo.to = spriteIndex;
                self.spriteAnimation.init(spriteSheetInfo);
                self.type = "alien";
                this.x = x;
                this.y = y;
                this.width = spriteSheetInfo.width;
                this.height = spriteSheetInfo.height;
                this.centerX = this.width / 2;
                this.centerY = this.height / 2;
                    break;     
            }
        };
        
        this.setRelease = function(numShip, time){
            
            if(self.hasReleasedShips){
              return;   
            }
            
            //assigns number of ships to release
            numShips = numShip;
            
            //checks if time to release ships was passed in
            time = (time == undefined)? 5: time;

            var countDownRunning = true;
            var currentTime = 0;
            var finalTime = time;
            
            
            tick();  
            
            function tick(){
                
            if(countDownRunning){
                
                currentTime++;
                    if(currentTime >= finalTime){
                        self.releaseShips();
                        countDownRunning = false;
                        currentTime = 0;
                        tick();
                    }
                window.setTimeout(tick, 1000);   
                }    
            }   
             
        };
        this.releaseShips = function(){
            
            self.hasReleasedShips = true;
            
            switch(self.type){
                case "alien":
                    for(var i=0; i<numShips; i++){
                    
                    var positionX = this.x + enemyShipsPool.pool[i].width*i;
                    var positionY = this.y + enemyShipsPool.pool[i].height*i;
                        
                    enemyShipsPool.pool[i].x = positionX;
                    enemyShipsPool.pool[i].y = positionY;
                    enemyShipsPool.pool[i].alive = true;
                    enemyShipsPool.pool[i].colliding = false;  
                        
                        } 
                    break;
                case "human":
                   for(var j=0; j<numShips; j++){
                    humanShipsPool.pool[j].x = this.x;
                    humanShipsPool.pool[j].y = this.y;
                    humanShipsPool.pool[j].alive = true;
                    humanShipsPool.pool[j].colliding = false;    
                        }  
                    break;      
            }
            
        };
        this.draw = function(){
            
            this.context.save();
            if(self.hasReleasedShips){
                this.alpha -= alphaSpeed;   
                this.alpha = (this.alpha <= 0)? 0: this.alpha; 
            }else{
            this.alpha += alphaSpeed;
            this.alpha = (this.alpha >= 1)? 1: this.alpha;
            }
            this.context.globalAlpha = this.alpha;
            self.spriteAnimation.play(this.x, this.y, MothershipSpriteSheet);
            this.context.restore();
            
            if(this.alpha == 1){
                shield.x = this.x-shield.centerX+this.centerX;
			    shield.y = this.y-shield.centerY+this.centerY;
                shield.draw();   
            }else if(this.alpha <= 0){
                this.alive = false;
            }
            
        };
        this.spawn = function(x, y){
            
            //if no parameter is passed, keep the x and y values
            x = (x == undefined)? this.x: x;
            y = (y == undefined)? this.y: y;
            
            //update the x and y values 
            this.x = x;
            this.y = y;
            
            self.alive = true;
            self.colliding = false;
            self.hasReleasedShips = false;
            this.alpha = 0;
        };
        
        this.jump = function(){
            console.log('JUMPED MOTHERSHIP!');
            if(this.alpha == 0 && self.hasReleasedShips){
                this.alive = false;
            } 
        };
    }
	
	function Explosion(numParticles){
		this.x = 0;
		this.y = 0;
		this.context;
		this.canvasWidth;
		this.canvasHeight;
		this.running = false;
		this.particles = [];
		this.deadParticleCounter = 0;
		var size = numParticles;
		var self = this;
		for(var i = 0; i<size; i++){
			this.particles.push({x:0,y:0,alive:false,maxLife:0,velX:0,velY:0, width:2, height:2, life:0});
		}
		
		this.setCanvas = function(canvas){
			self.context = canvas.getContext('2d');
			self.canvasWidth = canvas.width;
			self.canvasHeight = canvas.height;
		};
		this.create = function(x, y){
			if(self.running){
				return;
			}
			
			for(var i=0;i<size;i++){
				var currentParticle = self.particles[i];
				currentParticle.x = x;
				currentParticle.y = y;
				currentParticle.maxLife = Math.random()*30+10;
				currentParticle.velX = Math.random()*7-5;
				currentParticle.velY = Math.random()*7-5;
				currentParticle.alive = true;
				currentParticle.life = 0;
			}
			self.running = true;
			self.deadParticleCounter = 0;
		};
		this.draw = function(){
			if(!self.running){
				return;
			}
			
			self.context.fillStyle = '#00FF00';
			for(var i=0; i<size; i++){
				var currentParticle = self.particles[i];
				if(currentParticle.alive){
				currentParticle.x += currentParticle.velX;
				currentParticle.y += currentParticle.velY;
				currentParticle.life++;
				self.context.fillRect(currentParticle.x, currentParticle.y, currentParticle.width, currentParticle.height);
					if(currentParticle.life >= currentParticle.maxLife){
					currentParticle.alive = false;
					currentParticle.life = 0;
					self.deadParticleCounter++;
				}
				}
				
			}
			//change the state from running to false by checking if there are any particles alive left
			if(self.deadParticleCounter>=size){
				self.running = false;
			}
		};
		
	}
	
	function Shield(){
		this.radius = 40;
		this.maxRadius = 45;
        this.life = 100;
        this.disabled = false;
        
		var self = this;
        
		this.draw = function(){
            
            if(self.life <= 0){
              self.life = 0;
              self.disabled = true;   
                return;
            }
            
			this.context.strokeStyle = '#0000FF';
            this.context.lineWidth = 1;
			this.context.beginPath(); 
			this.context.arc(this.x+this.centerX, this.y+this.centerY, self.radius, 0, Math.PI*2, true);
			this.context.closePath();
			this.context.stroke(); 
			
			self.radius += .25;
			self.radius = (self.radius>self.maxRadius)? 40: self.radius;
		};
        this.reset = function(){
            self.life = 100;
            self.disabled = false;
        };
	}
    
    
    function MeteorPool(maxSize){
        var size = maxSize;
        var pool = [];
        this.pool = pool;
        this.init = function(){
            var numMediumRocks = size*2;
            var numSmallRocks = numMediumRocks*2;
            
                for(var i=0; i<size; i++){
                    var meteor = new Rock();
                    meteor.setCanvas(mainCanvas);
                    meteor.init("large");
                    meteor.alive = false;
                    pool.push(meteor);
                }
                for(var j=0; j<numMediumRocks; j++){
                    var meteorMedium = new Rock();
                    meteorMedium.setCanvas(mainCanvas);
                    meteorMedium.init("medium");
                    meteorMedium.alive = false;
                    pool.push(meteorMedium);
                }
                for(var k=0; k<numSmallRocks; k++){
                    var meteorSmall = new Rock();
                    meteorSmall.setCanvas(mainCanvas);
                    meteorSmall.init("small");
                    meteorSmall.alive = false;
                    pool.push(meteorSmall);
                }
        }
        
        this.getMeteor = function(x, y, meteorSize){
            
            var i = 0;
                while(i<pool.length){
                    if(pool[i].size == meteorSize && !pool[i].alive){
                        pool[i].spawn(x, y);
                        break;
                    }
                    i++;     
                }  
        };
        this.hideItems = function(){
            for(var i=0; i<pool.length; i++){
                pool[i].alive = false; 
            }
            
        }
        
    }
    
	function SoundPool(maxSize){
		var size = maxSize;
		var pool = [];
		this.pool = pool;
		var currentSound = 0;
		this.init = function(object){
			if(object == "explosion"){
				for(var i=0; i<size; i++){
					var explosion = new Audio('assets/sounds/explosion'+supportedFormat);
					explosion.volume = 1.0;
					explosion.load();
					explosion.addEventListener('canplaythrough', onAssetsLoad, false);
                    //explosion.setAttribute('controls', '');
                    document.body.appendChild(explosion);
					pool[i] = explosion;
				}
			}else if(object == "shoot"){
				for(var i=0; i<size; i++){
					var shoot = new Audio('assets/sounds/shoot'+supportedFormat);
					shoot.volume = 1.0;
					shoot.load();
					shoot.addEventListener('canplaythrough', onAssetsLoad, false);
                    //shoot.setAttribute('controls', '');
                    document.body.appendChild(shoot);
					pool[i] = shoot;
				}
			}else if(object == "meteor"){
                for(var i=0; i<size; i++){
					var meteorExplosion = new Audio('assets/sounds/meteorExplosion'+supportedFormat);
					meteorExplosion.volume = 1.0;
					meteorExplosion.load();
					meteorExplosion.addEventListener('canplaythrough', onAssetsLoad, false);
                    //shoot.setAttribute('controls', '');
                    document.body.appendChild(meteorExplosion);
					pool[i] = meteorExplosion;
				}
            }
			};
		this.get = function(volume){
			volume = (volume == undefined)? 1: volume;
            
            //my Way
            var i = 0;
            
            while(i < pool.length){
                if(pool[i].currentTime == 0 || pool[i].ended ){
                    pool[i].play();
                    pool[i].volume = volume;
                    console.log('Sound Played!');
                    break;
                }else{
                    pool[pool.length-1].currentTime = 0;   
                    console.log('the the last to 0');
                }
                i++;   
            }
            /*How it was from Steve 
			if(pool[currentSound].currentTime == 0 || pool[currentSound].ended){
				pool[currentSound].play();
                pool[currentSound].volume = volume;
			}	
			currentSound = (currentSound+1) % size;*/
		};
	}
    
    
	
	function Pool(maxSize){
		var size = maxSize;
		var pool = [];
		this.pool = pool;
		var currentObject = 0;
		this.init = function(object){
			if(object == "missile"){
				for(var i=0; i<size; i++){
					var missile = new Missile();
					missile.setCanvas(mainCanvas);
					missile.init(0,0,2,2);
					missile.alive = false;
					pool[i] = missile;
				}
			}else if(object == "enemy"){
                for(var j=0; j<size; j++){
                    var randomX = Math.floor(Math.random()*mainCanvas.width);
                    var randomY = Math.floor(Math.random()*mainCanvas.height);
                    
                    var enemy = new Enemy();
                    enemy.setCanvas(mainCanvas);
                    enemy.init(randomX, randomY, 23, 21);
                    enemy.alive = false;
                    enemy.colliding = false;
                    pool[j] = enemy;
                }
            }else if(object == "perks"){
                
                size = Math.floor(size / 2);
                
                for(var k=0; k<size; k++){
                    var life = new Perk();
                    life.init("life");
                    pool.push(life); 
                }
                
                for(var h=0; h<size; h++){
                    var shield = new Perk();
                    shield.init("shield");
                    pool.push(shield);
                }
                
            }
		};
		this.get = function(x, y, angle, speed){
            speed = (speed == undefined)? 3: speed;
            angle = (angle == undefined)? 0: angle;
            
			if(!pool[size-1].alive){
				pool[size-1].spawn(x,y);
				pool[size-1].alive = true;
				pool[size-1].life=0;
                pool[size-1].speed = speed;
				pool[size-1].velX = Math.cos(angle)*pool[size-1].speed;
				pool[size-1].velY = Math.sin(angle)*pool[size-1].speed;
				pool.unshift(pool.pop());
			}
		};
        this.hideItems  = function(){
            for(var i=0; i<pool.length; i++){
                pool[i].alive = false; 
            }
        };
	}
    
    function Timer(){
        this.currentTime = 0;
        this.totalTime;
        this.running = false;
        this.timeUp = false;
        this.callBack;
        
        var self = this;
        
        this.init = function(time, callBack){
            //checks parameters
            time = (time == undefined)? 5: time;
            callBack = (callBack == undefined)? self.stop: callBack;
                        
            //assigns the count down seconds and callback function on time up
            self.totalTime = time;
            self.callBack = callBack;
            
        };
        this.start = function(){
            self.currentTime = 0;
            self.running = true;
            tick();  
            
            function tick(){
            if(self.running){
                console.log('Timer ticking!');
                self.currentTime++;
                if(self.currentTime >= self.totalTime){
                    self.callBack();
                    self.running = false;
                    self.timeUp = true;
                    tick();
                }
                window.setTimeout(tick, 1000);   
            }    
        }   
        };
        this.stop = function(){
            self.running = false;
        };        
        
    }
    
	function $(selector){
	       return document.querySelector(selector);
    }
	
	//end of canvasApp function
}

