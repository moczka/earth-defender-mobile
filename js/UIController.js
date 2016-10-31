var PubSub = require('./PubSub'),

	//state dictionary given property names for each state. 
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
     
    this.hasInitialized = true;
    this.pages = document.getElementsByClassName('appPage');
    this.interface = document.getElementById('interfaceWrapper');
    this.counters = document.getElementsByClassName('counter');
    this.subId = PubSub.subscribe('statechange', handleStateChange.bind(this));
    //Adds mousedown event listener to the div containing all the app pages
	this.interface.addEventListener('mousedown', handleClick);
    
    return this;
    
}

function handleClick(event){
    
    var button = event.target,
        from = button.getAttribute('data-from'),
        to = button.getAttribute('data-to');
    
	//if the element that triggered event has data-to and from attributes, trigger event.
    if(from && to){
         PubSub.publish('statechange', {from: state[from], to: state[to]});   
    }
    
}

function updateCounters(counter, value){
    
	//if the counter exists update its value.
	if(this.counters[counter]){

		 this.counters[counter].innerHTML = value;
		
	}
   
    
    return this;
    
}

function show(pageName){
	
    //if the page exists show it. 
    if(this.pages[pageName]){
        
        this.pages[pageName].setAttribute('style', 'display: block;');
        
    }
    
    return this;
    
}

function hide(pageName){
    
	//if the page is defined, hide it. 
    if(this.pages[pageName]){
        
        this.pages[pageName].setAttribute('style', 'display: none;');
        
    }
    
    return this;
    
}

function hideAll(){
    
    var self = this;
	
 	//delegates the forEach array method to iterate and hide each page.
    [].forEach.call(this.pages, function(curretPage, index){
       
		//calls the module hide method with the current context.
        hide.call(self, index);
        
    });
    
    return self;
    
}


function handleStateChange(event, data){
    
	//hides away current state page and shows new state page.
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