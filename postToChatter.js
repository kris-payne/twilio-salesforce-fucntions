const got = require("got");
exports.handler = function(context, event, callback) {
    
    let auth_url = "https://login.salesforce.com/services/oauth2/token";
	let client_id = process.env.SFDC_CLIENT_ID;
	let client_secret = process.env.SFDC_CLIENT_SECRET;
	let username = process.env.SFDC_USERNAME;
	let password = process.env.SFDC_PASSWORD;
	let grant_type = "password";
	console.log("event: " + JSON.stringify(event));
    var caseID = event.caseID;
	let query_url = "https://" + process.env.SFDC_INSTANCE_URL + "/services/data/v46.0/chatter/feed-elements?feedElementType=FeedItem&subjectId="+ caseID+ "&text=New+post";
	var commentText = event.comment;
    var requestPayload = { "body" : {"messageSegments" : [{ "type" : "Text", "text" : commentText }]},"feedElementType" : "FeedItem","subjectId" : caseID};	
	console.log("requestPayload: " + requestPayload);
	var auth_params = {
		grant_type: grant_type,
		client_id: client_id,
		client_secret: client_secret,
		username: username,
		password: password
	};
	console.log('here');
	got
		.post(auth_url, {
			json: true,
			form: true,
			body: auth_params,
		})
		.then(function(response) {
	        console.log('here1');
			let token = response.body.access_token;
			got.post(query_url, {
				body: requestPayload, 
				json: true,
				headers: { Authorization: "Bearer " + token }
			})
				.then(function(response) {
				    console.log('here2');
				    callback(null, {
							result: true
					});
				})
				.catch(function(error) {
					console.log("error1");
					console.log(error);
					callback(error);
				});
		})
		.catch(function(error) {
			console.log("Error2");
			console.log(error);
			callback(error);
		});
};