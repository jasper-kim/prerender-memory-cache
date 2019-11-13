var cacheManager = require('cache-manager');

module.exports = {
	init: function() {
		this.cache = cacheManager.caching({
			store: 'memory', max: process.env.CACHE_MAXSIZE || 1000, ttl: process.env.CACHE_TTL || 7776000/*90 days in seconds*/
		});
	},

	requestReceived: function(req, res, next) {
		const cache = this.cache;
		cache.get(req.prerender.url, function (err, result) {	
			const submitType = req.prerender.submitType;
			
			if(submitType === "reset") {
				cache.reset();
				console.log("Flushing cache!");
				res.send(200, "Deleted Successfully");
			}

			if(!err && result) {
				console.log("Cache Found!!");
				if(submitType === "delete") {
					req.prerender.cacheHit = true;
					cache.del(req.prerender.url, function (err) {
						console.log("Cached is deleted!");
						res.send(200, "Deleted Successfully");
					});
				} else if(submitType === "create" || submitType === "edit") {
					next();
				} else {
					req.prerender.cacheHit = true;
					console.log("Cache gets returned!");
					res.send(200, result);
				}
			} else if(!result && submitType === "delete") {
				console.log('Cached is "ALREADY" deleted!');
				res.send(404);
			} else {
				next();
			}
		});
	},

	beforeSend: function(req, res, next) {
		const submitType = req.prerender.submitType;
		
		if (!req.prerender.cacheHit && req.prerender.statusCode == 200) {
			this.cache.set(req.prerender.url, req.prerender.content);
			console.log("Cache is created!");
		}
		next();
	}
};