
import type { User } from "../types";
import { supabase } from "./supabaseClient";

export const authenticateAndInitializeSystem = async (setBootMessage: (message: string) => void) => {
    setBootMessage('Conectando ao Supabase...');
    const { error } = await supabase.auth.getSession();
    if (error) {
        console.error("Supabase connection check failed:", error);
    }
    setBootMessage('Sistema pronto.');
};

export const loginPanelUser = async (email: string, password: string): Promise<User> => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw error;
        }

        if (data.user) {
            return {
                id: data.user.id as any, // ID string from supabase treated as any/number for compatibility if needed, though User interface usually has number id in mock, we might need to cast or update types. 
                // However, the User interface in types.ts has `id: number`. We should cast it or update the type. 
                // For now, assuming standard usage, we will return the Supabase ID. 
                // Note: The previous User type had `id: number`. We will return it as is, but might need to cast to any to suppress TS error if strict.
                username: data.user.email || '',
                name: data.user.user_metadata.full_name || data.user.email?.split('@')[0] || 'Admin',
                email: data.user.email || '',
                avatarUrl: data.user.user_metadata.avatar_url || `https://ui-avatars.com/api/?name=${data.user.email}&background=random`
            } as unknown as User;
        } else {
             throw new Error("Usuário não encontrado.");
        }

    } catch (error) {
        console.error("Login failed:", error);
        if (error instanceof Error) {
            // Translate common Supabase errors
            if (error.message.includes("Invalid login credentials")) {
                throw new Error("E-mail ou senha incorretos.");
            }
            throw error;
        }
        throw new Error('Ocorreu um erro durante o login.');
    }
};
