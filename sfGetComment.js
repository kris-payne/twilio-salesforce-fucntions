const got = require("got");
exports.handler = function(context, event, callback) {
    let caseID = event.caseID;
	console.log(`caseID: ${caseID}`);
	let auth_url = "https://login.salesforce.com/services/oauth2/token";
	let client_id = process.env.SFDC_CLIENT_ID;
	let client_secret = process.env.SFDC_CLIENT_SECRET;
	let username = process.env.SFDC_USERNAME;
	let password = process.env.SFDC_PASSWORD;
	let grant_type = "password";
	console.log("event: " + JSON.stringify(event));

	let query_url = "https://" + process.env.SFDC_INSTANCE_URL + "/services/data/v29.0/query/";
	
	let query =
		"Select Id, ParentId, Type, Title, Body, CommentCount, LikeCount, LinkUrl, RelatedRecordId, CreatedDate FROM feeditem fi WHERE Type='TextPost' and";
	
	let query_lookup = " ParentId='" + caseID + "'";
	
	query = query + query_lookup;
	console.log(query);
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
			body: auth_params
		})
		.then(function(response) {
	        console.log('here1');
			let token = response.body.access_token;
			got(query_url, {
				query: { q: query },
				json: true,
				headers: { Authorization: "Bearer " + token }
			})
				.then(function(response) {
				    console.log('here2');
				    if (response.body.records.length > 0) {
				        console.log(response.body.records[0].Body);
				        console.log("returned a case");
						console.log(response.body.records[0]);
						callback(null, {
							body: response.body.records[0].Body
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