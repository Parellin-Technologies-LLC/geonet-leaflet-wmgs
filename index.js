/** ****************************************************************************************************
 * File: index.js
 * Project: geonet-leaflet-wmgs
 * @author Nick Soggin <iSkore@users.noreply.github.com> on 24-Feb-2019
 *******************************************************************************************************/
'use strict';

const
	{
		CRS,
		Util,
		geoJSON,
		GeoJSON,
		latLng,
		latLngBounds
	} = L;

import VirtualGrid from './virtual-grid';
import Response from 'http-response-class';
import LightMap from '@parellin/lightmap';

L.WMGS = VirtualGrid.extend( {
	options: {
		crs: CRS.EPSG4326,
		url: '',
		// maxFeatures: null,
		requestPerCell: false,
		filterTimeRange: Object.seal( {
			from: 0,
			to: 0
		} ),
		query: {},
		select: { type: true, properties: true, geometry: true },
		defaultStyle: {
			color: 'blue',
			opacity: 1,
			fillOpacity: 1
		}
	},
	
	_cache: new LightMap(),
	_activeRequests: 0,
	currentTimeRange: Object.seal( {
		from: 0,
		to: 0
	} ),
	
	currentVisibleTypes: new Set(),
	
	initialize( opts ) {
		VirtualGrid.prototype.initialize.call( this, opts );
		this.on( 'cellsupdated', this._cellsUpdated );
	},
	
	_update() {
		VirtualGrid.prototype._update.call( this );
	},
	
	async fetch( opts ) {
		try {
			opts._body = opts.body;
			
			if( opts.headers[ 'Content-Type' ].startsWith( 'application/json' ) ) {
				opts.body = JSON.stringify( opts.body );
			}
			
			const res = await fetch( this.options.url, opts );
			
			if( !Response.isSuccess( res.status ) ) {
				return Promise.reject( await res.json() );
			}
			
			if( opts.headers[ 'Content-Type' ].startsWith( 'application/json' ) ) {
				return await res.json();
			}
			
			return res;
		} catch( e ) {
			return Promise.reject( e );
		}
	},
	
	async customRequest( opts ) {
		return await this.fetch( {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: opts
		} );
	},
	
	async getTypes() {
		return await this.customRequest( {
			action: 'getTypes',
			layer: 'default',
			property: 'properties.type'
		} );
	},
	
	async getFeatures( bounds ) {
		this._activeRequests++;
		
		if( this._activeRequests === 1 ) {
			this.fire( 'loading', { bounds }, true );
		}
		
		try {
			const featureRequest = {
				action: 'getItems',
				layer: 'default',
				zoom: this._map.getZoom(),
				query: {
					_id: {},
					geometry: {
						$geoIntersects: {
							$geometry: {
								type: 'Polygon',
								coordinates: [ [
									[ bounds._southWest.lng, bounds._southWest.lat ],
									[ bounds._northEast.lng, bounds._southWest.lat ],
									[ bounds._northEast.lng, bounds._northEast.lat ],
									[ bounds._southWest.lng, bounds._northEast.lat ],
									[ bounds._southWest.lng, bounds._southWest.lat ]
								] ]
							}
						}
					},
					...this.options.query
				},
				select: this.options.select
			};
			
			featureRequest.query._id.$nin = [ ...this._cache.keys() ];
			
			// console.log( this._cache.size );
			
			if( this.options.filterTimeRange.from ) {
				featureRequest.query._id.$gte = this.objectIdToTime( this.options.filterTimeRange.from );
			}
			
			if( this.options.filterTimeRange.to ) {
				featureRequest.query._id.$lte = this.objectIdToTime( this.options.filterTimeRange.to );
			}
			
			const featureCollection = await this.fetch( {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: featureRequest
			} );
			
			if( featureCollection && featureCollection.features.length ) {
				// Immediately make cache reference so we don't request the same feature n * cell number of times
				for( let i = 0; i < featureCollection.features.length; i++ ) {
					this._cache.set( featureCollection.features[ i ]._id, null );
				}
				
				Util.requestAnimFrame(
					() => {
						this._addFeatures( featureCollection.features );
						// this._postProcessFeatures( bounds );
					}
				);
			}
			
			return featureCollection;
		} catch( e ) {
			return Promise.reject( e );
		}
	},
	
	_createNewLayer( geojson ) {
		let layer;
		
		if( geojson.geometry.type === 'Point' ) {
			if( this.options.pointToLayer ) {
				layer = this.options.pointToLayer(
					geojson,
					latLng(
						geojson.geometry.coordinates[ 1 ],
						geojson.geometry.coordinates[ 0 ]
					)
				);
			} else {
				layer = geoJSON();
			}
		} else {
			layer = GeoJSON.geometryToLayer( geojson );
		}
		
		if( layer ) {
			layer.defaultOptions = layer.options;
			layer.feature        = geojson;
			
			// if it's a point, don't style it
			if( geojson.geometry.type !== 'Point' ) {
				if( layer.setStyle && layer.feature.properties ) {
					if( layer.feature.properties.hasOwnProperty( 'style' ) ) {
						layer.setStyle( layer.feature.properties.style || this.options.defaultStyle );
					} else {
						layer.setStyle( this.options.defaultStyle );
					}
				} else {
					layer.setStyle( this.options.defaultStyle );
				}
			}
		}
		
		return layer;
	},
	
	_buildIndexes() {
		let timeframe = [];
		
		for( const val of this._cache.values() ) {
			timeframe.push( this.timeFromObjectId( val.feature._id ) );
			this.currentVisibleTypes.add( val.feature.properties.type );
		}
		
		timeframe = timeframe.sort();
		
		this.currentTimeRange.from = timeframe[ 0 ];
		this.currentTimeRange.to   = timeframe[ timeframe.length - 1 ];
	},
	
	_addFeatures( features ) {
		for( let i = 0; i < features.length; i++ ) {
			const
				ref   = features[ i ],
				layer = this._createNewLayer( ref );
			
			if( this.options.onEachFeature ) {
				this.options.onEachFeature( layer.feature, layer );
			}
			
			this._cache.set( ref._id, layer );
		}
		
		this._buildIndexes();
	},
	
	async createFeature( e ) {
		if( e.layer ) {
			e = e.layer;
		}
		
		const geojson = e.toGeoJSON();
		
		geojson.properties = geojson.properties || {};
		
		e = this._createNewLayer( geojson );
		
		if( this.options.onEachFeature ) {
			this.options.onEachFeature( e.feature, e );
		}
		
		return await this.fetch( {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: {
				action: 'createItem',
				layer: 'default',
				data: geojson
			}
		} );
	},
	
	async updateFeatures( e ) {
		const
			layers  = e.layers.getLayers(),
			updates = [];
		
		for( let i = 0; i < layers.length; i++ ) {
			updates.push(
				await this.fetch( {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: {
						action: 'updateItem',
						layer: 'default',
						query: { _id: layers[ i ]._id },
						data: layers[ i ].feature
					}
				} )
			);
		}
		
		return Promise.all( updates );
	},
	
	async deleteFeatures( e ) {
		const _id = e.layers.getLayers().map( layer => layer.feature._id );
		
		if( !_id.length ) {
			return _id;
		}
		
		return await this.fetch( {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: {
				action: 'deleteItem',
				layer: 'default',
				data: { _id }
			}
		} );
	},
	
	async _cellsUpdated( e ) {
		// console.log( e );
		// console.log( 'active cells:', Object.keys( e.target._activeCells ).length );
		// console.log( 'cells:', Object.keys( e.target._cells ).length );
		
		const
			cells         = Object.keys( e.target._activeCells ),
			requestBounds = latLngBounds();
		
		for( let i = 0; i < cells.length; i++ ) {
			if( this.options.requestPerCell ) {
				await this.getFeatures( e.target._activeCells[ cells[ i ] ].bounds );
			} else {
				requestBounds.extend( e.target._activeCells[ cells[ i ] ].bounds );
			}
		}
		
		if( !this.options.requestPerCell ) {
			await this.getFeatures( requestBounds );
		}
	},
	
	createCell( bounds, coords ) {
		if( this.options.onCreateCell ) {
			this.options.onCreateCell( bounds, coords );
		}
	},
	
	cellEnter( bounds, coords ) {
		if( this.options.onCellEnter ) {
			this.options.onCellEnter( bounds, coords );
		}
	},
	
	cellLeave( bounds, coords ) {
		if( this.options.onCellLeave ) {
			this.options.onCellLeave( bounds, coords );
		}
		
		for( const [ k, v ] of this._cache ) {
			if( v.feature.geometry.type === 'Point' ) {
				if( bounds.contains( v.getLatLng() ) ) {
					this._map.removeLayer( v );
					this._cache.delete( k );
				}
			} else {
				if( bounds.contains( v.getBounds() ) || bounds.intersects( v.getBounds() ) ) {
					this._map.removeLayer( v );
					this._cache.delete( k );
				}
			}
		}
	},
	
	timeFromObjectId( _id ) {
		return new Date( Number.parseInt( _id.substring( 0, 8 ), 16 ) * 1000 );
	},
	objectIdToTime( date ) {
		return Math.floor( new Date( date ).getTime() / 1000 ).toString( 16 ) + '0'.repeat( 16 );
	}
} );
