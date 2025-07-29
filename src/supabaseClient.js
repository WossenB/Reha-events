import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pckmbifzmwdgzhcluyjp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBja21iaWZ6bXdkZ3poY2x1eWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3ODY3MTUsImV4cCI6MjA2OTM2MjcxNX0.xzYn83bXvrjg29mSmYfepEeSmfEuqP0EqEQ736t09MM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
