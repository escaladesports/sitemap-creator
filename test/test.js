'use strict'
const sitemap = require('../index.js')




sitemap({
		url: 'http://www.goalrilla.com/',
		replaceUrl: 'https://google.com/',
		content: {
			'/': {
				fileTimestamp: './package.json'
			}
		},
		exclude: [
			'/customer-service'
		],
		outputFile: './test/sitemap.xml',
		log: console.log,
		depth: 2,
		pretty: true
	})
	.then(console.log)
	.catch(console.error)