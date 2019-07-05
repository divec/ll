/*!
 * LL two-way parallel translation - demo
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

( function () {
	/* eslint-disable no-jquery/no-global-selector */
	var $firstDemo = $( '.ve-demo-editor' ).eq( 0 ),
		$secondDemo = $( '.ve-demo-editor' ).eq( 1 ),
		$firstInstance = $( '.ve-instance' ).eq( 0 ),
		$secondInstance = $( '.ve-instance' ).eq( 1 ),
		translator = new ll.ApertiumTranslator( 'http://localhost:2737' );

	new ve.init.sa.Platform( ve.messagePaths ).getInitializedPromise()
		.fail( function () {
			$firstInstance.text( 'Sorry, this browser is not supported.' );
		} )
		.done( function () {
			var prism,
				firstLangOptions = [],
				secondLangOptions = [],
				firstLangDropdown = new OO.ui.DropdownWidget(),
				secondLangDropdown = new OO.ui.DropdownWidget(),
				firstTarget = new ll.init.LLTarget(),
				secondTarget = new ll.init.LLTarget();

			translator.getParallelLangPairsPromise().then( function ( pairs ) {
				var langList = OO.unique( pairs.map( function ( pair ) {
					return pair.source;
				} ) ).sort();
				firstLangOptions = langList.map( function ( lang ) {
					return new OO.ui.MenuOptionWidget( { data: lang, label: ve.init.platform.getLanguageName( lang ) } );
				} );
				secondLangOptions = langList.map( function ( lang ) {
					return new OO.ui.MenuOptionWidget( { data: lang, label: ve.init.platform.getLanguageName( lang ) } );
				} );
				firstLangDropdown.getMenu().addItems( firstLangOptions );
				secondLangDropdown.getMenu().addItems( secondLangOptions );

				firstLangDropdown.getMenu().selectItemByData( prism.firstDoc.getLang() );
				secondLangDropdown.getMenu().selectItemByData( prism.secondDoc.getLang() );
			} );

			function onSelect( changedLangDropdown, otherLangDropdown, changedTarget ) {
				translator.getLangPairsPromise().then( function ( langPairs ) {
					changedLangDropdown.getMenu().on( 'select', function ( i ) {
						var lang = i.getData(),
							dir = ve.init.platform.getLanguageDirection( lang ),
							surface = changedTarget.surface;
						otherLangDropdown.getMenu().getItems().forEach( function ( j ) {
							j.$element.css( 'opacity',
								translator.pairSupported( langPairs, lang, j.getData() ) ? 1 : 0.5
							);
						} );
						// This is ugly but you are unlikely to change language mid document.
						surface.getModel().getDocument().lang = lang;
						surface.getModel().getDocument().dir = dir;
						surface.getView().getDocument().setLang( lang );
						surface.getView().getDocument().setDir( dir );
					} );
				} );
			}

			onSelect( firstLangDropdown, secondLangDropdown, firstTarget );
			onSelect( secondLangDropdown, firstLangDropdown, secondTarget );

			$firstDemo.append( firstLangDropdown.$element );
			$secondDemo.append( secondLangDropdown.$element );

			prism = new ll.Prism(
				{
					lang: 'en',
					dir: 'ltr',
					// eslint-disable-next-line no-multi-str
					html: '<h1>LL two-way parallel translation</h1>\
					<figure class="ve-align-right"><img src="ll-logo.svg" width="248" height="105"><figcaption>LL is parallel translation</figcaption></figure>\
					<ul><li><b>Bidirectional</b> translation.</li>\
					<li>The source and target language is determined per paragraph</li>\
					<li>Highlighted paragraphs contain uncommitted translations.</li>\
					<li>Click “✓” to commit the translation.</li></ul>\
					'
				},
				{
					lang: 'es',
					dir: 'ltr',
					// eslint-disable-next-line no-multi-str
					html: '<h1>LL traducción paralela bidireccional</h1>\
					<figure class="ve-align-right"><img src="ll-logo.svg" width="248" height="105"><figcaption>LL es traducción paralela</figcaption></figure>\
					<ul><li>Traducción <b>bidireccional</b>.</li>\
					<li>El idioma de origen y destino se determina por párrafo</li>\
					<li>Los párrafos resaltados contienen traducciones no comprometidas.</li>\
					<li>Haga clic en “✓” para confirmar la traducción.</li></ul>\
					'
				},
				translator
			);
			$firstInstance.append( firstTarget.$element );
			$secondInstance.append( secondTarget.$element );
			firstTarget.clearSurfaces();
			firstTarget.addSurface( prism.firstSurface );
			secondTarget.clearSurfaces();
			secondTarget.addSurface( prism.secondSurface );
		} );
}() );
