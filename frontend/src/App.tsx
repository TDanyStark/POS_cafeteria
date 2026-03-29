import { Routes, Route, Navigate } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<div>Login — coming in Phase 2</div>} />
      <Route path="/dashboard" element={<div>Dashboard — coming in Phase 6</div>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
