window.addEventListener('load', onWindowLoad, false);

function onWindowLoad(){
    
    
    canvasApp();
    
}


function canvasApp(){	
	
		var ResourceLoader = require('./ResourceLoader.js'),
            PubSub = require('./PubSub.js'),
            Consctructors = require('./Constructors'),
            UIController = require('./UIController'),
            Game = require('./Game');
    
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


    
    var state = {
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
    };
    
    
    window.ResourceLoader = ResourceLoader;
	//adding the state object to the keyboardControl state property
    var preloadImage = document.getElementById('preload');
    
    preloadImage.setAttribute('style', 'display: none;');
	
	//frame, assets counter and audio support
	var frameRate = new FrameRateCounter();

	
    var loadBar = document.getElementById('loadBar');
    
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
				},
                sounds : {
                    soundTrack : {
                        src: ['assets/sounds/soundtrack.mp3','assets/sounds/soundtrack.wav'],
                        volume: 0.5,
                        loop: false
                        },
                    finaLevelSound : {
                         src: ['assets/sounds/finalLevelSound.mp3','assets/sounds/finalLevelSound.wav'],
                         volume: 1,
                        },
                    meteorExplosionSound : {
                        src: ['assets/sounds/meteorExplosion.mp3','assets/sounds/meteorExplosion.wav'],
                        volume: 1,
                        },
                    playerShootSound : {
                        src: ['assets/sounds/shoot.mp3','assets/sounds/shoot.wav'],
                        volume: 0.3,
                        },
                    explosionSound : {
                        src: ['assets/sounds/explosion.mp3','assets/sounds/explosion.wav'],
                        volume: 0.2,
                        },
                    perkSound : {
                        src: ['assets/sounds/perk.mp3','assets/sounds/perk.wav'],
                        volume: 1.0,
                        },
                    victorySound : {
                        src: ['assets/sounds/victory.mp3','assets/sounds/victory.wav'],
                        volume: 1.0,
                        },
                    gameOverSound : {
                        src: ['assets/sounds/gameover.mp3','assets/sounds/gameover.wav'],
                        volume: 1.0,
                        }
                }
			},
            useHowl : true,
        
			onload : function(item){
				loadBar.setAttribute('style', 'width: '+ResourceLoader.loaded*100+'%;');
			},
        
			final : function(){
                Game.init();
				PubSub.publish('statechange', {from:state.LOADING, to:state.STORY_LINE});
			}
		};
    
    UIController.init();
    ResourceLoader.init(loaderOptions);
    ResourceLoader.downloadAll();
    
    
   
    
    
    
    //PubSub.publish('statechange', {from: state.LOADING, to: state.STORY_LINE});
    
	
	//counters
	var scoreCounter = document.getElementById('scoreCounter');
	var levelCounter = document.getElementById('levelCounter');
	var livesCounter = document.getElementById('livesCounter');
	var frameRateCounter = document.getElementById('frameRate');
    var reportEnemiesKilled = document.getElementById('reportCarnage');
    var reportRocksDestroyed = document.getElementById('eportAsteroids');
    var reportScore = document.getElementById('reportScore');
    var beatGameScore = document.getElementById('beatGameScore');
	

	

        
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

}
