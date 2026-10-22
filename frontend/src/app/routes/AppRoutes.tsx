//Importação das paginas para definir as rotas
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '../../features/auth/LoginPage'     
import { RegisterPage } from '../../features/auth/RegisterPage' 
import { GalleryPage } from '../../pages/GalleryPage'

export function AppRoutes() {
  return (
    <Routes>
      {/* Redireciona a raiz "/" direto para o login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Definição das Rotas*/}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route path="/galeria" element={<GalleryPage />} />
      
      {/* Rota coringa: caso digitem qualquer URL inexistente, joga para o login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}