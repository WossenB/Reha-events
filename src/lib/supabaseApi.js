import { supabase } from './supabaseClient';

// Insert a new person into the Supabase database
export const insertPerson = async ({ name, email, phone }) => {
  const { data, error } = await supabase
    .from('person')
    .insert([{ full_name: name, email, phone }])
    .select();

  if (error) {
    console.error('Supabase Insert Error:', error);
    return { error };
  }

  return { data };
};
