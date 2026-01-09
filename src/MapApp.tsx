import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 修正 Leaflet 預設圖示
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// 特殊圖示：目前位置（藍色）與 移動中的動畫點（紅色）
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

const MapApp = () => {
  const [startPos, setStartPos] = useState({ lat: 25.0339, lng: 121.5644 }); // 預設台北 101
  const [markers, setMarkers] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animPos, setAnimPos] = useState(null);

  // 1. 處理移動動畫邏輯
  const startPreview = async () => {
    if (markers.length === 0) return alert("請先在地圖上點擊新增目的地！");
    setIsAnimating(true);
    
    const path = [startPos, ...markers]; // 從起點出發，依序經過點1, 點2...
    
    for (let i = 0; i < path.length - 1; i++) {
      await animateBetween(path[i], path[i+1]);
    }
    
    setIsAnimating(false);
    setAnimPos(null);
  };

  const animateBetween = (start, end) => {
    return new Promise((resolve) => {
      const steps = 30; // 每一段路徑切成 30 步
      let currentStep = 0;
      
      const interval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        
        setAnimPos({
          lat: start.lat + (end.lat - start.lat) * progress,
          lng: start.lng + (end.lng - start.lng) * progress
        });

        if (currentStep >= steps) {
          clearInterval(interval);
          resolve();
        }
      }, 50); // 每 50ms 更新一次位置
    });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: 'sans-serif' }}>
      {/* 側邊欄 */}
      <div style={{ width: '320px', padding: '20px', borderRight: '1px solid #ddd', overflowY: 'auto', backgroundColor: '#f9f9f9' }}>
        <h3>行程設定</h3>
        
        {/* 起點輸入欄位 */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#eef3f7', borderRadius: '8px' }}>
          <strong>📍 設定目前位置 (起點)</strong>
          <p>預設載入設備當前位置，非必要請勿修改</p>
          <div style={{ marginTop: '10px' }}>
            緯度: <input type="number" step="0.0001" value={startPos.lat} onChange={(e) => setStartPos({...startPos, lat: parseFloat(e.target.value)})} style={{ width: '80px' }} />
          </div>
          <div style={{ marginTop: '5px' }}>
            經度: <input type="number" step="0.0001" value={startPos.lng} onChange={(e) => setStartPos({...startPos, lng: parseFloat(e.target.value)})} style={{ width: '80px' }} />
          </div>
        </div>

        <button 
          onClick={startPreview} 
          disabled={isAnimating}
          style={{ width: '100%', padding: '10px', background: isAnimating ? '#ccc' : '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {isAnimating ? '預覽中...' : '預覽行程'}
        </button>

        <hr />
        <h4>目的地清單 ({markers.length})</h4>
        {markers.map((m, idx) => (
          <div key={m.id} style={{ fontSize: '12px', padding: '8px', borderBottom: '1px solid #eee' }}>
            #{idx + 1} - 緯: {m.lat.toFixed(4)}, 經: {m.lng.toFixed(4)}
          </div>
        ))}
        {markers.length > 0 && <button onClick={() => setMarkers([])} style={{ marginTop: '10px', fontSize: '12px' }}>清空全部</button>}
      </div>

      {/* 地圖區域 */}
      <div style={{ flex: 1 }}>
        <MapContainer center={[startPos.lat, startPos.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onMapClick={(latlng) => setMarkers([...markers, { id: Date.now(), ...latlng }])} />

          {/* 畫出路徑線段 */}
          {markers.length > 0 && (
            <Polyline 
              positions={[ [startPos.lat, startPos.lng], ...markers.map(m => [m.lat, m.lng]) ]} 
              color="blue" 
              dashArray="5, 10"
            />
          )}

          {/* 起點標記 */}
          <Marker position={[startPos.lat, startPos.lng]}>
            <Popup>目前位置 (起點)</Popup>
          </Marker>

          {/* 各個目的地標記 */}
          {markers.map((m, idx) => (
            <Marker key={m.id} position={[m.lat, m.lng]}>
              <Popup>目的地 #{idx + 1}</Popup>
            </Marker>
          ))}

          {/* 動態移動中的點 */}
          {animPos && (
            <Marker position={[animPos.lat, animPos.lng]} icon={redIcon}>
              <Popup>移動中...</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapApp;