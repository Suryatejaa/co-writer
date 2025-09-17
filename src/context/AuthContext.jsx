import { createContext, useContext, useState, useEffect } from 'react';
import { auth, getCurrentUser, isUserAdmin } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Wait a bit longer for Firebase to fully update admin status
                setTimeout(() => {
                    const userInfo = getCurrentUser();
                    setUser(userInfo.user);
                    setIsAdmin(userInfo.isAdmin);
                    setLoading(false);
                    console.log('🔄 Auth context updated:', { uid: userInfo.uid, isAdmin: userInfo.isAdmin });
                }, 500); // Increased delay to 500ms
            } else {
                setUser(null);
                setIsAdmin(false);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const value = {
        user,
        isAdmin,
        loading,
        isUserAdmin,
        uid: user?.uid || null
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};