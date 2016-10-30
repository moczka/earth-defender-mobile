var PubSub = require('./PubSub'),

    state = {
        loading: 0,
        storyLine : 1,
	    titleScreen : 2,
        gamePlay : 3,
        levelTransition : 4,
        beatGame : 5,
        gameOver : 6,
        credits : 7,
        howToPlay : 8,
        onPause : 9,
        shipJump : 10,
        setUpLevel: 11,

        current : -1 
    };

function init(){
    
    if(this.hasInitialized) return this;
    
    var self = this;
    
    
    this.hasInitialized = true;
    this.pages = document.getElementsByClassName('appPage');
    this.interface = document.getElementById('interfaceWrapper');
    this.counters = document.getElementsByClassName('counter');
    
    this.subId = PubSub.subscribe('statechange', handleStateChange.bind(self));
    
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
    
    var button = event.target,
        from = button.getAttribute('data-from'),
        to = button.getAttribute('data-to');
    
    if(from && to){
         PubSub.publish('statechange', {from: state[from], to: state[to]});   
    }
    
}

function updateCounters(counter, value){
    
    this.counters[counter].innerHTML = value;
    
    return this;
    
}

function show(pageName){
    
    if(this.pages[pageName]){
        
        this.pages[pageName].setAttribute('style', 'display: block;');
        
    }
    
    return this;
    
}

function hide(pageName){
    
    if(this.pages[pageName]){
        
        this.pages[pageName].setAttribute('style', 'display: none;');
        
    }
    
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
    hasInitialized : false,
    updateCounter : updateCounters
    
    
};