import React, { createContext, useState, ReactNode, useEffect, useContext } from 'react';
import { api } from '../api/cliente_http';
import { jwtDecode } from 'jwt-decode';
import { useSnackbar } from 'notistack';

interface Association {
  id: number;
  name: string;
  type: 'lodge' | 'obedience';
}

export interface UserPayload {
  sub: string;
  user_id: number;
  role: 'super_admin' | 'webmaster' | 'member';
  lodge_id?: number;
  obedience_id?: number;
  requires_selection?: boolean;
  associations?: Association[];
  [key: string]: any;
}

interface AuthContextType {
  user: UserPayload | null;
  associations: Association[];
  requiresSelection: boolean;
  login: (email: string, pass: string) => Promise<UserPayload>;
  loginWithGoogle: (credential: string) => Promise<UserPayload>;
  logout: () => Promise<void> | void;
  selectAssociation: (association: Association) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { enqueueSnackbar } = useSnackbar();
  
  const [user, setUser] = useState<UserPayload | null>(() => {
    const token = localStorage.getItem('token');
    return token ? jwtDecode<UserPayload>(token) : null;
  });

  const [associations, setAssociations] = useState<Association[]>(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedUser = jwtDecode<UserPayload>(token);
      return decodedUser.requires_selection ? (decodedUser.associations || []) : [];
    }
    return [];
  });

  const [requiresSelection, setRequiresSelection] = useState(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedUser = jwtDecode<UserPayload>(token);
      return !!decodedUser.requires_selection;
    }
    return false;
  });

  useEffect(() => {
    // Escutar evento de logout forçado (vindo do Axios Interceptor)
    const handleForceLogout = () => {
      enqueueSnackbar('Sua sessão expirou por segurança. Faça login novamente.', { variant: 'warning', autoHideDuration: 6000 });
      logout();
    };
    
    window.addEventListener('force_logout', handleForceLogout);
    return () => {
      window.removeEventListener('force_logout', handleForceLogout);
    };
  }, [enqueueSnackbar]);

  const login = async (email: string, pass: string) => {
    const payload = {
      username: email,
      password: pass
    };

    const response = await api.post('/auth/login', payload);
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    
    const decodedUser = jwtDecode<UserPayload>(access_token);
    setUser(decodedUser);

    if (decodedUser.requires_selection) {
      setAssociations(decodedUser.associations || []);
      setRequiresSelection(true);
    } else {
      setRequiresSelection(false);
      setAssociations([]);
    }
    return decodedUser;
  };

  const loginWithGoogle = async (credential: string) => {
    const response = await api.post('/auth/google', { credential });
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    
    const decodedUser = jwtDecode<UserPayload>(access_token);
    setUser(decodedUser);

    if (decodedUser.requires_selection) {
      setAssociations(decodedUser.associations || []);
      setRequiresSelection(true);
    } else {
      setRequiresSelection(false);
      setAssociations([]);
    }
    return decodedUser;
  };

  const selectAssociation = async (association: Association) => {
    const response = await api.post('/auth/token/select-association', {
      association_id: association.id,
      association_type: association.type,
    });
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    const decodedUser = jwtDecode<UserPayload>(access_token);
    setUser(decodedUser);
    setRequiresSelection(false);
    setAssociations([]);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('Logout API failed, cleaning local session anyway', e);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setAssociations([]);
      setRequiresSelection(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, associations, requiresSelection, login, loginWithGoogle, logout, selectAssociation }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
