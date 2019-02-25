# geonet-leaflet-wmgs
Leaflet.WMGS plugin (Web Map GeoJSON Service)

### install

```
npm i -S @geonet/leaflet-wmgs
```

### Usage

```javascript
const wmgs = new L.WMGS( {
	crs: L.CRS.EPSG4326,
	url: 'http://localhost:3000/wmgs',
	// requestPerCell: false,
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
			radius: 8,
			fillColor: '#ff7800',
			color: '#000',
			weight: 1,
			opacity: 1,
			fillOpacity: 0.4
		} );
	},
	onEachFeature: ( geojson, layer ) => {
		// Render the feature
		layer.feature.properties.type = 'AOI';
		this.drawLayer.addLayer( layer );
	}
} );

wmgs.addTo( map );

map.on( L.Draw.Event.CREATED, e => wmgs.createFeature( e ) );
map.on( L.Draw.Event.EDITED, e => wmgs.updateFeatures( e ) );
map.on( L.Draw.Event.DELETED, e => wmgs.deleteFeatures( e ) );
```

### Options

| option            | default                                            | required | type     | description                                                                                                           |
|-------------------|----------------------------------------------------|----------|----------|-----------------------------------------------------------------------------------------------------------------------|
| `url`             |                                                    | true     | String   | URL for WMGS API                                                                                                      |
| `CRS`             | `L.CRS.EPSG4326`                                   | false    | String   | Coordinate Reference Systems (default: equirectangular projection)                                                    |
| `requestPerCell`  | `false`                                            | false    | Boolean  | Request GeoJSON one cell at a time, or group all cells together                                                       |
| `filterTimeRange` | `{ from: 0, to: 0 }`                               | false    | Object   | Filter objects based on time range                                                                                    |
| `defaultStyle`    | `{ color: 'blue', opacity: 1, fillOpacity: 0.4 }`  | false    | Object   | Default polygon styling                                                                                               |
| `query`           | `{}`                                               | false    | Object   | Define query parameters to filter all responses by                                                                    |
| `select`          | `{ type: true, properties: true, geometry: true }` | false    | Object   | Define parameters to select from DB (`type`, `properties`, and `geometry` must be defined to properly render GeoJSON) |
| `onCreateCell`    |                                                    | false    | Function | Called when a new cell is created                                                                                     |
| `onCellEnter`     |                                                    | false    | Function | Called when an existing cell is entered                                                                               |
| `onCellLeave`     |                                                    | false    | Function | Called when an existing cell is exited                                                                                |
| `pointToLayer`    |                                                    | false    | Function | Function that will be used for creating layers for GeoJSON Points.                                                    |
| `onEachFeature`   |                                                    | false    | Function | Function used to add GeoJSON to the map or allows for inspection of GeoJSON Features.                                 |

### Methods

| method             | params                       | returns                    | description                                                                                                    |
|--------------------|------------------------------|----------------------------|----------------------------------------------------------------------------------------------------------------|
| `fetch`            | Object (request options)     | `{Promise<*>}`             | Used to request the WMGS server                                                                                |
| `customRequest`    | Object (request options)     | `{Promise<*>}`             | Allows user to make custom defined request to the WMGS server                                                  |
| `getTypes`         |                              | Array                      | Get the types of Features defined in the WMGS server                                                           |
| `getFeatures`      | `bounds` (`L.latLng` object) | Object (FeatureCollection) | Method used by module to request GeoJSON from WMGS. Method will pass all retrieved layers into `onEachFeature` |
| `createFeature`    | `Layer`                      | Fetch response             | Add a WMGS Feature                                                                                             |
| `updateFeatures`   | `Layer[]`                    | Fetch response             | Update WMGS Features                                                                                           |
| `deleteFeatures`   | `Layer[]`                    | Fetch response             | Delete WMGS Features                                                                                           |
| `timeFromObjectId` | `ObjectID`                   | `Date`                     | Converts an `ObjectID` into a `Date`                                                                           |
| `objectIdToTime`   | `Date`                       | `ObjectID`                 | Converts a `Date` into an `ObjectID`                                                                           |
