import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedPaciente = localStorage.getItem('paciente');
    const storedToken = localStorage.getItem('token');

    if (storedPaciente && storedToken) {
      setPaciente(JSON.parse(storedPaciente));
    }
    setLoading(false);
  }, []);

  const login = async (email, senha) => {
    try {
      const response = await api.post('/auth/login', { email, senha });
      const { paciente, token } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('paciente', JSON.stringify(paciente));
      setPaciente(paciente);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao fazer login'
      };
    }
  };

  const register = async (dados) => {
    try {
      const response = await api.post('/auth/register', dados);
      const { paciente, token } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('paciente', JSON.stringify(paciente));
      setPaciente(paciente);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao cadastrar'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('paciente');
    setPaciente(null);
  };

  const updateProfile = async (dados) => {
    try {
      const response = await api.put('/auth/profile', dados);
      const { paciente: pacienteAtualizado } = response.data;

      localStorage.setItem('paciente', JSON.stringify(pacienteAtualizado));
      setPaciente(pacienteAtualizado);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao atualizar perfil'
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        paciente,
        signed: !!paciente,
        loading,
        login,
        register,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
