# sitemap-creator

A sitemap generator based on [glob](https://github.com/isaacs/node-glob) patterns. The `lastmod` tag can also be set to pull from the last modified time of a different file.

## Installation

```
$ npm install --save sitemap-creator
```

## Usage

### Basic usage

```
const sitemap = require('sitemap-creator')

sitemap({
		url: 'http://www.example.com/',
		content: {
			'/': {
				priority: 1,
				lastmod: '2015-06-27T15:30:00.000Z'
			},
			'/page/*': {
				priority: 0.7,
				changefreq: 'monthly'
			}
		},
		outputFile: './sitemap.xml'
	})
	.then(console.log)
	.catch(console.error)


```

### Dynamic timestamps:

A function or a string can be supplied as the `lastMod`.

```
sitemap({
		url: 'http://www.example.com/',
		content: {
			'/content/**/*': {
				lastMod: '2017-02-22T21:31:44.000Z'
			},
			'/page/*': {
				fileTimestamp: function(path, cb){
					const json = require('./data.json')
					cb(json.lastModified)
				}
			}
		},
	})
	.then(console.log)
	.catch(console.error)
```

### Dyanmic file timestamps:

A function or a string can be supplied as the `fileTimestamp`. This will get the last modified date from the file to use as the `lastmod` for the pages that match the glob path.

```
sitemap({
		url: 'http://www.example.com/',
		content: {
			'/content/**/*': {
				fileTimestamp: './src/content.json'
			},
			'/page/*': {
				fileTimestamp: function(path, cb){
					path = path.replace('/page/', '')
					cb('./views/' + path + '.pug')
				}
			}
		},
	})
	.then(console.log)
	.catch(console.error)
```

### Excluding paths:

```
sitemap({
		url: 'http://www.example.com/',
		exclude: [
			'/admin/**/*',
			'/login'
		],
	})
	.then(console.log)
	.catch(console.error)
```

## Options

- `url`: [**String**] The root domain to be crawled
- `replaceUrl`: [**String**] Replaces the url in the final sitemap
- `content`: [**Object**] Paths to supply tags for glob patterns
- `exclude`: [**Array**] An array of glob patterns to be excluded
- `outputFile`: [**String**] Saves out the sitemap file to path specified
- `log`: [**Function**] Pass a function to handle logs
- `depth`: [**Number**] Set to limit the number of pages crawled
- `pretty`: [**Boolean/String**] Set to prettify XML content