var PubSub = {};

(function(p){
	
	var events = {},
		idRegistry = 9100;
	
	
	p.subscribe = function(event, func){
		if(!events.hasOwnProperty(event)){
			events[event] = [];
		}
		
		var eventID = ++idRegistry;
		
		events[event].push({
			
			id : eventID,
			handler : func
						   
			});
		
		return eventID;

	};
	
	p.publish = function(event, data){
		
		for(var event in events){
			if(!events.hasOwnProperty(event)){
				return false;
			}
		}
			
		var subs = events[event];

		for(var i = 0, j = subs.length; i<j; i++){
			
			subs[i].handler(event, data);
			
		}
		
	};
	
	p.unsubscribe = function(id){
		
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
		
	};

})(PubSub);

module.exports = PubSub;