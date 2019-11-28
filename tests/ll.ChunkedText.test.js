/*!
 * LL two-way parallel translation - ChunkedText tests
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

QUnit.module( 'll.ChunkedText' );

QUnit.test( 'slice', function ( assert ) {
	var chunkedText, tests, i, iLen, test;
	chunkedText = new ll.ChunkedText(
		'foo bar baz qux quux',
		[ 'h123' ],
		[
			{ start: 4, text: 'bar', annList: [ 'h123', 'h456' ] },
			{ start: 12, text: 'qux', annList: [ 'h123', 'h789' ] }
		]
	);

	tests = [
		{
			start: undefined,
			end: undefined,
			expected: chunkedText.toJSON(),
			msg: 'Complete slice'
		},
		{
			start: 4,
			end: 11,
			expected: {
				allText: 'bar baz',
				commonAnnList: [ 'h123' ],
				chunks: [
					{ start: 0, text: 'bar', annList: [ 'h123', 'h456' ] }
				]
			},
			msg: 'Slice across an annotation'
		},
		{
			start: 16,
			end: undefined,
			expected: {
				allText: 'quux',
				commonAnnList: [ 'h123' ],
				chunks: []
			},
			msg: 'Slice to end with positive start index'
		},
		{
			start: -4,
			end: undefined,
			expected: {
				allText: 'quux',
				commonAnnList: [ 'h123' ],
				chunks: []
			},
			msg: 'Slice to end with negative start index'
		},
		{
			start: -4,
			end: -1,
			expected: {
				allText: 'quu',
				commonAnnList: [ 'h123' ],
				chunks: []
			},
			msg: 'Negative start and end indexes'
		}
	];

	for ( i = 0, iLen = tests.length; i < iLen; i++ ) {
		test = tests[ i ];
		assert.deepEqual(
			chunkedText.slice( test.start, test.end ).toJSON(),
			test.expected,
			test.msg
		);
	}
} );

QUnit.test( 'toLinearData', function ( assert ) {
	var chunkedText;
	chunkedText = new ll.ChunkedText( 'foo', [], [] );
	assert.deepEqual(
		chunkedText.toLinearData(),
		[ 'f', 'o', 'o' ],
		'Unannotated text'
	);
	chunkedText = new ll.ChunkedText(
		'foo bar baz qux quux',
		[ 'h123' ],
		[
			{ start: 4, text: 'bar', annList: [ 'h123', 'h456' ] },
			{ start: 12, text: 'qux', annList: [ 'h123', 'h789' ] }
		]
	);
	assert.deepEqual(
		chunkedText.toLinearData(),
		[
			[ 'f', [ 'h123' ] ],
			[ 'o', [ 'h123' ] ],
			[ 'o', [ 'h123' ] ],
			[ ' ', [ 'h123' ] ],
			[ 'b', [ 'h123', 'h456' ] ],
			[ 'a', [ 'h123', 'h456' ] ],
			[ 'r', [ 'h123', 'h456' ] ],
			[ ' ', [ 'h123' ] ],
			[ 'b', [ 'h123' ] ],
			[ 'a', [ 'h123' ] ],
			[ 'z', [ 'h123' ] ],
			[ ' ', [ 'h123' ] ],
			[ 'q', [ 'h123', 'h789' ] ],
			[ 'u', [ 'h123', 'h789' ] ],
			[ 'x', [ 'h123', 'h789' ] ],
			[ ' ', [ 'h123' ] ],
			[ 'q', [ 'h123' ] ],
			[ 'u', [ 'h123' ] ],
			[ 'u', [ 'h123' ] ],
			[ 'x', [ 'h123' ] ]
		],
		'Annotated text with two chunks'
	);
} );
