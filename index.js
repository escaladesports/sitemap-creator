'use strict'
const fs = require('fs-extra')
const url = require('url')
const request = require('request')
const minimatch = require('minimatch')
const cheerio = require('cheerio')

function getPageContent(options, pool, found, done){
	// When done parsing all pages
	if(pool.length === 0 || Object.keys(found).length >= options.depth){
		options.log('Done parsing pages...')
		return createXml(options, found, done)
	}
	const url = pool.shift()
	options.log(`Requesting: ${url} ...`)
	request(url, (err, res, page) => {
		if(err) return done(err)
		if(res.statusCode !== 200) return done(`Status code: ${res.statusCode}`)
		getLinks(options, url, page, pool, found, done)
	})
}

function getLinks(options, uri, page, pool, found, done){
	const $ = cheerio.load(page)
	const linkEls = $('a[href]')
	let progress = 0

	linkEls.each(function(){
		let link = $(this).attr('href')
		link = url.resolve(uri, link)
		const path = url.parse(link).path
		if(
			// If link is from same domain
			link.indexOf(options.url) === 0 &&
			// If link is not on exclude list
			!excluded(options, path) &&
			// If link hasn't been added yet
			!(link in found)
		){
			found[link] = true
			let meta = $('meta[http-equiv="last-modified"]') || false
			if(meta){
				meta = meta.attr('http-equiv')
			}
			timestamp(options, path, meta, (err, res) => {
				if(err) done(err)
				else{
					found[link] = res
					pool.push(link)
				}
				onProgress()
			})
		}
		else{
			onProgress()
		}
	})

	function onProgress(){
		progress++
		if(progress >= linkEls.length){
			// Get next page
			getPageContent(options, pool, found, done)
		}
	}
}


function excluded(options, link){
	if(!options.exclude) return false
	for(let i in options.exclude){
		if(minimatch(link, options.exclude[i])){
			return true
		}
	}
	return false
}



function createXml(options, found, done){
	let xml = [
		'<?xml version="1.0" encoding="utf-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
	]
	let depth = ''
	let newLine = ''
	if(options.pretty){
		depth = (typeof options.pretty === 'string') ? options.pretty : '\t'
		newLine = '\n'
	}
	for(let url in found){
		let displayUrl = url
		if(options.replaceUrl){
			displayUrl = displayUrl.replace(options.url, options.replaceUrl)
		}
		let str = [ `${depth}${depth}<loc>${displayUrl}</loc>` ]
		if(typeof found[url] === 'object'){
			for(let i in found[url]){
				const tag = i.toLowerCase()
				str.push(`${depth}${depth}<${tag}>${found[url][i]}</${tag}>`)

			}
		}
		str = str.join(newLine)
		xml.push(`${depth}<url>${newLine}${str}${newLine}${depth}</url>`)
	}
	xml.push('</urlset>')
	xml = xml.join(newLine)

	if(!options.outputFile){
		return done(false, xml)
	}

	fs.outputFile(options.outputFile, xml, err => {
		if(err) done(err, xml)
		else done(false, xml)
	})

	
}




function timestamp(options, page, meta, done){
	const rules = options.content
	if(!rules){
		if(meta){
			done(false, { lastMod: meta })
		}
		else{
			done(false, true)
		}
		return
	}


	for(let glob in rules){
		// If rules match
		if(minimatch(page, glob)){
			const obj = Object.assign({}, rules[glob])
			if(meta){
				obj.lastMod = meta
				return done(false, obj)
			}
			// If it's mapped to a file, get lastMod date from file
			let val
			if(val = getCamelCase(obj, 'fileTimestamp')){
				getFilePath(page, val)
					.then(getModifiedDate)
					.then(modDate => {
						obj.lastMod = modDate
						done(false, obj)
					})
					.catch(done)
			}
			else if(val = getCamelCase(obj, 'lastMod')){
				getLastMod(page, val)
					.then(modDate => {
						obj.lastMod = modDate
						done(false, obj)
					})
					.catch(done)
			}
			else{
				done(false, obj)
			}
			return
		}
	}
	// If no match
	done(false, true)
}


function getCamelCase(obj, camel){
	let val = false
	if(obj[camel]){
		val = obj[camel]
		delete obj[camel]
	}
	else{
		const lower = camel.toLowerCase()
		if(obj[lower]){
			delete obj[lower]
		}
	}
	return val
}


function getFilePath(urlPath, filePath){
	return new Promise((resolve, reject) => {
		if(typeof filePath === 'string') return resolve(filePath)
		filePath(urlPath, resolve)
	})
}
function getModifiedDate(file){
	return new Promise((resolve, reject) => {
		fs.stat(file, (err, stats) => {
			if(err){
				reject(err)
			}
			else{
				resolve(new Date(stats.mtime).toISOString())
			}
		})
	})
}


function getLastMod(urlPath, lastMod){
	return new Promise((resolve, reject) => {
		if(typeof lastMod === 'string'){
			resolve(lastMod)
		}
		else{
			lastMod(urlPath, resolve)
		}
	})
}



const defaults = {
	log: () => {}
}

module.exports = options => {
	options = Object.assign({}, defaults, options)

	options.log('Starting...')

	return new Promise((resolve, reject) => {
		const pool = [ options.url ]
		const found = { }
		
		// Start
		getPageContent(options, pool, found, (err, obj) => {
			if(err) reject(err)
			else resolve(obj)
		})
	})

}