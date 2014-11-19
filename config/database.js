module.exports = {

	// the database url to connect
	//url : 'mongodb://node:nodeuser@mongo.onmodulus.net:27017/uwO3mypu'
	//url : 'mongodb://admin:_vx3Cb-zv6VC@$OPENSHIFT_MONGODB_DB_HOST:$OPENSHIFT_MONGODB_DB_PORT/gd'
	//url : 'mongodb://admin:_vx3Cb-zv6VC@process.env.OPENSHIFT_MONGODB_DB_HOST:process.env.OPENSHIFT_MONGODB_DB_PORT/gd'
	url : 'process.env.OPENSHIFT_MONGODB_DB_URL'
}
