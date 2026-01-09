import { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import styled, { keyframes } from 'styled-components';
import L from 'leaflet';

// --- 樣式組件 ---
const AppContainer = styled.div`
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #f5f7fa;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
`;

const InfoPanel = styled.div`
  padding: 15px;
  background: white;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  border-bottom: 1px solid #eee;
`;

const StatCard = styled.div`
  background: #f8f9fa;
  padding: 10px;
  border-radius: 8px;
  text-align: center;
  span { display: block; font-size: 12px; color: #666; }
  strong { font-size: 16px; color: #2b579a; }
`;

const ControlBar = styled.div`
  padding: 10px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
`;

const ToggleButton = styled.button`
  background: ${props => props.active ? '#2b579a' : '#eee'};
  color: ${props => props.active ? 'white' : '#333'};
  border: none;
  padding: 6px 12px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
`;

const spin = keyframes` 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } `;
const LoadingContainer = styled.div`
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  height: 300px; color: #2b579a;
`;
const Spinner = styled.div`
  border: 4px solid #f3f3f3; border-top: 4px solid #2b579a;
  border-radius: 50%; width: 36px; height: 36px; animation: ${spin} 1s linear infinite; margin-bottom: 10px;
`;

// --- 工具函數：計算兩點距離 (公尺) ---
const getDistance = (p1, p2) => {
  if (!p1.lat || !p2.lat) return 0;
  const R = 6371e3; 
  const φ1 = p1.lat * Math.PI/180;
  const φ2 = p2.lat * Math.PI/180;
  const Δφ = (p2.lat-p1.lat) * Math.PI/180;
  const Δλ = (p2.lng-p1.lng) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c).toFixed(0);
};

// --- 地圖行為控制 ---
function MapController({ userPos, isLocked }) {
  const map = useMap();
  useEffect(() => {
    if (isLocked && userPos.lat) {
      map.flyTo([userPos.lat, userPos.lng], map.getZoom());
    }
  }, [userPos, isLocked, map]);
  return null;
}

const redIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });
const greenIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });

function AutoTracking() {
  const [userPos, setUserPos] = useState({ lat: null, lng: null });
  const [devicePos, setDevicePos] = useState({ lat: null, lng: null });
  const [isLocked, setIsLocked] = useState(true);
  const [error, setError] = useState(null);
  
  const timerRef = useRef(null);

  const requestLocation = async () => {
    // 模擬 API 獲取裝置位置 (你原本的邏輯)
    try {
      const res = await fetch('/api/getDevicePos');
      const _devicePos = await res.json();
      setDevicePos({ lat: _devicePos.lat, lng: _devicePos.lng });
      
      // 測試用 mock 數據
    //   setDevicePos({ lat: 25.0350, lng: 121.5650 });
    } catch (e) { console.error("裝置定位失敗"); }

    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setError(err.message),
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    requestLocation(); // 初始執行
    timerRef.current = setInterval(requestLocation, 3000); // 建議改為 3秒，避免過於頻繁
    return () => clearInterval(timerRef.current);
  }, []);

  const distance = getDistance(userPos, devicePos);

  return (
    <AppContainer>
      {/* 頂部數據面板 */}
      <InfoPanel>
        <StatCard>
          <span>與裝置距離</span>
          <strong>{distance} m</strong>
        </StatCard>
        <StatCard>
          <span>定位狀態</span>
          <strong style={{color: error ? 'red' : '#4CAF50'}}>{error ? '異常' : '良好'}</strong>
        </StatCard>
      </InfoPanel>

      {/* 地圖控制項 */}
      <ControlBar>
        <div style={{fontSize: '14px', fontWeight: 'bold'}}>即時追蹤中</div>
        <ToggleButton active={isLocked} onClick={() => setIsLocked(!isLocked)}>
          {isLocked ? '🔓 解除視角鎖定' : '🔒 鎖定個人視角'}
        </ToggleButton>
      </ControlBar>

      {/* 地圖區域 */}
      <div style={{ width: "100%", height: "350px", position: 'relative' }}>
        {userPos.lat ? (
          <MapContainer center={[userPos.lat, userPos.lng]} zoom={18} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapController userPos={userPos} isLocked={isLocked} />
            
            <Marker position={[userPos.lat, userPos.lng]} icon={redIcon}>
              <Popup>您的位置</Popup>
            </Marker>

            {devicePos.lat && (
              <>
                <Marker position={[devicePos.lat, devicePos.lng]} icon={greenIcon}>
                  <Popup>裝置位置</Popup>
                </Marker>
                <Polyline positions={[[userPos.lat, userPos.lng], [devicePos.lat, devicePos.lng]]} color="#2b579a" weight={3} opacity={0.6} dashArray="10, 10" />
              </>
            )}
          </MapContainer>
        ) : (
          <LoadingContainer>
            <Spinner />
            <div>正在定位...</div>
          </LoadingContainer>
        )}
      </div>

      {/* 底部操作欄 */}
      <div style={{padding: '15px', background: '#fff', fontSize: '12px', color: '#888'}}>
        最後更新時間: {new Date().toLocaleTimeString()}
        <br />
        * 請確保開啟 GPS 以獲得最佳精度
      </div>
    </AppContainer>
  );
}

export default AutoTracking;