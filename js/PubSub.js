


	
	var events = {},
		idRegistry = 9100;
	
	
	function Subscribe(event, func){
		if(!events.hasOwnProperty(event)){
			events[event] = [];
		}
		
		var eventID = ++idRegistry;
		
		events[event].push({
			
			id : eventID,
			handler : func
						   
			});
		
		return eventID;

	}
	
	function Publish(){
        
        
        
        var event = arguments[0],
            data = arguments[1],
            realOne = arguments[2];
		
        
        
			if(!events.hasOwnProperty(event)){
				return false;
			}
			
		var subs = events[event];

		for(var i = 0, j = subs.length; i<j; i++){
			
			subs[i].handler(event, data);
			
		}
		
	}
	
	function Unsubscribe(id){
		
		for(var event in events){
			if(events.hasOwnProperty(event)){
				for(var i = 0, j = events[event].length; i<j; i++){
					if(events[event][i].id === id){
						events[event].splice(i, 1);
						return id;
					}
				}
			}
		}
		
	}



module.exports = {
    
    subscribe : Subscribe,
    publish : Publish,
    unsubscribe : Unsubscribe
    
};