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

const StatButton = styled.button<{ $color?: string; }>`
  background: ${props => props.$color};
  padding: 10px;
  border-radius: 8px;
  text-align: center;
  span { display: block; font-size: 12px; color: #e0e0e0; }
  strong { font-size: 16px; color: #f7f7f7; }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// 🔹 載入動畫容器
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  color: #2b579a;
  font-size: 18px;
  font-weight: 500;
`;

// 🔹 旋轉圈圈
const Spinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2b579a;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 10px;
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

const parseNMEA = (nmeaString: string) => {
  if (!nmeaString || !nmeaString.startsWith('$')) return null;
  const p = nmeaString.split(',');

  // 我們主要解析 $GPGGA (包含經緯度與定位狀態)
  // 格式: $GPGGA,時間,緯度,N/S,經度,E/W,定位品質(0=未定位, 1=GPS定位, 2=DGPS)...
  if (p[0] === '$GPGGA' && p[6] !== '0') { 
    const convertToDecimal = (val, dir) => {
      if (!val) return null;
      // NMEA 格式是 DDMM.MMMM -> 轉換為十進位
      const degrees = parseFloat(val.substring(0, val.indexOf('.') - 2));
      const minutes = parseFloat(val.substring(val.indexOf('.') - 2));
      let decimal = degrees + minutes / 60;
      if (dir === 'S' || dir === 'W') decimal *= -1;
      return decimal;
    };

    const lat = convertToDecimal(p[2], p[3]);
    const lng = convertToDecimal(p[4], p[5]);
    
    return (lat && lng) ? { lat, lng } : null;
    // return (25.0397, 121.573);
  }
  return null;
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
  const [wsStatus, setWsStatus] = useState("中斷");
  const [dvStatus, setDvStatus] = useState("待命");
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const [loading, setLoading] = useState(true);
    
  if(loading)
  {
      setTimeout(() => {
          setLoading(false);
      }, 800);
  }

  if(!devicePos.lat)
  {
    setDevicePos({ lat: 25.0397, lng: 121.573 })
  }
  const timerRef = useRef(null);

  const requestLocation = async () => {
    // 模擬 API 獲取裝置位置 (你原本的邏輯)
    try {
      setTimeout(async () => {
        const res = await fetch('/api/getDevicePos');
        const _devicePos = await res.json();
        console.log("裝置位置:", _devicePos);
        setDevicePos({ lat: _devicePos.lat, lng: _devicePos.lng });
      }, 10);
      
      
    } catch (e) { console.error("裝置定位失敗"); }

    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setError(err.message),
      { enableHighAccuracy: true }
    );
  };


  useEffect(() => {
    const connectWS = () => {
      // 如果已經有連線，先關閉它
      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = new WebSocket("wss://cautious-potato-5wx99rv4pqpcrv4-5174.app.github.dev/ws");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket 已連線");
        setWsStatus("已連線");
        // 連線成功時，清除重連的定時器
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const nmeaStr = data.echo;
          const coords = parseNMEA(nmeaStr);
          
          if (coords) {
            setDevicePos(coords);
          }
        } catch (err) {
          console.error("解析失敗:", err);
        }
      };

      ws.onclose = () => {
        setWsStatus("中斷");
        console.log("WebSocket 連線中斷，5秒後嘗試重連...");
        
        // 避免重複設定多個 Timeout
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        
        // 5 秒後重新執行 connectWS
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWS();
        }, 5000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket 錯誤", err);
        ws.close(); // 觸發 onclose 進行重連
      };
    };

    connectWS();

    // 瀏覽器定位監聽
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error("手機定位錯誤:", err),
      { enableHighAccuracy: true }
    );

    // 清理機制
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const distance = getDistance(userPos, devicePos);

  if (loading) {
      return (
      <LoadingContainer>
          <Spinner />
          <div>登入中...</div>
      </LoadingContainer>
      );
  }

return (
    <AppContainer>
      {/* 頂部數據面板 */}
      <InfoPanel>
        <StatCard>
          <span>與裝置距離</span>
          {/* <strong>{distance} m</strong> */}
          <strong>1 m</strong>
        </StatCard>
        <StatCard>
          <span>定位狀態</span>
          <strong style={{color: error ? 'red' : '#4CAF50'}}>{error ? '異常' : '良好'}</strong>
        </StatCard>
      </InfoPanel>

      <InfoPanel>
        <StatCard>
          {/* <span>WebSocket 狀態</span> */}
          <span>裝置狀態</span>
          {/* <strong style={{ color: wsStatus === '已連線' ? 'green' : 'red' }}>{wsStatus}</strong> */}
          <strong style={{ color: dvStatus === '待命' ? 'green' : dvStatus === '緊急停止' ? 'red' : '#ebbd3f' }}>{dvStatus}</strong>
        </StatCard>
        <StatCard>
          <span>裝置定位</span>
          <strong>定位完成</strong>
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
      <InfoPanel>
            <StatButton $color="#257dd6" onClick={() => { setDvStatus("跟隨中") }}>
                <strong>跟隨移動</strong>
            </StatButton>
            <StatButton $color="#d63a25"  onClick={() => { setDvStatus("緊急停止") }}>
                <strong>緊急停止</strong>
            </StatButton>
            </InfoPanel>
      <div style={{padding: '15px', background: '#fff', fontSize: '12px', color: '#888'}}>
        最後更新時間: {new Date().toLocaleTimeString()}
        <br />
        * 請確保開啟 GPS 以獲得最佳精度
      </div>
    </AppContainer>
  );
}

export default AutoTracking;