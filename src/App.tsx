import { useState, useEffect } from 'react';
import { Layout } from './components/Layout/Layout';
import { ClusterManager } from './components/ClusterManager/ClusterManager';
import { HostsPanel } from './components/HostsPanel/HostsPanel';
import { ConnectPanel } from './components/ConnectPanel/ConnectPanel';
import { ExchangePanel } from './components/ExchangePanel/ExchangePanel';
import { HistoryPanel } from './components/History/HistoryPanel';
import { useAppStore } from './stores/appStore';
import { clusterApi } from './utils/api';
import { getSessionId } from './utils/session';

function App() {
  const [activeView, setActiveView] = useState('connect');
  const { setClusters, setTasks } = useAppStore();
  const sessionId = getSessionId();

  useEffect(() => {
    async function loadData() {
      const clustersResult = await clusterApi.getAll();
      if (clustersResult.success && clustersResult.data) {
        setClusters(clustersResult.data);
      }
      
      try {
        const tasksRes = await fetch(`/api/tasks?sessionId=${sessionId}`);
        const tasksData = await tasksRes.json();
        if (tasksData.success && tasksData.data) {
          setTasks(tasksData.data);
        }
      } catch (e) {
        console.error('Failed to load tasks:', e);
      }
    }
    
    loadData();
  }, [setClusters, setTasks, sessionId]);

  const renderContent = () => {
    switch (activeView) {
      case 'clusters':
        return <ClusterManager />;
      case 'hosts':
        return <HostsPanel />;
      case 'connect':
        return <ConnectPanel />;
      case 'exchange':
        return <ExchangePanel />;
      case 'history':
        return <HistoryPanel />;
      default:
        return <ClusterManager />;
    }
  };

  return (
    <Layout activeView={activeView} onNavigate={setActiveView}>
      {renderContent()}
    </Layout>
  );
}

export default App;
