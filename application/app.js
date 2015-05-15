(function() {

  return {
	
	loading: false,
	
    events: {
      'userGetRequest.done': 'this.showInfo',
      'userGetRequest.fail': 'this.showError',
      'app.activated':'getInfo',
	  'click' : function(){ console.log("Clikcl worked");},
	  'click .genCompany': function(e){
		  console.log("Hiding");
		  console.log(e.currentTarget.id);
		  this.hideCompany(e.currentTarget.id);
	  },
	  'submit #submitButton' : function(e){
		  console.log("submit Button hit");
		  //get e.value and log
	  }
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
	
	hideCompany: function(className){
			console.log("Try Slide: " + className);
			this.$("." + className).slideToggle();
			//this.$(".icon-minus, .icon-plus").toggleClass("icon-minus icon-plus");
			this.$("." + className + "mathSymbol").toggleClass("icon-minus icon-plus");
	},

    showInfo: function(data) {

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
      }
    },

    showError: function() {
      this.switchTo('error');
    },

  };

}());