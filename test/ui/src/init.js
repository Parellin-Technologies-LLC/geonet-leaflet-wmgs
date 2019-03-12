/** ****************************************************************************************************
 * File: init.js
 * Project: boilerplate-ui
 * @author Nick Soggin <iSkore@users.noreply.github.com> on 16-Jan-2019
 *******************************************************************************************************/
'use strict';

import $ from 'jquery';

import Map from './Map';

$( document ).ready(
	() => {
		Map.init();

		$( '.leaflet-control-attribution' ).remove();
	}
);

