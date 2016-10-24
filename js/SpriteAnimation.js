var SpriteAnimation = (function(){
	 
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
           
    
     return SpriteAnimation;
	
	
 })();

module.exports = SpriteAnimation;