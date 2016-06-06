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
	STATE_GAME_RESET = 50,
	STATE_GAME_OVER = 60;
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
	var itemsToLoad = 21;
	var loadCount = 0;
	var FRAME_RATE = 1000/60;
	var loopOn = false;
	
	//set up sprites sheets & sounds
	var backgroundSprite = new Image(),
	    earthSprite = new Image(),
	    soundTrack = new Audio(),
        enemySpriteSheet = new Image(),
	    playerSpriteSheet = new Image();
    
    
	//mouse
	var mouse = {x:0,y:0, alive:true};
	
	//counters
	var scoreCounter = $('#scoreCounter');
	var levelCounter = $('#levelCounter');
	var livesCounter = $('#livesCounter');
	var frameRateCounter = $('#frameRate');
	
	//title screen buttons 
	var startButton = $('#startGame');
    var howToPlayButton = $('#howToPlay');
	var restartButton = $('#restart');
    var storyLineButton = $('#storyLine');
    
	
	//game text div holders and controls
	var gameStartHolder = $('#gameStart');
	var gamePlayHolder = $('#gamePlay');
	var gameOverHolder = $('#gameOver');
    var howToPlayHolder = $('#howToPlayHolder');
    var storyLineHolder = $('#storyLineHolder');
    var levelTransitionHolder = $('#levelTransition');
    
    var nextLevelButton = $('#nextLevel');
	var howToBackButton = $('#howToBack');
    var storyLineSkipButton = $('#skipStoryLine');
    
	//score  & level variables
	var currentScore = 0,
	   currentLevel = 1,
        enemyShipWorth = 10,
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
    
	//create sound pool for explosion and shoot sound
	var shootSoundPool = new SoundPool(8);
	var explosionSoundPool = new SoundPool(8);
	
	//gets canvas and its context and creates center x and y variables
	var mainCanvas = $('#bgCanvas');
	var mainContext = mainCanvas.getContext('2d');
	var centerX = bgCanvas.width/2;
	var centerY = bgCanvas.height/2;
    
	//array holding key presses
	var keyPressList = [];

	//TEMP: player instance and enemies
	var enemyOne = new Enemy();
	var enemyTwo = new Enemy();
	var enemyThree = new Enemy();
	var playerShip = new Ship();
	var background = new Background();
    
    //pools holding enemies and rocks
    var enemyShipsPool = new Pool(10),
        rocks = new Pool(5);
        
    var totalEnemies = 10,
        totalRocks = 5,
        levelEnemies = 3;
    
	
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
            transLevel();
            break;
        case STATE_WAITING:
            //loop does nothing, waits for a change in state.
            break;
		case STATE_NEXT_LEVEL:
			break;
		case STATE_GAME_RESET:
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
			//mainCanvas.setAttribute('style', 'width: 600px; height: 480px;');
		}else{
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
		
		//init and load sound pool sounds
		explosionSoundPool.init("explosion");
		shootSoundPool.init("shoot");
        
		
		//sounds 1 sounds
		soundTrack.src = 'assets/sounds/soundtrack'+supportedFormat;
		soundTrack.load();
		soundTrack.addEventListener('canplaythrough', onAssetsLoad, false);
		
		//sprites | images 4 images
		earthSprite.src = 'assets/sprites/earth.png';
		earthSprite.addEventListener('load', onAssetsLoad, false);
        playerSpriteSheet.src = 'assets/sprites/playerShip.png';
        playerSpriteSheet.addEventListener('load', onAssetsLoad, false);
        enemySpriteSheet.src = 'assets/sprites/enemyShips.png';
        enemySpriteSheet.addEventListener('load', onAssetsLoad, false);
		backgroundSprite.src = 'assets/sprites/background.png';
		backgroundSprite.addEventListener('load', onAssetsLoad, false);

        //hides preload image
        preloadImage.setAttribute('style', 'display:none;');
        
	}
	
	function onAssetsLoad(e){
		
		var target = e.target;
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
			console.log(soundTrack);
		}
	}
	
	function initAssets(){
		playerShip.setCanvas(mainCanvas);
		playerShip.init(centerX,centerY,23,23);
		background.init(0,0,backgroundSprite, 1);
		background.velX = 1;
        playerShip.thrustAccel = 0.10;
		
        //init enemy pool
        enemyShipsPool.init('enemy');
		
		
		window.addEventListener('mousemove', onMouseMove, false);
		storyLineHolder.setAttribute('style', 'display: block');
        storyLineSkipButton.addEventListener('mousedown', function(e){
                appState = STATE_TITLE_SCREEN;
                gameStartHolder.setAttribute('style','display: block;');
                storyLineHolder.setAttribute('style', '');
            }, false);
        
		startButton.addEventListener('mousedown', onStartClick, false);
        howToPlayButton.addEventListener('mousedown', function(e){
            appState = STATE_HOW_TO_PLAY;
            gameStartHolder.setAttribute('style', '');
        }, false);
        
        storyLineButton.addEventListener('mousedown', function(e){
            appState = STATE_STORY_LINE;
            storyLineHolder.setAttribute('style', 'display: block');
            gameStartHolder.setAttribute('style', '');
            
        }, false);
		
		console.log(userAgent);
        
		appState = STATE_STORY_LINE;
		
	}
    
    
    //function in charged of playing the story line
    function storyLine(){
        background.draw(); 
    }
	
	function introAnimation(){
		background.draw();
		mainContext.drawImage(earthSprite, (mainCanvas.width/2-(earthSprite.width/2)), 0);

        
        
        
	}
    
    function howToPlay(){
        appState = STATE_WAITING;
        howToPlayHolder.setAttribute('style', 'display: block');
        howToBackButton.addEventListener('mousedown', function(e){
            appState = STATE_TITLE_SCREEN;
            gameStartHolder.setAttribute('style', 'display: block');
            howToPlayHolder.setAttribute('style', '');
        }, false);
    }
            
	//handles the start button click
	function onStartClick(e){
		var target = e.target;
		
		mainCanvas.removeEventListener('mousemove', onMouseMove, false);
		target.removeEventListener('mousedown', onStartClick, false);
		gameStartHolder.setAttribute('style', 'display: none;');
		gamePlayHolder.setAttribute('style', 'display: block;');
		gameOverHolder.setAttribute('style', 'display:none;');
		
        soundTrack.loop = true;
		soundTrack.play();
        soundTrack.volume = 0.7;
		
        console.log("Volume of the sound track " + soundTrack.volume);
		
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
        
        
        for(var i = 0; i<levelEnemies; i++){
            var randomX = Math.floor(Math.random()*mainCanvas.width),
                randomY = Math.floor(Math.random()*mainCanvas.height);
                enemyShipsPool.pool[i].x = randomX;
                enemyShipsPool.pool[i].y = randomY;
                enemyShipsPool.pool[i].alive = true;
                enemyShipsPool.pool[i].colliding = false;
        }
        
		
		appState = STATE_PLAYING;
	}
	
	//once the user has clicked the start button, this function draws the game
	function drawCanvas(){
		
		//draw background
		background.draw();
		
        //counts actual frames
		frameRate.countFrames();
		frameRateCounter.innerHTML = "Frames: "+frameRate.lastFrameCount;
		
        //adds friction to player ship motion
		playerShip.velX -= playerShip.velX*friction;
		playerShip.velY -= playerShip.velY*friction;
        //draws player ship
		checkBoundary(playerShip);
		playerShip.draw();
        
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
                
                if(!currentEnemy.colliding && hitTest(currentEnemy, playerShip)){
                    if(!playerShip.shieldActive){
                        playerShip.alive = false;
                        currentScore += enemyShipWorth;
                        playerShip.colliding = true;
                        currentEnemy.colliding = true;
                        explosionSoundPool.get(0.3);
                    }else{
                        explosionSoundPool.get(0.3);
                        //currentEnemy.alive = false;
                        currentEnemy.colliding = true;
                    }
                }
        
                for(var h=0; h<playerShip.missiles.length; h++){
                    var currentPlayerMissile = playerShip.missiles[h];
                    if(!currentEnemy.colliding && hitTest(currentPlayerMissile, currentEnemy)){
                       currentScore += enemyShipWorth;
                       explosionSoundPool.get(0.3);
                       currentEnemy.colliding = true;
                    }
                }
                for(var j=0; j<currentEnemy.missiles.length; j++){
                    var currentEnemyMissile = currentEnemy.missiles[j];
                    if(!currentEnemyMissile.colliding && playerShip.alive && hitTest(currentEnemyMissile, playerShip) && !playerShip.shieldActive){
                        currentEnemyMissile.colliding = true;
                        playerShip.alive = false;
                        playerShip.colliding = true;
                        shipLives--;
                        explosionSoundPool.get(0.3);
                    }else if(hitTest(currentEnemyMissile, playerShip.shield) && playerShip.shieldActive){
                            currentEnemyMissile.alive = false;
                             }
                }
            }
        }
			
        
        
        updateCounter('score');
        updateCounter('life');
		
		
/*

		//checks the player missiles collisions
		for(var j=0; j<playerShip.missiles.length; j++){
			var currentPlayerMissle = playerOne.missiles[j];
			if(currentPlayerMissle.alive){
			if(hitTest(currentPlayerMissle, enemyOne) && enemyOne.alive){
				currentScore += 10;
				updateCounter('score');
				enemyOne.alive = false;
				explosionSoundPool.get();
				playerOne.missiles[j].alive = false;
			}else if(hitTest(currentPlayerMissle, enemyTwo) && enemyTwo.alive){
				currentScore += 10;
				updateCounter('score');
				playerShip.missiles[j].alive = false;
				enemyTwo.alive = false;
				explosionSoundPool.get();
			}else if(hitTest(currentPlayerMissle, enemyThree) && enemyThree.alive){
				currentScore += 10;
				updateCounter('score');
				explosionSoundPool.get();
				playerOne.missiles[j].alive = false;
				enemyThree.alive = false;
			}
			}
		}*/
		
	}
    
    //function in charged of transition level
    function transLevel(){
        appState = STATE_WAITING;
        levelTransitionHolder.setAttribute('style', 'display: block;');
        nextLevelButton.addEventListener('mousedown', function(e){
            appState = STATE_TITLE_SCREEN;
            gameStartHolder.setAttribute('style', 'display: block');
            levelTransitionHolder.setAttribute('style', '');
        }, false);
        
    }
	
	//function in charged of ending the game
	function gameOver(){
		appState = STATE_LOADING;
		soundTrack.pause();
		playerShip.x = 320;
		playerShip.y = 240;
		playerShip.alive = true;
		playerShip.colliding = false;
		gameOverHolder.setAttribute('style', 'display:block');
		restartButton.addEventListener('mousedown', onStartClick, false);
	}
	
	
	//checks if an object has left the canvas bouding box
	function checkBoundary(object){

		if(object.x >= object.canvasWidth+object.width){
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
		shootSoundPool.get();
        }
		console.log(object.missiles.length);
	}
	if(keyPressList[DOWN_ARROW]){
		object.shieldActive = true;
	}else if(keyPressList[DOWN_ARROW] == false){
		object.shieldActive = false;
	}

	}
	
	//handles the mousemove interaction at title screen.
	function onMouseMove(event){
		
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

		var futureVelX, futureVelY, futureVel;
		
		ax = (e.accelerationIncludingGravity.x)/5;
		ay = (e.accelerationIncludingGravity.y)/5;
		
		var landscapeOrientation = window.innerWidth/window.innerHeight > 1;
		if (landscapeOrientation) {
			futureVelX = playerShip.velX-ay;
			futureVelY = playerShip.velY-ax;
		} else {
			futureVelX = playerShip.velX+ax;
			futureVelY = playerShip.velY-ay;
		}
		
		futureVel = Math.sqrt(futureVelX*futureVelX+futureVelY*futureVelY);
		
		if(futureVel >= 5){
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
			playerShip.shieldActive = true;
		}
	}
	
	function onTouchEndHandler(e){
		playerShip.shoot();
		shootSoundPool.get();
		playerShip.shieldActive = false;
	}
	
	//Checks for device orientation
	function onOrientationChange(e){

		if(window.innerHeight>= window.innerWidth){
			userAgent.portrait = true;
			orientationMessageHolder.setAttribute('style', 'display: block;');
			canvasHolder.setAttribute('style', 'display:none;');
		}else if(window.innerHeight<=window.innerWidth){
			orientationMessageHolder.setAttribute('style', '');
			canvasHolder.setAttribute('style', '');
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
	
	function Ship(){
	this.shieldActive = false;
	this.shieldDisabled = false;
	this.speed = 0;
	this.thrustAccel = 0;
	this.angle = 0;
	this.accelX = 0;
	this.accelY = 0;
	this.thrust = false;
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
		};
	this.shoot = function(){
		if(!this.alive || this.colliding){
			return;
		}
		missilePool.get(this.x+this.centerX, this.y+this.centerY, this.angle);
		
	};
	this.draw = function(){
		for(var i=0; i<missilePool.pool.length; i++){
			var currentMissile = missilePool.pool[i];
			if(currentMissile.alive){
				currentMissile.draw();
				console.log('DRAWING');
			}
		}
		
		if(!this.alive || this.colliding){			
			explosion.create(this.x, this.y);
			explosion.draw();
			
			if(!explosion.running){
			//appState = STATE_GAME_OVER;
                self.spawn(200,200);
			}

			return;
		}
		
		if(self.shieldActive){
			shield.x = this.x-shield.centerX+this.centerX;
			shield.y = this.y-shield.centerY+this.centerY;
			shield.draw();
		}
		this.context.save();
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
        this.alive = true;
        this.colliding = false;
        this.x = x;
        this.y = y;
    };
        
	}
	
	function Missile(){
		this.speed = 5;
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
		this.thrust = 0.15;
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
			if(Math.random() >= 0.01 || !this.alive || !object.alive){
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
                    self.spawn(200, 400);
                     
                     
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
					if(futureVel>2){
				newVelX = this.velX;
				newVelY = this.velY;
				}else{
				this.velX = newVelX;
				this.velY = newVelY;
				}
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
		var self = this;
		this.draw = function(){
            
            //this.context.strokeStyle = '#FFFFFF';
            //this.context.strokeRect(this.x, this.y, this.width, this.height);
            
			this.context.strokeStyle = '#0000FF';
			this.context.beginPath(); 
			this.context.arc(this.x+this.centerX, this.y+this.centerY, self.radius, 0, Math.PI*2, true);
			this.context.closePath();
			this.context.stroke(); 
			
			self.radius += .25;
			self.radius = (self.radius>self.maxRadius)? 40: self.radius;
		};
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
			}
			};
		this.get = function(volume){
			volume = (volume == undefined)? 1: volume;
			if(pool[currentSound].currentTime == 0 || pool[currentSound].ended){
				pool[currentSound].play();
                pool[currentSound].volume = volume;
			}	
			currentSound = (currentSound+1) % size;
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
                    var enemy = new Enemy();
                    enemy.setCanvas(mainCanvas);
                    enemy.init(0, 0, 23, 21);
                    enemy.alive = false;
                    enemy.colliding = false;
                    pool[j] = enemy;
                }
            }
		};
		this.get = function(x, y, angle){

			if(!pool[size-1].alive){
				pool[size-1].spawn(x,y);
				pool[size-1].alive = true;
				pool[size-1].life=0;
				pool[size-1].velX = Math.cos(angle)*pool[size-1].speed;
				pool[size-1].velY = Math.sin(angle)*pool[size-1].speed;
				pool.unshift(pool.pop());
			}
		};
		
		
	}
	
	function $(selector){
	return document.querySelector(selector);
}
	
	//end of canvasApp function
}

