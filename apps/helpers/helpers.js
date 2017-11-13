let path = require('path')
let fs = require('fs')

var createFullPath = (fullPath, callback) => {
	var parts = path.dirname(path.normalize(fullPath)).split("/"),
		working = '/',
		pathList = [];

	for(var i = 0, max = parts.length; i < max; i++) {
		working = path.join(working, parts[i]);
		
		pathList.push(working);
	}
	
	var recursePathList = function recursePathList(paths) {
		if(0 === paths.length) {
			callback(null);
			return ;
		}
	
		var working = paths.shift();
		
		try {
			path.exists(working, function(exists) {
				if(!exists) {
					try {
						fs.mkdir(working, 0755, function() {
							recursePathList(paths);
						});
					}
					catch(e) {
						callback(new Error("Failed to create path: " + working + " with " + e.toString()));
					}
				}
				else {
					recursePathList(paths);				
				}
			});
		}
		catch(e) {
			callback(new Error("Invalid path specified: " + working));
		}
	}
	
	if(0 === pathList.length)
		callback(new Error("Path list was empty"));
	else
		recursePathList(pathList);
}

module.exports = {
    createFullPath: createFullPath
}