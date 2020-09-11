'use strict'

const options = {
	cache: 'force-cache',
	credentials: 'include',
	headers: new Headers({
		Connection: 'keep-alive',
	}),
}

/**
 *
 */
function fetchCache(url) {
	return fetch(url, options).then(checkStatus).then(toText)
}

const commentOpen = /<!--/g,
	commentClose = /-->/g

let regexUsed = false

/**
 *
 */
function parse(text) {
	const dom = new DOMParser().parseFromString(text.replace(commentOpen, '').replace(commentClose, ''), 'text/html')
	const element = dom.querySelector('div[data-testid="post_message"]')

	let textToReturn = ''
	if (element === null || !element.textContent) {
		const match = text.match(/"story":{"message":{"text":"([^"]+)"/)
		if (!match || match.length === 0) {
			console.warn('no match', element)
			return ''
		}
		textToReturn = match[1]
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
	fetchCache('https://www.facebook.com/' + request.path)
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
