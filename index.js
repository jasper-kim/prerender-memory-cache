var cacheManager = require('cache-manager');

module.exports = {
	init: function() {
		this.cache = cacheManager.caching({
			store: 'memory', max: process.env.CACHE_MAXSIZE || 50, ttl: process.env.CACHE_TTL || 60/*seconds*/
		});
	},

	requestReceived: function(req, res, next) {
		const cache = this.cache;
		const submitType = req.prerender.submitType;
		
		if(submitType === "reset") {
			req.prerender.cacheHit = true;
			cache.reset();
			res.send(200, "Finish cache burster Successfully");
			console.log('All caches are cleared!');
		} else {
			cache.get(req.prerender.url, function (err, result) {	
				if(!err && result) {
					req.prerender.cacheHit = true;
					res.send(200, result);
					console.log("Cache Found!!");
					console.log("Cache gets returned!");
				} else {
					next();
				}
			});
		}
	},

	beforeSend: function(req, res, next) {	
		if (!req.prerender.cacheHit && req.prerender.statusCode == 200) {
			this.cache.set(req.prerender.url, req.prerender.content);
			console.log("Cache is created!");
		}
		next();
	}
};