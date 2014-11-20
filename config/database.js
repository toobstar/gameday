module.exports = {

	// the database url to connect																		

// mongodb://node:node@mongo.onmodulus.net:27017/uwO3mypu

	url : process.env.OPENSHIFT_MONGODB_DB_HOST?
		('mongodb://admin:_vx3Cb-zv6VC@' + process.env.OPENSHIFT_MONGODB_DB_HOST + ':' + process.env.OPENSHIFT_MONGODB_DB_PORT + '/gd'):
		('mongodb://127.0.0.1:27017/gd')
	//url : 'process.env.OPENSHIFT_MONGODB_DB_URL'
}
