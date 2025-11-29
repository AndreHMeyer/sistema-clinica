import { createContext, useContext, useState, useEffect } from 'react';
import medicoApi from '../services/medicoApi';

const MedicoAuthContext = createContext({});

export function MedicoAuthProvider({ children }) {
  const [medico, setMedico] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedMedico = localStorage.getItem('medico');
    const storedToken = localStorage.getItem('medicoToken');

    if (storedMedico && storedToken) {
      setMedico(JSON.parse(storedMedico));
    }
    setLoading(false);
  }, []);

  const login = async (email, senha) => {
    try {
      const response = await medicoApi.post('/medico/auth/login', { email, senha });
      const { medico, token } = response.data;

      localStorage.setItem('medicoToken', token);
      localStorage.setItem('medico', JSON.stringify(medico));
      setMedico(medico);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao fazer login'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('medicoToken');
    localStorage.removeItem('medico');
    setMedico(null);
  };

  const updateProfile = async (dados) => {
    try {
      const response = await medicoApi.put('/medico/auth/profile', dados);
      const { medico: medicoAtualizado } = response.data;

      localStorage.setItem('medico', JSON.stringify(medicoAtualizado));
      setMedico(medicoAtualizado);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao atualizar perfil'
      };
    }
  };

  return (
    <MedicoAuthContext.Provider
      value={{
        medico,
        signed: !!medico,
        loading,
        login,
        logout,
        updateProfile
      }}
    >
      {children}
    </MedicoAuthContext.Provider>
  );
}

export function useMedicoAuth() {
  const context = useContext(MedicoAuthContext);
  if (!context) {
    throw new Error('useMedicoAuth deve ser usado dentro de um MedicoAuthProvider');
  }
  return context;
}
