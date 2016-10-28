
var PubSub = require('./PubSub.js');

var keyboardControl = function(){
	
	//control keys
	const UP_ARROW = 38,
		LEFT_ARROW = 37,
		RIGHT_ARROW = 39,
		DOWN_ARROW = 40,
		X_KEY = 88,
		SPACE_BAR = 32,
		LETTER_P = 80,
          
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
    };
	
	//array of active and deactive keys
	var keyPressList = [],
		objects = [],
		initialized = false,
		inGamePlay = false;
	
	function init(objectsToControl){
		
		//pushes the elements to be manipulated by the keyword keys
		if(!objects.length){
			for(element in arguments){
				objects.push(arguments[element]);
			}
		}
	
		document.addEventListener('keyup', onKeyUp, false);
		document.addEventListener('keydown', onKeyDown, false);
		initialized = true;
		console.log('Keyword Control Module Initialized');
        PubSub.subscribe('statechange', handleStateChange.bind(this));
		
	}
	
	function handleStateChange(event, data){
		state.CURRENT = data.to;
	}
	
	function onKeyUp(e){
        
		if(!initialized) return(console.log('Keyword Module has not been initialized...'));
		e.preventDefault();
		keyPressList[e.keyCode] = false;
        
        if(keyPressList[LETTER_P] == false && state.CURRENT === state.PAUSED){
				keyPressList[LETTER_P] = true;
                PubSub.publish('statechange', {from: state.PAUSED, to: state.GAME_PLAY});
				console.log('Letter P has been pressed');

			}
        
	}
	
	function onKeyDown(e){
		if(!initialized) return(console.log('Keyword Module has not been initialized...'));
		e.preventDefault();
		keyPressList[e.keyCode] = true; 
	}
	
	function runKeys(){
        
		var length = objects.length;
		
		for(var i = 0; i<length; i++){
			
			var object = objects[i];
			
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

				if(futureVelocity > object.maxVelocity){
					newVelX = object.velX;
					newVelY = object.velY;
				}

				object.velX = newVelX;
				object.velY = newVelY;	

			}else{
				object.thrust = false;
			}
			if(keyPressList[SPACE_BAR] == false){                
				keyPressList[SPACE_BAR] = true;
				if(!object.shield.active){
				object.shoot();
				}				
			}
			if(keyPressList[X_KEY]){
				object.shield.active = true;

			}else if(keyPressList[X_KEY] == false){
				object.shield.active = false;
			}
			if(keyPressList[LETTER_P] == false){
				keyPressList[LETTER_P] = true;
                PubSub.publish('statechange', {from: state.GAME_PLAY, to: state.PAUSED});
				console.log('Letter P has been pressed');

			}
			
		}
		
	}
	
	function end(){
		document.removeEventListener('keyup', onKeyUp, false);
		document.removeEventListener('keydown', onKeyDown, false);
		initialized = false;
		console.log('Keyword Module Terminated');
	}
	
	return{
		init : init,
		update : runKeys,
		end : end
	}
	
}();

module.exports = keyboardControl;