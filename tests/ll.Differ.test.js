/*!
 * LL two-way parallel translation - Differ tests
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/* global QUnit */

QUnit.module( 'll.Diff' );

QUnit.test( 'diff3', function ( assert ) {
	var tests, differ, i, iLen, test, diff,
		store = new ve.dm.HashValueStore(),
		bHashArray = [ store.hash( ve.dm.annotationFactory.create( 'textStyle/bold' ) ) ],
		iHashArray = [ store.hash( ve.dm.annotationFactory.create( 'textStyle/italic' ) ) ];
	tests = [
		{
			message: 'Plaintext diff',
			o: 'It is a big cat'.split( '' ),
			a: 'It was a big kitten'.split( '' ),
			b: 'It is the big dog'.split( '' ),
			diff3: [
				[ null, [ 'I', 't', ' ' ], null ],
				[ [ 'w', 'a', 's' ], [ 'i', 's' ], null ],
				[ null, [ ' ' ], null ],
				[ null, [ 'a' ], [ 't', 'h', 'e' ] ],
				[ null, [ ' ', 'b', 'i', 'g', ' ' ], null ],
				[ [ 'k', 'i', 't', 't', 'e', 'n' ], [ 'c', 'a', 't' ], [ 'd', 'o', 'g' ] ]
			]
		},
		{
			message: 'Pure annotation diff',
			o: [ 'd', 'o', ' ', 'r', 'e', ' ', 'm', 'i', ' ', 'f', 'a', ' ', 's', 'o' ],
			a: [
				[ 'd', bHashArray ], [ 'o', bHashArray ], ' ', 'r', 'e', ' ', 'm', 'i',
				' ', 'f', 'a', ' ', [ 's', bHashArray ], [ 'o', bHashArray ]
			],
			b: [
				'd', 'o', ' ', 'r', 'e', ' ', [ 'm', iHashArray ], [ 'i', iHashArray ],
				' ', 'f', 'a', ' ', [ 's', iHashArray ], [ 'o', iHashArray ]
			],
			diff3: [
				[
					[ [ 'd', bHashArray ], [ 'o', bHashArray ] ],
					[ 'd', 'o' ],
					null
				],
				[
					null,
					[ ' ', 'r', 'e', ' ' ],
					null
				],
				[
					null,
					[ 'm', 'i' ],
					[ [ 'm', iHashArray ], [ 'i', iHashArray ] ]
				],
				[
					null,
					[ ' ', 'f', 'a', ' ' ],
					null
				],
				[
					[ [ 's', bHashArray ], [ 'o', bHashArray ] ],
					[ 's', 'o' ],
					[ [ 's', iHashArray ], [ 'o', iHashArray ] ]
				]
			]
		}
	];
	differ = new ll.Differ( store );
	for ( i = 0, iLen = tests.length; i < iLen; i++ ) {
		test = tests[ i ];
		diff = differ.diff3( test.a, test.o, test.b );
		assert.deepEqual(
			diff,
			test.diff3,
			test.message
		);
	}
} );
