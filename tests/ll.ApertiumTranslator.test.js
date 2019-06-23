/*!
 * LL two-way parallel translation - ApertiumTranslator tests
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/* global QUnit */

QUnit.module( 'll.ApertiumTranslator' );

QUnit.test( 'translate', function ( assert ) {
	var blank, source, expect, translator,
		done = assert.async();

	blank = new ll.ChunkedText( '', [], [] );
	source = new ll.ChunkedText(
		'It is a big red Box',
		[ 'ccc' ],
		[
			{ start: 0, text: 'It', annList: [ 'ccc', 'iii' ] },
			{ start: 12, text: 'red', annList: [ 'ccc', 'rrr' ] },
			{ start: 16, text: 'Box', annList: [ 'ccc', 'bbb' ] }
		]
	);
	expect = new ll.ChunkedText(
		'Es una gran Caja roja',
		[ 'ccc' ],
		[
			{ start: 12, text: 'Caja', annList: [ 'ccc', 'bbb' ] },
			{ start: 17, text: 'roja', annList: [ 'ccc', 'rrr' ] }
		]
	);
	translator = new ll.ApertiumTranslator( 'http://dummy/translate' );

	assert.throws(
		function () { translator.translate( 'unknown-lang', 'es', [] ); },
		/^Error: Unsupported language code/,
		'Throws on invalid source language'
	);

	assert.throws(
		function () { translator.translate( 'en', 'unknown-lang', [] ); },
		/^Error: Unsupported language code/,
		'Throws on invalid target language'
	);

	$.ajax = ll.fakeAjaxApertium;
	ll.fakeAjaxApertiumMap = {
		'': '',
		':!!:': ':!!:',
		':!!!:': ':!!!:',
		'It is a big red Box': 'Es una gran Caja roja',
		'IT is a big red Box': 'Es una gran Caja roja',
		'It is a big RED Box': 'Es una gran Caja ROJA',
		'It is a big red BOX': 'Es una gran CAJA roja'
	};
	translator.translate( 'en', 'es', [ blank, source ] ).then( function ( target ) {
		assert.deepEqual( target[ 0 ].toJSON(), blank.toJSON(), 'Blank text' );
		assert.deepEqual( target[ 1 ].toJSON(), expect.toJSON(), 'Annotated text' );
	} ).fail( function ( err ) {
		assert.deepEqual( err, undefined, 'Translation error' );
	} ).always( function () {
		$.ajax = ll.ajaxReal;
		done();
	} );
} );
