'use strict'
const fs = require('fs-extra')
const url = require('url')
const request = require('request')
const minimatch = require('minimatch')
const cheerio = require('cheerio')

function getPageContent(options, pool, found, done){
	console.log('getPageContent()')
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
	console.log('getLinks()')
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
			let meta = $('meta[http-equiv="last-modified"]') || false
			if(meta){
				meta = meta.attr('http-equiv')
			}
			timestamp(options, path, meta, (err, res) => {
				console.log('timestamp done...')
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
			console.log('Progress done!')
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
		let str = [ `${depth}${depth}<loc>${url}</loc>` ]
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
	console.log('timestamp()')
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
			if(obj.fileTimestamp){
				const fileTimestamp = obj.fileTimestamp
				delete obj.fileTimestamp
				const file = (typeof fileTimestamp === 'function') ? fileTimestamp(page) : fileTimestamp
				fs.stat(file, (err, stats) => {
					if(err){
						console.error(err)
						done(false, obj)
					}
					else{
						obj.lastMod = new Date(stats.mtime).toISOString()
					}
					done(false, obj)
				})
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