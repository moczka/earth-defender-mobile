var PubSub = require('./PubSub');

function init(){
    
    if(this.hasInitialized) return this;
    this.hasInitialized = true;
    
    this.pages = document.getElementsByClassName('appPage');
    this.interface = document.getElementById('interfaceWrapper');
    this.subId = PubSub.subscribe('statechange', handleStateChange.bind(this));
    delegateClicks.call(this);
    
    return this;
    
}

function delegateClicks(){
    
    var pages = [].slice.call(this.pages, 0, this.pages.length); 
    
    for(var i=0, len=pages.length; i<len; i++){
        
        var currentPage = pages[i];
        
        currentPage.addEventListener('mousedown', handleClick);
        
    }
    
    
    return pages;
    
}

function handleClick(event){
    
    var button = event.target;
    
    console.log(button);
    
    
}

function show(pageName){
 
    this.pages[pageName].setAttribute('style', 'display: block;');
    
    return this;
    
}

function hide(pageName){
    
    this.pages[pageName].setAttribute('style', 'display: none;');
    
    return this;
}

function hideAll(){
    
    var self = this;
 
    [].forEach.call(this.pages, function(curretPage, index){
       
        hide.call(self, index);
        
    });
    
    return self;
    
}


function handleStateChange(event, data){
    
    hide.call(this, data.from);
    show.call(this, data.to);
    
}

module.exports = {
    
    init : init,
    show : show,
    hide : hide,
    hideAll : hideAll,
    hasInitialized : false
    
    
};