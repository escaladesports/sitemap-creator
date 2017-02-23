'use strict'
const sitemap = require('../index.js')



/*
sitemap({
		url: 'http://www.goalrilla.com/',
		replaceUrl: 'https://google.com/',
		content: {
			'/': {
				fileTimestamp: './package.json'
			},
			'/gamemaker': {
				fileTimestamp: (path, cb) => {
					console.log(`fileTimestamp function path: ${path}`)
					cb('./.gitignore')
				}
			},
			'/basketball-*': {
				lastMod: (path, cb) => {
					cb('test')
				}
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
*/



sitemap({
		url: `http://localhost:8080/`,
		content: {
			'/': {
				fileTimestamp: './views/index.pug',
			},
			'/product/*': {
				lastMod: (path, cb) => {
					console.log('lastMod()')
					path = path.replace('/product/', '')
					let lastMod
					try{
						const json = require(`./public/json/product/${path}.json`)
						lastMod = json.lastModified
					}
					catch(e){

					}
					cb(lastMod)
				}
			},
			'/*': {
				fileTimestamp: (path, cb) => {
					console.log('fileTimestamp()')
					path = path.replace('/', '')
					cb(`./views/${path}.pug`)
				}
			}
		},
		outputFile: './test/sitemap.xml',
		pretty: true,
		log: console.log
	})
	.then(console.log)
	.catch(console.error)