
// This file is obsolete as Supabase connection has been removed.
// It is kept empty to avoid breaking imports in files that haven't been refactored yet.
export const supabase = {
    // Dummy object to prevent crash if accidentally called
    auth: {
        getSession: async () => ({ error: null, data: { session: null } }),
        signInWithPassword: async () => ({ error: { message: "Supabase disabled" }, data: {} }),
        setPersistence: async () => {},
        getUser: async () => ({ data: { user: null } })
    },
    from: () => ({
        select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }), order: () => ({ data: [], error: null }) }) }),
        insert: () => ({ select: () => ({ single: () => ({ data: {}, error: null }) }) }),
        update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: {}, error: null }) }) }) }),
        delete: () => ({ eq: () => ({ error: null }) })
    })
};
