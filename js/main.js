window.addEventListener('load', onWindowLoad, false);

	var Display = require('./Display'),
		SpriteAnimation = require('./SpriteAnimation.js'),
		ResourceLoader = require('./ResourceLoader.js'),
		PubSub = require('./PubSub.js'),
		keyboardControl = require('./keyboardControl.js');



function onWindowLoad(){
    
    
    canvasApp();
    
}


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

	//pc normal states
	const STATE_LOADING = 1,
    STATE_INIT = 2,
    STATE_STORY_LINE = 3,
	STATE_TITLE_SCREEN = 4,
    STATE_HOW_TO_PLAY = 5,
	STATE_PLAYING = 6,
    STATE_WAITING = 7,
    STATE_LEVEL_TRANSITION = 8,
    STATE_NEXT_LEVEL = 9,
	STATE_USER_BEAT_GAME = 10,
	STATE_GAME_OVER = 11,
	STATE_ASPECT_RATIO = 13,
	STATE_ORIENTATION_CHANGE = 14,
	STATE_USER_AGENT = 15,
    STATE_CREDITS = 12;
		var appState;
		var previousAppState;
	
	//userAgent info and canvas control
	var userAgent = {mobile:false,platform:"", portrait:false};
	var canvasHolder = $('#canvasHolder');
    var preloadImage = $('#preload');
    var interfaceWrapper = $('#interfaceWrapper');
	var orientationMessageHolder = $('#orientationMessage');
	
	//frame, assets counter and audio support
	var frameRate = new FrameRateCounter();
	var itemsToLoad = 17;
	var loadCount = 0;
	var FRAME_RATE = 1000/60;
	var loopOn = false;
	
	//set up loader
	var loaderOptions = {
			assets : {
				imgs : {
			earthSprite : "assets/sprites/earth.png",
			playerSpriteSheet : "assets/sprites/playerShip.png",
			enemySpriteSheet : "assets/sprites/enemyShips.png",
			MothershipSpriteSheet : "assets/sprites/motherships.png",
			backgroundSprite : "assets/sprites/background.png",
			meteorSprite : "assets/sprites/meteorSprite.png",
			perkSprite : "assets/sprites/perks.png"
				}
			},
			onload : function(item){
				console.log("The source of the item that has just loaded is " + item.src);
			},
			final : function(){
				initAssets();
			}
		};
    
    
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
        lastLevel = 14,
        userBeatGame = false,
        enemyShipWorth = 10,
        rockWorth = 5,
	    shipLives = 4;
	
	var friction = 0.005;
    
    inheritFrom(Display, Physics);
    inheritFrom(Physics, Spacecraft);
    inheritFrom(Display, Background);
    
	//make custom classes inherit display class
    inheritFrom(Physics, Missile);
    inheritFrom(Display, Shield);
    inheritFrom(Spacecraft, Ship);
    inheritFrom(Display, Explosion);
    inheritFrom(Spacecraft, Enemy);
    inheritFrom(Physics, Rock);
    inheritFrom(Spacecraft, Mothership);
    inheritFrom(Physics, Perk);
    

    
	//sounds API
	var mySubscription = PubSub.subscribe('gamestate', handleSub);
	var secondSub = PubSub.subscribe('gamestate', handleSubTwo);
	console.log("The event key for sub one is : ", mySubscription);
	console.log("The event key for sub two is : ", secondSub); 
    
    
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
    //temp assets
    var tempEnemy = new Enemy();
    var tempMothership = new Mothership();
	var tempSpriteSheetAnimation = new SpriteAnimation();
    
    
    var totalEnemies = 8,
        totalRocks = 10,
        levelRocks = 5,
        levelEnemies = 8,
        levelPerks = 4,
        enemiesKilled = 0,
        rocksDestroyed = 0;

     //pools holding enemies and rocks
    var enemyShipsPool = new Pool(totalEnemies),
        humanShipsPool = new Pool(10),
        perksPool = new Pool(10),
        meteorPool = new Pool(totalRocks);
    
    console.log(background);
    console.log(playerShip);
    console.log(tempEnemy);
    console.log(tempMothership);
    

	
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
	    
		//sounds 5 sounds
		soundTrack = new Howl({
                    src: ['assets/sounds/soundtrack.mp3','assets/sounds/soundtrack.wav'],
                    volume: 0.5,
                    loop: false
                        });

		
        finalLevelSound = new Howl({
                     src: ['assets/sounds/finalLevelSound.mp3','assets/sounds/finalLevelSound.wav'],
                     volume: 1,
                        });
	
        meteorExplosionSound = new Howl({
                                    src: ['assets/sounds/meteorExplosion.mp3','assets/sounds/meteorExplosion.wav'],
                                    volume: 1,
                                    });
        playerShootSound = new Howl({
                                    src: ['assets/sounds/shoot.mp3','assets/sounds/shoot.wav'],
                                    volume: 0.3,
                                    });
        explosionSound = new Howl({
                                    src: ['assets/sounds/explosion.mp3','assets/sounds/explosion.wav'],
                                    volume: 0.2,
                                    });
        perkSound = new Howl({
                    src: ['assets/sounds/perk.mp3','assets/sounds/perk.wav'],
                    volume: 1.0,
                        });
		
        victorySound = new Howl({
                    src: ['assets/sounds/victory.mp3','assets/sounds/victory.wav'],
                    volume: 1.0,
                        });
        gameOverSound = new Howl({
                    src: ['assets/sounds/gameover.mp3','assets/sounds/gameover.wav'],
                    volume: 1.0,
                        });
        
		ResourceLoader.init(loaderOptions);
		ResourceLoader.downloadAll();
	
        //hides preload image
        preloadImage.setAttribute('style', 'display:none;');
        
	}
	
	function initAssets(){
        
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
        gameInterface.addButtonListeners();

		userAgent.mobile = false;
        
    
        if(userAgent.mobile){
			//add game controls for mobile devices based on motion
			window.addEventListener('touchend', onTouchEndHandler, false);
			window.addEventListener('devicemotion', devMotionHandler, false);
			//adds listener for touch move to remove the default behavior
			window.addEventListener('touchstart', onTouchStart, false);
			
		}else{
			//add game control for desktop based on keyboard events
			keyboardControl.init(playerShip);
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
		mainContext.drawImage(ResourceLoader.assets.earthSprite, (mainCanvas.width/2-(ResourceLoader.assets.earthSprite.width/2)), 0);
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
            var randomX, randomY;
        
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
        alienMothership.setRelease(levelEnemies, 8);
        
        updateCounter('level');
        updateCounter('life');
        updateCounter('score');
        
    }
	
	//temp code
	
	function handleSub(event, data){
		window.alert("The game state has changed to : " + data);
	}
	
	function handleSubTwo(event, data){
		console.log("the game state has changed to : " + data);
	}
	
	
	
	
	

	//once the user has clicked the start button, this function draws the game
	function drawCanvas(){
        
        background.draw();

        if(alienMothership.alive){
        alienMothership.draw();
        checkBoundary(alienMothership);
        alienMothership.follow(playerShip);
        alienMothership.attack(playerShip);
        alienMothership.missiles.isCollidingWith(playerShip, playerShip.shield);
        playerShip.missiles.isCollidingWith(alienMothership, alienMothership.shield);
        }

            for(var m=0; m<perksPool.pool.length; m++){
                    var currentPerk = perksPool.pool[m];
                    if(currentPerk.alive){
                        currentPerk.draw(); 
                        
                        if(hitTest(currentPerk, playerShip)){
                            console.log('DETECTION CONFIRMED!!');
                            console.log(currentPerk);
                            console.log(playerShip);
                            currentPerk.destroy();
                            recordCollision(currentPerk.type);
                        }
                    }
                }
        
        for(var i = 0; i<meteorPool.pool.length; i++){
           
            var currentMeteor = meteorPool.pool[i];
            
            if(currentMeteor.alive){
                currentMeteor.draw();
                checkBoundary(currentMeteor);
                playerShip.missiles.isCollidingWith(currentMeteor);
            }
        }
        
        meteorPool.isCollidingWith(playerShip, playerShip.shield);
        
        for(var h = 0; h<enemyShipsPool.pool.length; h++){
            
            var currentEnemy = enemyShipsPool.pool[h];
            
            if(currentEnemy.alive){
                
                currentEnemy.draw();
                checkBoundary(currentEnemy);
                currentEnemy.follow(playerShip);
                currentEnemy.attack(playerShip);
                currentEnemy.missiles.isCollidingWith(playerShip, playerShip.shield, meteorPool.pool);
                playerShip.missiles.isCollidingWith(currentEnemy, currentEnemy.shield);
                if(hitTest(currentEnemy, playerShip)){
                    currentEnemy.destroy();
                    playerShip.destroy();
                    recordCollision(currentEnemy.type);
                    recordCollision(playerShip.type);
                }
                
            }
            
        }

        //counts actual frames
		frameRate.countFrames();
        
        //hide debugging frame counter on final versions
		frameRateCounter.innerHTML = "Frames: "+frameRate.lastFrameCount;
        frameRateCounter.innerHTML = "";
        
		
        if(playerShip.alive){
			keyboardControl.update();
            checkBoundary(playerShip);
            playerShip.draw();
        }
        
        
        if(shipLives <= 0 && !playerShip.colliding && appState == STATE_PLAYING){
            
                    if(currentLevel == lastLevel){
						finalLevelSound.stop();
					}else{
						soundTrack.stop(); 
					}
            
                currentLevel = 0;
                appState = STATE_GAME_OVER;
            
        }else if(levelEnemies <= 0 && !playerShip.colliding && playerShip.alive && appState == STATE_PLAYING){
            
                    if(currentLevel == lastLevel){
						finalLevelSound.stop();
					}else{
						soundTrack.stop(); 
					}
            
            playerShip.angle = playerShip.velY = playerShip.velX = 0;
            playerShip.velX = 1;
            
            gameInterface.hide('gamePlay');
            updateCounter('level');
            appState = STATE_LEVEL_TRANSITION;

        }
    
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
        
        enemyShipsPool.pool.forEach(function(enemy){
            if(enemy.alive){
                enemy.draw();
            }
        });
        
        playerShip.velX += playerShip.velX*playerShip.easeValue;
        playerShip.draw();
        
        console.log(playerShip.velX);
        
        
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
        victorySound.play();
        
        //resets that score
        currentScore = 0;
        currentLevel = 0;
        
    }

	//function in charged of ending the game
	function gameOver(){
        
        //changes the state to call code only once.
		appState = STATE_WAITING;
        
        //checks to see which sound to stop playing given the level the user was before dying
		gameOverSound.play();
        
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
        if (!object1.alive || object1.colliding || object2.colliding || !object2.alive) return(false);
        
        if (object1.type == "humanShip" && object1.velX == 0) return(false);
        if (object2.type == "humanShip" && object2.velX == 0) return(false);
        
        if(object2 instanceof Spacecraft){
            if(object2.shield.active){
                return (false);
            }
        }
        if(object1 instanceof Spacecraft){
            if(object1.shield.active){
                return (false);
            }
        }
        

        //otherwise return true 
   		return(true);

	}
        
    //game score tracker
    
    function recordCollision(objectType){
        switch(objectType){
            case "largeRock":
                currentScore += 20;
                updateCounter('score');
                rocksDestroyed++;
                break;
                
            case "mediumRock":
                currentScore += 10;
                updateCounter('score');
                rocksDestroyed++;
                break;
                
            case "smallRock":
                currentScore += 5;
                updateCounter('score');
                rocksDestroyed++;
                break;
                
            case "humanShip":
                shipLives--;
                currentScore -= 50;
                updateCounter('score');
                updateCounter('life');
                break;
                
            case "enemy":
                currentScore += 50;
                updateCounter('score');
                levelEnemies--;
                enemiesKilled++;
                break;
                
            case "life":
                shipLives++;
                updateCounter('life');
                break;
                
            case "shield":
                playerShip.shield.reset();
                break;
            case "cash":
                break;
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


    //inheriter function
    function inheritFrom(parent, child){
        var copyOfParent = Object.create(parent.prototype);
        copyOfParent.constructor = child;
        child.prototype = copyOfParent;
    }
	
	//custom classes
    function Physics(){
        
            Display.call(this);
        
        this.velX = 0;
        this.velY = 0;
        this.acelX = 0;
        this.acelY = 0;
        this.colliding = false;
        this.speed = 0; 
        this.thrust = 0;
        this.angle = 0;
    }
    
    Physics.prototype.spawn = function(x, y, angle, speed){
        
        this.x = x || centerX;
        this.y = y || centerY;
        this.colliding = false;
        this.alive = true;
        this.angle = angle || this.angle;
        this.speed = speed || this.speed;
        this.velX = Math.cos(this.angle)*this.speed;
        this.velY = Math.sin(this.angle)*this.speed;
        
    };
    
    Physics.prototype.destroy = function(){
        this.alive = false; 
    };
    
    //spaceCraft function constructor 
    function Spacecraft(){
            
           Physics.call(this);
        
        this.autoSpawn = false;
        this.thrustAccel = 0.03;
        this.alphaSpeed = 0.03;
        this.shieldActive = false;
        this.shieldDisabled = false;
		this.maxVelocity = 4;
        this.missilesSpeed = 2.5;
        
    }
    
    Spacecraft.prototype.init = function(width, height){
        
            Display.prototype.init.call(this, width, height);
        
        var shield = new Shield();
            shield.setCanvas(mainCanvas);
            shield.init(80,80);
        var missilePool = new Pool(10);
            missilePool.init('missile');
        var explosion = new Explosion(15);
            explosion.setCanvas(mainCanvas);
            
        this.explosion = explosion;
        this.shield = shield;
        this.missiles = missilePool;
        
    };    
    Spacecraft.prototype.follow = function(object){
        
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
			newVelX = this.velX+Math.cos(this.angle)*this.thrustAccel;
			newVelY = this.velY+Math.sin(this.angle)*this.thrustAccel;	
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
    
    Spacecraft.prototype.attack = function(object){
			if(Math.random() >= 0.005 || !this.alive || !object.alive){
				return;
			}
			this.shoot();
    };
    
    Spacecraft.prototype.spawn = function(x, y, angle, speed){
        
            Physics.prototype.spawn.call(this, x, y, angle, speed);
            this.missiles.hideItems();
            //this.shield.reset();
        
    };
    
    Spacecraft.prototype.destroy = function(){
        
        this.colliding = true;  
        explosionSound.play();
        
    };

    Spacecraft.prototype.draw = function(){
        
        //draws spacecraft launched missiles
        for(var i=0; i<this.missiles.pool.length; i++){
            var currentMissile = this.missiles.pool[i];   
            if(currentMissile.alive){
                currentMissile.draw();   
            }
        }
        
        if(this.colliding){	
                //if spacecraft is colliding, create an explosion
            this.explosion.create(this.x+this.centerX, this.y+this.centerY);
            this.explosion.draw();
                //once the explosion is not running, kill off spacecraft
            if(!this.explosion.running){
                this.alive = false;
                this.colliding = false;
                if(this.autoSpawn){
                 this.spawn();   
                }
            }
                //return while colliding
            return;
                    
        }
            //if shield is active draw it.
        if(this.shield.active){
                this.shield.x = this.x-this.shield.centerX+this.centerX;
                this.shield.y = this.y-this.shield.centerY+this.centerY;
                this.shield.draw();
        }    
        
    };
    
    Spacecraft.prototype.shoot = function(){
        
        //if instance is not alive, is colliding or not moving, it will NOT shoot
        if(!this.alive || this.colliding || this.velX == 0){
                return;
        }

        this.missiles.get(this.x+10, this.y+10, "missile", this.angle, this.missilesSpeed);
		
    };
    
    //class for the rocks floating
    
    function Rock(){
        
            Physics.call(this);
        
        this.size;
        this.spriteAnimation = new SpriteAnimation();
        this.spriteAnimation.setCanvas(mainCanvas);
        this.explosion = new Explosion(7);
        this.explosion.setCanvas(mainCanvas);
        this.type = 'rock';
    
    }
    
    Rock.prototype.init = function(size){
        
          var spriteAnimationInfo,
              largeRockSpeed = 0.5,
              mediumRockSpeed = 1,
              smallRockSpeed = 1.2,
              randomAngle;
        
        
            
            size = size || "large";
    
            switch(size){
                case "large":
                    
                    spriteAnimationInfo = {width:56,height:55, offsetX: 0, offsetY: 0, numCol:2, numRow:9,fps:60,speed:8,loop:false,from:0,to:17};
                    this.spriteAnimation.init(spriteAnimationInfo);
                    this.sprite = ResourceLoader.assets.meteorSprite;
                    randomAngle = Math.random()*(Math.PI*2);
                    Display.prototype.init.call(this, spriteAnimationInfo.width, spriteAnimationInfo.height);
                    Physics.prototype.spawn.call(this, 0, 0, randomAngle, largeRockSpeed);
                    this.alive = false;
                    this.size = "large";
                    this.type = "largeRock";
                    
                    break;
                case "medium":
                    
                    spriteAnimationInfo = {width:44,height:44, numCol:3, numRow:6,fps:60,offsetX: 130, offsetY : 0, speed:12,loop:true,from:0,to:17};   
                    this.spriteAnimation.init(spriteAnimationInfo);
                    this.sprite = ResourceLoader.assets.meteorSprite;
                    randomAngle = Math.random()*(Math.PI*2);
                    Display.prototype.init.call(this, spriteAnimationInfo.width, spriteAnimationInfo.height);
                    Physics.prototype.spawn.call(this, 0, 0, randomAngle, mediumRockSpeed);
                    this.alive = false;
                    this.size = "medium";
                    this.type = "mediumRock";
                    
                    break;
                case "small":
                    
                    spriteAnimationInfo = {width:33,height:33, numCol:3,offsetX: 290, offsetY: 0, numRow:6,fps:60,speed:15,loop:true,from:0,to:17};
                    this.spriteAnimation.init(spriteAnimationInfo);
                    this.sprite = ResourceLoader.assets.meteorSprite;
                    randomAngle = Math.random()*(Math.PI*2);
                    Display.prototype.init.call(this, spriteAnimationInfo.width, spriteAnimationInfo.height);
                    Physics.prototype.spawn.call(this, 0, 0, randomAngle, smallRockSpeed);
                    this.alive = false;
                    this.size = "small";
                    this.type = "smallRock";
                    
                    break;
            }
            
    };
    
    Rock.prototype.draw = function(){
            
			if(this.colliding){ 
            //when object is colliding, creates and draws explosion
			this.explosion.create(this.x+this.centerX, this.y+this.centerY);
			this.explosion.draw();
                this.destroy();

			     if(!this.explosion.running){
			     //once explosion is over, kills off object
                    this.colliding = false;
                    this.alive = false;
                    }
                // if the explosion is still running return to drawing the explosion
			     return;
			}
            
            this.x += this.velX;
            this.y += this.velY;
            
            this.spriteAnimation.play(this.x, this.y, this.sprite);    
            
        };
    
    Rock.prototype.destroy = function(){
        
            if(this.colliding){
                return;
            }
        
            meteorExplosionSound.play();
            this.colliding = true;
            
            switch(this.size){
                case "large":
                meteorPool.get(this.x, this.y, "mediumRock");
                meteorPool.get(this.x, this.y, "mediumRock");
                    break;
                case "medium":
                meteorPool.get(this.x, this.y, "smallRock");
                meteorPool.get(this.x, this.y, "smallRock");
                    break;
                case "small":
                    //no rocks
                    break;     
            }  
    };    
    
	function Background(){
        
            Display.call(this);
        
        this.velX = 0;
        this.velY = 0;
		this.progressBarWidth = 400;
		this.progressBarHeight = 40;
	}
    
    Background.prototype.draw = function(){
            this.x += this.velX;
			this.y += this.velY;
            
            this.context.drawImage(ResourceLoader.assets.backgroundSprite, 0,0,this.canvasWidth,this.canvasHeight,this.x-this.canvasWidth, this.y,this.canvasWidth,this.canvasHeight);	
            this.context.drawImage(ResourceLoader.assets.backgroundSprite, 0,0,this.canvasWidth,this.canvasHeight,this.x,this.y,this.canvasWidth,this.canvasHeight);
			
			if(this.x>this.canvasWidth){
				this.x = 0;
			}	
    };
    Background.prototype.drawProgress = function(loaded, toLoad){
			this.context.fillStyle = '#000000';
			this.context.fillRect(0,0, this.canvasWidth, this.canvasHeight);
			this.context.strokeStyle = '#FFFFFF';
			this.context.strokeRect((this.canvasWidth-400)/2, this.canvasHeight/2-40, this.progressBarWidth, this.progressBarHeight);
			this.context.fillStyle = '#FFFFFF';
			this.context.fillRect((this.canvasWidth-400)/2, this.canvasHeight/2-40, (this.progressBarWidth*(loaded/toLoad)), this.progressBarHeight);
			this.context.font = '20px Ariel';
			this.context.textAlign = 'center';
			this.context.fillText('Loading...', this.canvasWidth/2, this.canvasHeight/2+40);
		};
    Background.prototype.clear = function(){
			this.context.fillStyle = '#000000';
			this.context.fillRect(0,0,this.canvasWidth, this.canvasHeight);
		};	
    
    
    
    
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
        
                Spacecraft.call(this);
        
            var shipSpriteInfo = {width:21,height:22, numCol:1, numRow:2,fps:60,speed:30,loop:false,from:0,to:0};
        
            this.thrust = false;
            this.autoSpawn = true;
            this.thrustAccel = 0.04;
            this.missilesSpeed = 3.2;
            this.easeValue = 0.03;
            this.spriteAnimation = new SpriteAnimation();
            this.spriteAnimation.setCanvas(mainCanvas);
            this.spriteAnimation.init(shipSpriteInfo); 
            this.type = "humanShip";
        
	}
    
    Ship.prototype.draw = function(){
        
           Spacecraft.prototype.draw.call(this);
        
        if(this.colliding){
            return;   
        }
        
                this.context.save();
                this.alpha += this.alphaSpeed;
                this.alpha = (this.alpha >= 1)? 1: this.alpha;
                this.context.globalAlpha = this.alpha;
                this.context.translate(this.x+10, this.y+10);	
                this.context.rotate(this.angle);
                this.x += this.velX;
                this.y += this.velY;
                if(this.thrust){
                    this.spriteAnimation.startFrame = 1;
                    this.spriteAnimation.finalFrame = 1;
                    this.spriteAnimation.play(-this.centerX, -this.centerY, ResourceLoader.assets.playerSpriteSheet);
                }else{
                    //this.context.drawImage(shipSprite, 0, 0, this.width, this.height, -10,-10, this.width, this.height);
                    this.spriteAnimation.startFrame = 0;
                    this.spriteAnimation.finalFrame = 0;
                    this.spriteAnimation.play(-this.centerX, -this.centerY, ResourceLoader.assets.playerSpriteSheet);
                }
                this.context.restore();
    };
	
	Ship.prototype.shoot = function(){
		Spacecraft.prototype.shoot.call(this);
		playerShootSound.play();
	};
    
    function Perk(){
        
            Physics.call(this);
        
        this.spriteAnimation = new SpriteAnimation(); 
        this.spriteAnimation.setCanvas(mainCanvas);
    
        this.type = 'perk';    
    }
    Perk.prototype.draw = function(){
        
        if(!this.alive){
            return;
        }
        
        this.x += this.velX;
        this.y += this.velY;
        
        this.spriteAnimation.play(this.x, this.y, ResourceLoader.assets.perkSprite);
        
    };
    Perk.prototype.init = function(perk){
            
            var spriteInfo; 
                
            
            switch(perk){
                    
                case "shield":
                        spriteInfo = {width:18,height:19, numCol:1, numRow:2,fps:60,speed:1,loop:false,from:0,to:0};
                        this.spriteAnimation.init(spriteInfo);
                        Display.prototype.init.call(this, spriteInfo.width, spriteInfo.height);
                        this.type = "shield";
                    break;
                    
                case "life":
                        spriteInfo = {width:18,height:19, numCol:1, numRow:2,fps:60,speed:1,loop:false,from:1,to:1};
                        this.spriteAnimation.init(spriteInfo);
                        Display.prototype.init.call(this, spriteInfo.width, spriteInfo.height);
                        this.type = "life";
                    break;
            }
    }; 
	
	Perk.prototype.destroy = function(){
		Physics.prototype.destroy.call(this);
		perkSound.play();
	};        
    //missle constructor
    
	function Missile(){
        
            Physics.call(this);
        
		this.speed = 3;
		this.life = 0;
		this.maxLife = 100;
        this.type = "missile";

	}
    
    Missile.prototype.spawn = function(x, y, angle, speed){
        Physics.prototype.spawn.call(this, x, y, angle, speed);  
        this.life = 0;
    };
    
    Missile.prototype.draw = function(){
        
        this.life++;
			if(this.life>=this.maxLife){
				this.life = 0;
				this.alive = false;
			}
			this.x += this.velX;
			this.y += this.velY;
			this.context.fillStyle = this.color;
			this.context.fillRect(this.x, this.y, this.width, this.height);
    
    };
    
	function Enemy(){
        
            Spacecraft.call(this);
        
		this.thrustAccel = 0.03;
        this.type = "enemy";
        
		
        var spriteRandomIndex = Math.floor(Math.random()*4);
        this.spriteAnimation = new SpriteAnimation();
        this.spriteAnimation.setCanvas(mainCanvas);
        var enemySpriteInfo = {width:23,height:21, numCol:1, numRow:4,fps:60,speed:30,loop:false,from:spriteRandomIndex,to:spriteRandomIndex};
        this.spriteAnimation.init(enemySpriteInfo);
    
	}
    
    Enemy.prototype.draw = function(){
        
                Spacecraft.prototype.draw.call(this);
            
            if(this.colliding || !this.alive){
                return;   
            }
        
                this.x += this.velX;
                this.y += this.velY;
                this.context.save();
                this.context.translate(this.x+this.centerX, this.y+this.centerY);
                this.context.rotate(this.angle);
                this.spriteAnimation.play(-this.centerX, -this.centerX, ResourceLoader.assets.enemySpriteSheet);
                this.context.restore();  
                

    };
        
    //mothership constructor
    function Mothership(){
        
             Spacecraft.call(this);
        
        
        this.hasReleasedShips = false;
        this.spriteAnimation = new SpriteAnimation();
        this.spriteAnimation.setCanvas(mainCanvas);
        this.type = undefined;
        this.missilesSpeed = 3;
        this.alpha = 0;
        this.alphaSpeed = 0.02;
        this.numShips = 0;
        this.type = "mothership";
    
    }
    
    Mothership.prototype.jump = function(){
        
            console.log('JUMPED MOTHERSHIP!');
            if(this.alpha == 0 && this.hasReleasedShips){
                this.alive = false;
            } 
            this.alive = false;
            this.shield.active = false;
        
        };
    
    Mothership.prototype.init = function(shipType){
        
            switch(shipType){
                    
                case "human":
                    
                 var spriteSheetInfo = {width:51,height:46, numCol:1, numRow:2,fps:60,speed:30,loop:false,from:0,to:0};
                 var spriteIndex = Math.floor(Math.random()*spriteSheetInfo.to);
                 spriteSheetInfo.from = spriteSheetInfo.to = spriteIndex;
                 this.spriteAnimation.init(spriteSheetInfo);
                 this.type = "human";
                 this.width = spriteSheetInfo.width;
                 this.height = spriteSheetInfo.height;
                 this.centerX = this.width / 2;
                 this.centerY = this.height / 2;
                    Spacecraft.prototype.init.call(this, this.width, this.height);
                    break;
                    
                case "alien":
                    
                var spriteSheetInfo = {width:51,height:46, numCol:4, numRow:2,fps:60,speed:30,loop:false,from:0,to:4};
                var spriteIndex = Math.floor(Math.random()*spriteSheetInfo.to);
                spriteSheetInfo.from = spriteSheetInfo.to = spriteIndex;
                this.spriteAnimation.init(spriteSheetInfo);
                this.type = "alien";
                this.width = spriteSheetInfo.width;
                this.height = spriteSheetInfo.height;
                this.centerX = this.width / 2;
                this.centerY = this.height / 2;
                    Spacecraft.prototype.init.call(this, this.width, this.height);
                    
                    break;     
            }
            
        };
    
    Mothership.prototype.setRelease = function(numShip, time){
            
            if(this.hasReleasedShips){
              return;   
            }
            
            //assigns number of ships to release
            this.numShips = numShip;
            
            //checks if time to release ships was passed in
            time = (time == undefined)? 5: time;

            var countDownRunning = true;
            var currentTime = 0;
            var finalTime = time;
            var self = this;
            
            tick();  
            
            function tick(){
                
            if(countDownRunning){
                
                currentTime++;
                    if(currentTime >= finalTime){
                        
                        Mothership.prototype.releaseShips.call(self);
                        countDownRunning = false;
                        currentTime = 0;
                        tick();
                    }
                window.setTimeout(tick, 1000);   
                }    
            }   
             
        };
    
    Mothership.prototype.releaseShips = function(){
        
            if(!this.alive) return;
        
        console.log('ship release function has been called');
            
            this.hasReleasedShips = true;
            this.shield.active = false;
            
            switch(this.type){
                case "alien":
                    
                    for(var i=0; i<this.numShips; i++){
                    
                    var positionX = this.x + enemyShipsPool.pool[i].width*i;
                    var positionY = this.y + enemyShipsPool.pool[i].height*i;
                    enemyShipsPool.get(positionX, positionY, 'enemy');
                    enemyShipsPool.pool[i].shield.active = false;
                        
                        } 
                    
                    break;
                case "human":
                    
                   for(var j=0; j<this.numShips; j++){

                    enemyShipsPool.pool[j].spawn(this.x, this.y);   
                    
                        }  
                    
                    break;      
            } 
            
        };
    
    
    Mothership.prototype.spawn = function(x, y, angle, speed){
            
            Spacecraft.prototype.spawn.call(this, x, y, angle, speed);
            this.hasReleasedShips = false;
            this.alpha = 0;
            
        };
    
    Mothership.prototype.draw = function(){
            
            Spacecraft.prototype.draw.call(this);
        
            if(this.colliding || !this.alive){
                console.log('ships dead wont draw it');
                return;
                
            }
            this.x += this.velX;
            this.y += this.velY;
        
        
            this.context.save();
            this.context.translate(this.x+this.centerX, this.y+this.centerY);
            this.context.rotate(this.angle);
            if(this.hasReleasedShips){
                this.alpha -= this.alphaSpeed;   
                this.alpha = (this.alpha <= 0)? 0: this.alpha; 
                this.alive = (this.alpha <= 0)? false : true;
            }else{
            this.alpha += this.alphaSpeed;
            this.alpha = (this.alpha >= 1)? 1: this.alpha;
            }
            this.context.globalAlpha = this.alpha;
            this.spriteAnimation.play(-this.centerX, -this.centerY, ResourceLoader.assets.MothershipSpriteSheet);
            this.context.restore();
            
            if(this.alpha <= 0){
                this.alive = false;
            } 
        };
    
    
    
    
    // explosion constructor
	function Explosion(numParticles){
        
            Display.call(this);
        
		this.running = false;
		this.particles = [];
		this.deadParticleCounter = 0;
		this.size = numParticles;
        
		for(var i = 0; i<numParticles; i++){
			this.particles.push({x:0,y:0,alive:false,maxLife:0,velX:0,velY:0, width:2, height:2, life:0});
		}
			
	}
    
    Explosion.prototype.create = function(x, y){
        if(this.running){
				return;
			}
			
			for(var i=0;i<this.size;i++){
				var currentParticle = this.particles[i];
				currentParticle.x = x;
				currentParticle.y = y;
				currentParticle.maxLife = Math.random()*45+15;
				currentParticle.velX = Math.random()*4-2.8;
				currentParticle.velY = Math.random()*4-2.8;
				currentParticle.alive = true;
				currentParticle.life = 0;
			}
			this.running = true;
			this.deadParticleCounter = 0;
    };
    Explosion.prototype.draw = function(){
        
        if(!this.running){
				return;
			}
			
			this.context.fillStyle = '#00FF00';
			for(var i=0; i<this.size; i++){
				var currentParticle = this.particles[i];
				if(currentParticle.alive){
				currentParticle.x += currentParticle.velX;
				currentParticle.y += currentParticle.velY;
				currentParticle.life++;
				this.context.fillRect(currentParticle.x, currentParticle.y, currentParticle.width, currentParticle.height);
                        if(currentParticle.life >= currentParticle.maxLife){
                        currentParticle.alive = false;
                        currentParticle.life = 0;
                        this.deadParticleCounter++;
                    }
				}
				
			}
//change the state from running to false by checking if there are any particles alive left
			if(this.deadParticleCounter>=this.size){
				this.running = false;
			}
        
    };
    
    //Shield constructor
	function Shield(){
        
            Display.call(this);
        
		this.radius = 40;
		this.maxRadius = 45;
        this.life = 100;
        this.disabled = false;
        this.color = '#0000FF';
        this.type = 'shield';
        var shieldState = false;
    
        Object.defineProperty(this, "active", {
            get: function(){
                
                return shieldState;
                
            },
            set: function(value){
                
                shieldState = (this.disabled)? false: value;
                this.alive = shieldState;
                
            },
            configurable: true,
            enumerable: true
        });
        
        
	}
    
    Shield.prototype.reduceLife = function(amount){
        amount = (amount === undefined)? 50: amount;
        this.life -= amount;
    };
    
    Shield.prototype.draw = function(){
        
            if(!this.active){
                console.log('shield is disabled');
                return;
            }
            if(this.life <= 0){
                this.life = 0;
                this.disabled = true;
                this.active = false;
                    return;
            }
			this.context.strokeStyle = this.color;
            this.context.lineWidth = 1;
			this.context.beginPath(); 
			this.context.arc(this.x+this.centerX, this.y+this.centerY, this.radius, 0, Math.PI*2, true);
			this.context.closePath();
			this.context.stroke(); 
			this.radius += .25;
			this.radius = (this.radius>this.maxRadius)? 40: this.radius;
        
    };
    
    Shield.prototype.reset = function(){
            this.life = 100;
            this.disabled = false;
    };
    
    
    //meteor pool
	function Pool(maxSize){
        
		var pool = [];
        
		this.pool = pool;
        this.size = maxSize;
        
	}
    
    Pool.prototype.init = function(type){
            
            switch(type){
                case "missile":
                    
                  for(var i=0; i<this.size; i++){
					var missile = new Missile();
					missile.setCanvas(mainCanvas);
					missile.init(2,2);
					this.pool[i] = missile;
				}  
                    break;
                    
                case "enemy":
                   for(var j=0; j<this.size; j++){
                    var randomX = Math.floor(Math.random()*mainCanvas.width);
                    var randomY = Math.floor(Math.random()*mainCanvas.height);
                    
                    var enemy = new Enemy();
                    enemy.setCanvas(mainCanvas);
                    enemy.init(23, 21);
                    enemy.x = randomX;
                    enemy.y = randomY;

                    this.pool[j] = enemy;
                       
                } 
                    break;
                    
                case "perks":
                    this.size = Math.floor(this.size / 2);

                    for(var k=0; k<this.size; k++){
                        var life = new Perk();
                        life.setCanvas(mainCanvas);
                        life.init("life");
                        this.pool.push(life); 
                    }

                    for(var h=0; h<this.size; h++){
                        var shield = new Perk();
                        shield.setCanvas(mainCanvas);
                        shield.init("shield");
                        this.pool.push(shield);
                    }
                    
                    this.size *= 2;
                    
                    break;
                    
                case "rocks":
                    
                    var numMediumRocks = this.size*2;
                    var numSmallRocks = numMediumRocks*2;

                        for(var l=0; l<this.size; l++){
                            var meteor = new Rock();
                            meteor.setCanvas(mainCanvas);
                            meteor.init("large");
                            meteor.type = "largeRock";
                            this.pool.push(meteor);
                        }
                        for(var m=0; m<numMediumRocks; m++){
                            var meteorMedium = new Rock();
                            meteorMedium.setCanvas(mainCanvas);
                            meteorMedium.init("medium");
                            meteorMedium.type = "mediumRock";
                            this.pool.push(meteorMedium);
                        }
                        for(var n=0; n<numSmallRocks; n++){
                            var meteorSmall = new Rock();
                            meteorSmall.setCanvas(mainCanvas);
                            meteorSmall.init("small");
                            meteorSmall.type = "smallRock";
                            this.pool.push(meteorSmall);
                        }
                    
                    this.size += (numMediumRocks+numSmallRocks);
                    
                    break;
            }
            
    };
    
    Pool.prototype.get = function(x, y, type, angle, speed){
        
            type = type || "missile";
        
            /* code from before mixing both pools meteor and regular 
			if(!this.pool[size-1].alive){
				this.pool[size-1].spawn(x,y, angle, speed);
				this.pool.unshift(pool.pop());
			}
            */
            var i = 0;

                while(i<this.size){
                    if(this.pool[i].type === type && !this.pool[i].alive){
                        this.pool[i].spawn(x, y, angle, speed);
                        break;
                    }
                    i++;     
                }
        
    };

    Pool.prototype.isCollidingWith = function(args){
            
            var length = this.pool.length;
            var argsLength = arguments.length;
            
            for(var i = 0; i<length; i++){
                
                var currentItem = this.pool[i];
                
                if(currentItem.alive){
                
                for(var h = 0; h<argsLength; h++){
                    //each argument represents the objects being passed in to this method.
                    var currentArgument = arguments[h];
					
					//if one of the arguments to check for collision is a pool of objects, iterate over each item.
					if(Array.isArray(currentArgument)){
						for(var j = 0, len = currentArgument.length; j < len; j++){
							var currentPoolItem = currentArgument[j];
							checkCollision(currentItem, currentPoolItem);
						}
					}else{
							checkCollision(currentItem, currentArgument);
					}
                }
            }
                
        }
			//function in charge of testing for collision and executing what to do when there is a collision, it also makes a call to the recordCollision function which handles the recording of collisions for points and score.
			function checkCollision(item1, item2){
				
					if(hitTest(item1, item2)){
							if(item2 instanceof Shield){
								if(!(item1 instanceof Rock)){
										item1.destroy();
										item2.reduceLife(10);
										recordCollision(item1.type);
									}
								}else if(item1 instanceof Perk){
									item1.destroy();
									recordCollision(item1.type);
								}else{
									item2.destroy();
									item1.destroy();
									recordCollision(item2.type);
									recordCollision(item1.type);
								}
						}

			}
    };
    
    Pool.prototype.hideItems  = function(){
            var length = this.pool.length;
            for(var i=0; i<length; i++){
                this.pool[i].alive = false; 
            }
    };
        
	function $(selector){
	       return document.querySelector(selector);
    }
	
	//end of canvasApp function
}
