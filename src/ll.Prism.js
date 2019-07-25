/*!
 * LL two-way parallel translation - Prism class
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/**
 * Parallel document models with identical structure but differing content
 *
 * @class
 * @constructor
 * @param {Object} firstOptions Options for first document
 * @param {Object} firstOptions.lang Language code
 * @param {Object} firstOptions.dir Directionality
 * @param {Object} firstOptions.html Initial HTML
 * @param {Object} secondOptions Options for second document
 * @param {Object} secondOptions.lang Language code
 * @param {Object} secondOptions.dir Directionality
 * @param {Object} secondOptions.html Initial HTML
 * @param {ll.Translator} [translator] Translator object
 */
ll.Prism = function LLPrism( firstOptions, secondOptions, translator ) {
	var prism = this;

	function makeSurface( lang, dir, html, store ) {
		var doc = ve.dm.converter.getModelFromDom(
			ve.createDocumentFromHtml( html ),
			{ lang: lang, dir: dir },
			store
		);
		return new ve.dm.Surface( doc, doc.getDocumentNode(), { sourceMode: false } );
	}

	// TODO use one target with two surfaces? But then they'd share one toolbar, do we want that?
	this.firstSurface = makeSurface( firstOptions.lang, firstOptions.dir, firstOptions.html );
	this.firstDoc = this.firstSurface.getDocument();
	this.store = this.firstDoc.getStore();
	this.secondSurface = makeSurface( secondOptions.lang, secondOptions.dir, secondOptions.html, this.store );
	this.differ = new ll.Differ( this.store );
	this.secondDoc = this.secondSurface.getDocument();
	this.firstDoc.other = this.secondDoc;
	this.secondDoc.other = this.firstDoc;
	this.translator = translator || null;

	this.conflictAnnotation = ve.dm.annotationFactory.create( 'll/conflict' );
	this.conflictHash = this.firstDoc.getStore().hash( this.conflictAnnotation );
	this.updateAnnotation = ve.dm.annotationFactory.create( 'll/update' );
	this.updateHash = this.firstDoc.getStore().hash( this.updateAnnotation );

	this.firstDoc.on( 'precommit', this.applyDistorted.bind( this, this.firstDoc, this.secondDoc ) );
	this.secondDoc.on( 'precommit', this.applyDistorted.bind( this, this.secondDoc, this.firstDoc ) );
	this.changedNodePairs = new Map();
	this.throttledMaybeTranslate = ve.throttle( function ( doc, otherDoc ) {
		// Remove this postponement if ve.throttle becomes guaranteed asynchronous
		ll.setTimeout( function () {
			prism.maybeTranslate( doc, otherDoc );
		} );
	}, 50 );
	this.firstDoc.storeApprovedDescendants( this.firstDoc.getDocumentNode() );
};

/* Initialize */

OO.initClass( ll.Prism );

/* Instance methods */

/**
 * Distort an applied translation for the other doc, and apply it
 *
 * @param {ve.dm.Document} doc The lead document for this change
 * @param {ve.dm.Document} otherDoc The following document for this change
 * @param {ve.dm.Transaction} tx A transaction applying to doc
 */
ll.Prism.prototype.applyDistorted = function ( doc, otherDoc, tx ) {
	var distortion;
	if ( tx.noEcho ) {
		return;
	}
	distortion = tx.distort( doc, otherDoc );
	otherDoc.commit( distortion.tx );
	ll.setTimeout( this.flagDirty.bind( this, distortion.changedNodePairs ) );
	this.throttledMaybeTranslate( doc, otherDoc );
};

/**
 * Flag the target node as mt/approved, and mark for translation, as appropriate
 *
 * @param {Map} changedNodePairs map whose pairs are (sourceNode, targetNode)
 */
ll.Prism.prototype.flagDirty = function ( changedNodePairs ) {
	var prism = this;

	function eqJSON( val1, val2 ) {
		return JSON.stringify( val1 ) === JSON.stringify( val2 );
	}

	changedNodePairs.forEach( function ( targetNode, sourceNode ) {
		var attributeTx, sourceDirty,
			targetDoc = targetNode.getDocument();

		if ( !sourceNode.getDocument() || !targetNode.getDocument() ) {
			// Node has been detached since marking this changed pair
			return;
		}
		sourceDirty = !eqJSON(
			sourceNode.getChunked(),
			sourceNode.getLastApproved()
		);
		if (
			sourceNode.getAttribute( 'll-dirty' ) !== 'mt' &&
			sourceNode.getAttribute( 'll-dirty' ) !== 'edited' &&
			targetNode.getAttribute( 'll-dirty' ) !== 'edited'
		) {
			attributeTx = ve.dm.TransactionBuilder.static.newFromAttributeChanges(
				targetDoc,
				targetNode.getOuterRange().start,
				{ 'll-dirty': sourceDirty ? 'mt' : 'approved' }
			);
			attributeTx.noEcho = true;
			targetDoc.commit( attributeTx );
		}
		prism.changedNodePairs.set( sourceNode, targetNode );
	} );
};

/**
 * Asynchronously translate nodes marked for translation, if they are unchanged
 *
 * TODO: This doesn't always fire at sensible times. Rethink this whole methodology.
 *
 * @param {ve.dm.Document} doc The lead document XXX but "lead" is defined per CBN
 * @param {ve.dm.Document} otherDoc The following document XXX ditto
 * @return {Promise} Promise resolving when all translations are complete
 */
ll.Prism.prototype.maybeTranslate = function ( doc, otherDoc ) {
	var prism = this,
		promises = [];
	prism.changedNodePairs.forEach( function ( targetNode, sourceNode ) {
		var chunkedSource, oldChunkedSource, oldChunkedTarget, promise,
			sourceLang = doc.getLang(),
			targetLang = otherDoc.getLang();

		if (
			!sourceNode.getDocument() ||
			sourceNode.getAttribute( 'll-dirty' ) === 'mt' ||
			sourceNode.getAttribute( 'll-dirty' ) === 'edited' ||
			targetNode.getAttribute( 'll-dirty' ) === 'edited'
		) {
			prism.changedNodePairs.delete( sourceNode );
			return;
		}

		chunkedSource = sourceNode.getChunked();
		oldChunkedSource = sourceNode.getLastApproved();
		oldChunkedTarget = targetNode.getLastApproved();
		if ( !oldChunkedSource || !oldChunkedTarget ) {
			oldChunkedSource = new ll.ChunkedText( '', [], [] );
			oldChunkedTarget = new ll.ChunkedText( '', [], [] );
		}
		promise = prism.translator.translate(
			sourceLang,
			targetLang,
			[ oldChunkedSource, chunkedSource ]
		).then( function ( machineTranslations ) {
			var newTargetData, tx,
				oldMachineTranslation = machineTranslations[ 0 ],
				newMachineTranslation = machineTranslations[ 1 ];
			if ( JSON.stringify( chunkedSource ) !== JSON.stringify( sourceNode.getChunked() ) ) {
				// Source has changed since we started translating; abort
				return;
			}
			prism.changedNodePairs.delete( sourceNode );

			newTargetData = prism.adaptCorrections(
				oldMachineTranslation,
				newMachineTranslation,
				oldChunkedTarget
			);
			if ( newTargetData ) {
				tx = ve.dm.TransactionBuilder.static.newFromReplacement(
					otherDoc,
					targetNode.getRange(),
					newTargetData,
					// Remove metadata
					true
				);
				tx.noEcho = true;
				otherDoc.commit( tx );
			}
		} );
		promises.push( promise );
	} );
	return $.when.apply( $, promises );
};

/**
 * Adapt corrections from old machine translation to new machine translation
 *
 * @param {ll.ChunkedText} oldMachineTranslation Machine-translated chunked old source
 * @param {ll.ChunkedText} newMachineTranslation Machine-translated chunked current source
 * @param {ll.ChunkedText} oldTarget Human-corrected version of oldMachineTranslation
 * @return {Array} Linear data for candidate human-corrected newMachineTranslation (with our without conflicts)
 */
ll.Prism.prototype.adaptCorrections = function ( oldMachineTranslation, newMachineTranslation, oldTarget ) {
	var i, iLen, item,
		diff = ll.adaptCorrections(
			oldMachineTranslation,
			newMachineTranslation,
			oldTarget,
			this.differ
		),
		data = [];

	for ( i = 0, iLen = diff.length; i < iLen; i++ ) {
		item = diff[ i ];
		if ( item.type === 'RETAIN' ) {
			ve.batchPush( data, item.data );
		} else if ( !item.conflict ) {
			if ( iLen === 1 ) {
				ve.batchPush( data, item.insert );
			} else {
				ve.batchPush( data, ll.annotateData( this.updateHash, item.insert ) );
			}
		} else {
			ve.batchPush( data, ll.annotateData( this.conflictHash, item.remove ) );
			ve.batchPush( data, ll.annotateData( this.updateHash, item.insert ) );
		}
	}
	return data;
};
