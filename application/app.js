(function() {

  return {
	
	emails : [],
	basicData: {},
	trelloCardNumber: 0,
	
    events: {
	  'app.activated':'this.getImage',
	  'userGetRequest.done' : 'this.showInfo',
	  'click .genCompany': function(e){
		  console.log("Hiding");
		  console.log(e.currentTarget.id);
		  this.hideCompany(e.currentTarget.id);
	  },
	  'click #authorizeTrello' : 'this.oauthTrello',
	  'click #submitKey' : 'saveKey',
	  'click #submitAuthTrello' : 'saveTrelloAuth',
	  'click #getCard' : 'this.getCard'
    },

    requests: {
	  //Zen Desk API to get users email
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
	  synergy5Feed: function(key, email) {
        return {
          url: 'https://beta.totalsynergy.com/internalkpi/totalsynergy/summary/zendeskfeed?internal-token=' + key,
          type:'POST',
          dataType: 'json',
		  data: {"Email" : email}
        };
	  },
	  postCard: function(card){
		  return{
			url: 'https://api.trello.com/1/cards?key=' + this.trelloAppKey + '&token=' + this.trelloToken,
			type:'POST',
			dataType: 'json',
			data: card  
		  }
      },
	  getListOfCards: function(userToken){
		  return{
			  url: 'https://api.trello.com/1/boards/Wsp49XKC/cards?key=d04c9c2bd2be123721cdbf17f78f5c20&token=' + userToken,
			type:'GET',
			dataType: 'json'
		  }
	  },
	  getSyn5Key: function(dailyCode){
		  return{
		    url: 'https://beta.synergycloudapp.com/totalsynergy/InternalKpi/Home/keys?codefortoday=' + dailyCode,
			type:'GET',
			dataType: 'json'
		  }
	  }
	  
	  /* Below Code to get there multiple emails 
	  getIdentities : function(id){
		  return {
          url: '/api/v2/users/'+ id + '/identities.json',
          type:'GET',
          dataType: 'json'
        };
	  }
	  */
    },
	
	getImage: function()
	{
		this.ajax('userGetRequest', this.ticket().requester().id() ).then(
			//success
			function(d)
			{
				if(d.user.photo)
					this.basicData = {"Name" : d.user.name, "Photo" : d.user.photo.content_url};
				else
					this.basicData = {"Name" : d.user.name};
			},
			//failed
			function(d)
			{
				console.log("Did not get user info");
			}
		);
	},
	
	showInfo: function() {
		
		if(this.store('cardNumber'))
			trelloCardNumber = this.store('key');
		
		if(this.store('key'))
		    var key = this.store('key');
		
		console.log("Make request with emails: " + this.ticket().requester().email());
	    this.ajax('synergy5Feed', key, this.ticket().requester().email()).then(
			//if success
			function(data)
			{
				//Render Page
				//Can we also pass zenDesk User API for image
				var dataToPass = data.data;
				dataToPass.Basic = this.basicData;
				
				this.switchTo('requester', dataToPass);
				this.$("#spinner").hide();
			},
			//if failed
			function(error)
			{
				this.switchTo('requester', data);
				this.$("#spinner").hide();
			}
		) ;
	},

	saveKey: function(){
		var dailyCode = this.$('#inputKey').val();
		console.log("Key: " + dailyCode);
		
		if(key != '')
		{
			this.ajax('getSyn5Key', dailyCode).then(
				//got key
				function(d)
				{
					if(d.data.length > 0){
						var key = '';
						console.log(JSON.stringify(d));
						//Loop through to find just in case there is a change
						for(var i = 0; i < d.data.length; i++)
						{
							if(d.data[i].Key == "Synergy 5 Key"){
								console.log("Matched");
								key = d.data[i].Key;
								break;								
							}
						}
						this.store('synergyKey', key);
						console.log("Key: " + key);
						this.$('#inputKey').val('Key Worked');
					}
				},
				//didnt get key
				function(d)
				{
					this.$('#inputKey').val('Key Failed');
				}
			);
			/*
			this.ajax('synergy5Feed', key).then(
				//if success
				function(data)
				{
					this.$('#inputKey').val('Key Worked');

					//render page with data - similar to initial get Info
					this.switchTo('requester', data);
					this.$("#spinner").hide();
					//save key
					this.store('synergyKey', key);
				},
				//if failed
				function(error)
				{
					this.$('#inputKey').val('Key Failed');
					console.log("Call to synergy failed");
				}
			)
			*/
		}
	},
	
	saveTrelloAuth: function(){
		var auth = this.$('#inputTrelloAuth').val();
		console.log("Auth: " + auth);
		
		if(auth != '')
		{
			this.store('trelloAuth', auth);
		}
	},
	
	oauthTrello : function(){
		console.log("Lets Authorize");
		
	},
	
	//Using QuickLinks as Dynamic Class Name Because it has no spaces and unique
	hideCompany: function(className){
		
			//Cut and Slice string due to jquery searching '/' issues
			var name = className.toString();
			name = name.substr(8);
			this.$("div[class*='Synergy/" + name + "']").slideToggle();

			console.log("Toggle: " + "Synergy/" + name + "mathSymbol");
			this.$("i[class*='Synergy/" + name + "mathSymbol']").toggleClass("icon-minus icon-plus");
	},


    showError: function() {
      this.switchTo('error');
    },
	
	getCard: function(){
		console.log("Getting card");
		var auth = "empty";
		if(this.store('trelloAuth'))
		{
			var auth = this.store('trelloAuth');
		}
		console.log("Got auth: " + auth);

	}
	
	
	/* Used to retrieve Identifiers and sort them
	getEmails: function()
	{
	    //use user id for zendesk identities API request
	    this.ajax('getIdentities', this.ticket().requester().id()).then(
			function(d)
			{
				//Go through their identities and store them in email array
				console.log("Got Identities: " + JSON.stringify(d));
				var identities = d.identities;
				for(var i = identities.length - 1; i >= 0; i--)
				{
					if(identities[i].type = "email")
						this.emails.push(identities[i].value);
				}
				console.log("Emails is now: " + this.emails);
				this.showInfo();
			},
			function(d)
			{
				console.log("No identities");
			}
		);
	}
	*/

  };
  
  

}());