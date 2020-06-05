'use strict'

const options = {
	credentials: 'include',
	cache: 'force-cache',
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

	let text = ''
	if (element === null || !element.textContent) {
		const match = text.match('"story":{"message":{"text":"([^"]+)"')
		if (match.length === 0) {
			console.warn('no match', element)
			return ''
		}
		text = match[1]
	} else {
		text = element.innerHTML
	}

	regexUsed = true
	return text
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
