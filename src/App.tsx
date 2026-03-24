import { ConnectionForm } from "@/components/ConnectionForm"
import { Dashboard } from "@/components/Dashboard"
import { useAuth } from "@/hooks/useAuth"
import { useLanguage } from "@/lib/i18n"

function App() {
  const { t } = useLanguage()
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
        <p className="text-sm text-muted-foreground">{t.app.restoringSession}</p>
      </div>
    )
  }

  if (!isConnected || !connection) {
    return <ConnectionForm isConnecting={isConnecting} error={error} onSubmit={connect} />
  }

  return <Dashboard connection={connection} onDisconnect={disconnect} />
}

export default App
