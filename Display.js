var Display = (function(){
	
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
    
    //Physics data type
	
	return Display;
	
	
})();