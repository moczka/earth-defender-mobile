var OS = "desktop",
    mobile = false;
if(navigator.userAgent.match(/(?:iphone|ipad)/i)){
    OS = "ios";   
    mobile = true;
}else if(navigator.userAgent.match(/(?:android)/i)){
    OS = "android";
    mobile = true;
}

module.exports = {
    isMobile : function(){
        
        return mobile;
    },
    getOS : function(){
     
        return OS;
        
    },
    getOrientation : function(){
        
        return (window.innerHeight>= window.innerWidth)? "portrait" : "landscape";
        
    }
};