var mobileControl = (function(){
	
	var initialized = false,
			//mobile acceleration
		ax, ay;
	
	
	function init(objects){
		initialized = true;
		
		//add listeners
		window.addEventListener('touchend', onTouchEndHandler, false);
		window.addEventListener('devicemotion', devMotionHandler, false);
		window.addEventListener('touchstart', onTouchStart, false);
		console.log('Mobile control module initialized...');
		
		
	}
	
	function end(){
		initialized = false;
		window.removeEventListener('touchend', onTouchEndHandler, false);
		window.removeEventListener('deviceMotion', devMotionHandler, false);
		window.removeEventListener('touchstart', onTouchStart, false);
		console.log('Mobile control module terminated...');
		
	}

	//MOBILE CONTROLS
	//function that handles mobile controls of the game
	function devMotionHandler(e){
        
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
		
        //comparings the global touches active if more than one shield is activated.
		if(e.touches.length >= 2){
			//if more than one finger on screen. activate shield
			playerShip.shield.active = true;
		}
	}
	
	function onTouchEndHandler(e){
      
        if(e.touches.length <= 1){
            playerShip.shoot();
		    playerShip.shield.active = false;
        }
	}
	
	return{
		
		init : init,
		update : runControls
		
	}

})();