'use strict'

const label = /#label(?:\/.+){2}/,
	inbox = /#(inbox|imp|al{2})\/.+/,
	urlRegex = /^https:\/\/www.facebook.com\//,
	cacheMap = new Map(),
	fetchMap = new Map()

function fetchFromBackground(path) {
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage({ path }, html => {
			if (html === undefined && chrome.runtime.lastError)
				return reject(chrome.runtime.lastError.message)

			return resolve(html)
		})
	})
}

function fetchFromElement(element) {
	if (element === null) return

	const query = element.querySelectorAll(
			'td > span > a[href^="https://www.facebook.com/nd/"]'
		),
		href = query[query.length - 1],
		path = href.href.replace(urlRegex, '')

	const parent = href.parentElement

	const maybePromise = fetchMap.get(path)
	if (maybePromise !== undefined) {
		maybePromise.then(update.bind(undefined, parent))
		fetchMap.delete(path)
		return
	}

	if (cacheMap.has(path)) update(parent, cacheMap.get(path))
	else {
		const promise = fetchFromBackground(path)
			.then(update.bind(undefined, parent))
			.then(cache.bind(undefined, path))
		fetchMap.set(path, promise)
	}
}

function update(element, text) {
	const hash = document.location.hash
	if (
		(!label.test(hash) && !inbox.test(hash)) ||
		element === undefined ||
		!text
	)
		return text

	element.innerHTML = text

	recursiveCleanStyle(element)

	return text
}

function recursiveCleanStyle(node) {
	const children = node.children
	for (let i = 0; i < children.length; ++i) {
		children[i].style = ''
		recursiveCleanStyle(children[i])
	}
}

function cache(key, html) {
	cacheMap.set(key, html)
	return html
}

let observer
function observe() {
	let div = document.querySelector('div[id=":4"] + div')
	if (div === null) {
		div = document.querySelector('div[id=":5"] + div')
		if (div === null) {
			console.warn('no div found')
			return
		}
	}

	observer = new MutationObserver(handleMutations)
	observer.observe(div, {
		subtree: true,
		childList: true,
	})
}

function handleMutations(mutations) {
	const hash = document.location.hash
	if (!label.test(hash) && !inbox.test(hash)) return

	//console.log('mutation', hash)
	for (let i = 0; i < mutations.length; ++i) {
		const mutation = mutations[i].target.querySelectorAll(
			'table[id$="email_table"]'
		)
		for (const current of mutation) {
			if (!current.classList.contains('gmail-fb--matched')) {
				current.classList.add('gmail-fb--matched')
				fetchFromElement(current)
			}
		}
	}
}

/**
 * Adds event listeners.
 *
 * @author 	Jacob Groß
 * @date   	2015-06-07
 */
function addListener() {
	window.addEventListener('load', function() {
		if (observer !== undefined) observer.disconnect()
		observe()
		window.setInterval(() => {
			cacheMap.clear()
			fetchMap.clear()
		}, 600000)
	})
}

addListener()
