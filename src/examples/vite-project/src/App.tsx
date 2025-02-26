import { useMemo } from 'react'
import './App.css'
import createAppRouter from './router'
import { RouterProvider } from 'react-router-dom'
import { YAuthProvider } from './providers/YauthProvider'


function App() {
  const router = useMemo(() => createAppRouter(), [])

  return (
    <>
    <YAuthProvider>
      <RouterProvider router={router}/>
    </YAuthProvider>
    </>
  )
}

export default App
