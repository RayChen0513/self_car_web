import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import styled, { keyframes } from 'styled-components';

// --- 修正 Leaflet 預設圖示 ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

// --- Styled Components 定義 ---

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

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  flex-direction: column; /* 預設手機版：上下排列 */

  @media (min-width: 768px) {
    flex-direction: row; /* 電腦版：左右排列 */
  }
`;

const Sidebar = styled.div<{ $isOpen: boolean }>`
  background-color: #ffffff;
  z-index: 1001;
  transition: all 0.3s ease;
  overflow-y: auto;

  /* 手機版：底部抽屜樣式 */
  @media (max-width: 767px) {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: ${props => props.$isOpen ? '60vh' : '40px'};
    padding: 15px;
    width: calc(100% - 30px);
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
  }

  /* 電腦版：側邊欄樣式 */
  @media (min-width: 768px) {
    width: 320px;
    height: 100vh;
    padding: 24px;
    border-right: 1px solid #e0e0e0;
  }
`;

const Title = styled.h3`
  margin-top: 0;
  color: #2c3e50;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 8px;
`;

const ConfigCard = styled.div`
  margin-bottom: 20px;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
`;

const Label = styled.strong`
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
`;

const HelperText = styled.p`
  font-size: 12px;
  color: #64748b;
  margin: 4px 0 12px 0;
`;

const InputGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;

  input {
    width: 100px;
    padding: 4px 8px;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    &:focus {
      outline: none;
      border-color: #4CAF50;
    }
  }
`;

const ActionButton = styled.button<{ $isAnimating?: boolean; $variant?: 'danger' | 'success' | 'stat' }>`
  width: 100%;
  padding: 12px;
  background-color: ${props => props.$isAnimating ? '#cbd5e1' : (props.$variant === 'danger' ? '#ef4444' : props.$variant === 'stat' ? '#448eef' : '#4CAF50')};
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: bold;
  margin-bottom: 10px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent; /* 移除手機點擊藍框 */
`;

const DestinationList = styled.div`
  margin-top: 20px;
`;

const ListItem = styled.div`
  font-size: 12px;
  padding: 10px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:last-child {
    border-bottom: none;
  }
`;

const MapWrapper = styled.div`
  flex: 1;
  height: 100%;
  width: 100%;
  z-index: 1;
`;

const MobileHandle = styled.div`
  width: 40px;
  height: 5px;
  background: #ccc;
  border-radius: 10px;
  margin: 0 auto 10px;
  display: block;

  @media (min-width: 768px) {
    display: none;
  }
`;

// --- 功能性組件 ---

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

const MapApp = () => {
  const [startPos, setStartPos] = useState({ lat: 25.0397, lng: 121.5730 });
  const [markers, setMarkers] = useState<{id: number, lat: number, lng: number}[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animPos, setAnimPos] = useState<{lat: number, lng: number} | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [waiting, setWaiting] = useState(false);

  if(loading)
  {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }

  const startPreview = async () => {
    if (markers.length === 0) return alert("請先在地圖上點擊新增目的地！");
    setIsAnimating(true);
    const path = [startPos, ...markers];
    for (let i = 0; i < path.length - 1; i++) {
      await animateBetween(path[i], path[i+1]);
    }
    setIsAnimating(false);
    setAnimPos(null);
  };

  const animateBetween = (start, end) => {
    return new Promise<void>((resolve) => {
      const steps = 30;
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
      }, 50);
    });
  };

  if (loading) {
    return (
      <LoadingContainer>
        <Spinner />
        <div>等待定位...</div>
      </LoadingContainer>
    );
  }

  if (waiting) {
    return (
      <LoadingContainer>
        <Spinner />
        <div>發起操作請求...</div>
      </LoadingContainer>
    );
  }

  return (
    <AppContainer>
      <Sidebar $isOpen={isSidebarOpen}>
        {/* 手機版頂部的灰色拖動條 */}
        <MobileHandle onClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <Title>行程設定</Title>
        
        {/* 座標設定卡片 */}
        <ConfigCard>
          <Label>📍 設定目前位置 (起點)</Label>
          <HelperText>預設為設備位置，可手動調整</HelperText>
          <InputGroup>
            緯度: 
            <input 
              type="number" 
              step="0.0001" 
              value={startPos.lat || ''} 
              onChange={(e) => setStartPos({...startPos, lat: parseFloat(e.target.value)})} 
            />
          </InputGroup>
          <InputGroup>
            經度: 
            <input 
              type="number" 
              step="0.0001" 
              value={startPos.lng || ''} 
              onChange={(e) => setStartPos({...startPos, lng: parseFloat(e.target.value)})} 
            />
          </InputGroup>
        </ConfigCard>

        {/* 主操作按鈕 */}
        <ActionButton 
          onClick={startPreview} 
          $isAnimating={isAnimating} 
          disabled={isAnimating}
        >
          {isAnimating ? '🚁 預覽進行中...' : '🎬 開始行程預覽'}
        </ActionButton>

        {/* 目的地列表區域 */}
        <DestinationList>
          <h4>目的地清單 ({markers.length})</h4>
          
          {/* 當清單為空時的視覺提示 */}
          {markers.length === 0 && (
            <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', margin: '20px 0' }}>
              點擊地圖即可新增目的地
            </p>
          )}

          {markers.map((m, idx) => (
            <ListItem key={m.id}>
              <span>#{idx + 1} - {m.lat.toFixed(4)}, {m.lng.toFixed(4)}</span>
              {/* 你也可以在此處新增一個小垃圾桶圖示來刪除單一地點 */}
            </ListItem>
          ))}

          {/* 只有在有標記時才顯示清空按鈕 */}
          {markers.length > 0 && (
            <ActionButton 
              $variant="danger" 
              onClick={() => {
                if(window.confirm("確定要清空所有地點嗎？")) setMarkers([]);
              }}
            >
              清空所有地點
            </ActionButton>
          )}
          {markers.length > 0 && (
            <ActionButton 
              $variant="stat" 
              onClick={() => {
                if(window.confirm("確定要開始行程嗎？")) setWaiting(true);
              }}
            >
              開始行程
            </ActionButton>
          )}
        </DestinationList>
      </Sidebar>

      <MapWrapper>
        <MapContainer center={[startPos.lat, startPos.lng]} zoom={17} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onMapClick={(latlng) => setMarkers([...markers, { id: Date.now(), ...latlng }])} />

          {markers.length > 0 && (
            <Polyline 
              positions={[ [startPos.lat, startPos.lng], ...markers.map(m => [m.lat, m.lng]) ]} 
              color="#3b82f6" 
              dashArray="8, 12"
              weight={4}
            />
          )}

          <Marker position={[startPos.lat, startPos.lng]}>
            <Popup>目前位置 (起點)</Popup>
          </Marker>

          {markers.map((m, idx) => (
            <Marker key={m.id} position={[m.lat, m.lng]}>
              <Popup>目的地 #{idx + 1}</Popup>
            </Marker>
          ))}

          {animPos && (
            <Marker position={[animPos.lat, animPos.lng]} icon={redIcon}>
              <Popup>移動中...</Popup>
            </Marker>
          )}
        </MapContainer>
      </MapWrapper>
    </AppContainer>
  );
};

export default MapApp;