(function() {

  return {
    events: {
      'app.activated':'getInfo',
	  'userGetRequest.done': 'this.showInfo',
	  'userGetRequest.fail': 'this.showError'
    },
	
	requests: {
		
	  orgGetRequest: function(id) {
		return {
		  url: '/api/v2/organizations/' + id + '.json',
		  type:'GET',
		  dataType: 'json'
		};
	  },
	  
	  userGetRequest: function(id) {
		return {
		  url: '/api/v2/users/' + id + '.json',
		  type:'GET',
		  dataType: 'json'
		};
	  }
	},
	
	getInfo : function(){
		var id = JSON.stringify(this.ticket().requester().id()); //using data API to get id of agent
		this.ajax('userGetRequest', id); //sample rest get to data api for more user info
	},
	
    showInfo: function(data) {
		
		if (data.user.organization_id == null) {

		  } else {
			//make ajax requester
			this.ajax('orgGetRequest', data.user.organization_id).then(

			  function(org_data) {
				data.user.organization_name = org_data.organization.name;
				this.switchTo('requester', data);
			  },

			  function() {
				this.showError();
			  }

			);

		  }
		  
    },
	
	showError: function(){
		this.switchTo('error');
	}
  };

}());
