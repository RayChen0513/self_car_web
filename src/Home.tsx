import { useState } from 'react';
import styled, { keyframes } from 'styled-components';

// --- 樣式組件 ---
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
  text-align: center;
  img {
      background-position: center;
    height: 300px;}
`;

const InfoPanel2 = styled.div`
  padding: 15px;
  background: white;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  border-bottom: 1px solid #eee;
  text-align: center;
  display: flex;
    justify-content: center;
  img {
      background-position: center;
    height: 300px;}
`;

const StatCard = styled.div`
  background: #f8f9fa;
  padding: 10px;
  border-radius: 8px;
  text-align: center;
  span { display: block; font-size: 12px; color: #666; }
  strong { font-size: 16px; color: #2b579a; }
`;

const StatButton = styled.button<{ $color?: string; }>`
  background: ${props => props.$color};
  padding: 10px;
  border-radius: 8px;
  text-align: center;
  span { display: block; font-size: 12px; color: #e0e0e0; }
  strong { font-size: 16px; color: #f7f7f7; }
`;

const Home = () => {
      const [loading, setLoading] = useState(true);
    
    if(loading)
    {
        setTimeout(() => {
            setLoading(false);
        }, 800);
    }

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
                <span>裝置</span>
                <strong>E41F-D59C-6ED6</strong>
            </StatCard>
            <StatCard>
                <span>裝置狀態</span>
                <strong style={{color: '#4CAF50'}}>{false ? '異常' : '良好'}</strong>
            </StatCard>
            </InfoPanel>
    
            <InfoPanel>
            <StatCard>
                <span>電量</span>
                <strong style={{ color: true ? 'green' : 'red' }}>95 %</strong>
            </StatCard>
            <StatCard>
                <span>移動速度</span>
                <strong>0 公里/小時</strong>
            </StatCard>
            </InfoPanel>

            <InfoPanel2>
                <img src="/P_20260205_104459.png" />
            </InfoPanel2>

            <InfoPanel>
            <StatButton $color="#257dd6" onClick={() => { window.location.href = "/tracking" }}>
                <strong>自動跟隨</strong>
            </StatButton>
            <StatButton $color="#25d669"  onClick={() => { window.location.href = "/map" }}>
                <strong>行程規劃</strong>
            </StatButton>
            </InfoPanel>
    
    
            {/* 底部操作欄 */}
            <div style={{padding: '15px', background: '#fff', fontSize: '12px', color: '#888'}}>
            最後更新時間: {new Date().toLocaleTimeString()}
            <br />
            請確保網路連線穩定
            </div>
        </AppContainer>
    )
}

export default Home;