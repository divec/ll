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
	this.secondSurface = makeSurface( secondOptions.lang, secondOptions.dir, secondOptions.html, this.firstDoc.getStore() );
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
 * This is fundamentally the same logic as ve.dm.Change.static.rebaseTransactions
 *
 * @param {Object} oldMachineTranslation Machine-translated chunked old source
 * @param {Object} newMachineTranslation Machine-translated chunked current source
 * @param {Object} oldTarget Human-corrected version of oldMachineTranslation
 * @return {Array|undefined} Linear data of machineTranslation2 with adapted human corrections; undefined if not adaptable
 */
ll.Prism.prototype.adaptCorrections = function ( oldMachineTranslation, newMachineTranslation, oldTarget ) {
	var m1, m2, t1, m1m2, m1t1, startToken, endToken, m2t1,
		insertion, newData;

	function annotateData( hash, data ) {
		return data.map( function ( item ) {
			if ( item.type ) {
				return item;
			}
			if ( Array.isArray( item ) ) {
				return [ item[ 0 ], [ hash ].concat( item[ 1 ] ) ];
			}
			return [ item, [ hash ] ];
		} );
	}

	m1 = ll.getTokens( oldMachineTranslation.allText );
	m2 = ll.getTokens( newMachineTranslation.allText );
	t1 = ll.getTokens( oldTarget.allText );

	m1m2 = ve.countEdgeMatches( m1, m2 );
	m1t1 = ve.countEdgeMatches( m1, t1 );

	if ( !m1m2 ) {
		// No changes: m1 and m2 are identical
		m1m2 = { start: 0, end: m1.length };
	}

	if ( !m1t1 ) {
		m1t1 = { start: 0, end: t1.length };
	}

	// Calculate replacement range in t1
	if ( m1.length - m1m2.end <= m1t1.start ) {
		startToken = m1m2.start;
		endToken = m1.length - m1m2.end;

	} else if ( m1.length - m1t1.end <= m1m2.start ) {
		startToken = m1m2.start + t1.length - m1.length;
		endToken = t1.length - m1m2.end;
	} else {
		// Conflict between the MT update and the MT correction
		m2t1 = ve.countEdgeMatches( m2, t1 );
		newData = [].concat(
			m2.slice( 0, m2t1.start ).join( '' ).split( '' ),
			annotateData(
				this.conflictHash,
				t1.slice( m2t1.start, t1.length - m2t1.end ).join( '' ).split( '' )
			),
			annotateData(
				this.updateHash,
				m2.slice( m2t1.start, m2.length - m2t1.end ).join( '' ).split( '' )
			),
			m2.slice( m2.length - m2t1.end ).join( '' ).split( '' )
		);
		return newData;
	}
	insertion = newMachineTranslation.slice(
		m2.slice( 0, m1m2.start ).join( '' ).length,
		m2.slice( 0, m2.length - m1m2.end ).join( '' ).length
	);
	newData = [].concat(
		t1.slice( 0, startToken ).join( '' ).split( '' ),
		( startToken === 0 && endToken === t1.length ) ?
			insertion.toLinearData() :
			annotateData( this.updateHash, insertion.toLinearData() ),
		t1.slice( endToken ).join( '' ).split( '' )
	);
	return newData;
};
