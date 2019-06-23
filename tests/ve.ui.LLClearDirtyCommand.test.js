/*!
 * LL two-way parallel translation - LLClearDirtyCommand tests
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/* global QUnit */

QUnit.module( 've.ui.LLClearDirtyCommand' );

QUnit.test( 'clearDirty', function ( assert ) {
	var fakeTimer, prism, secondUiSurface, command, tx, node, fragment;
	fakeTimer = new ll.FakeTimer();
	fakeTimer.hijack();
	prism = new ll.Prism(
		{ lang: 'en', html: '<p></p>' },
		{ lang: 'cy', html: '<p></p>' }
	);
	prism.throttledMaybeTranslate = function () {};
	secondUiSurface = ve.init.target.addSurface( prism.secondSurface );
	command = ve.ui.commandRegistry.lookup( 'clearDirty' );
	tx = ve.dm.TransactionBuilder.static.newFromInsertion(
		prism.firstDoc,
		1,
		[ 'a', 'b', 'c' ]
	);
	prism.firstSurface.change( tx );
	fakeTimer.flush();
	prism.secondSurface.setLinearSelection( new ve.Range( 1 ) );
	node = prism.secondDoc.getDocumentNode().getChildren()[ 0 ];
	assert.strictEqual( node.getAttribute( 'll-dirty' ), 'mt', 'Tx sets ll-dirty=mt' );
	fragment = prism.secondSurface.getLinearFragment( new ve.Range( 1 ) );
	assert.strictEqual( command.isExecutable( fragment ), true, 'Command is executable' );
	command.execute( secondUiSurface );
	assert.strictEqual( node.getAttribute( 'll-dirty' ), 'approved', 'Set ll-dirty to approved' );
	assert.strictEqual( command.isExecutable( fragment ), false, 'Command is not executable' );
} );
