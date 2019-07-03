import React, { PureComponent } from 'react';
import ReactMapboxGl, { Marker } from 'react-mapbox-gl';
import { area, polygon, circle } from '@turf/turf';
import DrawControl from '../components/DrawControl';
import Polygon from '../components/Polygon';
import Circle from '../components/Circle';
import SvgContainer from '../components/SvgContainer';
import './index.css';

const accessToken = 'pk.eyJ1IjoicmVicmFuZCIsImEiOiJjangxdHhoYjUwMWZyNGFtcWU4emJ6cHNlIn0.4LJRH7zN8ZDH1ZzHhv5V8A';

const Map = ReactMapboxGl({ accessToken });

const DEFAULT_OPTIONS = {
  stroke: 'orange',
  fill: 'orange',
  fillOpacity: 0.3,
  strokeWidth: '0.01'
};

const drawOptions = {
  fill: '#0097DC',
  fillOpacity: 0.3,
  stroke: 'blue',
  strokeWidth: '0.01'
}

class MapContainer extends PureComponent {

  state = {
    figureDrawing: null,
    pointsPolygon: [],
    centerCircle: null,
    areaCircle: null,
    polygons: [],
    circles: [],
    viewBox: null,
  };

  refPolygon = React.createRef();
  refCircle = React.createRef();
  map = React.createRef();

  handleControlButton = (figureDrawing = null) => () => {
    this.setState({
      figureDrawing,
      pointsPolygon: [],
      centerCircle: null,
    });
  }

  addPointPolygon = (lngLat) => {
    this.setState(state => ({
      pointsPolygon: [...state.pointsPolygon, [lngLat.lng, lngLat.lat]]
    }), () => {
        this.drawPolygon(lngLat);
    })
  }
  
  addPointCircle = (lngLat) => {
    const { centerCircle, areaCircle: area } = this.state;
    const { current: circle } = this.refCircle;
    if (centerCircle) {
      const cx = circle.getAttribute('cx');
      const cy = circle.getAttribute('cy');
      const r = circle.getAttribute('r');
      this.setState(state => ({
        circles: [...state.circles, { cx, cy, r, area }],
        centerCircle: null,
        areaCircle: null,
        figureDrawing: null,
      }));
    } else {
      this.setState({ centerCircle: [lngLat.lng, lngLat.lat] }, () => {
        this.drawCircle(lngLat);
      });
    }
  }

  drawPolygon = (lngLat) => {
    const { pointsPolygon } = this.state;
    const { current: polygon } = this.refPolygon;
    if (polygon) {
      let points = polygon.getAttribute('points');
      points = points ? points.split(' ') : [];
      if (points.length > pointsPolygon.length)
        points.pop();
      const worldCoordinate = this.getWorldCoordinate(lngLat.lat, lngLat.lng);
      const { x, y } = this.getPointSvg(worldCoordinate);
      const newPoints = [...points, [x, y]];
      polygon.setAttribute('points', newPoints.join(' '));
    }
  }

  getPointSvg = (point) => {
    const PARAM = 1000;
    return {
      x: (point.x * PARAM).toFixed(3),
      y: (point.y * PARAM).toFixed(3),
    }
  }

  boundsChanged = (map) => {
    this.setupViewbox(map);
  }

  setupViewbox = (map) => {
    const viewbox = this.getCurrentViewboxSvg(map);
    this.setState({ viewbox });
  }

  getCurrentViewboxSvg = (map) => {
    const bounds = map.getBounds();
    const worldCoordinateNe = this.getWorldCoordinate(bounds._ne.lat, bounds._ne.lng);
    const worldCoordinateSw = this.getWorldCoordinate(bounds._sw.lat, bounds._sw.lng);
    const { x: minWidth, y: maxHeight } = this.getPointSvg(worldCoordinateSw);
    const { x: maxWidth, y: minHeight } = this.getPointSvg(worldCoordinateNe);
    const width = maxWidth - minWidth;
    const height = maxHeight - minHeight;
    const viewbox = `${minWidth} ${minHeight} ${width} ${height}`;
    return viewbox;
  }

  handleClickMap = (map, e) => {
    this.setupViewbox(map);
    const { figureDrawing } = this.state;
    if (figureDrawing === 'circle') {
      this.addPointCircle(e.lngLat);
    }
    if (figureDrawing === 'polygon') {
      this.addPointPolygon(e.lngLat);
    }
  }

  getWorldCoordinate = (lat, lng) => {
    const TILE_SIZE = 512;
    let siny = Math.sin(lat * Math.PI / 180);
    siny = Math.min(Math.max(siny, -0.9999), 0.9999);
    return {
      x: TILE_SIZE * (0.5 + lng / 360),
      y: TILE_SIZE * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI))
    };
  }

  drawCircle = (lngLat) => {
    const { centerCircle } = this.state;
    const { current: circle } = this.refCircle;
    if (circle) {
      const worldCoordinateCenterCircle = this.getWorldCoordinate(centerCircle[1], centerCircle[0]);
      const worldCoordinate = this.getWorldCoordinate(lngLat.lat, lngLat.lng);
      const { x: cx, y: cy } = this.getPointSvg(worldCoordinateCenterCircle);
      const { x, y } = this.getPointSvg(worldCoordinate);
      const deltaX = x - cx;
      const deltaY = y - cy;
      const radius = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', radius);
    }
  }

  mouseMoveMap = (map, e) => {
    const { figureDrawing, pointsPolygon, centerCircle } = this.state;
    if (figureDrawing === 'polygon' && pointsPolygon.length)
      this.drawPolygon(e.lngLat);
    if (figureDrawing === 'circle' && centerCircle) {
      this.drawCircle(e.lngLat);
      const areaCircle = this.calculateAreaCircle(centerCircle, e.lngLat);
      this.setState({ areaCircle });
    }
  }

  calculateAreaCircle = (centerCircle, lngLat) => {
    if (centerCircle) {
      const deltaX = lngLat.lng - centerCircle[0];
      const deltaY = lngLat.lat - centerCircle[1];
      const radius = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (radius) {
        const circleToPolygon = circle(centerCircle, radius, { units: 'degrees' })
        return area(circleToPolygon).toFixed(2);
      }
    }
  }

  handleClickPoint = (point) => () => {
    const { pointsPolygon } = this.state;
    if (
      pointsPolygon.length > 2 &&
      pointsPolygon[0].x === point.x && 
      pointsPolygon[0].y === point.y &&
      this.refPolygon.current
    ) {
      const points = this.refPolygon.current.getAttribute('points').split(' ');
      points.splice(-2);
      const area = this.calculateAreaPolygon(points);
      const center = this.getCenterPolygon(points);
      this.setState(state => ({
        figureDrawing: null,
        polygons: [...state.polygons, { points, area, center }],
        pointsPolygon: [],
      }))
    }
  }

  getAdditionlOptions = (zoom) => {
    const additionalOptions = {};
    if (zoom < 12) {
      const pixel = Math.floor(zoom) * 5 / zoom;
      additionalOptions.strokeDasharray = `${pixel} ${pixel / 5}`;
      additionalOptions.strokeWidth = `${ pixel / 5 }`;
    }

    return additionalOptions;
  }

  getCenterPolygon = (points) => {
    const sum = points.reduce((accum, cur) => {
      const point = cur.split(',');
      return {
        totalLat: accum.totalLat + +point[0],
        totalLng: accum.totalLng + +point[1]
      }
    }, { totalLat: 0, totalLng: 0 });
    const x = sum.totalLat / points.length;
    const y = sum.totalLng / points.length;
    return { x, y };
  }

  calculateAreaPolygon = (points) => {
    const proccessingPoints = points.map(point => point.split(',').map(item => item / 1000));
    proccessingPoints.push(proccessingPoints[0]);
    return area(polygon([proccessingPoints])).toFixed(2);
  }

  render() {
    const {
      figureDrawing,
      pointsPolygon,
      centerCircle,
      polygons,
      circles,
      viewbox,
      areaCircle,
    } = this.state;
    
    const additionalOptions = this.map.current ? this.getAdditionlOptions(this.map.current.state.map.getZoom()) : {};
    return (
      <Map
        ref={this.map}
        style="mapbox://styles/mapbox/streets-v8"
        defaultZoom={[8]}
        maxZoom={[3]}
        containerStyle={{
          height: '100vh',
          width: '100vw'
        }}
        className={`${figureDrawing && 'draw'}`}
        onClick={this.handleClickMap}
        onMouseMove={this.mouseMoveMap}
        onMove={this.boundsChanged}
      >
        <DrawControl
          handleCircle={this.handleControlButton('circle')}
          handlePolygon={this.handleControlButton('polygon')}
        />
        <SvgContainer viewBox={viewbox}>
          {figureDrawing === 'polygon' && <Polygon ref={this.refPolygon} {...DEFAULT_OPTIONS} {...additionalOptions}/>}
          {figureDrawing === 'circle' && <Circle ref={this.refCircle} {...DEFAULT_OPTIONS} {...additionalOptions} />}
          {polygons.map(item => {
            const points = item.points.join(' ');
            const { x, y } = item.center;
            return <React.Fragment>
              <Polygon {...drawOptions} {...additionalOptions} points={points} /> 
              <text x={x} y={y} className="text">{item.area} кв.м</text>
            </React.Fragment>
          })}
          {circles.map(({ area, ...item}) => <React.Fragment>
            <Circle {...drawOptions} {...additionalOptions} {...item} />
            <text className="text"></text>
          </React.Fragment>
          )}
        </SvgContainer>
        {pointsPolygon.map(point => (
          <Marker coordinates={point}>
            <div className="point" onClick={this.handleClickPoint(point)} />
          </Marker>
        ))}
        {centerCircle && 
          <Marker coordinates={centerCircle}>
          <div className="point">
            <span className="text">{areaCircle} кв.м</span>
          </div>
          </Marker>
        }       
      </Map>
    );
  }
 
};

export default MapContainer;