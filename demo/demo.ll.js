/*!
 * LL two-way parallel translation - demo
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

( function () {
	/* eslint-disable no-jquery/no-global-selector */
	var $firstInstance = $( '.ve-instance' ).eq( 0 ),
		$secondInstance = $( '.ve-instance' ).eq( 1 );

	new ve.init.sa.Platform( ve.messagePaths ).getInitializedPromise()
		.fail( function () {
			$firstInstance.text( 'Sorry, this browser is not supported.' );
		} )
		.done( function () {
			var prism,
				firstTarget = new ll.init.LLTarget(),
				secondTarget = new ll.init.LLTarget();

			prism = new ll.Prism(
				{
					lang: 'en',
					dir: 'ltr',
					html: '<h1>LL two-way parallel translation</h1><ul><li><b>Bidirectional</b> translation.</li><li>The source and target language is determined per paragraph</li><li>Highlighted paragraphs contain uncommitted translations.</li><li>Click “✓” to commit the translation.</li></ul><figure><img src="ll-logo.svg" width="248" height="105"><figcaption>LL is parallel translation</figcaption></figure>'
				},
				{
					lang: 'es',
					dir: 'ltr',
					html: '<h1>LL traducción paralela bidireccional</h1><ul><li>Traducción <b>bidireccional</b>.</li><li>El idioma de origen y destino se determina por párrafo</li><li>Los párrafos resaltados contienen traducciones no comprometidas.</li><li>Haga clic en “✓” para confirmar la traducción.</li></ul><figure><img src="ll-logo.svg" width="248" height="105"><figcaption>LL es traducción paralela</figcaption></figure>'
				},
				new ll.ApertiumTranslator( 'http://localhost:2737/translate' )
			);
			$firstInstance.append( firstTarget.$element );
			$secondInstance.append( secondTarget.$element );
			firstTarget.clearSurfaces();
			firstTarget.addSurface( prism.firstSurface );
			secondTarget.clearSurfaces();
			secondTarget.addSurface( prism.secondSurface );
		} );
}() );
