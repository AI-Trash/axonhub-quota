import { ConnectionForm } from "@/components/ConnectionForm"
import { Dashboard } from "@/components/Dashboard"
import { useAuth } from "@/hooks/useAuth"

function App() {
  const {
    connection,
    isConnected,
    isConnecting,
    isRestoring,
    error,
    connect,
    disconnect,
  } = useAuth()

  if (isRestoring) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">Restoring previous AxonHub session...</p>
      </div>
    )
  }

  if (!isConnected || !connection) {
    return <ConnectionForm isConnecting={isConnecting} error={error} onSubmit={connect} />
  }

  return <Dashboard connection={connection} onDisconnect={disconnect} />
}

export default App
