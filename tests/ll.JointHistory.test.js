/*!
 * LL two-way parallel translation - JointHistory tests
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/* global QUnit */

QUnit.module( 'll.JointHistory' );

QUnit.test( 'pushTransactionPair+pairAt', function ( assert ) {
	var jointHistory, tx1, tx2, tx3,
		prism = new ll.Prism(
			{ lang: 'en', html: '<p>one</p>' },
			{ lang: 'cy', html: '<p>un</p>' }
		),
		doc1 = prism.firstDoc,
		doc2 = prism.secondDoc;

	tx1 = ve.dm.Transaction.static.deserialize(
		[ 3, [ '', [ { type: '/paragraph' }, { type: 'paragraph' } ] ], 4 ]
	);
	tx2 = ve.dm.Transaction.static.deserialize(
		[ 3, [ '', [ { type: '/paragraph' }, { type: 'paragraph' } ] ], 3 ]
	);

	jointHistory = new ll.JointHistory( doc1, doc2 );
	jointHistory.pushTransactionPair( tx1, tx2 );

	assert.deepEqual(
		jointHistory.transactions[ 1 ].operations,
		tx1.operations.concat( { type: 'retain', length: 7 } ),
		'Joint history tx1'
	);
	assert.deepEqual(
		jointHistory.transactions[ 2 ].operations,
		[ { type: 'retain', length: 10 } ].concat( tx2.operations ),
		'Joint history tx2'
	);

	assert.deepEqual(
		jointHistory.pairAt( 1 )[ 0 ].operations,
		tx1.operations,
		'Retrieve tx1'
	);
	assert.deepEqual(
		jointHistory.pairAt( 1 )[ 1 ].operations,
		[ { type: 'retain', length: 6 } ],
		'Retain on doc2 corresponding to tx1'
	);
	assert.deepEqual(
		jointHistory.pairAt( 2 )[ 1 ].operations,
		tx2.operations,
		'Retrieve tx2'
	);
	assert.deepEqual(
		jointHistory.pairAt( 2 )[ 0 ].operations,
		[ { type: 'retain', length: 9 } ],
		'Retain on doc1 corresponding to tx2'
	);
	tx3 = ve.dm.Transaction.static.deserialize(
		[ 9, [ 'x', '' ], 8 ]
	);
	assert.throws( function () {
		jointHistory.pushTransaction( tx3 );
	}, Error, 'pushTransaction guards against replacement over document boundary' );

	assert.deepEqual(
		[ jointHistory.length1AtIndex, jointHistory.length2AtIndex ],
		[ [ 7, 9, 9 ], [ 6, 6, 8 ] ],
		'Lengths at index'
	);
	ve.dm.Change.prototype.pushTransaction.call( jointHistory, tx3 );
	assert.throws( function () {
		jointHistory.pairAt( 3 );
	}, Error, 'pairAt detects replacement over document boundary' );
} );
