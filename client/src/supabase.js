//this is for connecting to supabase
import { createClient } from "@supabase/supabase-js";

//this is for the project address and public key, they come from the .env file
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, key);
