/*!
 * LL two-way parallel translation - Prism tests
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/* global QUnit */

QUnit.module( 'll.Prism' );

QUnit.test( 'applyDistorted', function ( assert ) {
	var prism, tests, i, iLen, test;

	function getStructure( branchNode ) {
		var i, iLen, child, childItems,
			items = [];
		for ( i = 0, iLen = branchNode.children.length; i < iLen; i++ ) {
			child = branchNode.children[ i ];
			items.push( { type: child.getType() } );
			if ( !child.canContainContent() ) {
				childItems = getStructure( child );
				ve.batchSplice( items, items.length, 0, childItems );
			}
			items.push( { type: '/' + child.getType() } );
		}
		return items;
	}

	function assertEqStructure( msg ) {
		var firstStructure, secondStructure;
		firstStructure = getStructure( prism.firstDoc.getDocumentNode() );
		secondStructure = getStructure( prism.secondDoc.getDocumentNode() );
		assert.deepEqual( secondStructure, firstStructure, msg );
	}
	prism = new ll.Prism(
		{ lang: 'en', html: '<ul><li><p>cat</p></li><li><p>dog</p></li></ul>' },
		{ lang: 'cy', html: '<ul><li><p>cath</p></li><li><p>ci</p></li></ul>' }
	);
	prism.throttledMaybeTranslate = function () {};

	tests = [
		{
			msg: 'Append text',
			tx: ve.dm.TransactionBuilder.static.newFromInsertion(
				prism.firstDoc,
				6,
				[ 's' ]
			)
		},
		{
			msg: 'Break list item',
			tx: ve.dm.TransactionBuilder.static.newFromInsertion(
				prism.firstDoc,
				6,
				[
					{ type: '/paragraph' },
					{ type: '/listItem' },
					{ type: 'listItem' },
					{ type: 'paragraph' }
				]
			)
		}
	];
	for ( i = 0, iLen = tests.length; i < iLen; i++ ) {
		test = tests[ i ];
		prism.firstSurface.change( test.tx );
		assertEqStructure( test.msg );
		prism.firstSurface.change( test.tx.reversed() );
		assertEqStructure( test.msg + ' (reversed)' );
	}
} );

QUnit.test( 'markApproved', function ( assert ) {
	var prism, node1, node2;
	prism = new ll.Prism(
		{ lang: 'en', html: '<ul><li><p>cat</p></li><li><p>dog</p></li></ul>' },
		{ lang: 'cy', html: '<ul><li><p>cath</p></li><li><p>ci</p></li></ul>' }
	);
	prism.throttledMaybeTranslate = function () {};
	node1 = prism.firstDoc.getPositionFromTreePath( [ 0, 0, 0, 0 ] ).node;
	node2 = prism.secondDoc.getPositionFromTreePath( [ 0, 0, 0, 0 ] ).node;
	prism.firstSurface.markApproved( node1 );
	assert.strictEqual(
		node1.getAttribute( 'll-dirty' ),
		'approved',
		'll-dirty attribute is set on first node'
	);
	assert.strictEqual(
		node2.getAttribute( 'll-dirty' ),
		undefined,
		'll-dirty attribute is not set on second node'
	);
	assert.strictEqual(
		node1.lastApproved === node2.lastApproved,
		true,
		'lastApproved property is reference equal in both surfaces'
	);
	assert.deepEqual(
		node1.getLastApproved().toJSON(),
		{ allText: 'cat', commonAnnList: [], chunks: [] },
		'Source lastApproved'
	);
	assert.deepEqual(
		node2.getLastApproved().toJSON(),
		{ allText: 'cath', commonAnnList: [], chunks: [] },
		'Target lastApproved'
	);
} );

QUnit.test( 'maybeTranslate', function ( assert ) {
	var fakeTimer = new ll.FakeTimer(),
		done = assert.async();
	fakeTimer.hijack();
	ll.testMaybeTranslate( fakeTimer, assert ).catch( function ( err ) {
		assert.strictEqual( err, undefined, 'Exception thrown' );
	} ).always( function () {
		fakeTimer.unhijack();
		done();
	} );
} );

ll.testMaybeTranslate = function ( fakeTimer, assert ) {
	var prism, tests,
		italicAnnotation = 'h851288c946e755a1',
		promise = $.when( true );

	prism = new ll.Prism(
		{ lang: 'en', html: '<p>Abcd</p><p>E<i>f</i></p>' },
		{ lang: 'cy', html: '<p>AABBCCDD</p><p>EE<i>FF</i></p>' },
		new ll.FakeTranslator()
	);
	prism.throttledMaybeTranslate = function () {};
	tests = [
		{
			msg: 'Content replacement',
			tx: ve.dm.TransactionBuilder.static.newFromInsertion(
				prism.firstDoc,
				9,
				[
					[ 'g', [ italicAnnotation ] ],
					'h'
				]
			),
			beforeRange: new ve.Range( 11, 15 ),
			afterRange: new ve.Range( 11, 19 ),
			afterContent: [
				'E',
				'E',
				[ 'F', [ italicAnnotation ] ],
				[ 'F', [ italicAnnotation ] ],
				[ 'G', [ italicAnnotation ] ],
				[ 'G', [ italicAnnotation ] ],
				'H',
				'H'
			]
		}
	];

	tests.forEach( function ( test ) {
		var beforeContent = prism.secondDoc.data.data.slice(
			test.beforeRange.start,
			test.beforeRange.end
		);
		promise = promise.then( function () {
			prism.firstSurface.change( test.tx );
			fakeTimer.flush();
			return prism.maybeTranslate( prism.firstDoc, prism.secondDoc );
		} ).then( function () {
			assert.deepEqual(
				prism.secondDoc.data.data.slice(
					test.afterRange.start,
					test.afterRange.end
				),
				test.afterContent,
				test.msg
			);
			prism.firstSurface.change( test.tx.reversed() );
			fakeTimer.flush();
			return prism.maybeTranslate( prism.firstDoc, prism.secondDoc );
		} ).then( function () {
			assert.deepEqual(
				prism.secondDoc.data.data.slice(
					test.beforeRange.start,
					test.beforeRange.end
				),
				beforeContent,
				test.msg + ' (reversed)'
			);
		} );
	} );
	return promise;
};

QUnit.test( 'adaptCorrections', function ( assert ) {
	var tests, i, iLen, test, data,
		store = new ve.dm.HashValueStore(),
		fakePrism = {
			store: store,
			updateHash: store.hash( ve.dm.annotationFactory.create( 'll/update' ) ),
			adaptCorrections: ll.Prism.prototype.adaptCorrections,
			differ: new ll.Differ( new ve.dm.HashValueStore() )
		};

	function chunk( plaintext ) {
		return new ll.ChunkedText( plaintext, [], [] );
	}

	function ann( hash, string ) {
		return string.split( '' ).map( function ( ch ) {
			return hash ? [ ch, [ hash ] ] : ch;
		} );
	}

	tests = [
		{
			oldMt: 'No tengo ningún pantalón, Andy',
			oldTarget: 'No havo ningún pantalón, andy',
			newMt: 'No tengo ninguna camisa, Peter',
			newTarget: [].concat(
				ann( null, 'No havo ' ),
				ann( 'h41c896f073fda2a6', 'ninguna camisa' ),
				ann( null, ', ' ),
				ann( 'ha82fb0cce3bc3c12', 'Peter' )
			),
			msg: 'Partially conflicting translation'
		}
	];
	for ( i = 0, iLen = tests.length; i < iLen; i++ ) {
		test = tests[ i ];
		data = fakePrism.adaptCorrections( fakePrism.differ.diff3(
			chunk( test.newMt ).toLinearData(),
			chunk( test.oldMt ).toLinearData(),
			chunk( test.oldTarget ).toLinearData()
		) );
		assert.deepEqual( data, test.newTarget, test.msg );
	}
} );
