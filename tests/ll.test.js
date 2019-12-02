/*!
 * LL two-way parallel translation - tests
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

QUnit.module( 'll' );

QUnit.test( 'getTokens', function ( assert ) {
	var i, iLen, tests, test;
	tests = [
		{
			text: 'foo bar baz',
			tokens: [ 'foo', ' ', 'bar', ' ', 'baz' ],
			msg: 'Simple basic Latin'
		},
		{
			text: '\n  "foo, \t bar" - baz? ',
			tokens: [ '"', 'foo', ',', ' ', 'bar', '"', ' ', '-', ' ', 'baz', '?' ],
			msg: 'Non-canonical spaces'
		},
		{
			text: '有17個學生，知道嗎？',
			tokens: [ '有', '17', '個', '學', '生', '，', '知', '道', '嗎', '？' ],
			msg: 'Han'
		}
	];
	for ( i = 0, iLen = tests.length; i < iLen; i++ ) {
		test = tests[ i ];
		assert.deepEqual(
			ll.getTokens( test.text ),
			test.tokens,
			test.msg
		);
	}
} );

QUnit.test( 'adaptAnnotationsWithModifiedTargets', function ( assert ) {
	var target = ll.adaptAnnotationsWithModifiedTargets(
		new ll.ChunkedText(
			'It is a big red Box',
			[ 'ccc' ],
			[
				{ start: 0, text: 'It', annList: [ 'ccc', 'iii' ] },
				{ start: 12, text: 'red', annList: [ 'ccc', 'rrr' ] },
				{ start: 16, text: 'Box', annList: [ 'ccc', 'bbb' ] }
			]
		),
		'Es una gran Caja roja',
		[
			'Es una gran Caja roja',
			'Es una gran Caja ROJA',
			'Es una gran CAJA roja'
		]
	);
	assert.deepEqual( target.toJSON(), {
		allText: 'Es una gran Caja roja',
		commonAnnList: [ 'ccc' ],
		chunks: [
			{ start: 12, text: 'Caja', annList: [ 'ccc', 'bbb' ] },
			{ start: 17, text: 'roja', annList: [ 'ccc', 'rrr' ] }
		]
	} );
} );

QUnit.test( 'annotateDataInPlace / unannotateDataInPlace', function ( assert ) {
	var origData, expectedData, data;
	origData = [
		{ type: 'paragraph' },
		'a',
		[ 'b', [ 'qqq' ] ],
		{ type: 'inlineImage' },
		{ type: '/inlineImage' },
		'c',
		[ 'd', [ 'qqq' ] ],
		{ type: 'inlineImage', annotations: [ 'rrr' ] },
		{ type: '/inlineImage' },
		'e',
		'f',
		{ type: '/paragraph' }
	];
	expectedData = [
		{ type: 'paragraph' },
		'a',
		[ 'b', [ 'sss', 'qqq' ] ],
		{ type: 'inlineImage', annotations: [ 'sss' ] },
		{ type: '/inlineImage' },
		[ 'c', [ 'sss' ] ],
		[ 'd', [ 'sss', 'qqq' ] ],
		{ type: 'inlineImage', annotations: [ 'sss', 'rrr' ] },
		{ type: '/inlineImage' },
		[ 'e', [ 'sss' ] ],
		'f',
		{ type: '/paragraph' }
	];

	data = ve.copy( origData );
	ll.annotateDataInPlace( 'sss', data, 2, 10 );
	assert.deepEqual( data, expectedData, 'Annotate a range' );
	ll.unannotateDataInPlace( 'sss', data, 2, 10 );
	assert.deepEqual( data, origData, 'Unannotate a range' );
} );
