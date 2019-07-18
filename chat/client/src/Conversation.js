/* global io */

window.Conversation = class Conversation extends EventTarget {
	constructor( lang ) {
		super();
		this.socket = io();

		// Events
		this.socket.on( 'error', data => {
			// eslint-disable-next-line no-console
			console.log( data );
		} );
		this.socket.on( 'message', data => {
			if ( data.lang !== lang ) {
				this.translate( data.lang, lang, data.text )
					.fail( error => {
						// eslint-disable-next-line no-console
						console.error( error );
					} )
					.done( response => {
						const translatedText = response.data.translations[ 0 ].translatedText;
						data.originalText = data.text;
						data.text = translatedText;
						this.dispatchEvent( new CustomEvent( 'message', { detail: data } ) );
					} );
			} else {
				this.dispatchEvent( new CustomEvent( 'message', { detail: data } ) );
			}
		} );
	}

	send( message ) {
		this.socket.emit( 'message', message );
	}

	translate( sourceLang, targetLang, text ) {
		return $.ajax( {
			url: 'https://translation.googleapis.com/language/translate/v2',
			method: 'post',
			datatype: 'json',
			data: {
				key: 'API KEY HERE',
				source: sourceLang,
				target: targetLang,
				q: text
			}
		} );
	}
};
