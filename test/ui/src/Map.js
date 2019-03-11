/** ****************************************************************************************************
 * File: Map.js
 * Project: boilerplate-ui
 * @author Nick Soggin <iSkore@users.noreply.github.com> on 19-Feb-2019
 *******************************************************************************************************/
'use strict';

// import URL, { URLSearchParams } from 'url';

import L from 'leaflet';
import 'leaflet-draw';

import '../../../index';
import LightMap from '@parellin/lightmap';

import LayerControl from './LayerControl';

class Map
{
	constructor()
	{
		this.map = L.map( 'map', {
			renderer: L.svg(),
			minZoom: 0,
			maxZoom: 25
		} );
		
		this.layerControl = new LayerControl( this.map, LayerControl.POSITION.TR );
		
		this.drawLayer = new L.FeatureGroup();
		
		this.drawControl = new L.Control.Draw( {
			position: 'bottomleft',
			draw: {
				polygon: {
					shapeOptions: {
						color: '#bada55'
					}
				},
				circle: false,
				circlemarker: false,
				// marker: false,
				rectangle: {}
			},
			edit: {
				featureGroup: this.drawLayer
			}
		} );
		
		this.map.addLayer( this.drawLayer );
		this.map.addControl( this.drawControl );
		
		// this.map.setView( [ 0, 0 ], 2 );
		this.map.setView( [ 25.802118131610102, 28.422882726192478 ], 12 );
	}
	
	async init()
	{
		// const url = new URL( 'http://localhost/api/zone/status' );
		
		// const query = [{}];
		
		// const query = params.map(
		// 	( v, k ) => [ k, JSON.stringify( v ) ]
		// );
		
		// url.search = new URLSearchParams( query );
		//
		// console.log( query );
		//
		// const x = await fetch( url, {
		// 	method: 'GET',
		// 	headers: { 'Content-Type': 'application/json' }
		// } );
		//
		// console.log( x );
		//
		// console.log( await x.json() );
		
		this.drawLayer.addLayer( L.GeoJSON.geometryToLayer( {
			type: 'Polygon',
			coordinates: [ [
				[ 28.348039, 25.716079 ],
				[ 28.348039, 25.790669 ],
				[ 28.516973, 25.790669 ],
				[ 28.516973, 25.716079 ],
				[ 28.348039, 25.716079 ]
			] ]
		} ) );
		
		// return;
		this.addBasemap();
		this.addVirtualGrid();
		this.bindDrawLayer();
	}
	
	addVirtualGrid()
	{
		this.wmgs = new L.WMGS( {
			crs: L.CRS.EPSG4326,
			url: 'http://localhost:3000/wmgs',
			requestPerCell: true,
			// filterTimeRange: {},
			defaultStyle: {
				color: 'red'
			},
			query: {},
			// onCreateCell: ( bounds, coords ) => {},
			// onCellEnter: ( bounds, coords ) => {},
			// onCellLeave: ( bounds, coords ) => {},
			pointToLayer: ( feature, latlng ) => {
				return L.circleMarker( latlng, {
					// radius: 3,
					fillColor: '#ff7800',
					color: '#000',
					weight: 1,
					opacity: 1,
					fillOpacity: 0.4
				} );
			},
			onEachFeature: ( geojson, layer ) => {
				// Render the feature
				this.drawLayer.addLayer( layer );
			}
		} );
		
		this.wmgs.addTo( this.map );
		// this.wmgs.setQuery( {} );
	}
	
	bindDrawLayer()
	{
		this.map.on( 'click', e => {
			console.log( e );
			this.map.fitBounds( e.target.getBounds() );
			// console.log( this.map.getZoom() );
		} );
		
		// TODO:: need to disable rerender when updating a polygon
		
		
		this.map.on( L.Draw.Event.CREATED, e => {
			if( e.layerType === 'marker' ) {
				e.layer.bindPopup( 'A popup!' );
			}
			
			this.wmgs.createFeature( e.layer );
			// this.drawLayer.addLayer( layer );
		} );
		
		this.map.on( L.Draw.Event.EDITED, e => this.wmgs.updateFeatures( e ) );
		
		this.map.on( L.Draw.Event.DELETED, e => this.wmgs.deleteFeatures( e ) );
	}
	
	addBasemap()
	{
		this.layerControl
			.addBaseLayer(
				'OpenStreetMap',
				L.tileLayer( 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' ),
				false
			);
		
		this.layerControl
			.addBaseLayer(
				'Google',
				L.tileLayer( 'http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}', {
					maxZoom: 25,
					maxNativeZoom: 20
				} ),
				true
			);
	}
}

export default new Map();
