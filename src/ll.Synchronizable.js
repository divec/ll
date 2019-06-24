/*!
 * LL two-way parallel translation - Synchronizable class
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/**
 * Implementation of the ve.dm.Document/Surface interface parts used by ve.dm.Synchronizer
 *
 * @param {ll.JointHistory} jointHistory The joint history object to synchronize
 */
ll.Synchronizable = function ( jointHistory ) {
	// Mixin constructors
	OO.EventEmitter.call( this );

	this.jointHistory = jointHistory;

	this.jointHistory.connect( this, {
		append: 'onJointHistoryAppend'
	} );

	// Setup properties so jointHistory is in the right place
	this.documentModel = { completeHistory: this.jointHistory };
};

/* Events */

/**
 * @event select
 * Emitted when the selection is changed
 * XXX we can't do this without refactoring
 * @param {ve.dm.Selection} New selection, with offsets on joint linmod
 */

/**
 * @event transact
 * Emitted when a transaction is appended to the linmod
 */

/* Initialization */

ll.Synchronizable.prototype.onJointHistoryAppend = function ( tx ) {
	this.emit( 'transact', tx );
};

OO.initClass( ll.Synchronizable );
OO.mixinClass( ll.Synchronizable, OO.EventEmitter );
