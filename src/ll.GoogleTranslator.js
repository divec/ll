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

/* Static properties */

ll.GoogleTranslator.static.codeFromIso = {
	// Missing from ULS-data: Hmong (hmn)
	he: 'iw',
	jv: 'jw',
	'zh-hans': 'zh-CN',
	'zh-hant': 'zh-TW'
};

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

/* Static methods */

/**
 * Unescape XML-like entities such as &#39; that can appear in Google translated text
 *
 * @param {string} text Raw text from Google translate
 * @return {string} The text, with XML-like entities unescaped
 */
ll.GoogleTranslator.static.unescapeEntities = function ( text ) {
	return text.replace( /&#(\d+);/g, function ( entity ) {
		return String.fromCharCode( parseInt( entity.slice( 2, -1 ), 10 ) );
	} );
};

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

/**
 * @inheritdoc
 */
ll.GoogleTranslator.prototype.fetchLangPairsPromise = function () {
	return $.ajax( {
		url: this.url + '/language/translate/v2/languages',
		datatype: 'json',
		data: {
			key: this.key
		}
	} ).then( function ( data ) {
		var list = [],
			languages = data.data.languages.map( function ( obj ) {
				return obj.language;
			} );
		languages.forEach( function ( source ) {
			languages.forEach( function ( target ) {
				if ( source !== target ) {
					// Mapping to ISO is done by parent
					list.push( { source: source, target: target } );
				}
			} );
		} );
		return list;
	} );
};

/**
 * @inheritdoc
 */
ll.GoogleTranslator.prototype.translatePlaintext = function ( sourceLang, targetLang, texts ) {
	var translator = this,
		unescapeEntities = this.constructor.static.unescapeEntities;
	return this.constructor.static.queue( function ( resolve, reject ) {
		$.ajax( {
			url: translator.url + '/language/translate/v2',
			method: 'post',
			datatype: 'json',
			data: {
				key: translator.key,
				source: translator.getCodeFromIso( sourceLang ),
				target: translator.getCodeFromIso( targetLang ),
				q: texts
			},
			traditional: true
		} ).fail( function ( error ) {
			reject( error );
		} ).done( function ( data ) {
			resolve( data.data.translations.map( function ( translation ) {
				return unescapeEntities( translation.translatedText );
			} ) );
		} );
	} );
};
