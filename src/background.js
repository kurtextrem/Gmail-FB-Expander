'use strict'

/**
 *
 */
function fetchCache(url) {
	return fetch(url, {
		cache: 'force-cache',
		credentials: 'include',
		headers: {
			Connection: 'keep-alive',
			Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
			'Cache-Control': 'max-age=0',
			'viewport-width': 1920
		},
		mode: 'cors'
	}).then(checkStatus).then(toText)
}

let regexUsed = false

/**
 *
 */
function parse(text) {
	const dom = new DOMParser().parseFromString(text.replace(/<!--/g, '').replace(/-->/g, ''), 'text/html')
	const element = dom.querySelector('div[data-testid="post_message"]')

	let textToReturn = ''
	if (element === null || !element.textContent) {
		const match = text.match(/"story":{"message":{"text":"(.+?)"}?,"/) // ? grabs as little as possible.
		if (!match || match.length === 0) {
			console.warn('no match', element)
			return ''
		}
		try { textToReturn = (JSON.parse('{"text":"' + match[1].replace(/\\n/g, '<br>') + '"}')).text } // 
		catch (e) {
			console.error(e)
			textToReturn = match[1]
		}
	} else {
		textToReturn = element.innerHTML
	}

	regexUsed = true
	return textToReturn
}

/**
 *
 */
function checkStatus(response) {
	if (response.ok) return response

	const error = new Error(`HTTP Error ${response.statusText}`)
	error.status = response.statusText
	error.response = response
	console.error(error)
	throw error
}

/**
 *
 */
function toText(response) {
	return response.text()
}

/**
 *
 */
function error(e) {
	console.error(e)
	return e
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	const realPath = decodeURIComponent(request.path).replace('nd/?', '').split('&')[0]
	fetchCache('https://www.facebook.com/' + realPath)
		.then(parse)
		.then(sendResponse)
		.catch(error)

	return true
})

/**
 *
 */
function free() {
	if (!regexUsed) return

	regexUsed = false
	;/\s*/g.exec('')
}

setInterval(() => {
	free()
}, 600000)

const preconnect = document.createElement('link')
preconnect.rel = 'preconnect'
preconnect.href = 'https://www.facebook.com/'
document.head.appendChild(preconnect)
