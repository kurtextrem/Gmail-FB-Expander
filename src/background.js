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
		.then(sendResponse)
		.catch(error)

	return true
})