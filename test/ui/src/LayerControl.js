/** ****************************************************************************************************
 * File: LayerControl.js
 * Project: boilerplate-ui
 * @author Nick Soggin <iSkore@users.noreply.github.com> on 23-Jan-2019
 *******************************************************************************************************/
'use strict';

import L from 'leaflet';

class LayerControl
{
	constructor( map, position = LayerControl.POSITION.TL )
	{
		if( !( position === LayerControl.POSITION.TL ||
			position === LayerControl.POSITION.TR ||
			position === LayerControl.POSITION.BL ||
			position === LayerControl.POSITION.BR ) ) {
			throw new Error( 'Position must be typeof LayerControl.POSITION' );
		}
		
		this.map = map;
		
		this.selectedBaseLayer = null;
		this.baseLayers        = {};
		this.overlayLayers     = {};
		
		this.control = L.control.layers(
			this.baseLayers,
			this.overlayLayers,
			{
				position,
				collapsed: true
			}
		);
		
		this.control.addTo( this.map );
	}
	
	getSelectedBaseLayer()
	{
		return this.selectedBaseLayer;
	}
	
	getOverlay( name )
	{
		return this.overlayLayers[ name ];
	}
	
	addOverlay( name, layer, addToMap = false )
	{
		this.overlayLayers[ name ] = layer;
		this.control.addOverlay( layer, name );
		
		if( addToMap ) {
			layer.addTo( this.map );
		}
	}
	
	removeOverlayer( name )
	{
		this.map.removeLayer( this.overlayLayers[ name ] );
		delete this.overlayLayers[ name ];
	}
	
	getBaseLayer( name )
	{
		return this.baseLayers[ name ];
	}
	
	addBaseLayer( name, layer, addToMap = false )
	{
		this.baseLayers[ name ] = layer;
		this.control.addBaseLayer( layer, name );
		
		if( addToMap ) {
			layer.addTo( this.map );
		}
	}
	
	removeBaseLayer( name )
	{
		this.map.removeLayer( this.baseLayers[ name ] );
		delete this.baseLayers[ name ];
	}
}

LayerControl.POSITION = {
	TL: 'topleft',
	TR: 'topright',
	BL: 'bottomleft',
	BR: 'bottomright'
};

export default LayerControl;
