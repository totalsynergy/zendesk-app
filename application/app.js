(function() {

    //Note - API key is accessed through ADAM HANNIGAN'S ACCOUNT
    //If account removed please create API developer key to use in API requests
    return {

        emails: [],
        basicData: {},
        trelloCardNumber: 0,
        trelloAppKey: '',
        trelloUserAuth: '',
        synergyData: {},
        listNames: [],
		trelloBoards: [],
		boardsInformation: [],
		renderData: {"noTrelloKey" : false},

        //Similar to callbacks in ajax requests
		//Handle Callbacks in then() statement
		//Goes fetchAgentData > getImage > getTrelloMemberID > getTrelloInfo > showInformation.
        events: {
            'app.created': 'this.fetchAgentData',
            'click .genCompany': function(e) {
                this.hideCompany(e.currentTarget.id);
            },
            'click #submitKey': 'saveKey',
            'click #submitAuthTrello': 'saveTrelloAuth',
            'click #getCard': 'this.getCard',
            'click #postCard': 'this.createCard'
        },

        requests: {

            //Zen Desk API to get users info
            getUserInfo: function(id) {
                return {
                    url: '/api/v2/users/' + id + '.json',
                    type: 'GET',
                    dataType: 'json'
                };
            },

            //Get User Synergy Information
            synergy5Feed: function(key, email) {
                return {
                    url: 'https://beta.totalsynergy.com/internalkpi/totalsynergy/summary/zendeskfeed?internal-token=' + key,
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        "Email": email
                    }
                };
            },

            //Post Trello Card to listID
            postCard: function(card, appKey, userToken, idList) {
                return {
                    url: 'https://api.trello.com/1/lists/' + idList + '/cards?name=' + card.name + '&desc=' + card.desc + '&due=' + card.due + '&key=' + appKey + '&token=' + userToken,
                    type: 'POST'
                };
            },

            //Get Trello Card using cardID
            getTrelloCard: function(cardId) {
                return {
                    url: 'https://api.trello.com/1/cards/' + cardId + '?list=true&actions=commentCard&board=true&key=' + this.trelloAppKey + '&token=' + this.trelloUserAuth,
                    type: 'GET'
                };
            },
			
			//batch call with the url concatenated with board IDS
			getTrelloLists: function(batch){
				return{
					url: 'https://api.trello.com/1/batch?urls=' + batch + '&key=' + this.trelloAppKey + '&token=' + this.trelloUserAuth,
					type: 'GET'
				};
			},
			
			getMemberTrelloBoards: function(){
				return{
					url: 'https://api.trello.com/1/tokens/' + this.trelloUserAuth+ '/member/idBoards?key=' + this.trelloAppKey + '&token=' + this.trelloUserAuth,
					type: 'GET'
				};
			},

            //Retrieve Synergy Keys - Trello Application and Syn 5 Beta
            getSynergyKey: function(dailyCode) {
                return {
                    url: 'https://beta.synergycloudapp.com/totalsynergy/InternalKpi/Home/keys?codefortoday=' + dailyCode,
                    type: 'GET',
                    dataType: 'json'
                };
            },

            //Save Keys to Account API
            saveKeys: function(synKey, tAppKey, id) {
                return {
                    url: '/api/v2/users/' + id + '.json',
                    type: 'PUT',
                    data: {
                        "user": {
                            "user_fields": {
                                "synergy_5_key": synKey,
                                "trello_application_key": tAppKey
                            }
                        }
                    }
                };
            },

            //Save user Token to Account API
            storeTrelloAuth: function(authKey, id) {
                return {
                    url: '/api/v2/users/' + id + '.json',
                    type: 'PUT',
                    data: {
                        "user": {
                            "user_fields": {
                                "trello_user_token": authKey
                            }
                        }
                    }
                };
            }

        },

        //Access the current user's fields
        fetchAgentData: function() {
			this.renderData = {};
            this.ajax('getUserInfo', this.currentUser().id()).then(
                function(data) {

                    var fields = data.user.user_fields;

                    this.synergyKey = fields.synergy_5_key;
                    this.trelloAppKey = fields.trello_application_key;
					
					if(this.trelloAppKey && this.trelloAppKey !== ''){
						this.renderData.trelloAppKey = this.trelloAppKey;
					}
					
                    this.trelloUserAuth = fields.trello_user_token;

                    this.getTicketImage();

                },
                function(error) {
                    this.renderData.errorMessage = "Could Not Access ZenDesk Data API for tags/fields";
					console.log("Did Not fetch Agent Data");
                }
            );
        },
		
		//Use Zendesk API feed to get user photo
        getTicketImage: function() {
            //Regardless of whether we get image still try get rest of information
            this.ajax('getUserInfo', this.ticket().requester().id()).then(
                //success
                function(d) {
                    if (d.user.photo)
                        this.renderData.basicInformation = {
                            "Name": d.user.name,
                            "Photo": d.user.photo.content_url
                        };
                    else
                        this.renderData.basicInformation = {
                            "Name": d.user.name
                        };
					
					//this.getTrelloBoards();
					this.getSynergyData();
                },
                //failed
                function(d) {
                    console.log("Did not get user info");
					this.getSynergyData();
                }
            );
        },
		
		
		getSynergyData : function(){
			this.ajax('synergy5Feed', this.synergyKey, this.ticket().requester().email()).then(
                //if success render Page
                function(data) {
                    //If email was found
                    if (data.data) {
						
						console.log("\n\n\n Successfully Got Synergy Data " + JSON.stringify(data) + "\n\n\n");
                        //Append Zendesk User info such as photo
                        var successData = data.data;
						
						this.renderData.synergyData = successData;

                    } 
					else //email was not found
                    {
						this.renderData.errorMessage = "Email Was Not Found For This User";
						console.log("Did not find user: " + JSON.stringify(data) + "with user " + this.ticket().requester().email());
                    }

                    //Remove the spinner
                    this.$("#spinner").hide();
					
					//Remove the ability to input synergy keys since they are proven correct
					this.renderData.noSynergyKey = false;
					
					this.showInfo();
					this.getTrelloBoards();
                },
                //Could not access synergy 5 feed
                function(error) {
                    this.renderData.synergyError = "Email Was Not Found For This User";
					this.renderData.noSynergyKey = true;
					this.showInfo();
                    this.$("#spinner").hide();
					this.getTrelloBoards();
                }
            );
		},
		
		getTrelloBoards: function(){
			this.ajax('getMemberTrelloBoards').then(
				function(success)
				{
					console.log("\n \n Got member info: " + JSON.stringify(success));
					//this.trelloBoards = success;
					this.getTrelloLists(success);
					
					//Trello User Auth worked so do not display the ability to enter this
					this.renderData.noTrelloKey = false;
					this.noTrelloKey = false;
				},
				function(error)
				{
					this.noTrelloKey = true;
					console.log("Failed member token fetch: " + JSON.stringify(error));
					
					//Trello User Auth Did Not Work
					this.renderData.noTrelloKey = true;
					
					this.showInfo();
				}
			);
		},
		
		getTrelloLists: function(trelloBoardIds){
			
			var url = "";
			
			for(var i = 0; i < trelloBoardIds.length; i++){
				
				if(i !== 0)
					url += ",";
				
				url += "/1/boards/" + trelloBoardIds[i] + "?lists=open";   //can change open
			}
			
			console.log("/n Url is: " + url);
			
			
			//Whether this fails or not still show the synergy organization
			this.ajax('getTrelloLists', url).then(
				function(success)
				{
					console.log("\n \n Succesffuly got batch");
					
					var boardsArray = [];
					//Sort the Board and List Information 
					for(var  i = 0; i < success.length; i++)
					{
						var board = success[i][200];
						
						var boardObject = {
							"id" : board.id,
							"name" : board.name,
							"lists" : []
						};
						
						for(var j = 0; j < board.lists.length; j++)
						{
							var list = board.lists[j];
							
							var listObject = {
								"listId" : list.id,
								"listName" : list.name,
								"listClosed" : list.closed
							};
							
							boardObject.lists.push(listObject);
						}
						
						boardsArray.push(boardObject);
						//this.boardsInformation.push(boardObject);
					}
					
					this.renderData.boards = boardsArray;
					
					console.log("\n \n Sorted Trello Lists: ");
					this.showInfo();
				},
				function(error)
				{
					console.log("Did Not get batch");
				}
			);
		},
		
        //Render Template
        showInfo: function() {
						
			var dataToPass = this.renderData;
			

            //Determines whether 'get card' or 'escalate card' shows
			var trelloCardNumber = this.ticket().customField("custom_field_22941890");
			
            if (trelloCardNumber !== '' && trelloCardNumber ){
                dataToPass.CardNumber = true;
				console.log("  \n \n Trello Card Number is not empty: " + this.ticket().customField("custom_field_22941890"));
			}
			
			console.log("\n \n \n Showing Info\n \n \n");
            this.switchTo('requester', dataToPass);
        },

        //Save Keys to User API
        saveKey: function() {

            var dailyCode = this.$('#inputKey').val();

            //Test if user accidentally presses button without typing anything
            if (dailyCode !== '') {
                this.ajax('getSynergyKey', dailyCode).then(
                    //Daily Code Worked
                    function(d) {
                        //If key properly worked length will be > 0
                        if (d.data) {
                            var key = '';
                            var trelloAppKey = '';
                            console.log(JSON.stringify(d));

                            //Loop through and match keys
                            for (var i = 0; i < d.data.length; i++) {
                                if (d.data[i].Key == "Synergy 5 Key") {
                                    console.log("Matched");
                                    key = d.data[i].Value;
                                }
                                if (d.data[i].Key == "Trello Application Key") {
                                    console.log("Matched Trello");
                                    trelloAppKey = d.data[i].Value;
                                }
                            }

                            //Now Save these individual keys to user API
                            this.sendKeyToUserAPI(key, trelloAppKey);
                        } else
                            this.$('#inputKey').val('Key Failed');
                    },
                    //Daily Code Did Not Work
                    function(d) {
                        this.$('#inputKey').val('Key Failed');
                    }
                );

            }
        },

        //Send Synergy/Trello Application Key to User API
        sendKeyToUserAPI: function(synKey, trelloAppKey) {
            this.ajax('saveKeys', synKey, trelloAppKey, this.currentUser().id()).then(
                //keys saved 
                function(data) {
                    this.$('#inputKey').val('Key Worked');
					this.fetchAgentData();
                },
                //keys not saved
                function(error) {
                    this.$('#inputKey').val('Key Failed');
                }
            );
        },

        //Save trello user token to user API
        saveTrelloAuth: function() {

            var auth = this.$('#inputTrelloAuth').val();

            //Prevents User accidentally clicking button and saving key
            if (auth !== '') {
                this.ajax('storeTrelloAuth', auth, this.currentUser().id()).then(
                    //key saved
                    function(data) {
                        this.$('#inputTrelloAuth').val('Key Saved');
                    },
                    //something went wrong
                    function(error) {
                        this.$('#submitAuthTrello').val('Key Not Saved');
                    }
                );
            }
        },

        //Slides Companies Up and Down for viewing
        //N.B using quicklinks as ID since this is only unique field
        hideCompany: function(className) {

            //Cut and Slice string due to jquery searching '/' issues
            var name = className.toString();
            name = name.substr(8);

            //Difficulties with forward slash
            this.$("div[class*='Synergy/" + name + "']").slideToggle();
            this.$("i[class*='Synergy/" + name + "mathSymbol']").toggleClass("icon-minus icon-plus");
        },

        //When problem occurs, render the error template
        showError: function() {
            this.switchTo('error');
        },

        getCard: function() {

            this.$("#getCard").text("Loading...");

            //Get the trello card id
            var cardID = this.ticket().customField("custom_field_22941890");

            this.ajax('getTrelloCard', cardID).then(
                //Trello Card Successively Gotten
                function(data) {
                    //Create Card and Store certain values
                    var card = {};
                    console.log("\n \n Card Data is: " + JSON.stringify(data));
                    card.name = data.name;
					console.log("Sorted Card");
                    card.desc = data.desc;
                    card.url = data.url;
                    card.labels = data.labels;
                    card.closed = data.closed;
                    card.percentage = data.badges.checkItemsChecked / data.badges.checkItems * 100;
					card.board = data.board.name;
					
					//Store latest comment if there is one
					if (data.actions[0] != null){
						card.comment = data.actions[0].data.text;
						card.commenter = data.actions[0].memberCreator.fullName;
					}

                    card.currentState = data.list.name;
					

                    //Append the extra information such as Zendesk Name, Image etc.
                    //var newDataToPass = this.synergyData;
                    //newDataToPass.Card = card;

					this.renderData.Card = card;
                    //Render template with trello Card
					this.showInfo();
                    //Must hide it now since rendered again
                    this.$("#getCard").hide();
                },
                //Could Not Get Trello Card - show error
                function(error) {
                    this.$("#trelloError").empty();
                    this.$("#getCard").after("<div id='trelloError'>Trello Card Number Cannot Be Found.<br>It has likely been deleted. Please reset the trelloCardNumber on the left panel if you wish to escalate the card again.</div>");
                    this.$("#getCard").hide();
                    this.$("#postCard").show();
                    console.log("Failed to get TrelloCard");
                }
            );
        },

        //Escalate Trello Card
        createCard: function() {
			
			this.$("#postCard").text("Sending...");
			console.log("CREATING LIST FOR: " + this.$("#listSelect option:selected").text() + " : " + this.$("#listSelect option:selected").val());
			
			var listId = this.$("#listSelect option:selected").val();
            var card = {};
            var ticket = this.ticket();

            //Will be changeable in the future
            card.idList = '4ff4e26b97a6411d1c3927fc';
            card.name = ticket.subject();
            card.desc = " - **Ticket Description: **" + ticket.description() + " %0A";
            card.desc += " - **Ticket Number: **" + ticket.id() + " %0A";
            card.desc += " **Priority: **" + ticket.priority() + " %0A";
            card.desc += " - **Companies: **";

            //Go through each company and append to list
			if(this.synergyData.Company){
				for (var i = 0; i < this.synergyData.Company.length; i++) {
					card.desc += this.synergyData.Company[i].CompanyName;
					if (i != this.synergyData.Company.length - 1)
						card.desc += ", ";
					else
						card.desc += " %0A";
				}
			}

            card.desc += " - **Link: ** https://totalsynergy.zendesk.com/agent/tickets/" + ticket.id() + " %0A";
            card.requester = ticket.requester();
            card.due = null;
			
			//var cardList = '5567b292253bf481c1b25bcc';
            //send card
            this.ajax('postCard', card, this.trelloAppKey, this.trelloUserAuth, listId).then(
                //Card Posted Successively > render success message
                function(data) {
                    //Save trello card id to ticket
                    this.ticket().customField("custom_field_22941890", data.id);

                    this.$("#postCard").hide();
                    this.$("#postCard").after('<p id="trelloError">Card has been sent. <br>Remember to save this ticket if you want to maintain connection to trello card.</p>');

                    //Note - User must then submit/save the ticket to save the card id
                },
                //error occurred
                function(error) {
					this.$("#postCard").text("Error!");
                    console.log("Could Not Create card");
                }
            );
        }

    };



}());