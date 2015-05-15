(function() {

  return {
	
	
    events: {
      'userGetRequest.done': 'this.showInfo',
      'userGetRequest.fail': 'this.showError',
      'app.activated':'getInfo',
	  'click .genCompany': function(e){
		  console.log("Hiding");
		  console.log(e.currentTarget.id);
		  this.hideCompany(e.currentTarget.id);
	  },
	  'click #submitKey' : 'saveKey',
    },

    requests: {
      userGetRequest: function(id) {
        return {
          url: '/api/v2/users/' + id + '.json',
          type:'GET',
          dataType: 'json'
        };
      },
      orgGetRequest: function(id) {
        return {
          url: '/api/v2/organizations/' + id + '.json',
          type:'GET',
          dataType: 'json'
        };
      },
	  synergy5Feed: function(key) {
        return {
          url: 'https://beta.synergycloudapp.com/totalsynergy/internalkpi/home',
          type:'GET',
          dataType: 'json'
        };
      }
    },

    formatDates: function(data) {
      var cdate = new Date(data.user.created_at);
      var ldate = new Date(data.user.last_login_at);
      data.user.created_at = cdate.toLocaleDateString();
      data.user.last_login_at = ldate.toLocaleString();
      return data;
    },

    getInfo: function() {
      var id = this.ticket().requester().id();
      this.ajax('userGetRequest', id);
    },
	
	saveKey: function(){
		var key = this.$('#inputKey').val();
		console.log("Key: " + key);
		if(key != '')
		{
			this.ajax('orgGetRequest', key).then(
				//if success
				function(data)
				{
					this.$('#inputKey').val('Key Worked');
					console.log("Got Data!");
					//render page with data - similar to initial get Info
						//this.switchTo('requester', data);
						//this.$("#spinner").hide();
					//save key
						this.store('synergyKey', key);
				},
				//if failed
				function(error)
				{
					this.$('#inputKey').val('Key Failed');
					console.log("Call to synergy failed");
					//This will be taken out - only for testing local storage
					this.store('key', key);
				}
			)
		}
	},
	
	hideCompany: function(className){
			console.log("Try Slide: " + className);
			this.$("." + className).slideToggle();
			//this.$(".icon-minus, .icon-plus").toggleClass("icon-minus icon-plus");
			this.$("." + className + "mathSymbol").toggleClass("icon-minus icon-plus");
	},

    showInfo: function(data) {
	  
	  
	  if(this.store('key'))
		  var key = this.store('key');
	  
	  console.log("Key is: " + key);
	  
	  this.ajax('orgGetRequest', key).then(
				//if success
				function(data)
				{
					console.log("Got Data!");
					//render page with data - similar to initial get Info
					this.switchTo('requester', data);
					this.$("#spinner").hide();
				},
				//if failed
				function(error)
				{
					console.log("Call to synergy failed");
					//this.switchTo('error');
					//2 below for testing
					this.switchTo('requester', data);
					this.$("#spinner").hide();
				}
			) ;
			/*
      this.formatDates(data);
      if (data.user.organization_id == null) {
        this.switchTo('requester', data);
      } else {
        this.ajax('orgGetRequest', data.user.organization_id).then(
    	  function(org_data) {
			var testOrgs = {orgs: ["Sunny","InternsRUs","YoYoYo"]};
    		data.user.organization_name = org_data.organization.name;
			//replaced data
    		this.switchTo('requester', testOrgs);
			this.$("#spinner").hide();
    	  },
    	  function() {
    		this.showError();
    	  }
        );
      }*/
    },

    showError: function() {
      this.switchTo('error');
    },

  };

}());