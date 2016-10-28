var ResourceLoader = require('./ResourceLoader.js'),
    keyboardControl = require('./keyboardControl.js'),
    PubSub = require('./PubSub'),
    Algorithms = require('./Algorithms'),
    mainCanvas = document.getElementById('bgCanvas'),
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
        SHIP_JUMP : 9,
        CURRENT : -1
    },
    
    stateHandlers = {},
    
    loopOn = false;  

    var totalEnemies = 8,
        totalRocks = 10,
        levelRocks = 5,
        levelEnemies = 8,
        levelPerks = 4,
        enemiesKilled = 0,
        rocksDestroyed = 0;

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
    
        runInheritance();
    
        playerShip = new Ship();
	    alienMothership = new Mothership();
        humanMothership = new Mothership();
	    background = new Background();

     //pools holding enemies and rocks
        enemyShipsPool = new Pool(totalEnemies);
        humanShipsPool = new Pool(10);
        perksPool = new Pool(10);
        meteorPool = new Pool(totalRocks);   

    
        attachStateHandlers();
    
        this.subId = PubSub.subscribe('statechange', handleStateChange.bind(this));
    
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
        
        //window.addEventListener('mousemove', onMouseMove, false);
        
        //add game control for desktop based on keyboard events
        keyboardControl.init(playerShip);
		
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
        alienMothership.setRelease(levelEnemies, 8000);
        
        //updateCounter('level');
        //updateCounter('life');
        //updateCounter('score');
}

function attachStateHandlers(){
    
    stateHandlers[state.LOADING] = handleLoading;
    stateHandlers[state.STORY_LINE] = handleStoryLine;
    stateHandlers[state.TITLE_SCREEN] = handleTitleScreen;
    stateHandlers[state.GAME_PLAY] = handleGamePlay;
    stateHandlers[state.SHIP_JUMP] = handleShipJump;
    stateHandlers[state.LEVEL_TRANSITION] = handleLevelTransition;
    stateHandlers[state.BEAT_GAME] = handleBeatGame;
    stateHandlers[state.GAME_OVER] = handleGameOver;
    stateHandlers[state.CREDITS] = handleCredits;
    stateHandlers[state.HOW_TO_PLAY] = handleHowToPlay;
        
}

function handleLoading(){
    //do nothing   
}

function handleStoryLine(){

    if(!loopOn){
     
        loopOn = true;
        gameLoop();
        
    }
    
    //background.draw();
    
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
            checkBoundary(currentEnemy);
        }
    
}

function handleGamePlay(){
    
    if(!loopOn){
        
        setUpLevel();
        loopOn = true;
        gameLoop();
           
    }
    
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
    
        //check frames
		
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
            
            
            PubSub.publish('statechange', {from: state.GAME_PLAY, to: state.LEVEL_TRANSITION});
            
            //updateCounter('level');
            
            state.CURRENT = state.LEVEL_TRANSITION;

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
        
        
        if(playerShip.x >= 1020-playerShip.width){ 
            
            PubSub.publish('statechange', {from: state.SHIP_JUMP, to: state.LEVEL_TRANSITION});
            state.CURRENT = state.LEVEL_TRANSITION;
            
        }
    
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


    function runInheritance(){
    
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
    
    }

    //inheriter function
    function inheritFrom(parent, child){
        var copyOfParent = Object.create(parent.prototype);
        copyOfParent.constructor = child;
        child.prototype = copyOfParent;
    }

    //custom classes
	function Display(){
       
		this.canvasWidth = 0;
		this.canvasHeight = 0;
		this.centerX = 0;
		this.centerY = 0;
		this.height = 0;
		this.width = 0;
		this.x = 0;
		this.y = 0;
		this.color = "#00FF00";
		this.alpha = 1;
        this.alive = false;  
        this.context = undefined;
        this.type = "display";
       
	}
        //temp proto method....
    Display.prototype.reset = function(){
			this.x = 0;
			this.y = 0;
			this.angle = 0;
			this.velX = 0;
			this.velY = 0;
			this.alive = false;
			this.colliding = false;
		};
    
    Display.prototype.setCanvas = function(canvas){
			this.context = canvas.getContext('2d');
			this.canvasWidth = canvas.width;
			this.canvasHeight = canvas.height;
		};
    
    Display.prototype.init = function(width, height){
			this.width = width || 20;
			this.height = height || 20;
			this.centerX = width/2;
			this.centerY = height/2;
			this.alive = false;
		};

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
        
        /*
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
        */
        
        
        
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
        ResourceLoader.assets.explosionSound.play();
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
        /*
        this.explosion = new Explosion(7);
        this.explosion.setCanvas(mainCanvas);
        */
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
        
            ResourceLoader.assets.meteorExplosionSound.play();
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
		ResourceLoader.assets.playerShootSound.play();
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
		ResourceLoader.assets.perkSound.play();
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
            time = (typeof time != "number")? 5000: time;
		
			var self = this;
		
			this.interval = window.setTimeout(function(){
				//release ships after the time has passed
				Mothership.prototype.releaseShips.call(self);	
			}, time);   
		
        };
    
    Mothership.prototype.releaseShips = function(){
       
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
    
    Mothership.prototype.destroy = function(){
		Spacecraft.prototype.destroy.call(this);
		window.clearTimeout(this.interval);
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
				
					if(Algorithms.hitTest(item1, item2)){
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

    function SpriteAnimation(){
		 
        this.width;
        this.height;
        this.x;
        this.y;
		this.offsetX = 0;
		this.offsetY = 0;
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
		 //spritesheet animations loops by default
        this.loop = true;
		    //private members 
     	this._frames = [];
        this._frameIncrement;
        this._frameIndex;

		 
	 }
	
     SpriteAnimation.prototype.setCanvas = function(canvas){
            this.context = canvas.getContext('2d');
            this.canvasHeight = canvas.height;
            this.canvasWidth = canvas.width;
      };
	
     SpriteAnimation.prototype.init = function(spriteObject){
            
            //sets up sprite properties from the spritesheet info object being passed in.
            this.width = spriteObject.width || 32;
            this.height = spriteObject.height || 32;
            this.numCol = spriteObject.numCol || 1;
            this.numRow = spriteObject.numRow || 1;
            this.startFrame = spriteObject.from || 0;
            this.finalFrame = spriteObject.to || 0;
            this.speed = spriteObject.speed || 15;
		 	this.offsetX = spriteObject.offsetX || 0;
		 	this.offsetY = spriteObject.offsetY || 0;
            this.totalFrames = spriteObject.numCol * spriteObject.numRow - 1;
            this.loop = spriteObject.loop || true;
            this.appFPS = spriteObject.fps;
            
            //creates the decimal of increment for each second
            this._frameIncrement = this.speed/spriteObject.fps;
            this._frameIndex = this.startFrame;        
            
            //creates a variable holding the length of the array holding the frames
            var totalFramesLength = spriteObject.numCol * spriteObject.numRow;

            for(var i = 0; i < totalFramesLength; i++){
                var frame = {};
					frame.regX = this.offsetX;
					frame.regY = this.offsetY;
            
                frame.regX += (i % this.numCol)*this.width;
                frame.regY += (i % this.numRow)*this.height;
                
                //pushes the objects with the regX and regY for each frame into a frame array.
                this._frames.push(frame);
                
            }
              
        };
        //use this method to locate or move the sprite sheet to a cordinate
     SpriteAnimation.prototype.play = function(x, y, sprite){
            this.x = x || 0;
            this.y = y || 0;

            //no animation will be playeed if the starting frame is equal to the final frame.
            if(this.startFrame === this.finalFrame){
				
	//surrounds the sprite into a white block for debugging purposes, you can remove this in your final app
                //this.context.strokeStyle = '#FFFFFF';
                //this.context.strokeRect(this.x, this.y, this.width, this.height);
               
                this.currentFrame = this._frames[this.startFrame];
                this.context.drawImage(sprite, this.currentFrame.regX, this.currentFrame.regY, this.width, this.height, this.x, this.y, this.width, this.height);
                
            }else{
                //increments the frameIndex by a decimal, this will be floored because it is used to find an item in the frame array.
                this._frameIndex += this._frameIncrement;
                
                if(this._frameIndex >= this.finalFrame + 1){
                    this._frameIndex = (this.loop)? this.startFrame: this.finalFrame;
                }
                //floors the current index to a whole number so to find an object in the frame array
                this.currentFrame = this._frames[Math.floor(this._frameIndex)];
                //surrounds the sprite into a white block for debugging purposes, you can remove this in your final app
                //this.context.strokeStyle = '#FFFFFF';
                //this.context.strokeRect(this.x, this.y, this.width, this.height);
                //draws the section of the image given the regX and regY as well as the width and height
                this.context.drawImage(sprite, this.currentFrame.regX, this.currentFrame.regY, this.width, this.height, this.x, this.y, this.width, this.height); 
            } 
        };
        //use this method to change the fps speed of your sprite sheet animation
     SpriteAnimation.prototype.setSpeed = function(speed){
            //reason why a method for this is needed is because there is  math to be done when speed is changed.
          this.speed = speed || this.speed;
            this._frameIncrement = this.speed / this.appFPS;
            this._frameIndex = this.startFrame;   
        }; 
	
     SpriteAnimation.prototype.getFrame = function(frameIndex){
            this._frameIndex = (frameIndex == undefined)? 0: frameIndex;
            return this._frames[this._frameIndex];
        };


module.exports = {
    
    init : init
    
};