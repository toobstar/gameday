module.exports = {

	// the database url to connect
	//url : 'mongodb://node:nodeuser@mongo.onmodulus.net:27017/uwO3mypu'
	url : 'mongodb://$OPENSHIFT_MONGODB_DB_HOST:$OPENSHIFT_MONGODB_DB_PORT/'
}
