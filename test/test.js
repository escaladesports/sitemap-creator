'use strict'
const sitemap = require('../index.js')




sitemap({
		url: 'http://www.goalrilla.com/',
		content: {
			'/product/*': {
				changeFreq: 'monthly',
				fileTimestamp: path => path.replace('/product/', '/public/json/product/') + '.json'

			},
			'/': {
				fileTimestamp: './package.json'
			}
		},
		exclude: [
			'/customer-service'
		],
		outputFile: './public/sitemap.xml',
		log: console.log,
		depth: 2,
		pretty: true
	})
	.then(console.log)
	.catch(console.error)