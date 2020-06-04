const got = require("got");

exports.handler = function(context, event, callback) {
    let auth_url = "https://login.salesforce.com/services/oauth2/token";
	let client_id = process.env.SFDC_CLIENT_ID;
	let client_secret = process.env.SFDC_CLIENT_SECRET;
	let username = process.env.SFDC_USERNAME;
	let password = process.env.SFDC_PASSWORD;
	let grant_type = "password";
	console.log("event: " + JSON.stringify(event));

	let query_url = "https://" + process.env.SFDC_INSTANCE_URL + "/services/data/v20.0/query/";
	
	let query =
		"SELECT Id,Contact.Account.Name,ReportsTo.Member_ID__c,ReportsTo.Name,FirstName,Member_ID__c,LastName,Phone,AssistantName,AssistantPhone,LoyaltyTier__c,LoyaltyPoints__c,CreatedDate,(select id, CaseNumber, subject, owner.alias from Cases where Status != 'Closed'),(select id, ActivityDate from Tasks where Status != 'Completed') FROM Contact WHERE ";
	let contact = event.contact
	contact = contact.substring(contact.indexOf(":") + 1);
	console.log(`Contact: ${contact}`)
	
	let query_lookup = "Phone = '" + contact + "'";
	if (event.id && !isNaN(event.id)) {
		query_lookup = "Member_ID__c = " + event.id;
	}
	query = query + query_lookup;
	console.log(query);
	var auth_params = {
		grant_type: grant_type,
		client_id: client_id,
		client_secret: client_secret,
		username: username,
		password: password
	};
	
	got
		.post(auth_url, {
			json: true,
			form: true,
			body: auth_params
		})
		.then(function(response) {
			let token = response.body.access_token;
			got(query_url, {
				query: { q: query },
				json: true,
				headers: { Authorization: "Bearer " + token }
			})
				.then(function(response) {
					if (response.body.records.length > 0) {
						console.log("returned a contact");
						console.log(response.body.records[0]);
						const ReportsTo = response.body.records[0].ReportsTo;
						let caseNumber = response.body.records[0].Cases.records[0].CaseNumber;
						console.log(caseNumber);
						let caseID;
						if (response.body.records[0].Cases.records[0].Id !== null) {
						    console.log("returned a case");
						    caseID = response.body.records[0].Cases.records[0].Id;
						    console.log(caseID);
						}
						else{
						    console.log("No case");
						}
						callback(null, {
							contact_id: response.body.records[0].Id,
							reportsto_id: ReportsTo ? ReportsTo.Member_ID__c : "",
							reportsto_name: ReportsTo ? ReportsTo.Name : "",
							delegate: response.body.records[0].AssistantName,
							delegate_phone: response.body.records[0].AssistantPhone,
							first_name: response.body.records[0].FirstName,
							member_id: response.body.records[0].Member_ID__c,
							last_name: response.body.records[0].LastName,
							account: response.body.records[0].Account
								? response.body.records[0].Account.Name
								: "",
							phone: response.body.records[0].Phone,
							points: response.body.records[0].LoyaltyPoints__c
								? response.body.records[0].LoyaltyPoints__c
								: 0,
							join_date: response.body.records[0].CreatedDate,
							bill_due: response.body.records[0].Tasks
								? response.body.records[0].Tasks.records[0].ActivityDate
								: "",
							tier: response.body.records[0].LoyaltyTier__c
								? response.body.records[0].LoyaltyTier__c
								: 0,
							cases: response.body.records[0].Cases,
							CaseNumber: caseNumber,
							caseID: caseID,
						});
					} else {
						console.log("no contact found:" + JSON.stringify(response.body));
						callback(null, {
							points: 0
						});
					}
				})
				.catch(function(error) {
					console.log(error);
					callback(error);
				});
		})
		.catch(function(error) {
			console.log(error);
			callback(error);
		});
};