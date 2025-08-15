// Re-export functions from supabase.ts
import { supabase } from './supabase'
export { supabase }

// Re-export user profile functions
export { getUserProfile, upsertUserProfile, getUserTopics } from './supabase'

// Re-export other functions that might be needed
export { createTopic, uploadFile, getPublicUrl } from './supabase'