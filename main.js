window.addEventListener('load', onWindowLoad, false);

function onWindowLoad(){
	canvasApp();
}

function canvasApp(){
	
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
	//inis canvas app
	const UP_ARROW = 38;
	const LEFT_ARROW = 37;
	const RIGHT_ARROW = 39;
	const DOWN_ARROW = 40;
	const SPACE_BAR = 32;
	const LETTER_P = 80;
	
	//orientation and mobile device states
	const STATE_ASPECT_RATIO = 0;
	const STATE_ORIENTATION_CHANGE = 1;
	const STATE_USER_AGENT = 4;
	
	var userAgent = {mobile:false,platform:"", portrait:false};
	var canvasHolder = $('#canvasHolder');
	var orientationMessageHolder = $('#orientationMessage');
	
	
	//pc normal states
	const STATE_LOADING = 10;
	const STATE_INIT = 20;
	const STATE_START_ANIMATION = 70;
	const STATE_PLAYING = 30;
	const STATE_NEXT_LEVEL = 40;
	const STATE_GAME_RESET = 50;
	const STATE_GAME_OVER = 60;
		var appState;
	
	var frameRate = new FrameRateCounter();
	var supportedFormat = getSoundFormat();
	var maxVelocity = 4;
	var itemsToLoad = 7;
	var loadCount = 0;
	var loopOn = false;
	var shipSprite; 
	var backgroundSprite;
	var earthSprite;
	var enemySprite;
	var shieldSound;
	var shootSound;
	var explosionSound;
	
	
	
	//mouse
	var mouse = {x:0,y:0, alive:true};
	
	//counters
	var scoreCounter = $('#scoreCounter');
	var levelCounter = $('#levelCounter');
	var livesCounter = $('#livesCounter');
	var frameRateCounter = $('#frameRate');
	
	var startButton = $('#startGame');
	var restartButton = $('#restart');
	
	var gameStartHolder = $('#gameStart');
	var gamePlayHolder = $('#gamePlay');
	var gameOverHolder = $('#gameOver');
	
	//score variables
	var currentScore = 0;
	var currentLevel = 1;
	
	
	var soundTrack;
	
	var shootSoundPool = new SoundPool(8);
	shootSoundPool.init("shoot");
	var explosionSoundPool = new SoundPool(8);
	explosionSoundPool.init("explosion");
	
	var shipLives = 4;
	
	Ship.prototype = new Display(); 
	Missile.prototype = new Display();
	Enemey.prototype = new Display();
	Shield.prototype = new Display();
	Background.prototype = new Display();
	
	var mainCanvas = $('#bgCanvas');
	var mainContext = mainCanvas.getContext('2d');
	var centerX = bgCanvas.width/2;
	var centerY = bgCanvas.height/2;
	

	//var pauseButton = $('#pauseButton');
	//pauseButton.addEventListener('click', onPauseButton, false);
	
	/*
	things to do:
	
	fix the explosion simulation using a pool so that you can play and replay at any time using the same particles
	fix the explosion sound so that it onnly plays once and you can play it again when the player or monster has been killed.
	
	*/
	

	var keyPressList = [];
	
	var FRAME_RATE = 1000/60;
	var loopOn = true;


	var enemyOne = new Enemey();
	var enemyTwo = new Enemey();
	var enemyThree = new Enemey();
	
	
	var playerOne = new Ship();
	
	var background = new Background();
	
	
	appState = STATE_USER_AGENT;
	runState();
	
	
	function drawCanvas(){
		
		//draw background
		background.draw();
		
		frameRate.countFrames();
		
		frameRateCounter.innerHTML = "Frames: "+frameRate.lastFrameCount;
		
		checkBoundary(playerOne);
		playerOne.draw();
		
		
		checkBoundary(enemyOne);
		enemyOne.draw();
		enemyOne.follow(playerOne);
		enemyOne.attack(playerOne);
		
		
		checkBoundary(enemyTwo);
		enemyTwo.draw();
		enemyTwo.follow(playerOne);
		enemyTwo.attack(playerOne);
		
		
		checkBoundary(enemyThree);
		enemyThree.follow(playerOne);
		enemyThree.draw();
		enemyThree.attack(playerOne);
		
		
		
		
		
		
		keyControl(playerOne);
		
		for(var i=0; i<enemyOne.missiles.length; i++){
			var currentEnemyMissle = enemyOne.missiles[i];
			if(currentEnemyMissle.alive){
			if(hitTest(currentEnemyMissle,playerOne) && !playerOne.shieldActive){
				playerOne.alive = false;
				explosionSoundPool.get();
				enemyOne.missiles[i].alive = false;
				shipLives--;
				updateCounter('life');
			}else if(hitTestShield(currentEnemyMissle, playerOne) && playerOne.shieldActive){
				enemyOne.missiles[i].alive = false;
			}
			}
		}
		
		for(var j=0; j<playerOne.missiles.length; j++){
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
				playerOne.missiles[j].alive = false;
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
		}
		
	}
	
	
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
		object.shoot();
		shootSoundPool.get();
		//enemyOne.attack(object);
		console.log(playerOne.missiles.length);
		console.log(enemyOne.missiles.length);
	}
	if(keyPressList[LETTER_P] == false){
		keyPressList[LETTER_P] = true;
		loopOn = !loopOn;
		gameLoop();
	}
	if(keyPressList[DOWN_ARROW]){
		if(shieldSound.ended){
			object.shieldDisabled = false;
			object.shieldActive = false;
			return;
		}
		object.shieldActive = (object.shieldDisabled)? false: true;
		shieldSound.play();
	}else{
		object.shieldActive = false;
	}

	}
	
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
	
	function hitTestShield(object1, object2){
		var dx = object2.x - object1.x;
		var dy = object2.y - object1.y;
		var distance = Math.sqrt(dx*dx + dy*dy);
		
		//console.log('The distance is '+ distance);
		
		if(distance<40){
			return (true);
		}else{
		
		return (false);
		}
		
	}
	
	
	function onKeyUp(e){
		e.preventDefault();
		keyPressList[e.keyCode] = false;
		
	}
	
	function onKeyDown(e){
		e.preventDefault();
		keyPressList[e.keyCode] = true; 
	}
	
	function loadAssets(){
		appState = STATE_LOADING;
		
		background.setCanvas(mainCanvas);
		
		shipSprite = new Image();
		shieldSound = new Audio();
		shieldSound.volume = 1.0;
		shootSound = new Audio();
		explosionSound = new Audio();
		enemySprite = new Image();
		backgroundSprite = new Image();
		soundTrack = new Audio();
		earthSprite = new Image();
		
		earthSprite.src = 'assets/sprites/earth.png';
		earthSprite.addEventListener('load', onAssetsLoad, false);
		soundTrack.src = 'assets/sounds/soundtrack.mp3';
		soundTrack.load();
		soundTrack.addEventListener('canplaythrough', onAssetsLoad, false);
		backgroundSprite.src = 'assets/sprites/background.png';
		backgroundSprite.addEventListener('load', onAssetsLoad, false);
		enemySprite.src = 'assets/sprites/enemy1.png';
		enemySprite.addEventListener('load', onAssetsLoad, false);
		explosionSound.src = 'assets/sounds/explosion'+supportedFormat;
		explosionSound.load();
		explosionSound.addEventListener('canplaythrough', onAssetsLoad, false);
		shootSound.src = 'assets/sounds/shoot'+supportedFormat;
		shootSound.addEventListener('canplaythrough', onAssetsLoad, false);
		shieldSound.src = 'assets/sounds/shield'+supportedFormat;
		shieldSound.load();
		shieldSound.addEventListener('canplaythrough', onAssetsLoad, false);
		shipSprite.src = 'assets/sprites/playerShip.png';
		shipSprite.addEventListener('load', onAssetsLoad, false);
		
		
	}
	function onAssetsLoad(e){
		
		/*
		var target = e.target;
		
		if(target.tagName == "AUDIO"){
			target.removeEventListener('canplaythrough', onAssetsLoad, false);
		}else if(target.tagName == "IMG"){
			target.removeEventListener('load', onAssetsLoad, false);
		}*/
	
		loadCount++;
		background.drawProgress(loadCount, itemsToLoad);
		if(loadCount === itemsToLoad){
			background.clear();
			initAssets();
		}
	}
	
	function initAssets(){
		playerOne.setCanvas(mainCanvas);
		playerOne.init(centerX,centerY,shipSprite, 2);
		background.init(0,0,backgroundSprite, 1);
		background.velX = 1;
		
		enemyOne.setCanvas(mainCanvas);
		enemyOne.init(500, 340, enemySprite, 1);
		//enemyOne.alive = true;
		//enemyOne.x = 500;
		//enemyOne.y = 320;
		
		
		enemyTwo.setCanvas(mainCanvas);
		enemyTwo.init(300,400, enemySprite,1);
		//enemyTwo.alive = true;
		//enemyTwo.x = 230;
		//enemyTwo.y = 150;
		
		console.log(enemyOne);
		console.log(enemyTwo);
		console.log(enemyThree);
		
		
		
		enemyThree.setCanvas(mainCanvas);
		enemyThree.init(560, 380, enemySprite,1);
		//enemyThree.alive = true;
		//enemyThree.x = 314;
		//enemyThree.y = 80;
		
		
		
		
		
		playerOne.thrustAccel = 0.10;
		
		mainCanvas.addEventListener('mousemove', onMouseMove, false);
		gameStartHolder.setAttribute('style', 'display: block');
		startButton.addEventListener('click', onStartClick, false);
		
		console.log(userAgent);
		
		appState = STATE_START_ANIMATION;
	}
	
	function introAnimation(){
		background.draw();
		mainContext.drawImage(earthSprite, 0, 0);
		enemyOne.follow(mouse);
		enemyTwo.follow(mouse);
		enemyThree.follow(mouse);
		enemyOne.draw();
		enemyTwo.draw();
		enemyThree.draw();
		
		
	}
	
	function onMouseMove(event){
		if ( event.layerX ||  event.layerX == 0) { // Firefox
   			mouse.x = event.layerX ;
    		mouse.y = event.layerY;
  		} else if (event.offsetX || event.offsetX == 0) { // Opera
    		mouse.x = event.offsetX;
    		mouse.y = event.offsetY;
  		}
	}
	
	function onStartClick(e){
		var target = e.target;
		document.addEventListener('keyup', onKeyUp, false);
		document.addEventListener('keydown', onKeyDown, false);
		
		mainCanvas.removeEventListener('mousemove', onMouseMove, false);
		target.removeEventListener('click', onStartClick, false);
		gameStartHolder.setAttribute('style', 'display: none;');
		gamePlayHolder.setAttribute('style', 'display: block;');
		gameOverHolder.setAttribute('style', 'display:none;');
		
		soundTrack.play();
		soundTrack.loop = true;
		
		appState = STATE_PLAYING;
	}
	
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
	
	//Checks for device orientation
	
	function getUserAgentInfo(){
		
		userAgent.platform = navigator.platform;
		
		if(userAgent.platform != "Win32" && userAgent.platform != "MacIntel"){
			userAgent.mobile = true;
			window.addEventListener('resize', onOrientationChange, false);
			document.addEventListener('touchstart', onTouchStart, false);
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
		
		
		if(!userAgent.mobile){
			mainCanvas.width = 600;
			mainCanvas.height = 480;
			mainCanvas.setAttribute('style', 'width: 600; height: 480;');
		}
		
		loopOn = true;
		appState = STATE_INIT;
		gameLoop();
		
	}
	
	function onOrientationChange(e){

		if(window.innerHeight>= window.innerWidth && appState == STATE_PLAYING){
			appState = STATE_LOADING;
			userAgent.portrait = true;
			orientationMessageHolder.setAttribute('style', 'display: block;');
			canvasHolder.setAttribute('style', 'display:none;');
		}else if(window.innerHeight>=window.innerWidth && appState != STATE_PLAYING){
			userAgent.portrait = true;
			orientationMessageHolder.setAttribute('style', 'display: block;');
			canvasHolder.setAttribute('style', 'display:none;');
		}else if(window.innerHeight<=window.innerWidth && appState == STATE_LOADING && loadCount == itemsToLoad){
			//mainCanvas.width = window.innerWidth;
			orientationMessageHolder.setAttribute('style', '');
			canvasHolder.setAttribute('style', '');
			userAgent.portrait = false;
			appState = STATE_PLAYING;
		}
		
	}
	
	function onTouchStart(e){
		e.preventDefault();
	}
	
	function startPlaying(){
		console.log('Start playing function is running');
		mainContext.fillStyle = "#000";
		mainContext.fillRect(0,0,mainCanvas.width, mainCanvas.height);
		mainContext.strokeStyle = '#00FF00';
		mainContext.lineWidth = 5;
		mainContext.strokeRect(0,0,mainCanvas.width, mainCanvas.height);
	}
	
	function runState(){
		
	switch(appState){
			
		case STATE_ASPECT_RATIO:
				setAspectRatio();
			break;
		case STATE_ORIENTATION_CHANGE:
				onOrientationChange();
			break;
		case STATE_USER_AGENT:
				getUserAgentInfo();
			break;	
		//normal states
		case STATE_INIT: 
			loadAssets();
			break;
		case STATE_LOADING:
			//wait for calls backs of load events
			break;
			
		case STATE_START_ANIMATION:
			introAnimation();
			break;
		case STATE_PLAYING:
			drawCanvas();
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
			requestAnimFrame(gameLoop);
			runState();
		}
	}
	
	function onPauseButton(e){
		loopOn = !loopOn;
		gameLoop();
	}
	
	
	function gameOver(){
		soundTrack.pause();
		playerOne.x = 320;
		playerOne.y = 240;
		playerOne.alive = true;
		playerOne.colliding = false;
		gameOverHolder.setAttribute('style', 'display:block');
		restartButton.addEventListener('click', onStartClick, false);
		appState = STATE_LOADING;
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
	
	
	//classes
	
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
	
		function Display(){
		this.context;
		this.canvasWidth;
		this.canvasHeight;
		this.velX = 0;
		this.velY = 0;
		this.angle = 0;
		this.centerX;
		this.centerY;
		this.sprite = false;
		this.height = 0;
		this.width = 0;
		this.x = 0;
		this.y = 0;
		this.colliding = false;
		this.alive = false;
		this.color = "#00FF00";
		this.alpha = 1;
		var self = this;
		this.setCanvas = function(canvas){
			self.context = canvas.getContext('2d');
			self.canvasWidth = canvas.width;
			self.canvasHeight = canvas.height;
		};
			
			//this init function is for all inanimate objects not.
		this.init = function(x,y, sprite, numSprite){
			self.sprite = (sprite != false)? true: false;
			self.x = x;
			self.y = y;
			self.width = sprite.width/numSprite || 20;
			self.height = sprite.height || 20;
			self.centerX = self.width/2;
			self.centerY = self.height/2;
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
	
	function Background(){
		var self = this;
		var progressBarWidth = 400;
		var progressBarHeight = 40;
		this.draw = function(){
			this.x += this.velX;
			this.y += this.velY;
			
			
this.context.drawImage(backgroundSprite, 0,0,this.canvasWidth,this.canvasHeight,this.x-this.canvasWidth, this.y,this.canvasWidth,this.canvasHeight);	
this.context.drawImage(backgroundSprite, 0,0,this.canvasWidth,this.canvasHeight,this.x,this.y,this.canvasWidth,this.canvasHeight);
			
		//this.context.drawImage(backgroundSprite, this.x-this.width, this.y);
		//this.context.drawImage(backgroundSprite, this.x, this.y);
			
			if(this.x>this.canvasWidth){
				this.x = 0;
			}	
		};
		this.drawProgress = function(loaded, toLoad){
			this.context.fillStyle = '#000000';
			this.context.fillRect(0,0, this.canvasWidth, this.canvasHeight);
			this.context.strokeStyle = '#FFFFFF';
			this.context.strokeRect(100, this.canvasHeight/2-40, progressBarWidth, progressBarHeight);
			this.context.fillStyle = '#FFFFFF';
			this.context.fillRect(100, this.canvasHeight/2-40, (progressBarWidth*(loaded/toLoad)), progressBarHeight);
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
	shield.init(0,0, false, 1);
	shield.width = shield.radius*2;
	shield.height = shield.radius*2;
	this.shield = shield;
	var self = this;
	this.init = function(x,y, sprite, numSprite){
			this.sprite = (sprite != false)? true: false;
			this.x = x;
			this.y = y;
			this.width = sprite.width/numSprite || 20;
			this.height = sprite.height || 20;
			this.centerX = self.width/2;
			this.centerY = self.height/2;
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
				this.alive = true;
				this.colliding = false;
				this.x = 200;
				this.y = 200;				
			}

			return;
		}
		
		if(self.shieldActive){
			shield.x = this.x+10;
			shield.y = this.y+10;
			shield.draw();
			
			
		}
		
		
		this.context.save();
		this.context.translate(this.x+10, this.y+10);	
		this.context.rotate(this.angle);
		this.x += this.velX;
		this.y += this.velY;
		if(self.thrust){
			this.context.drawImage(shipSprite, 20, 0, this.width, this.height, -10,-10, this.width, this.height);
		}else{
			this.context.drawImage(shipSprite, 0, 0, this.width, this.height, -10,-10, this.width, this.height);
		}
		this.context.restore();
		
		};
	}
	
	function Missile(){
		this.speed = 9;
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
		this.init = function(x,y, sprite, numSprite){
			this.sprite = (sprite != false)? true: false;
			this.x = x;
			this.y = y;
			this.width = sprite.width/numSprite || 20;
			this.height = sprite.height || 20;
			this.centerX = self.width/2;
			this.centerY = self.height/2;
			this.alive = true;
		};
		this.spawn = function(x, y){
			this.alive = true;
			this.x = x;
			this.y = y;
			this.colliding = false;
		};
	}
	
	function Enemey(){
		
		this.thrust = 0.15;
		var explosion = new Explosion(20);
		explosion.setCanvas(mainCanvas);
		var missilePool = new Pool(10);
		missilePool.init('missile');
		this.missiles = missilePool.pool;
		var self = this;
		this.init = function(x,y, sprite, numSprite){
			this.sprite = (sprite != false)? true: false;
			this.x = x;
			this.y = y;
			this.width = sprite.width/numSprite || 20;
			this.height = sprite.height || 20;
			this.centerX = self.width/2;
			this.centerY = self.height/2;
			this.alive = true;
		};
		this.attack = function(object){
			if(Math.random() >= 0.01 || !this.alive || !object.alive){
				return;
			}
			missilePool.get(this.x+10, this.y+10, this.angle);
		};
		this.draw = function(){

			for(var i=0; i<self.missiles.length; i++){
				currentMissle = self.missiles[i];
				if(currentMissle.alive){
				currentMissle.draw();
				}
			}
			
			if(!this.alive || this.colliding){
			explosion.create(this.x, this.y);
			explosion.draw();
				
			if(!explosion.running){
			//appState = STATE_GAME_OVER;
				this.alive = true;
				this.colliding = false;
				this.x = 200;
				this.y = 200;				
			}	
				
			return;
			}
			
			this.x += this.velX;
			this.y += this.velY;
			this.context.save();
			this.context.translate(this.x+this.centerX, this.y+this.centerY);
			this.context.rotate(this.angle);
			
			this.context.drawImage(enemySprite, -this.centerX, -this.centerY);
			this.context.restore();
			//this.context.strokeRect(this.x, this.y, this.width, this.height);
			
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
			this.context.strokeStyle = '#0000FF';
			this.context.beginPath(); 
			this.context.arc(this.x, this.y, self.radius, 0, Math.PI*2, true);
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
					explosion.volume = 0.50;
					explosion.load();
					//explosion.addEventListener('canplaythrough', onAssetsLoad, false);
					pool[i] = explosion;
				}
			}else if(object == "shoot"){
				for(var i=0; i<size; i++){
					var shoot = new Audio('assets/sounds/shoot'+supportedFormat);
					shoot.volume = 0.50;
					shoot.load();
					//shoot.addEventListener('canplaythrough', onAssetsLoad, false);
					pool[i] = shoot;
				}
			}
			};
		this.get = function(){
			if(pool[currentSound].currentTime == 0 || pool[currentSound].ended){
				pool[currentSound].play();
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
					missile.init(0,0,false,1);
					missile.alive = false;
					missile.width = missile.height = 2;
					pool[i] = missile;
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

