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


module.exports = {
    
    checkBoundary : checkBoundary,
    hitTest : hitTest
    
};