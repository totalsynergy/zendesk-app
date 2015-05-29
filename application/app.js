(function() {

  //Note - API key is accessed through ADAM HANNIGAN'S ACCOUNT
  //If account removed please create API developer key to use in API requests
  return {
	
	emails : [],
	basicData: {},
	trelloCardNumber: 0,
	trelloAppKey : '',
	trelloUserAuth: '',
	synergyData: {},
	
	//Similar to callbacks in ajax requests
    events: {
	  'app.activated':'this.getImage',
	  'userGetRequest.done' : 'this.getCardTagNumber',
	  'getCardNumber.done' : 'this.showInfo',
	  'click .genCompany': function(e){
		  this.hideCompany(e.currentTarget.id);
	  },
	  'click #submitKey' : 'saveKey',
	  'click #submitAuthTrello' : 'saveTrelloAuth',
	  'click #getCard' : 'this.getCard',
	  'click #postCard' : 'this.createCard'
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
	  //Testing to get ticket organization data
      orgGetRequest: function(id) {
        return {
          url: '/api/v2/organizations/' + id + '.json',
          type:'GET',
          dataType: 'json'
        };
      },
	  //Get user synergy organization information
	  synergy5Feed: function(key, email) {
        return {
          url: 'https://beta.totalsynergy.com/internalkpi/totalsynergy/summary/zendeskfeed?internal-token=' + key,
          type:'POST',
          dataType: 'json',
		  data: {"Email" : email}
        };
	  },
	  //Post Trello Card to listID
	  //List ID for 2nd Level - 5567b292253bf481c1b25bcc
	  //Using boards/5567b292253bf481c1b25bcc/lists to get - could use sorting 
	  //strangely the parameters get passed in query not data body
	  postCard: function(card){
		  return{
			url: 'https://api.trello.com/1/lists/5567b292253bf481c1b25bcc/cards?name=' + card.name + '&desc=' + card.desc + '&due=' + card.due + '&key=' + this.trelloAppKey + '&token=' + this.trelloUserAuth,
			//url: 'https://api.trello.com/1/boards/Wsp49XKC/lists?key=' + this.trelloAppKey + '&token=' + this.trelloUserAuth,
			type:'POST'
		  }
      },
	  getTrelloCard: function(cardId){
		  return{
			url: 'https://api.trello.com/1/cards/' + cardId + '?key=' + this.trelloAppKey + '&token=' + this.trelloUserAuth,
			type:'GET'
		  }
	  },
	  //Get list of trello cards
	  getListOfCards: function(userToken){
		  return{
			url: 'https://api.trello.com/1/boards/Wsp49XKC/cards?key=d04c9c2bd2be123721cdbf17f78f5c20&token=' + userToken,
			type:'GET',
			dataType: 'json'
		  }
	  },
	  //Used to retrieve the synergy Key needed to access synergy 5 Feed
	  getSyn5Key: function(dailyCode){
		  return{
		    url: 'https://beta.synergycloudapp.com/totalsynergy/InternalKpi/Home/keys?codefortoday=' + dailyCode,
			type:'GET',
			dataType: 'json'
		  }
	  },
	  
	  getCardNumber: function(){
		  return{
		    url: '/api/v2/ticket_fields.json',
			type:'GET'
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
	
	//Use Zendesk API feed to get user photo
	getImage: function()
	{
		//Key information
		
		console.log("Synergy Key: " + this.store('key'));
		console.log("Trello App Key:" + this.store('trelloAppKey'));
		console.log("Trello User Key:" + this.store('trelloUserAuth'));
		
		
		//End Key Information
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

	//Attempt to get user's synergy 5 feed and display
	showInfo: function() {
		
		//will test if trello card exists
			
		
		if(this.store('key'))
		    var key = this.store('key');
		
		console.log("Make request with emails: " + this.ticket().requester().email());
	    this.ajax('synergy5Feed', key, this.ticket().requester().email()).then(
			//if success render Page
			function(data)
			{
				//N.B This will still return a success if the user does not have email > Make another
				//template to handle this error
				
				//Append Zendesk User info such as photo
				var dataToPass = data.data;
				dataToPass.Basic = this.basicData;
				
				//determines whether to pass get card or escalte card
				if(this.ticket().customField("custom_field_22941890") != '')
					dataToPass.CardNumber = true;
				
				this.synergyData = dataToPass;
				this.switchTo('requester', dataToPass);
				
				//Remove the spinner
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
	
	//User Input to save daily code for synergy - if success will save key in local storage
	saveKey: function(){
		var dailyCode = this.$('#inputKey').val();
		console.log("Key: " + dailyCode);
		
		//Test if user accidentally presses button without typing anything
		if(key != '')
		{
			this.ajax('getSyn5Key', dailyCode).then(
				//got key
				function(d)
				{
					if(d.data.length > 0){
						var key = '';
						var trelloAppKey = '';
						console.log(JSON.stringify(d));
						//Loop through to find just in case there is a change
						for(var i = 0; i < d.data.length; i++)
						{
							if(d.data[i].Key == "Synergy 5 Key"){
								console.log("Matched");
								key = d.data[i].Value;						
							}
							if(d.data[i].Key == "Trello Application Key"){
								console.log("Matched Trello");
								trelloAppKey = d.data[i].Value;						
							}
						}
						console.log("Storing synergyKey: " + key);
						this.store('synergyKey', key);
						console.log("Storing trello app key: " + trelloAppKey);
						this.store('trelloAppKey', trelloAppKey);
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

		}
	},
	
	//Save trello authorization in local storage
	saveTrelloAuth: function(){
		var auth = this.$('#inputTrelloAuth').val();
		console.log("Auth: " + auth);
		
		if(auth != '')
		{
			this.store('trelloUserAuth', auth);
		}
	},
	
	//Slides Companies Up and Down for viewing
	//Using QuickLinks as Dynamic Class Name Because it has no spaces and unique
	hideCompany: function(className){
		
			//Cut and Slice string due to jquery searching '/' issues
			var name = className.toString();
			name = name.substr(8);
			this.$("div[class*='Synergy/" + name + "']").slideToggle();

			console.log("Toggle: " + "Synergy/" + name + "mathSymbol");
			
			//for issues with the forward slash using different jquery selectors
			this.$("i[class*='Synergy/" + name + "mathSymbol']").toggleClass("icon-minus icon-plus");
	},

	//When problem occurs, render the error template
    showError: function() {
      this.switchTo('error');
    },
	
	getCardTagNumber : function(){
		//ID 22941890
		console.log("Ticket: " + this.ticket().requester().id());
		console.log("Custom Field: " + this.ticket().customField("custom_field_22941890"));
		
		console.log("Custom Field: " + this.ticket().customField("custom_field_22941890"));		
		this.showInfo();
	},
	
	getCard : function(){
		if(this.store('trelloAppKey'))
			this.trelloAppKey = this.store('trelloAppKey');
		
		if(this.store('trelloUserAuth'))
			this.trelloUserAuth = this.store('trelloUserAuth');
		
		var cardID = this.ticket().customField("custom_field_22941890");
		
		this.ajax('getTrelloCard', cardID).then(
			//success
			function(data)
			{
				//format card for rendering
				console.log("Got card info");
				var card = {};
				console.log(JSON.stringify(data));
				card.name = data.name;
				card.desc = data.desc;
				card.url = data.url;
				card.labels = data.labels;
				card.due = data.due;
				card.closed = data.closed;
				card.percentage = data.badges.checkItemsChecked/data.badges.checkItems*100;
				var newDataToPass = this.synergyData;
				newDataToPass.Card = card;
				
				
				this.switchTo('requester', newDataToPass);
				
				//Must hide it now since rendered again
				this.$("#getCard").hide();
			},
			//failed
			function(error){
				console.log("Failed to get TrelloCard");
			}
		)
	},
	
	createCard : function(){
		
		if(this.store('trelloAppKey'))
			this.trelloAppKey = this.store('trelloAppKey');
		
		if(this.store('trelloUserAuth'))
			this.trelloUserAuth = this.store('trelloUserAuth');
		
		var card = {};
		var ticket = this.ticket();
		
		var listId = '4ff4e26b97a6411d1c3927fc';
		
		card.idList = '4ff4e26b97a6411d1c3927fc';
		card.name = ticket.subject();
		card.desc = ticket.description();
		card.requester = ticket.requester();
		card.organization = ticket.organization();
		//look into the value of the variable below
		card.due = null;
		
		//Create and format trello card
		
		
		//send card
		this.ajax('postCard', card).then(
			//posted card
			function(data)
			{
				console.log("Card Created");
				console.log("Card Posted: " + JSON.stringify(data));
				//save the card id
				//Note - User must then submit/save the ticket to save the card id
				this.ticket().customField("custom_field_22941890", data.id);
				this.$("#postCard").hide();
				
				//render new display
			},
			//error occurred
			function(error)
			{
				console.log("Could Not Create card");
			}
		);
	},
	
	
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