export default {
    expo: { 
        name: "smart-money-frontend",
        slug: "smart-money-frontend",
        scheme: "smartmoneyfrontend",
        android: {
            package: "com.ngohaibang.smartmoneyfrontend",
        },
        version: "1.0.0",
        extra: {
            SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID: process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID,
            SUPABASE_AUTH_EXTERNAL_FACEBOOK_APP_ID: process.env.SUPABASE_AUTH_EXTERNAL_FACEBOOK_APP_ID,
            SUPABASE_URL: process.env.SUPABASE_URL,
            SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
        },
    },
};