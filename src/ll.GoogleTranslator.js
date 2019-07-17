/*!
 * LL two-way parallel translation - Google translator class
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/**
 * Google translator
 * @abstract
 * @class
 *
 * @constructor
 * @param {Object} config
 * @param {string} config.key API key
 */
ll.GoogleTranslator = function LLGoogleTranslator( config ) {
	this.url = 'https://translation.googleapis.com';
	if ( !config.key ) {
		throw new Error( 'Need Google API key' );
	}
	this.key = config.key;
	// Parent constructor: must be called after setting .url and .key above
	ll.GoogleTranslator.super.call( this );
};

/* Initialization */

OO.inheritClass( ll.GoogleTranslator, ll.Translator );

// TODO: Make separators more robust.
// Google messes with multi-character separators, usually by adding spaces betweem unalike character
// repetitions, such as ":!!:" becoming ": !!:". Using more obscure characters works, but is still
// inherently fragile.
ll.GoogleTranslator.static.outerSeparator = '☆';
ll.GoogleTranslator.static.innerSeparator = '️★';

/**
 * List of queued tasks.
 * @static
 * @type {Array}
 */
ll.GoogleTranslator.static.stack = [];

/**
 * Interval timer for processing the queue.
 * @static
 * @type {number|null}
 */
ll.GoogleTranslator.static.timer = null;

/**
 * Process queued tasks.
 *
 * Clears the processing interval when the queue is empty.
 */
ll.GoogleTranslator.static.process = function () {
	var task = this.stack.pop();
	// Remove the rest
	this.stack.length = 0;
	if ( task ) {
		task();
		clearInterval( this.timer );
		this.timer = null;
	}
};

/**
 * Queue tasks to be processed.
 *
 * Uses an interval timer (100ms) to rate-limit tasks.
 * TODO: Consider moving this up to ll.Translator, as it seems generally useful.
 *
 * @param {Function} task Task function accepting resolve and reject functions as arguments
 * @return {$.Promise} Promised task result or error
 */
ll.GoogleTranslator.static.queue = function ( task ) {
	var deferred = $.Deferred();
	this.stack.push( task.bind( null, deferred.resolve, deferred.reject ) );
	if ( this.timer === null ) {
		this.timer = setInterval( this.process.bind( this ), 100 );
	}
	return deferred.promise();
};

/* Instance methods */

ll.GoogleTranslator.prototype.fetchLangPairsPromise = function () {
	return $.ajax( {
		url: this.url + '/language/translate/v2/languages',
		datatype: 'json',
		data: {
			key: this.key
		}
	} ).then( function ( data ) {
		var list = [];
		data.data.languages.forEach( function ( source ) {
			data.data.languages.forEach( function ( target ) {
				if ( source !== target ) {
					list.push( { source: source, target: target } );
				}
			} );
		} );
		return list;
	} );
};

/**
 * Translate plaintext
 * @param {string} sourceLang Source language code
 * @param {string} targetLang Target language code
 * @param {string} text The text to translate
 * @return {Promise} Promise resolving with the translated text
 */
ll.GoogleTranslator.prototype.translatePlaintext = function ( sourceLang, targetLang, text ) {
	var translator = this;
	return ll.GoogleTranslator.static.queue( function ( resolve, reject ) {
		$.ajax( {
			url: translator.url + '/language/translate/v2',
			method: 'post',
			datatype: 'json',
			data: {
				key: translator.key,
				source: sourceLang,
				target: targetLang,
				q: text
			}
		} ).fail( function ( error ) {
			reject( error );
		} ).done( function ( data ) {
			resolve( data.data.translations[ 0 ].translatedText );
		} );
	} );
};
