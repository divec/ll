/*!
 * LL two-way parallel translation - demo
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

ll.demo = {
	/* eslint-disable no-jquery/no-global-selector */
	$firstDemo: $( '.ll-demo-editor' ).eq( 0 ),
	$secondDemo: $( '.ll-demo-editor' ).eq( 1 ),
	$firstInstance: $( '.ve-instance' ).eq( 0 ),
	$secondInstance: $( '.ve-instance' ).eq( 1 ),
	translator: null
};

ll.demo.preload = function () {
	return $.getJSON( '../environment.json' )
		.fail( function () {
			ll.demo.$firstInstance.text(
				'Could not load environment.json. ' +
				'Be sure to make one using a copy of environment.json.apertium-example or environment.json.yandex-example and modify as needed.'
			);
		} )
		.done( function ( env ) {
			if ( typeof ll[ env.translatorClass ] !== 'function' ) {
				ll.demo.$firstInstance
					.text( 'Unsupported translator class: ' + env.translatorClass );
				return;
			}
			ll.demo.translator = new ll[ env.translatorClass ]( env.translatorConfig || env.translatorUrl );
		} );
};

ll.demo.setup = function () {
	/**
	 * Automatically disable spellcheck if the surface isn't in a browser supported language.
	 *
	 * This is needed because it turns out that browsers don't have spellcheck on hand for every
	 * language in existenece - fair enough - so they just use whatever spellcheck language they
	 * do have on hand for all contentEditable elements regardless of the lang attribute - WAT?!
	 *
	 * @param {ve.Surface} surface Surface to act on
	 */
	function autoDisableSpellcheck( surface ) {
		var lang = surface.getView().getDocument().getLang(),
			$root = surface.getView().$attachedRootNode,
			supported = navigator.languages.indexOf( lang ) !== -1,
			enabled = $root.prop( 'spellcheck' );
		if ( supported !== enabled ) {
			// Toggle spellcheck
			$root.prop( 'spellcheck', supported );
			// If surface is focused, cycle focus to reset the spellcheck system
			if ( $root.is( ':focus' ) ) {
				$root.trigger( 'blur' );
				$root.trigger( 'focus' );
			}
		}
	}

	return new ve.init.sa.Platform( ve.messagePaths ).getInitializedPromise()
		.fail( function () {
			ll.demo.$firstInstance.text( 'Sorry, this browser is not supported.' );
		} )
		.done( function () {
			var prism,
				firstLangOptions = [],
				secondLangOptions = [],
				firstLangDropdown = new OO.ui.DropdownWidget(),
				secondLangDropdown = new OO.ui.DropdownWidget(),
				firstTarget = new ll.init.LLTarget(),
				secondTarget = new ll.init.LLTarget();

			ll.demo.translator.getParallelLangPairsPromise().then( function ( pairs ) {
				var langList = OO.unique( pairs.map( function ( pair ) {
					return pair.source;
				} ) ).sort();
				firstLangOptions = langList.map( function ( lang ) {
					return new OO.ui.MenuOptionWidget( {
						data: lang, label: ve.init.platform.getLanguageName( lang )
					} );
				} );
				secondLangOptions = langList.map( function ( lang ) {
					return new OO.ui.MenuOptionWidget( {
						data: lang, label: ve.init.platform.getLanguageName( lang )
					} );
				} );
				firstLangDropdown.getMenu().addItems( firstLangOptions );
				secondLangDropdown.getMenu().addItems( secondLangOptions );

				firstLangDropdown.getMenu().selectItemByData( prism.firstDoc.getLang() );
				secondLangDropdown.getMenu().selectItemByData( prism.secondDoc.getLang() );
			} );

			function onSelect( changedLangDropdown, otherLangDropdown, changedTarget ) {
				ll.demo.translator.getLangPairsPromise().then( function ( langPairs ) {
					changedLangDropdown.getMenu().on( 'select', function ( i ) {
						var lang = i.getData(),
							dir = ve.init.platform.getLanguageDirection( lang ),
							surface = changedTarget.surface;
						otherLangDropdown.getMenu().getItems().forEach( function ( j ) {
							j.$element.toggleClass( 'll-language-unsupported',
								!ll.demo.translator.pairSupported( langPairs, lang, j.getData() )
							);
						} );
						// This is ugly but you are unlikely to change language mid document.
						surface.getModel().getDocument().lang = lang;
						surface.getModel().getDocument().dir = dir;
						surface.getView().getDocument().setLang( lang );
						surface.getView().getDocument().setDir( dir );
						autoDisableSpellcheck( surface );
					} );
				} );
			}

			onSelect( firstLangDropdown, secondLangDropdown, firstTarget );
			onSelect( secondLangDropdown, firstLangDropdown, secondTarget );

			ll.demo.$firstDemo.append( firstLangDropdown.$element );
			ll.demo.$secondDemo.append( secondLangDropdown.$element );

			prism = new ll.Prism(
				{
					lang: 'en',
					dir: 'ltr',
					html: [
						'<h1>Bidirectional translation</h1>',
						'<figure class="ve-align-right"><img src="images/logo.svg" width="248" height="105"><figcaption>Logo</figcaption></figure>',
						'<ul><li>You can edit text on either side.</li>',
						'<li>The edited text will be translated to the other side.</li>',
						'<li>You can correct the translation.</li>',
						'<li>Then click on “✓” to confirm the translation.</li></ul>'
					].join( '\n' )
				},
				{
					lang: 'es',
					dir: 'ltr',
					html: [
						'<h1>Traduccion bidireccional</h1>',
						'<figure class="ve-align-right"><img src="images/logo.svg" width="248" height="105"><figcaption>Logo</figcaption></figure>',
						'<ul><li>Puedes editar texto en cualquier lado.</li>',
						'<li>El texto editado será traducido al otro lado.</li>',
						'<li>Puede corregir la traducción</li>',
						'<li>Luego haga clic en “✓” para confirmar la traducción.</li>'
					].join( '\n' )
				},
				ll.demo.translator
			);
			ll.demo.$firstInstance.append( firstTarget.$element );
			ll.demo.$secondInstance.append( secondTarget.$element );
			firstTarget.clearSurfaces();
			firstTarget.addSurface( prism.firstSurface );
			secondTarget.clearSurfaces();
			secondTarget.addSurface( prism.secondSurface );

			autoDisableSpellcheck( firstTarget.getSurface() );
			autoDisableSpellcheck( secondTarget.getSurface() );
		} );
};

ll.demo.preload().then( ll.demo.setup );
