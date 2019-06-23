/*!
 * LL two-way parallel translation - test utilities
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

ll.realAjax = $.ajax;
ll.fakeAjaxApertiumMap = {};
ll.fakeAjaxApertium = function ( req ) {
	var resLines;
	resLines = req.data.q.split( /\n/ ).map( function ( qLine ) {
		var resLine = ll.fakeAjaxApertiumMap[ qLine ];
		if ( resLine === undefined ) {
			throw new Error( 'Unsupported query contents: "' + qLine + '"' );
		}
		return resLine;
	} );
	return $.when( { responseData: { translatedText: resLines.join( '\n' ) } } );

};

/**
 * Fake translator that upper-cases and doubles each char
 *
 * Will choke horribly on grapheme clusters, surrogates or even just ß.
 * @constructor
 */
ll.FakeTranslator = function LLFakeTranslator() {
};

OO.inheritClass( ll.FakeTranslator, ll.Translator );

ll.FakeTranslator.prototype.translate = function ( sourceLang, targetLang, chunkedList ) {
	function ucDouble( plaintext ) {
		return plaintext.toUpperCase().split( '' ).map( function ( ch ) {
			return ch + ch;
		} ).join( '' );
	}
	return $.when( chunkedList.map( function ( chunked ) {
		return new ll.ChunkedText(
			ucDouble( chunked.allText ),
			chunked.commonAnnList,
			chunked.chunks.map( function ( chunk ) {
				return {
					start: 2 * chunk.start,
					text: ucDouble( chunk.text ),
					annList: chunk.annList
				};
			} )
		);
	} ) );
};

ll.FakeTimer = function () {
	// Put one unused item in the pending queue, so the ids are 1-based
	this.pending = [ undefined ];
	this.flushedId = 0;
};

OO.initClass( ll.FakeTimer );

/* Static methods */

ll.FakeTimer.static.realSetTimeout = ll.setTimeout;
ll.FakeTimer.static.realClearTimeout = ll.clearTimeout;

/* Instance methods */

ll.FakeTimer.prototype.setTimeout = function ( callback ) {
	return this.pending.push( callback );
};

ll.FakeTimer.prototype.clearTimeout = function ( id ) {
	delete this.pending[ id ];
};

ll.FakeTimer.prototype.flush = function () {
	var callback;
	while ( ++this.flushedId < this.pending.length ) {
		callback = this.pending[ this.flushedId ];
		delete this.pending[ this.flushedId ];
		if ( callback === undefined ) {
			continue;
		}
		callback();
	}
};

ll.FakeTimer.prototype.hijack = function () {
	ll.setTimeout = this.setTimeout.bind( this );
	ll.clearTimeout = this.clearTimeout.bind( this );
};

ll.FakeTimer.prototype.unhijack = function () {
	ll.setTimeout = this.constructor.static.realSetTimeout;
	ll.clearTimeout = this.constructor.static.realClearTimeout;
};
